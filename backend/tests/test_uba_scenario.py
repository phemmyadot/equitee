"""
Test: sell all UBA → rebuy at higher price.

Verifies that:
1. Full sale closes the position and locks in realized P&L via ClosedPosition.
2. Rebuy reactivates the holding with the new avg_cost and resets realized_pl to 0
   so old P&L is not double-counted on a future close.
"""

import os
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.db.engine import Base
from app.db.models import User, Holding, ClosedPosition
from app.db.crud import create_holding, record_sale, add_shares


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    user = User(email="test@test.com", username="test", hashed_pw="x")
    session.add(user)
    session.commit()
    session.refresh(user)
    yield session, user
    session.close()


def test_uba_sell_all_then_rebuy(db):
    session, user = db

    # ── Phase 1: open position ──────────────────────────────────────────────
    # Buy 9500 UBA @ ₦40 avg cost
    holding = create_holding(
        session,
        ticker="UBA",
        name="United Bank for Africa",
        market="ngx",
        shares=9500,
        avg_cost=40.0,
        sector="Financials",
        user_id=user.id,
    )
    assert holding.shares == 9500
    assert holding.avg_cost == 40.0
    assert holding.realized_pl == 0.0
    assert holding.is_active is True

    # ── Phase 2: sell all 9500 @ ₦47 ───────────────────────────────────────
    expected_pl = (47.0 - 40.0) * 9500  # = 66 500

    updated, closed = record_sale(session, holding.id, user.id, 9500, 47.0, commission=0.0)

    assert updated is not None
    assert updated.shares == 0.0
    assert updated.is_active is False
    assert round(updated.realized_pl, 2) == round(expected_pl, 2), (
        f"Expected realized_pl={expected_pl}, got {updated.realized_pl}"
    )

    # ClosedPosition record created
    assert closed is not None
    assert closed.ticker == "UBA"
    assert round(closed.realized_pl, 2) == round(expected_pl, 2), (
        f"ClosedPosition P&L should be {expected_pl}, got {closed.realized_pl}"
    )

    # ── Phase 3: rebuy 9500 @ ₦50 ──────────────────────────────────────────
    reopened = add_shares(session, holding.id, user.id, new_shares=9500, buy_price=50.0)

    assert reopened is not None
    assert reopened.is_active is True
    assert reopened.shares == 9500.0
    assert reopened.avg_cost == 50.0, (
        f"avg_cost should reset to 50.0, got {reopened.avg_cost}"
    )
    assert reopened.realized_pl == 0.0, (
        f"realized_pl must reset to 0 on reopen — got {reopened.realized_pl}. "
        f"Old P&L ({expected_pl}) is already captured in ClosedPosition."
    )

    # ── Phase 4: close again — verify no double-counting ───────────────────
    # Sell at ₦55 → new P&L = (55-50)*9500 = 47 500
    new_pl = (55.0 - 50.0) * 9500  # = 47 500
    _, closed2 = record_sale(session, reopened.id, user.id, 9500, 55.0, commission=0.0)

    assert closed2 is not None
    assert round(closed2.realized_pl, 2) == round(new_pl, 2), (
        f"Second ClosedPosition should only contain new P&L ({new_pl}), "
        f"got {closed2.realized_pl} — old P&L may be leaking in."
    )

    # Total closed positions in DB
    closed_rows = session.scalars(select(ClosedPosition).where(ClosedPosition.ticker == "UBA")).all()
    assert len(closed_rows) == 2
    total_pl = sum(r.realized_pl for r in closed_rows)
    assert round(total_pl, 2) == round(expected_pl + new_pl, 2), (
        f"Total P&L across both closes should be {expected_pl + new_pl}, got {total_pl}"
    )


def test_partial_sells_then_rebuy(db):
    """
    Case study:
      Start : 19,960 units @ N44.02, realized_pl = N20,000
      Sell  : 6,000 @ N47  commission N5,086.00
      Sell  : 3,500 @ N48  commission N3,033.98
      Buy   : 10,000 @ N50.02  commission N7,427.05

    Commission must NOT affect realized P&L or avg cost (only cash flows).
      Expected realized P&L = 20,000 + 17,880 + 13,930 = N51,810
      Expected new avg cost  = (10,460 x 44.02 + 10,000 x 50.02) / 20,460
    """
    session, user = db

    COMM_SELL1 = 5_086.00
    COMM_SELL2 = 3_033.98
    COMM_BUY   = 7_427.05

    holding = create_holding(
        session,
        ticker="UBA",
        name="United Bank for Africa",
        market="ngx",
        shares=19_960,
        avg_cost=44.02,
        sector="Financials",
        user_id=user.id,
    )
    holding.realized_pl = 20_000.0
    session.commit()
    session.refresh(holding)

    # ── Sell 6,000 @ N47 (comm N5,086) ────────────────────────────────────
    pl_sell1 = (47.0 - 44.02) * 6_000 - COMM_SELL1   # commission reduces P&L
    h, _ = record_sale(session, holding.id, user.id, 6_000, 47.0, commission=COMM_SELL1)

    assert h.shares == 19_960 - 6_000
    assert h.is_active is True
    assert round(h.realized_pl, 2) == round(20_000 + pl_sell1, 2), (
        f"After sell-1: expected N{20_000 + pl_sell1:,.2f}, got N{h.realized_pl:,.2f}"
    )

    # ── Sell 3,500 @ N48 (comm N3,033.98) ─────────────────────────────────
    pl_sell2 = (48.0 - 44.02) * 3_500 - COMM_SELL2   # commission reduces P&L
    h, _ = record_sale(session, holding.id, user.id, 3_500, 48.0, commission=COMM_SELL2)

    assert h.shares == 19_960 - 6_000 - 3_500
    assert h.is_active is True
    expected_realized = 20_000 + pl_sell1 + pl_sell2
    assert round(h.realized_pl, 2) == round(expected_realized, 2), (
        f"After sell-2: expected N{expected_realized:,.2f}, got N{h.realized_pl:,.2f}"
    )

    # ── Buy 10,000 @ N50.02 (comm N7,427.05) ──────────────────────────────
    # Commission is a cash cost on top — does NOT enter avg cost
    remaining = 10_460
    expected_avg = (remaining * 44.02 + 10_000 * 50.02) / (remaining + 10_000)

    h = add_shares(session, holding.id, user.id, new_shares=10_000, buy_price=50.02,
                   commission=COMM_BUY)

    assert h.shares == remaining + 10_000   # 20,460
    assert round(h.avg_cost, 6) == round(expected_avg, 6), (
        f"avg_cost: expected N{expected_avg:.6f}, got N{h.avg_cost:.6f}  "
        f"(buy commission must not inflate avg cost)"
    )
    assert round(h.realized_pl, 2) == round(expected_realized, 2), (
        f"Buy must not change realized_pl — expected N{expected_realized:,.2f}, "
        f"got N{h.realized_pl:,.2f}"
    )

    # ── Print summary ───────────────────────────────────────────────────────
    gross_sell1 = (47.0 - 44.02) * 6_000
    gross_sell2 = (48.0 - 44.02) * 3_500
    sep = "-" * 54
    print(f"\n{sep}")
    print(f"  Starting realized P&L          : N{20_000:>12,.2f}")
    print(f"  Sell 6,000 @ N47  gross        : N{gross_sell1:>12,.2f}")
    print(f"               comm              :  N{COMM_SELL1:>11,.2f}")
    print(f"               net               : N{pl_sell1:>12,.2f}")
    print(f"  Sell 3,500 @ N48  gross        : N{gross_sell2:>12,.2f}")
    print(f"               comm              :  N{COMM_SELL2:>11,.2f}")
    print(f"               net               : N{pl_sell2:>12,.2f}")
    print(sep)
    print(f"  New realized P&L               : N{h.realized_pl:>12,.2f}")
    print(f"  Shares held                    :  {h.shares:>12,.0f}")
    print(f"  New avg cost (excl buy comm)   : N{h.avg_cost:>12.4f}")
    print(f"  Buy commission (cash only)     :  N{COMM_BUY:>11,.2f}")
    print(sep)
