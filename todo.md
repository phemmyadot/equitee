# Multi-User Implementation Checklist

## Phase 1 — Backend Auth Foundation (additive, no breaking changes)
- [x] 1. Add `python-jose[cryptography]`, `passlib[bcrypt]`, `alembic` to `requirements.txt`
- [x] 2. Add `SECRET_KEY`, `REGISTRATION_MODE`, `FIRST_ADMIN_EMAIL/PASSWORD`, token expiry settings to `config.py`
- [x] 3. Add `User`, `RefreshToken`, `InviteCode` ORM models to `db/models.py`
- [x] 4. Create `auth/security.py` — password hashing, JWT create/decode
- [x] 5. Create `auth/dependencies.py` — `get_current_user`, `get_current_admin`
- [x] 6. Add user/token/invite CRUD functions to `db/crud.py`
- [x] 7. Create `routers/auth.py` — login, register, logout, refresh, me, invite endpoints
- [x] 8. Register auth router + add `ensure_first_admin()` to lifespan in `main.py`
- [x] 9. Initialize Alembic + write Migration 001 (create auth tables)
- [ ] 10. **TEST**: register, login, verify cookie, call `/api/auth/me`

## Phase 2 — DB Schema Migration
- [x] 11. Write Alembic Migration 002 — add `user_id DEFAULT 1` to `holdings`, `closed_positions`, `portfolio_snapshots`
- [x] 12. Add `user_id` columns + relationships to existing ORM models in `db/models.py`
- [ ] 13. **TEST**: run migration locally, confirm existing data gets `user_id=1`

## Phase 3 — Backend Query Scoping
- [ ] 14. Update all CRUD query functions in `db/crud.py` — add `user_id` param + filter
- [ ] 15. Update `services/portfolio.py` — remove internal `SessionLocal()` calls, thread `user_id` through
- [ ] 16. Update `routers/data.py` — inject `get_current_user`, pass `user_id` to service
- [ ] 17. Update `routers/settings.py` — inject `get_current_user`, pass `user_id` to all CRUD
- [ ] 18. Update `routers/history.py` — inject `get_current_user`, pass `user_id` to queries
- [ ] 19. **TEST**: all endpoints require auth and return user-scoped data

## Phase 4 — Frontend Auth
- [ ] 20. Create `lib/AuthContext.tsx` — `AuthProvider` + `useAuth()`
- [ ] 21. Wrap `app/layout.tsx` with `AuthProvider`
- [ ] 22. Create `app/login/page.tsx`
- [ ] 23. Create `app/register/page.tsx`
- [ ] 24. Create `components/auth/ProtectedRoute.tsx`
- [ ] 25. Add 401 refresh-and-retry logic to `lib/api.ts` + `lib/settingsApi.ts`
- [ ] 26. Gate `PortfolioContext.tsx` initial fetch on `useAuth().user`
- [ ] 27. Wrap all existing pages with `ProtectedRoute`
- [ ] 28. Add user badge + logout button to Header
- [ ] 29. **TEST**: full login flow end-to-end

## Phase 5 — Hardening & Deploy
- [ ] 30. Add invite code generation UI to settings page (admin only)
- [ ] 31. Add `NEXT_PUBLIC_REGISTRATION_MODE` env var handling to register page
- [ ] 32. Update `render.yaml` start command: `alembic upgrade head && uvicorn ...`
- [ ] 33. Add `SECRET_KEY` validation on startup (raise if empty in production)
- [ ] 34. Set env vars in Render + Netlify dashboards
- [ ] 35. **DEPLOY** and verify
