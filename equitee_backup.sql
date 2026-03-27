--
-- PostgreSQL database dump
--

\restrict gx8wzWfWJASVN4l4e7RoM1YyEZUEJFmfR2kt9hrZMxoWsRbZEjFEeDzk4QlFbNn

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg12+1)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: equitee_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO equitee_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO equitee_user;

--
-- Name: closed_positions; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.closed_positions (
    id integer NOT NULL,
    ticker character varying NOT NULL,
    name character varying NOT NULL,
    market character varying NOT NULL,
    realized_pl double precision NOT NULL,
    closed_at timestamp with time zone,
    user_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.closed_positions OWNER TO equitee_user;

--
-- Name: closed_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.closed_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.closed_positions_id_seq OWNER TO equitee_user;

--
-- Name: closed_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.closed_positions_id_seq OWNED BY public.closed_positions.id;


--
-- Name: daily_price_history; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.daily_price_history (
    id integer NOT NULL,
    ticker character varying NOT NULL,
    date character varying NOT NULL,
    close double precision,
    open double precision,
    high double precision,
    low double precision,
    volume double precision,
    change_pct double precision,
    source character varying NOT NULL
);


ALTER TABLE public.daily_price_history OWNER TO equitee_user;

--
-- Name: daily_price_history_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.daily_price_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_price_history_id_seq OWNER TO equitee_user;

--
-- Name: daily_price_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.daily_price_history_id_seq OWNED BY public.daily_price_history.id;


--
-- Name: dividend_cache; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.dividend_cache (
    id integer NOT NULL,
    ticker character varying NOT NULL,
    fetched_at timestamp with time zone NOT NULL,
    symbol character varying NOT NULL,
    currency character varying NOT NULL,
    ex_dividend_date character varying,
    record_date character varying,
    pay_date character varying,
    cash_amount double precision,
    dividend_ts character varying
);


ALTER TABLE public.dividend_cache OWNER TO equitee_user;

--
-- Name: dividend_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.dividend_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dividend_cache_id_seq OWNER TO equitee_user;

--
-- Name: dividend_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.dividend_cache_id_seq OWNED BY public.dividend_cache.id;


--
-- Name: financials_cache; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.financials_cache (
    id integer NOT NULL,
    ticker character varying NOT NULL,
    cache_type character varying NOT NULL,
    fetched_at timestamp with time zone NOT NULL,
    periods json NOT NULL,
    col_a json NOT NULL,
    col_b json NOT NULL,
    col_c json NOT NULL,
    col_d json
);


ALTER TABLE public.financials_cache OWNER TO equitee_user;

--
-- Name: financials_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.financials_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.financials_cache_id_seq OWNER TO equitee_user;

--
-- Name: financials_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.financials_cache_id_seq OWNED BY public.financials_cache.id;


--
-- Name: holdings; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.holdings (
    id integer NOT NULL,
    ticker character varying NOT NULL,
    name character varying NOT NULL,
    market character varying NOT NULL,
    shares double precision NOT NULL,
    avg_cost double precision NOT NULL,
    sector character varying DEFAULT ''::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone,
    user_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.holdings OWNER TO equitee_user;

--
-- Name: holdings_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.holdings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.holdings_id_seq OWNER TO equitee_user;

--
-- Name: holdings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.holdings_id_seq OWNED BY public.holdings.id;


--
-- Name: invite_codes; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.invite_codes (
    id integer NOT NULL,
    code character varying NOT NULL,
    created_by integer NOT NULL,
    used_by integer,
    used_at timestamp with time zone,
    created_at timestamp with time zone
);


ALTER TABLE public.invite_codes OWNER TO equitee_user;

--
-- Name: invite_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.invite_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invite_codes_id_seq OWNER TO equitee_user;

--
-- Name: invite_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.invite_codes_id_seq OWNED BY public.invite_codes.id;


--
-- Name: portfolio_snapshots; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.portfolio_snapshots (
    id integer NOT NULL,
    ts timestamp with time zone NOT NULL,
    ngx_equity_ngn double precision DEFAULT '0'::double precision NOT NULL,
    ngx_cost_ngn double precision DEFAULT '0'::double precision NOT NULL,
    us_equity_usd double precision DEFAULT '0'::double precision NOT NULL,
    us_cost_usd double precision DEFAULT '0'::double precision NOT NULL,
    usdngn double precision DEFAULT '0'::double precision NOT NULL,
    total_usd double precision DEFAULT '0'::double precision NOT NULL,
    user_id integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.portfolio_snapshots OWNER TO equitee_user;

--
-- Name: portfolio_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.portfolio_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.portfolio_snapshots_id_seq OWNER TO equitee_user;

--
-- Name: portfolio_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.portfolio_snapshots_id_seq OWNED BY public.portfolio_snapshots.id;


--
-- Name: price_history; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.price_history (
    id integer NOT NULL,
    snapshot_id integer NOT NULL,
    ticker character varying NOT NULL,
    market character varying NOT NULL,
    price double precision,
    change_pct double precision
);


ALTER TABLE public.price_history OWNER TO equitee_user;

--
-- Name: price_history_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.price_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.price_history_id_seq OWNER TO equitee_user;

--
-- Name: price_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.price_history_id_seq OWNED BY public.price_history.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone
);


ALTER TABLE public.refresh_tokens OWNER TO equitee_user;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO equitee_user;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    username character varying NOT NULL,
    hashed_pw character varying NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO equitee_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO equitee_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: watchlist; Type: TABLE; Schema: public; Owner: equitee_user
--

CREATE TABLE public.watchlist (
    id integer NOT NULL,
    user_id integer NOT NULL,
    ticker character varying NOT NULL,
    market character varying NOT NULL,
    added_at timestamp with time zone NOT NULL
);


ALTER TABLE public.watchlist OWNER TO equitee_user;

--
-- Name: watchlist_id_seq; Type: SEQUENCE; Schema: public; Owner: equitee_user
--

CREATE SEQUENCE public.watchlist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.watchlist_id_seq OWNER TO equitee_user;

--
-- Name: watchlist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: equitee_user
--

ALTER SEQUENCE public.watchlist_id_seq OWNED BY public.watchlist.id;


--
-- Name: closed_positions id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.closed_positions ALTER COLUMN id SET DEFAULT nextval('public.closed_positions_id_seq'::regclass);


--
-- Name: daily_price_history id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.daily_price_history ALTER COLUMN id SET DEFAULT nextval('public.daily_price_history_id_seq'::regclass);


--
-- Name: dividend_cache id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.dividend_cache ALTER COLUMN id SET DEFAULT nextval('public.dividend_cache_id_seq'::regclass);


--
-- Name: financials_cache id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.financials_cache ALTER COLUMN id SET DEFAULT nextval('public.financials_cache_id_seq'::regclass);


--
-- Name: holdings id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.holdings ALTER COLUMN id SET DEFAULT nextval('public.holdings_id_seq'::regclass);


--
-- Name: invite_codes id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.invite_codes ALTER COLUMN id SET DEFAULT nextval('public.invite_codes_id_seq'::regclass);


--
-- Name: portfolio_snapshots id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.portfolio_snapshots ALTER COLUMN id SET DEFAULT nextval('public.portfolio_snapshots_id_seq'::regclass);


--
-- Name: price_history id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.price_history ALTER COLUMN id SET DEFAULT nextval('public.price_history_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: watchlist id; Type: DEFAULT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.watchlist ALTER COLUMN id SET DEFAULT nextval('public.watchlist_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.alembic_version (version_num) FROM stdin;
006
\.


--
-- Data for Name: closed_positions; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.closed_positions (id, ticker, name, market, realized_pl, closed_at, user_id) FROM stdin;
1	CAVERTON	Caverton Offshore	ngx	13322.82	2026-03-10 01:58:34.068954+00	1
2	CHAMPION	Champion Breweries	ngx	-824	2026-03-10 01:58:34.068957+00	1
3	ELLAHLAKES	Ellah Lakes Plc	ngx	-3188.54	2026-03-10 01:58:34.068958+00	1
\.


--
-- Data for Name: daily_price_history; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.daily_price_history (id, ticker, date, close, open, high, low, volume, change_pct, source) FROM stdin;
495	DANGCEM	2025-09-18	516.2	516.2	516.2	516.2	149983	0	history
496	DANGCEM	2025-09-19	516.2	516.2	516.2	516.2	551027	0	history
497	DANGCEM	2025-09-22	516.2	516.2	516.2	516.2	204105	0	history
498	DANGCEM	2025-09-23	516.2	516.2	516.2	516.2	105606	0	history
499	DANGCEM	2025-09-24	516.2	516.2	516.2	516.2	284528	0	history
500	DANGCEM	2025-09-25	516.2	516.2	516.2	516.2	288634	0	history
501	DANGCEM	2025-09-26	525.1	525.1	525.1	525.1	928468	1.72	history
502	DANGCEM	2025-09-29	525.1	525.1	525.1	525.1	158529	0	history
503	DANGCEM	2025-09-30	525.1	525.1	525.1	525.1	83990	0	history
504	DANGCEM	2025-10-02	525.1	525.1	525.1	525.1	181539	0	history
505	DANGCEM	2025-10-03	525.1	525.1	525.1	525.1	314521	0	history
506	DANGCEM	2025-10-06	525.1	525.1	525.1	525.1	459902	0	history
507	DANGCEM	2025-10-07	530	527	530	527	2980963	0.93	history
508	DANGCEM	2025-10-08	530	530	530	530	482675	0	history
509	DANGCEM	2025-10-09	540	540	540	540	20923980	1.89	history
510	DANGCEM	2025-10-10	575	575	575	575	2023515	6.48	history
511	DANGCEM	2025-10-13	585	585	585	585	1362278	1.74	history
512	DANGCEM	2025-10-14	585.6	585.3	585.6	585.3	4009106	0.1	history
513	DANGCEM	2025-10-15	585.6	585.6	585.6	585.6	336904	0	history
514	DANGCEM	2025-10-16	599.8	599.8	599.8	599.8	1695597	2.42	history
515	DANGCEM	2025-10-17	600	600	600	600	4397724	0.03	history
516	DANGCEM	2025-10-20	600	600	600	600	3363346	0	history
517	DANGCEM	2025-10-21	600	645.5	656	600	3399243	0	history
518	DANGCEM	2025-10-22	639	639	639	639	847591	6.5	history
519	DANGCEM	2025-10-23	649.3	640	649.3	640	886818	1.61	history
520	DANGCEM	2025-10-24	665	665	665	665	1205009	2.42	history
521	DANGCEM	2025-10-27	665	665	665	665	2524101	0	history
522	DANGCEM	2025-10-28	665	665	665	665	7540388	0	history
523	DANGCEM	2025-10-29	660	660	660	660	398647	-0.75	history
524	DANGCEM	2025-10-30	660	660	660	660	411125	0	history
525	DANGCEM	2025-10-31	660	660	660	660	583986	0	history
526	DANGCEM	2025-11-03	660	660	660	660	109331	0	history
527	DANGCEM	2025-11-04	660	660	660	660	129199	0	history
528	DANGCEM	2025-11-05	660	660	660	660	211303	0	history
529	DANGCEM	2025-11-06	660	660	660	660	2523273	0	history
530	DANGCEM	2025-11-07	660	660	660	660	1767573	0	history
531	DANGCEM	2025-11-10	660	660	660	660	3626384	0	history
532	DANGCEM	2025-11-11	594	600	600	594	1765473	-10	history
533	DANGCEM	2025-11-12	594	594	594	594	2134945	0	history
534	DANGCEM	2025-11-13	594	594	594	594	3383103	0	history
535	DANGCEM	2025-11-14	594	594	594	594	343190	0	history
536	DANGCEM	2025-11-17	534.6	534.6	534.6	534.6	537170	-10	history
537	DANGCEM	2025-11-18	534.6	534.6	534.6	534.6	126733	0	history
538	DANGCEM	2025-11-19	534.6	534.6	534.6	534.6	320284	0	history
539	DANGCEM	2025-11-20	534.6	534.6	534.6	534.6	225119	0	history
540	DANGCEM	2025-11-21	534.6	534.6	534.6	534.6	208958	0	history
541	DANGCEM	2025-11-24	534.6	534.6	534.6	534.6	402921	0	history
542	DANGCEM	2025-11-25	534.6	534.6	534.6	534.6	243830	0	history
543	DANGCEM	2025-11-26	534.6	534.6	534.6	534.6	132885	0	history
544	DANGCEM	2025-11-27	534.6	534.6	534.6	534.6	545729	0	history
545	DANGCEM	2025-11-28	534.6	534.6	534.6	534.6	436549	0	history
546	DANGCEM	2025-12-01	534.6	534.6	534.6	534.6	312332	0	history
547	DANGCEM	2025-12-02	588	588	588	588	713127	9.99	history
548	DANGCEM	2025-12-03	588	588	588	588	165477	0	history
549	DANGCEM	2025-12-04	588	588	588	588	213912	0	history
550	DANGCEM	2025-12-05	614.9	614.9	614.9	614.9	239469	4.57	history
551	DANGCEM	2025-12-08	614.9	614.9	614.9	614.9	533352	0	history
552	DANGCEM	2025-12-09	614.9	614.9	614.9	614.9	738169	0	history
553	DANGCEM	2025-12-10	614.9	614.9	614.9	614.9	959431	0	history
554	DANGCEM	2025-12-11	614.9	614.9	614.9	614.9	281940	0	history
555	DANGCEM	2025-12-12	614.9	614.9	614.9	614.9	573939	0	history
556	DANGCEM	2025-12-15	614.9	614.9	614.9	614.9	506273	0	history
557	DANGCEM	2025-12-16	614.9	614.9	614.9	614.9	352465	0	history
558	DANGCEM	2025-12-17	614.9	614.9	614.9	614.9	1052842	0	history
559	DANGCEM	2025-12-18	614.9	614.9	614.9	614.9	517760	0	history
560	DANGCEM	2025-12-19	610	610	610	610	1024570	-0.8	history
561	DANGCEM	2025-12-22	610	610	610	610	989673	0	history
562	DANGCEM	2025-12-23	610	610	610	610	338201	0	history
563	DANGCEM	2025-12-24	609	609	609	609	613278	-0.16	history
564	DANGCEM	2025-12-29	609	609	609	609	370510	0	history
565	DANGCEM	2025-12-30	609	609	609	609	599944	0	history
566	DANGCEM	2025-12-31	609	609	609	609	290550	0	history
567	DANGCEM	2026-01-02	609	609	609	609	170776	0	history
568	DANGCEM	2026-01-05	609	609	609	609	425631	0	history
569	DANGCEM	2026-01-06	635	635	635	635	1946976	4.27	history
570	DANGCEM	2026-01-07	635	635	635	635	1067418	0	history
571	DANGCEM	2026-01-08	635	635	635	635	970043	0	history
572	DANGCEM	2026-01-09	635	635	635	635	1306366	0	history
573	DANGCEM	2026-01-12	635	635	635	635	1011167	0	history
574	DANGCEM	2026-01-13	635	635	635	635	711635	0	history
575	DANGCEM	2026-01-14	635	635	635	635	1506044	0	history
576	DANGCEM	2026-01-15	635	635	635	635	699190	0	history
577	DANGCEM	2026-01-16	635	635	635	635	615720	0	history
578	DANGCEM	2026-01-19	635	635	635	635	651566	0	history
579	DANGCEM	2026-01-20	635	635	635	635	298884	0	history
580	DANGCEM	2026-01-21	635	635	635	635	390861	0	history
581	DANGCEM	2026-01-22	635	635	635	635	266507	0	history
582	DANGCEM	2026-01-23	635	635	635	635	327001	0	history
583	DANGCEM	2026-01-26	635	635	635	635	658043	0	history
584	DANGCEM	2026-01-27	635	635	635	635	339623	0	history
585	DANGCEM	2026-01-28	635	635	635	635	494866	0	history
586	DANGCEM	2026-01-29	635	635	635	635	544004	0	history
587	DANGCEM	2026-01-30	635	635	635	635	574797	0	history
588	DANGCEM	2026-02-02	635	635	635	635	754028	0	history
589	DANGCEM	2026-02-03	644	643.9	644	643.9	872103	1.42	history
590	DANGCEM	2026-02-04	649.9	649.9	649.9	649.9	840491	0.92	history
591	DANGCEM	2026-02-05	660	659.9	660	659.9	1328872	1.55	history
592	DANGCEM	2026-02-06	680	660.2	680	660.2	945497	3.03	history
593	DANGCEM	2026-02-09	739.9	710	739.9	710	1787981	8.81	history
594	DANGCEM	2026-02-10	739.9	739.9	739.9	739.9	812373	0	history
595	DANGCEM	2026-02-11	739.9	739.9	739.9	739.9	2013960	0	history
596	DANGCEM	2026-02-12	726.3	726.3	726.3	726.3	1990276	-1.84	history
597	DANGCEM	2026-02-13	726.3	726.3	726.3	726.3	425153	0	history
598	DANGCEM	2026-02-16	798.6	779.8	798.6	779.8	2266238	9.95	history
599	DANGCEM	2026-02-17	799.9	799.9	799.9	799.9	2494461	0.16	history
600	DANGCEM	2026-02-18	799.9	799.9	799.9	799.9	1447593	0	history
601	DANGCEM	2026-02-19	799.9	799.9	799.9	799.9	953260	0	history
602	DANGCEM	2026-02-20	799.9	799.9	799.9	799.9	445888	0	history
603	DANGCEM	2026-02-23	799.9	799.9	799.9	799.9	1721006	0	history
604	DANGCEM	2026-02-24	829.5	790	829.5	790	4123458.000000001	3.7	history
605	DANGCEM	2026-02-25	829.5	829.5	829.5	829.5	632593	0	history
606	DANGCEM	2026-02-26	829.5	829.5	829.5	829.5	461886	0	history
607	DANGCEM	2026-02-27	779	763	779	763	1599603	-6.09	history
608	DANGCEM	2026-03-02	809.9	809.9	809.9	809.9	4304565	3.97	history
609	DANGCEM	2026-03-03	809.9	809.9	809.9	809.9	2123510	0	history
610	DANGCEM	2026-03-04	809.9	809.9	809.9	809.9	1401455	0	history
611	DANGCEM	2026-03-05	810	809.9	810	809.9	1413157	0.01	history
612	DANGCEM	2026-03-06	815	815	815	815	930416	0.62	history
613	DANGCEM	2026-03-09	815	815	815	815	810890	0	history
614	DANGCEM	2026-03-10	815	815	815	815	1275637	0	history
615	DANGCEM	2026-03-11	810	810	810	810	2429197	-0.61	history
616	DANGCEM	2026-03-12	810	810	810	810	26892570	0	history
617	DANGCEM	2026-03-13	794.9	794.9	794.9	794.9	3700404	-1.86	history
618	DANGCEM	2026-03-16	802.9	802.9	802.9	802.9	1506039	1.01	history
619	DANGCEM	2026-03-17	810	810	810	810	2784203	0.88	history
620	DANGCEM	2026-03-18	810	810	810	810	75235190	0	history
677	UBA	2025-06-17	32.2	\N	\N	\N	\N	-5.5718	chart
678	UBA	2025-06-18	34	\N	\N	\N	\N	5.5901	chart
679	UBA	2025-06-19	35	\N	\N	\N	\N	2.9412	chart
680	UBA	2025-06-20	34.4	\N	\N	\N	\N	-1.7143	chart
681	UBA	2025-06-23	34.9	\N	\N	\N	\N	1.4535	chart
682	UBA	2025-06-24	34.8	\N	\N	\N	\N	-0.2865	chart
683	UBA	2025-06-25	36.3	\N	\N	\N	\N	4.3103	chart
684	UBA	2025-06-26	36	\N	\N	\N	\N	-0.8264	chart
685	UBA	2025-06-27	35.35	\N	\N	\N	\N	-1.8056	chart
686	UBA	2025-06-30	35.4	\N	\N	\N	\N	0.1414	chart
687	UBA	2025-07-01	35.5	\N	\N	\N	\N	0.2825	chart
688	UBA	2025-07-02	35.65	\N	\N	\N	\N	0.4225	chart
689	UBA	2025-07-03	36.65	\N	\N	\N	\N	2.805	chart
690	UBA	2025-07-04	36.4	\N	\N	\N	\N	-0.6821	chart
691	UBA	2025-07-07	36.5	\N	\N	\N	\N	0.2747	chart
692	UBA	2025-07-08	36.95	\N	\N	\N	\N	1.2329	chart
693	UBA	2025-07-09	36	\N	\N	\N	\N	-2.571	chart
694	UBA	2025-07-10	39.6	\N	\N	\N	\N	10	chart
695	UBA	2025-07-11	43.55	\N	\N	\N	\N	9.9747	chart
696	UBA	2025-07-14	46	\N	\N	\N	\N	5.6257	chart
697	UBA	2025-07-16	50.5	\N	\N	\N	\N	9.7826	chart
698	UBA	2025-07-17	46	\N	\N	\N	\N	-8.9109	chart
699	UBA	2025-07-18	46.05	\N	\N	\N	\N	0.1087	chart
700	UBA	2025-07-21	45.85	\N	\N	\N	\N	-0.4343	chart
701	UBA	2025-07-22	46.7	\N	\N	\N	\N	1.8539	chart
702	UBA	2025-07-23	46.7	\N	\N	\N	\N	0	chart
703	UBA	2025-07-24	46.55	\N	\N	\N	\N	-0.3212	chart
704	UBA	2025-07-25	47	\N	\N	\N	\N	0.9667	chart
705	UBA	2025-07-28	46.65	\N	\N	\N	\N	-0.7447	chart
706	UBA	2025-07-29	47.8	\N	\N	\N	\N	2.4652	chart
707	UBA	2025-07-30	48	\N	\N	\N	\N	0.4184	chart
621	UBA	2025-03-19	34.4	\N	\N	\N	\N	\N	chart
622	UBA	2025-03-20	34.8	\N	\N	\N	\N	1.1628	chart
623	UBA	2025-03-21	36.8	\N	\N	\N	\N	5.7471	chart
624	UBA	2025-03-24	37.8	\N	\N	\N	\N	2.7174	chart
625	UBA	2025-03-25	36.95	\N	\N	\N	\N	-2.2487	chart
626	UBA	2025-03-26	37	\N	\N	\N	\N	0.1353	chart
627	UBA	2025-03-27	36.85	\N	\N	\N	\N	-0.4054	chart
628	UBA	2025-03-28	36.9	\N	\N	\N	\N	0.1357	chart
629	UBA	2025-04-02	36.9	\N	\N	\N	\N	0	chart
630	UBA	2025-04-03	36.9	\N	\N	\N	\N	0	chart
631	UBA	2025-04-04	36.85	\N	\N	\N	\N	-0.1355	chart
632	UBA	2025-04-07	34.05	\N	\N	\N	\N	-7.5984	chart
633	UBA	2025-04-08	34.95	\N	\N	\N	\N	2.6432	chart
634	UBA	2025-04-09	34.05	\N	\N	\N	\N	-2.5751	chart
635	UBA	2025-04-10	35.25	\N	\N	\N	\N	3.5242	chart
636	UBA	2025-04-11	35.3	\N	\N	\N	\N	0.1418	chart
637	UBA	2025-04-14	31.3	\N	\N	\N	\N	-11.3314	chart
638	UBA	2025-04-15	31.55	\N	\N	\N	\N	0.7987	chart
639	UBA	2025-04-16	31.7	\N	\N	\N	\N	0.4754	chart
640	UBA	2025-04-17	32.1	\N	\N	\N	\N	1.2618	chart
641	UBA	2025-04-22	33	\N	\N	\N	\N	2.8037	chart
642	UBA	2025-04-23	34.95	\N	\N	\N	\N	5.9091	chart
643	UBA	2025-04-24	34	\N	\N	\N	\N	-2.7182	chart
644	UBA	2025-04-25	34	\N	\N	\N	\N	0	chart
645	UBA	2025-04-28	34.2	\N	\N	\N	\N	0.5882	chart
646	UBA	2025-04-29	34.95	\N	\N	\N	\N	2.193	chart
647	UBA	2025-04-30	35	\N	\N	\N	\N	0.1431	chart
648	UBA	2025-05-02	34.8	\N	\N	\N	\N	-0.5714	chart
649	UBA	2025-05-05	33.9	\N	\N	\N	\N	-2.5862	chart
650	UBA	2025-05-06	34.5	\N	\N	\N	\N	1.7699	chart
651	UBA	2025-05-07	34.5	\N	\N	\N	\N	0	chart
652	UBA	2025-05-08	34.5	\N	\N	\N	\N	0	chart
653	UBA	2025-05-09	34.55	\N	\N	\N	\N	0.1449	chart
654	UBA	2025-05-12	34.6	\N	\N	\N	\N	0.1447	chart
655	UBA	2025-05-13	34.5	\N	\N	\N	\N	-0.289	chart
656	UBA	2025-05-14	34.95	\N	\N	\N	\N	1.3043	chart
657	UBA	2025-05-15	34.9	\N	\N	\N	\N	-0.1431	chart
658	UBA	2025-05-16	34.9	\N	\N	\N	\N	0	chart
659	UBA	2025-05-19	34.5	\N	\N	\N	\N	-1.1461	chart
660	UBA	2025-05-20	34.5	\N	\N	\N	\N	0	chart
661	UBA	2025-05-21	33.9	\N	\N	\N	\N	-1.7391	chart
662	UBA	2025-05-22	33.25	\N	\N	\N	\N	-1.9174	chart
663	UBA	2025-05-23	34.45	\N	\N	\N	\N	3.609	chart
664	UBA	2025-05-26	34.4	\N	\N	\N	\N	-0.1451	chart
665	UBA	2025-05-27	34.85	\N	\N	\N	\N	1.3081	chart
666	UBA	2025-05-28	34.7	\N	\N	\N	\N	-0.4304	chart
667	UBA	2025-05-29	34.7	\N	\N	\N	\N	0	chart
668	UBA	2025-05-30	34.7	\N	\N	\N	\N	0	chart
669	UBA	2025-06-02	34.7	\N	\N	\N	\N	0	chart
670	UBA	2025-06-03	34.5	\N	\N	\N	\N	-0.5764	chart
671	UBA	2025-06-04	34.7	\N	\N	\N	\N	0.5797	chart
672	UBA	2025-06-05	36	\N	\N	\N	\N	3.7464	chart
673	UBA	2025-06-10	36.7	\N	\N	\N	\N	1.9444	chart
1	NNFM	2025-03-19	79.8	\N	\N	\N	\N	\N	chart
2	NNFM	2025-03-20	79.8	\N	\N	\N	\N	0	chart
3	NNFM	2025-03-21	79.8	\N	\N	\N	\N	0	chart
4	NNFM	2025-03-24	79.8	\N	\N	\N	\N	0	chart
5	NNFM	2025-03-25	79.8	\N	\N	\N	\N	0	chart
6	NNFM	2025-03-26	79.8	\N	\N	\N	\N	0	chart
7	NNFM	2025-03-27	79.8	\N	\N	\N	\N	0	chart
8	NNFM	2025-03-28	87.75	\N	\N	\N	\N	9.9624	chart
9	NNFM	2025-04-02	87.75	\N	\N	\N	\N	0	chart
10	NNFM	2025-04-03	87.75	\N	\N	\N	\N	0	chart
11	NNFM	2025-04-04	87.75	\N	\N	\N	\N	0	chart
12	NNFM	2025-04-07	87.75	\N	\N	\N	\N	0	chart
13	NNFM	2025-04-08	87.75	\N	\N	\N	\N	0	chart
14	NNFM	2025-04-09	87.75	\N	\N	\N	\N	0	chart
15	NNFM	2025-04-10	87.75	\N	\N	\N	\N	0	chart
16	NNFM	2025-04-11	87.75	\N	\N	\N	\N	0	chart
17	NNFM	2025-04-14	87.75	\N	\N	\N	\N	0	chart
18	NNFM	2025-04-15	79	\N	\N	\N	\N	-9.9715	chart
19	NNFM	2025-04-16	79	\N	\N	\N	\N	0	chart
20	NNFM	2025-04-17	79	\N	\N	\N	\N	0	chart
21	NNFM	2025-04-22	79	\N	\N	\N	\N	0	chart
22	NNFM	2025-04-23	79	\N	\N	\N	\N	0	chart
23	NNFM	2025-04-24	79	\N	\N	\N	\N	0	chart
24	NNFM	2025-04-25	75	\N	\N	\N	\N	-5.0633	chart
25	NNFM	2025-04-28	75	\N	\N	\N	\N	0	chart
26	NNFM	2025-04-29	75	\N	\N	\N	\N	0	chart
27	NNFM	2025-04-30	75	\N	\N	\N	\N	0	chart
28	NNFM	2025-05-02	75	\N	\N	\N	\N	0	chart
29	NNFM	2025-05-05	75	\N	\N	\N	\N	0	chart
30	NNFM	2025-05-06	82.5	\N	\N	\N	\N	10	chart
31	NNFM	2025-05-07	90.5	\N	\N	\N	\N	9.697	chart
32	NNFM	2025-05-08	90.5	\N	\N	\N	\N	0	chart
33	NNFM	2025-05-09	90.5	\N	\N	\N	\N	0	chart
34	NNFM	2025-05-12	90.5	\N	\N	\N	\N	0	chart
35	NNFM	2025-05-13	90.5	\N	\N	\N	\N	0	chart
36	NNFM	2025-05-14	99.55	\N	\N	\N	\N	10	chart
37	NNFM	2025-05-15	109	\N	\N	\N	\N	9.4927	chart
38	NNFM	2025-05-16	119.9	\N	\N	\N	\N	10	chart
39	NNFM	2025-05-19	131.85	\N	\N	\N	\N	9.9666	chart
40	NNFM	2025-05-20	131.85	\N	\N	\N	\N	0	chart
41	NNFM	2025-05-21	131.85	\N	\N	\N	\N	0	chart
42	NNFM	2025-05-22	131.85	\N	\N	\N	\N	0	chart
43	NNFM	2025-05-23	118.7	\N	\N	\N	\N	-9.9735	chart
44	NNFM	2025-05-26	118.7	\N	\N	\N	\N	0	chart
45	NNFM	2025-05-27	118.7	\N	\N	\N	\N	0	chart
46	NNFM	2025-05-28	130.55	\N	\N	\N	\N	9.9832	chart
47	NNFM	2025-05-29	138.9	\N	\N	\N	\N	6.396	chart
48	NNFM	2025-05-30	138.9	\N	\N	\N	\N	0	chart
49	NNFM	2025-06-02	138.9	\N	\N	\N	\N	0	chart
50	NNFM	2025-06-03	138.9	\N	\N	\N	\N	0	chart
51	NNFM	2025-06-04	138.9	\N	\N	\N	\N	0	chart
52	NNFM	2025-06-05	125.05	\N	\N	\N	\N	-9.9712	chart
53	NNFM	2025-06-10	125.05	\N	\N	\N	\N	0	chart
54	NNFM	2025-06-11	125.05	\N	\N	\N	\N	0	chart
55	NNFM	2025-06-13	112.55	\N	\N	\N	\N	-9.996	chart
56	NNFM	2025-06-16	101.3	\N	\N	\N	\N	-9.9956	chart
57	NNFM	2025-06-17	101.3	\N	\N	\N	\N	0	chart
58	NNFM	2025-06-18	101.3	\N	\N	\N	\N	0	chart
59	NNFM	2025-06-19	101.3	\N	\N	\N	\N	0	chart
60	NNFM	2025-06-20	93.2	\N	\N	\N	\N	-7.9961	chart
61	NNFM	2025-06-23	93.2	\N	\N	\N	\N	0	chart
62	NNFM	2025-06-24	101.3	\N	\N	\N	\N	8.691	chart
63	NNFM	2025-06-25	108	\N	\N	\N	\N	6.614	chart
64	NNFM	2025-06-26	108	\N	\N	\N	\N	0	chart
65	NNFM	2025-06-27	108	\N	\N	\N	\N	0	chart
66	NNFM	2025-06-30	108	\N	\N	\N	\N	0	chart
67	NNFM	2025-07-01	108	\N	\N	\N	\N	0	chart
68	NNFM	2025-07-02	108	\N	\N	\N	\N	0	chart
69	NNFM	2025-07-03	108	\N	\N	\N	\N	0	chart
70	NNFM	2025-07-04	108	\N	\N	\N	\N	0	chart
71	NNFM	2025-07-07	108	\N	\N	\N	\N	0	chart
72	NNFM	2025-07-08	98.1	\N	\N	\N	\N	-9.1667	chart
73	NNFM	2025-07-09	103.5	\N	\N	\N	\N	5.5046	chart
74	NNFM	2025-07-10	103.5	\N	\N	\N	\N	0	chart
75	NNFM	2025-07-11	103.5	\N	\N	\N	\N	0	chart
76	NNFM	2025-07-14	103.5	\N	\N	\N	\N	0	chart
77	NNFM	2025-07-16	103.5	\N	\N	\N	\N	0	chart
78	NNFM	2025-07-17	103.5	\N	\N	\N	\N	0	chart
79	NNFM	2025-07-18	103.5	\N	\N	\N	\N	0	chart
80	NNFM	2025-07-21	103.5	\N	\N	\N	\N	0	chart
81	NNFM	2025-07-22	103.5	\N	\N	\N	\N	0	chart
82	NNFM	2025-07-23	103.5	\N	\N	\N	\N	0	chart
83	NNFM	2025-07-24	103.5	\N	\N	\N	\N	0	chart
84	NNFM	2025-07-25	103.5	\N	\N	\N	\N	0	chart
85	NNFM	2025-07-28	103.5	\N	\N	\N	\N	0	chart
86	NNFM	2025-07-29	93.15	\N	\N	\N	\N	-10	chart
87	NNFM	2025-07-30	93.15	\N	\N	\N	\N	0	chart
88	NNFM	2025-07-31	93.15	\N	\N	\N	\N	0	chart
89	NNFM	2025-08-01	93.15	\N	\N	\N	\N	0	chart
90	NNFM	2025-08-04	93.15	\N	\N	\N	\N	0	chart
91	NNFM	2025-08-05	93.15	\N	\N	\N	\N	0	chart
92	NNFM	2025-08-06	93.15	\N	\N	\N	\N	0	chart
93	NNFM	2025-08-07	93.15	\N	\N	\N	\N	0	chart
94	NNFM	2025-08-08	93.15	\N	\N	\N	\N	0	chart
95	NNFM	2025-08-11	93.15	\N	\N	\N	\N	0	chart
96	NNFM	2025-08-12	89.8	\N	\N	\N	\N	-3.5963	chart
97	NNFM	2025-08-13	87.1	\N	\N	\N	\N	-3.0067	chart
98	NNFM	2025-08-14	87.1	\N	\N	\N	\N	0	chart
99	NNFM	2025-08-15	87.1	\N	\N	\N	\N	0	chart
100	NNFM	2025-08-18	87.1	\N	\N	\N	\N	0	chart
102	NNFM	2025-08-19	87.1	\N	\N	\N	\N	0	chart
103	NNFM	2025-08-20	87.1	\N	\N	\N	\N	0	chart
104	NNFM	2025-08-21	87.1	\N	\N	\N	\N	0	chart
105	NNFM	2025-08-22	87.1	\N	\N	\N	\N	0	chart
106	NNFM	2025-08-25	87.1	\N	\N	\N	\N	0	chart
107	NNFM	2025-08-26	87.1	\N	\N	\N	\N	0	chart
108	NNFM	2025-08-27	87.1	\N	\N	\N	\N	0	chart
109	NNFM	2025-08-28	86.7	\N	\N	\N	\N	-0.4592	chart
110	NNFM	2025-08-29	86.7	\N	\N	\N	\N	0	chart
111	NNFM	2025-09-01	86.7	\N	\N	\N	\N	0	chart
112	NNFM	2025-09-02	86.7	\N	\N	\N	\N	0	chart
113	NNFM	2025-09-03	86.7	\N	\N	\N	\N	0	chart
114	NNFM	2025-09-04	86.7	\N	\N	\N	\N	0	chart
115	NNFM	2025-09-08	86.7	\N	\N	\N	\N	0	chart
116	NNFM	2025-09-09	86.7	\N	\N	\N	\N	0	chart
117	NNFM	2025-09-10	86.45	\N	\N	\N	\N	-0.2884	chart
118	NNFM	2025-09-11	86.45	\N	\N	\N	\N	0	chart
119	NNFM	2025-09-12	86.45	\N	\N	\N	\N	0	chart
120	NNFM	2025-09-15	93.9	\N	\N	\N	\N	8.6177	chart
121	NNFM	2025-09-16	93.9	\N	\N	\N	\N	0	chart
122	NNFM	2025-09-17	93.9	\N	\N	\N	\N	0	chart
123	NNFM	2025-09-18	93.65	\N	\N	\N	\N	-0.2662	chart
124	NNFM	2025-09-19	93.65	\N	\N	\N	\N	0	chart
125	NNFM	2025-09-22	93.65	\N	\N	\N	\N	0	chart
126	NNFM	2025-09-23	93.65	\N	\N	\N	\N	0	chart
127	NNFM	2025-09-24	93.65	\N	\N	\N	\N	0	chart
128	NNFM	2025-09-25	93.65	\N	\N	\N	\N	0	chart
129	NNFM	2025-09-26	93.65	\N	\N	\N	\N	0	chart
130	NNFM	2025-09-29	93.65	\N	\N	\N	\N	0	chart
131	NNFM	2025-09-30	93.65	\N	\N	\N	\N	0	chart
132	NNFM	2025-10-02	93.65	\N	\N	\N	\N	0	chart
133	NNFM	2025-10-03	93.65	\N	\N	\N	\N	0	chart
134	NNFM	2025-10-06	93.65	\N	\N	\N	\N	0	chart
135	NNFM	2025-10-07	93.65	\N	\N	\N	\N	0	chart
136	NNFM	2025-10-08	93.65	\N	\N	\N	\N	0	chart
137	NNFM	2025-10-09	93.65	\N	\N	\N	\N	0	chart
138	NNFM	2025-10-10	93.65	\N	\N	\N	\N	0	chart
139	NNFM	2025-10-13	93.65	\N	\N	\N	\N	0	chart
140	NNFM	2025-10-14	93.65	\N	\N	\N	\N	0	chart
141	NNFM	2025-10-15	93.65	\N	\N	\N	\N	0	chart
142	NNFM	2025-10-16	93.65	\N	\N	\N	\N	0	chart
143	NNFM	2025-10-17	93.65	\N	\N	\N	\N	0	chart
144	NNFM	2025-10-20	93.65	\N	\N	\N	\N	0	chart
145	NNFM	2025-10-21	93.65	\N	\N	\N	\N	0	chart
146	NNFM	2025-10-22	93.65	\N	\N	\N	\N	0	chart
147	NNFM	2025-10-23	93.65	\N	\N	\N	\N	0	chart
148	NNFM	2025-10-24	93.65	\N	\N	\N	\N	0	chart
149	NNFM	2025-10-27	93.65	\N	\N	\N	\N	0	chart
150	NNFM	2025-10-28	93.65	\N	\N	\N	\N	0	chart
151	NNFM	2025-10-29	93.65	\N	\N	\N	\N	0	chart
152	NNFM	2025-10-30	93.65	\N	\N	\N	\N	0	chart
153	NNFM	2025-10-31	93.65	\N	\N	\N	\N	0	chart
154	NNFM	2025-11-03	84.3	\N	\N	\N	\N	-9.984	chart
155	NNFM	2025-11-04	84.3	\N	\N	\N	\N	0	chart
156	NNFM	2025-11-05	84.3	\N	\N	\N	\N	0	chart
157	NNFM	2025-11-06	84.3	\N	\N	\N	\N	0	chart
158	NNFM	2025-11-07	84.3	\N	\N	\N	\N	0	chart
159	NNFM	2025-11-10	84.3	\N	\N	\N	\N	0	chart
160	NNFM	2025-11-11	84.3	\N	\N	\N	\N	0	chart
161	NNFM	2025-11-12	84.3	\N	\N	\N	\N	0	chart
162	NNFM	2025-11-13	84.3	\N	\N	\N	\N	0	chart
163	NNFM	2025-11-14	84.3	\N	\N	\N	\N	0	chart
164	NNFM	2025-11-17	84.3	\N	\N	\N	\N	0	chart
165	NNFM	2025-11-18	84.3	\N	\N	\N	\N	0	chart
166	NNFM	2025-11-19	84.3	\N	\N	\N	\N	0	chart
167	NNFM	2025-11-20	84.3	\N	\N	\N	\N	0	chart
168	NNFM	2025-11-21	84.3	\N	\N	\N	\N	0	chart
169	NNFM	2025-11-24	84.3	\N	\N	\N	\N	0	chart
170	NNFM	2025-11-25	84.3	\N	\N	\N	\N	0	chart
171	NNFM	2025-11-26	84.3	\N	\N	\N	\N	0	chart
172	NNFM	2025-11-27	84.3	\N	\N	\N	\N	0	chart
173	NNFM	2025-11-28	84.3	\N	\N	\N	\N	0	chart
174	NNFM	2025-12-01	84.3	\N	\N	\N	\N	0	chart
175	NNFM	2025-12-02	84.3	\N	\N	\N	\N	0	chart
176	NNFM	2025-12-03	84.3	\N	\N	\N	\N	0	chart
177	NNFM	2025-12-04	84.3	\N	\N	\N	\N	0	chart
178	NNFM	2025-12-05	84.3	\N	\N	\N	\N	0	chart
179	NNFM	2025-12-08	84.3	\N	\N	\N	\N	0	chart
180	NNFM	2025-12-09	84.3	\N	\N	\N	\N	0	chart
181	NNFM	2025-12-10	84.3	\N	\N	\N	\N	0	chart
182	NNFM	2025-12-11	84.3	\N	\N	\N	\N	0	chart
183	NNFM	2025-12-12	84.3	\N	\N	\N	\N	0	chart
184	NNFM	2025-12-15	84.3	\N	\N	\N	\N	0	chart
185	NNFM	2025-12-16	84.3	\N	\N	\N	\N	0	chart
186	NNFM	2025-12-17	84.3	\N	\N	\N	\N	0	chart
187	NNFM	2025-12-18	84.3	\N	\N	\N	\N	0	chart
188	NNFM	2025-12-19	84.3	\N	\N	\N	\N	0	chart
189	NNFM	2025-12-22	84.3	\N	\N	\N	\N	0	chart
190	NNFM	2025-12-23	84.3	\N	\N	\N	\N	0	chart
191	NNFM	2025-12-24	84.3	\N	\N	\N	\N	0	chart
192	NNFM	2025-12-29	84.3	\N	\N	\N	\N	0	chart
193	NNFM	2025-12-30	84.3	\N	\N	\N	\N	0	chart
194	NNFM	2025-12-31	84.3	\N	\N	\N	\N	0	chart
195	NNFM	2026-01-02	84.3	\N	\N	\N	\N	0	chart
196	NNFM	2026-01-05	84.3	\N	\N	\N	\N	0	chart
197	NNFM	2026-01-06	84.3	\N	\N	\N	\N	0	chart
198	NNFM	2026-01-07	84.3	\N	\N	\N	\N	0	chart
199	NNFM	2026-01-08	84.3	\N	\N	\N	\N	0	chart
200	NNFM	2026-01-09	84.3	\N	\N	\N	\N	0	chart
201	NNFM	2026-01-12	84.3	\N	\N	\N	\N	0	chart
202	NNFM	2026-01-13	84.3	\N	\N	\N	\N	0	chart
203	NNFM	2026-01-14	84.3	\N	\N	\N	\N	0	chart
204	NNFM	2026-01-15	84.3	\N	\N	\N	\N	0	chart
205	NNFM	2026-01-16	84.3	\N	\N	\N	\N	0	chart
206	NNFM	2026-01-19	84.3	\N	\N	\N	\N	0	chart
207	NNFM	2026-01-20	84.3	\N	\N	\N	\N	0	chart
208	NNFM	2026-01-21	84.3	\N	\N	\N	\N	0	chart
209	NNFM	2026-01-22	84.3	\N	\N	\N	\N	0	chart
210	NNFM	2026-01-23	84.3	\N	\N	\N	\N	0	chart
211	NNFM	2026-01-26	84.3	\N	\N	\N	\N	0	chart
212	NNFM	2026-01-27	84.3	\N	\N	\N	\N	0	chart
213	NNFM	2026-01-28	84.3	\N	\N	\N	\N	0	chart
214	NNFM	2026-01-29	84.3	\N	\N	\N	\N	0	chart
215	NNFM	2026-01-30	84.3	\N	\N	\N	\N	0	chart
216	NNFM	2026-02-02	84.3	\N	\N	\N	\N	0	chart
217	NNFM	2026-02-03	82.25	\N	\N	\N	\N	-2.4318	chart
218	NNFM	2026-02-04	82.25	\N	\N	\N	\N	0	chart
219	NNFM	2026-02-05	82.25	\N	\N	\N	\N	0	chart
220	NNFM	2026-02-06	79.4	\N	\N	\N	\N	-3.465	chart
221	NNFM	2026-02-09	79.4	\N	\N	\N	\N	0	chart
222	NNFM	2026-02-10	79.4	\N	\N	\N	\N	0	chart
223	NNFM	2026-02-11	79.4	\N	\N	\N	\N	0	chart
224	NNFM	2026-02-12	79.4	\N	\N	\N	\N	0	chart
225	NNFM	2026-02-13	79.4	\N	\N	\N	\N	0	chart
226	NNFM	2026-02-16	79.4	\N	\N	\N	\N	0	chart
227	NNFM	2026-02-17	79.4	\N	\N	\N	\N	0	chart
228	NNFM	2026-02-18	79.4	\N	\N	\N	\N	0	chart
229	NNFM	2026-02-19	79.4	\N	\N	\N	\N	0	chart
230	NNFM	2026-02-20	79.4	\N	\N	\N	\N	0	chart
231	NNFM	2026-02-23	79.4	\N	\N	\N	\N	0	chart
232	NNFM	2026-02-24	79.4	\N	\N	\N	\N	0	chart
233	NNFM	2026-02-25	79.4	\N	\N	\N	\N	0	chart
234	NNFM	2026-02-26	79.4	\N	\N	\N	\N	0	chart
235	NNFM	2026-02-27	79.4	\N	\N	\N	\N	0	chart
236	NNFM	2026-03-02	79.4	\N	\N	\N	\N	0	chart
237	NNFM	2026-03-03	79.4	\N	\N	\N	\N	0	chart
238	NNFM	2026-03-04	79.4	\N	\N	\N	\N	0	chart
239	NNFM	2026-03-05	79.4	\N	\N	\N	\N	0	chart
240	NNFM	2026-03-06	79.4	\N	\N	\N	\N	0	chart
241	NNFM	2026-03-09	79.4	\N	\N	\N	\N	0	chart
242	NNFM	2026-03-10	79.4	\N	\N	\N	\N	0	chart
243	NNFM	2026-03-11	79.4	\N	\N	\N	\N	0	chart
244	NNFM	2026-03-12	79.4	\N	\N	\N	\N	0	chart
245	NNFM	2026-03-13	79.4	\N	\N	\N	\N	0	chart
246	NNFM	2026-03-16	79.4	\N	\N	\N	\N	0	chart
247	NNFM	2026-03-17	79.4	\N	\N	\N	\N	0	chart
248	NNFM	2026-03-18	79.4	\N	\N	\N	\N	0	chart
674	UBA	2025-06-11	35.55	\N	\N	\N	\N	-3.1335	chart
675	UBA	2025-06-13	36.15	\N	\N	\N	\N	1.6878	chart
676	UBA	2025-06-16	34.1	\N	\N	\N	\N	-5.6708	chart
708	UBA	2025-07-31	49.6	\N	\N	\N	\N	3.3333	chart
709	UBA	2025-08-01	49.25	\N	\N	\N	\N	-0.7056	chart
710	UBA	2025-08-04	48.9	\N	\N	\N	\N	-0.7107	chart
711	UBA	2025-08-05	48.9	\N	\N	\N	\N	0	chart
712	UBA	2025-08-06	48.1	\N	\N	\N	\N	-1.636	chart
713	UBA	2025-08-07	48.45	\N	\N	\N	\N	0.7277	chart
714	UBA	2025-08-08	48.6	\N	\N	\N	\N	0.3096	chart
715	UBA	2025-08-11	48.1	\N	\N	\N	\N	-1.0288	chart
716	UBA	2025-08-12	48.7	\N	\N	\N	\N	1.2474	chart
717	UBA	2025-08-13	48.05	\N	\N	\N	\N	-1.3347	chart
718	UBA	2025-08-14	48.3	\N	\N	\N	\N	0.5203	chart
719	UBA	2025-08-15	48	\N	\N	\N	\N	-0.6211	chart
720	UBA	2025-08-18	47.95	\N	\N	\N	\N	-0.1042	chart
721	UBA	2025-08-19	48	\N	\N	\N	\N	0.1043	chart
722	UBA	2025-08-20	48	\N	\N	\N	\N	0	chart
723	UBA	2025-08-21	48	\N	\N	\N	\N	0	chart
724	UBA	2025-08-22	47.95	\N	\N	\N	\N	-0.1042	chart
725	UBA	2025-08-25	47.95	\N	\N	\N	\N	0	chart
726	UBA	2025-08-26	48.4	\N	\N	\N	\N	0.9385	chart
727	UBA	2025-08-27	49.5	\N	\N	\N	\N	2.2727	chart
728	UBA	2025-08-28	48.8	\N	\N	\N	\N	-1.4141	chart
729	UBA	2025-08-29	48.65	\N	\N	\N	\N	-0.3074	chart
730	UBA	2025-09-01	47.25	\N	\N	\N	\N	-2.8777	chart
731	UBA	2025-09-02	46.7	\N	\N	\N	\N	-1.164	chart
732	UBA	2025-09-03	45.75	\N	\N	\N	\N	-2.0343	chart
733	UBA	2025-09-04	46.75	\N	\N	\N	\N	2.1858	chart
734	UBA	2025-09-08	46.75	\N	\N	\N	\N	0	chart
735	UBA	2025-09-09	46.95	\N	\N	\N	\N	0.4278	chart
736	UBA	2025-09-10	47	\N	\N	\N	\N	0.1065	chart
737	UBA	2025-09-11	48.1	\N	\N	\N	\N	2.3404	chart
738	UBA	2025-09-12	48.7	\N	\N	\N	\N	1.2474	chart
739	UBA	2025-09-15	48.35	\N	\N	\N	\N	-0.7187	chart
740	UBA	2025-09-16	47.25	\N	\N	\N	\N	-2.2751	chart
741	UBA	2025-09-17	47	\N	\N	\N	\N	-0.5291	chart
742	UBA	2025-09-18	47	\N	\N	\N	\N	0	chart
743	UBA	2025-09-19	44.2	\N	\N	\N	\N	-5.9574	chart
744	UBA	2025-09-22	43	\N	\N	\N	\N	-2.7149	chart
745	UBA	2025-09-23	43	\N	\N	\N	\N	0	chart
746	UBA	2025-09-24	43.75	\N	\N	\N	\N	1.7442	chart
747	UBA	2025-09-25	43.8	\N	\N	\N	\N	0.1143	chart
748	UBA	2025-09-26	44.9	\N	\N	\N	\N	2.5114	chart
749	UBA	2025-09-29	44.4	\N	\N	\N	\N	-1.1136	chart
750	UBA	2025-09-30	43.2	\N	\N	\N	\N	-2.7027	chart
751	UBA	2025-10-02	43	\N	\N	\N	\N	-0.463	chart
752	UBA	2025-10-03	43	\N	\N	\N	\N	0	chart
753	UBA	2025-10-06	42.15	\N	\N	\N	\N	-1.9767	chart
754	UBA	2025-10-07	42.45	\N	\N	\N	\N	0.7117	chart
755	UBA	2025-10-08	42.4	\N	\N	\N	\N	-0.1178	chart
756	UBA	2025-10-09	42.25	\N	\N	\N	\N	-0.3538	chart
757	UBA	2025-10-10	42.8	\N	\N	\N	\N	1.3018	chart
758	UBA	2025-10-13	42.8	\N	\N	\N	\N	0	chart
759	UBA	2025-10-14	42.3	\N	\N	\N	\N	-1.1682	chart
760	UBA	2025-10-15	42.4	\N	\N	\N	\N	0.2364	chart
761	UBA	2025-10-16	42	\N	\N	\N	\N	-0.9434	chart
762	UBA	2025-10-17	42	\N	\N	\N	\N	0	chart
763	UBA	2025-10-20	42.95	\N	\N	\N	\N	2.2619	chart
764	UBA	2025-10-21	42.95	\N	\N	\N	\N	0	chart
765	UBA	2025-10-22	42.8	\N	\N	\N	\N	-0.3492	chart
766	UBA	2025-10-23	42.6	\N	\N	\N	\N	-0.4673	chart
767	UBA	2025-10-24	42	\N	\N	\N	\N	-1.4085	chart
768	UBA	2025-10-27	40.2	\N	\N	\N	\N	-4.2857	chart
769	UBA	2025-10-28	39.6	\N	\N	\N	\N	-1.4925	chart
770	UBA	2025-10-29	39	\N	\N	\N	\N	-1.5152	chart
771	UBA	2025-10-30	39.75	\N	\N	\N	\N	1.9231	chart
772	UBA	2025-10-31	40.05	\N	\N	\N	\N	0.7547	chart
773	UBA	2025-11-03	40.5	\N	\N	\N	\N	1.1236	chart
774	UBA	2025-11-04	39.5	\N	\N	\N	\N	-2.4691	chart
775	UBA	2025-11-05	40.45	\N	\N	\N	\N	2.4051	chart
776	UBA	2025-11-06	41	\N	\N	\N	\N	1.3597	chart
777	UBA	2025-11-07	40	\N	\N	\N	\N	-2.439	chart
778	UBA	2025-11-10	38.05	\N	\N	\N	\N	-4.875	chart
779	UBA	2025-11-11	34.9	\N	\N	\N	\N	-8.2786	chart
780	UBA	2025-11-12	38.35	\N	\N	\N	\N	9.8854	chart
781	UBA	2025-11-13	41	\N	\N	\N	\N	6.91	chart
782	UBA	2025-11-14	40	\N	\N	\N	\N	-2.439	chart
783	UBA	2025-11-17	39.9	\N	\N	\N	\N	-0.25	chart
784	UBA	2025-11-18	38.9	\N	\N	\N	\N	-2.5063	chart
785	UBA	2025-11-19	38	\N	\N	\N	\N	-2.3136	chart
786	UBA	2025-11-20	37	\N	\N	\N	\N	-2.6316	chart
787	UBA	2025-11-21	36.9	\N	\N	\N	\N	-0.2703	chart
788	UBA	2025-11-24	35.85	\N	\N	\N	\N	-2.8455	chart
789	UBA	2025-11-25	35.9	\N	\N	\N	\N	0.1395	chart
790	UBA	2025-11-26	35.9	\N	\N	\N	\N	0	chart
791	UBA	2025-11-27	36	\N	\N	\N	\N	0.2786	chart
792	UBA	2025-11-28	36.45	\N	\N	\N	\N	1.25	chart
793	UBA	2025-12-01	37	\N	\N	\N	\N	1.5089	chart
794	UBA	2025-12-02	38.4	\N	\N	\N	\N	3.7838	chart
795	UBA	2025-12-03	39.6	\N	\N	\N	\N	3.125	chart
796	UBA	2025-12-04	39.15	\N	\N	\N	\N	-1.1364	chart
797	UBA	2025-12-05	40	\N	\N	\N	\N	2.1711	chart
798	UBA	2025-12-08	40	\N	\N	\N	\N	0	chart
799	UBA	2025-12-09	40	\N	\N	\N	\N	0	chart
800	UBA	2025-12-10	40.25	\N	\N	\N	\N	0.625	chart
801	UBA	2025-12-11	40	\N	\N	\N	\N	-0.6211	chart
802	UBA	2025-12-12	39.7	\N	\N	\N	\N	-0.75	chart
803	UBA	2025-12-15	40	\N	\N	\N	\N	0.7557	chart
804	UBA	2025-12-16	39.7	\N	\N	\N	\N	-0.75	chart
805	UBA	2025-12-17	39.8	\N	\N	\N	\N	0.2519	chart
806	UBA	2025-12-18	41.6	\N	\N	\N	\N	4.5226	chart
807	UBA	2025-12-19	40	\N	\N	\N	\N	-3.8462	chart
808	UBA	2025-12-22	39	\N	\N	\N	\N	-2.5	chart
809	UBA	2025-12-23	39.4	\N	\N	\N	\N	1.0256	chart
810	UBA	2025-12-24	42	\N	\N	\N	\N	6.599	chart
811	UBA	2025-12-29	41	\N	\N	\N	\N	-2.381	chart
812	UBA	2025-12-30	40.85	\N	\N	\N	\N	-0.3659	chart
813	UBA	2025-12-31	41.65	\N	\N	\N	\N	1.9584	chart
814	UBA	2026-01-02	43	\N	\N	\N	\N	3.2413	chart
815	UBA	2026-01-05	45.85	\N	\N	\N	\N	6.6279	chart
816	UBA	2026-01-06	43	\N	\N	\N	\N	-6.2159	chart
817	UBA	2026-01-07	43.9	\N	\N	\N	\N	2.093	chart
818	UBA	2026-01-08	44.3	\N	\N	\N	\N	0.9112	chart
819	UBA	2026-01-09	44	\N	\N	\N	\N	-0.6772	chart
820	UBA	2026-01-12	44	\N	\N	\N	\N	0	chart
821	UBA	2026-01-13	45.95	\N	\N	\N	\N	4.4318	chart
822	UBA	2026-01-14	45.2	\N	\N	\N	\N	-1.6322	chart
823	UBA	2026-01-15	45	\N	\N	\N	\N	-0.4425	chart
824	UBA	2026-01-16	45.2	\N	\N	\N	\N	0.4444	chart
825	UBA	2026-01-19	45.2	\N	\N	\N	\N	0	chart
826	UBA	2026-01-20	45	\N	\N	\N	\N	-0.4425	chart
827	UBA	2026-01-21	44.9	\N	\N	\N	\N	-0.2222	chart
828	UBA	2026-01-22	44.5	\N	\N	\N	\N	-0.8909	chart
829	UBA	2026-01-23	43.9	\N	\N	\N	\N	-1.3483	chart
830	UBA	2026-01-26	44.5	\N	\N	\N	\N	1.3667	chart
831	UBA	2026-01-27	44.85	\N	\N	\N	\N	0.7865	chart
832	UBA	2026-01-28	44.5	\N	\N	\N	\N	-0.7804	chart
833	UBA	2026-01-29	44.5	\N	\N	\N	\N	0	chart
834	UBA	2026-01-30	44.3	\N	\N	\N	\N	-0.4494	chart
835	UBA	2026-02-02	44.3	\N	\N	\N	\N	0	chart
836	UBA	2026-02-03	43	\N	\N	\N	\N	-2.9345	chart
837	UBA	2026-02-04	44.05	\N	\N	\N	\N	2.4419	chart
838	UBA	2026-02-05	44.15	\N	\N	\N	\N	0.227	chart
839	UBA	2026-02-06	44.2	\N	\N	\N	\N	0.1133	chart
840	UBA	2026-02-09	44.8	\N	\N	\N	\N	1.3575	chart
841	UBA	2026-02-10	46.05	\N	\N	\N	\N	2.7902	chart
842	UBA	2026-02-11	47	\N	\N	\N	\N	2.063	chart
843	UBA	2026-02-12	47.5	\N	\N	\N	\N	1.0638	chart
844	UBA	2026-02-13	48.3	\N	\N	\N	\N	1.6842	chart
845	UBA	2026-02-16	49.55	\N	\N	\N	\N	2.588	chart
846	UBA	2026-02-17	46.3	\N	\N	\N	\N	-6.559	chart
847	UBA	2026-02-18	47	\N	\N	\N	\N	1.5119	chart
848	UBA	2026-02-19	48	\N	\N	\N	\N	2.1277	chart
849	UBA	2026-02-20	49	\N	\N	\N	\N	2.0833	chart
850	UBA	2026-02-23	49.5	\N	\N	\N	\N	1.0204	chart
851	UBA	2026-02-24	50.2	\N	\N	\N	\N	1.4141	chart
852	UBA	2026-02-25	49	\N	\N	\N	\N	-2.3904	chart
853	UBA	2026-02-26	47.4	\N	\N	\N	\N	-3.2653	chart
854	UBA	2026-02-27	48.8	\N	\N	\N	\N	2.9536	chart
855	UBA	2026-03-02	47.2	\N	\N	\N	\N	-3.2787	chart
856	UBA	2026-03-03	47.05	\N	\N	\N	\N	-0.3178	chart
857	UBA	2026-03-04	47.6	\N	\N	\N	\N	1.169	chart
858	UBA	2026-03-05	47.65	\N	\N	\N	\N	0.105	chart
859	UBA	2026-03-06	47.6	\N	\N	\N	\N	-0.1049	chart
860	UBA	2026-03-09	47	\N	\N	\N	\N	-1.2605	chart
861	UBA	2026-03-10	46.45	\N	\N	\N	\N	-1.1702	chart
862	UBA	2026-03-11	46.1	\N	\N	\N	\N	-0.7535	chart
863	UBA	2026-03-12	45.9	\N	\N	\N	\N	-0.4338	chart
864	UBA	2026-03-13	45.5	\N	\N	\N	\N	-0.8715	chart
865	UBA	2026-03-16	48	\N	\N	\N	\N	5.4945	chart
866	UBA	2026-03-17	50.9	\N	\N	\N	\N	6.0417	chart
867	UBA	2026-03-18	48.75	\N	\N	\N	\N	-4.224	chart
1372	DANGCEM	2025-03-19	480	\N	\N	\N	\N	\N	chart
1373	DANGCEM	2025-03-20	480	\N	\N	\N	\N	0	chart
1374	DANGCEM	2025-03-21	480	\N	\N	\N	\N	0	chart
1375	DANGCEM	2025-03-24	480	\N	\N	\N	\N	0	chart
1376	DANGCEM	2025-03-25	480	\N	\N	\N	\N	0	chart
1377	DANGCEM	2025-03-26	480	\N	\N	\N	\N	0	chart
1378	DANGCEM	2025-03-27	480	\N	\N	\N	\N	0	chart
1379	DANGCEM	2025-03-28	480	\N	\N	\N	\N	0	chart
1380	DANGCEM	2025-04-02	480	\N	\N	\N	\N	0	chart
1381	DANGCEM	2025-04-03	480	\N	\N	\N	\N	0	chart
1382	DANGCEM	2025-04-04	480	\N	\N	\N	\N	0	chart
1383	DANGCEM	2025-04-07	480	\N	\N	\N	\N	0	chart
1384	DANGCEM	2025-04-08	480	\N	\N	\N	\N	0	chart
1385	DANGCEM	2025-04-09	480	\N	\N	\N	\N	0	chart
1386	DANGCEM	2025-04-10	480	\N	\N	\N	\N	0	chart
1387	DANGCEM	2025-04-11	480	\N	\N	\N	\N	0	chart
1388	DANGCEM	2025-04-14	480	\N	\N	\N	\N	0	chart
1389	DANGCEM	2025-04-15	480	\N	\N	\N	\N	0	chart
1390	DANGCEM	2025-04-16	480	\N	\N	\N	\N	0	chart
1391	DANGCEM	2025-04-17	480	\N	\N	\N	\N	0	chart
1392	DANGCEM	2025-04-22	480	\N	\N	\N	\N	0	chart
1393	DANGCEM	2025-04-23	480	\N	\N	\N	\N	0	chart
1394	DANGCEM	2025-04-24	480	\N	\N	\N	\N	0	chart
1395	DANGCEM	2025-04-25	432	\N	\N	\N	\N	-10	chart
1396	DANGCEM	2025-04-28	432	\N	\N	\N	\N	0	chart
1397	DANGCEM	2025-04-29	432	\N	\N	\N	\N	0	chart
1398	DANGCEM	2025-04-30	432	\N	\N	\N	\N	0	chart
1399	DANGCEM	2025-05-02	432	\N	\N	\N	\N	0	chart
1400	DANGCEM	2025-05-05	432	\N	\N	\N	\N	0	chart
1401	DANGCEM	2025-05-06	432	\N	\N	\N	\N	0	chart
1402	DANGCEM	2025-05-07	432	\N	\N	\N	\N	0	chart
1403	DANGCEM	2025-05-08	440	\N	\N	\N	\N	1.8519	chart
1404	DANGCEM	2025-05-09	440	\N	\N	\N	\N	0	chart
1405	DANGCEM	2025-05-12	440	\N	\N	\N	\N	0	chart
1406	DANGCEM	2025-05-13	440	\N	\N	\N	\N	0	chart
1407	DANGCEM	2025-05-14	440	\N	\N	\N	\N	0	chart
1408	DANGCEM	2025-05-15	440	\N	\N	\N	\N	0	chart
1409	DANGCEM	2025-05-16	440	\N	\N	\N	\N	0	chart
1410	DANGCEM	2025-05-19	440	\N	\N	\N	\N	0	chart
1411	DANGCEM	2025-05-20	440	\N	\N	\N	\N	0	chart
1412	DANGCEM	2025-05-21	440	\N	\N	\N	\N	0	chart
1413	DANGCEM	2025-05-22	440	\N	\N	\N	\N	0	chart
1414	DANGCEM	2025-05-23	440	\N	\N	\N	\N	0	chart
1415	DANGCEM	2025-05-26	440	\N	\N	\N	\N	0	chart
1416	DANGCEM	2025-05-27	440	\N	\N	\N	\N	0	chart
1417	DANGCEM	2025-05-28	440	\N	\N	\N	\N	0	chart
1418	DANGCEM	2025-05-29	440	\N	\N	\N	\N	0	chart
1419	DANGCEM	2025-05-30	440	\N	\N	\N	\N	0	chart
1420	DANGCEM	2025-06-02	440	\N	\N	\N	\N	0	chart
1421	DANGCEM	2025-06-03	450	\N	\N	\N	\N	2.2727	chart
1422	DANGCEM	2025-06-04	450	\N	\N	\N	\N	0	chart
1423	DANGCEM	2025-06-05	450	\N	\N	\N	\N	0	chart
1424	DANGCEM	2025-06-10	420	\N	\N	\N	\N	-6.6667	chart
1425	DANGCEM	2025-06-11	438.9	\N	\N	\N	\N	4.5	chart
1426	DANGCEM	2025-06-13	438.9	\N	\N	\N	\N	0	chart
1427	DANGCEM	2025-06-16	438.9	\N	\N	\N	\N	0	chart
1428	DANGCEM	2025-06-17	438.9	\N	\N	\N	\N	0	chart
1429	DANGCEM	2025-06-18	440	\N	\N	\N	\N	0.2506	chart
1430	DANGCEM	2025-06-19	440	\N	\N	\N	\N	0	chart
1431	DANGCEM	2025-06-20	440	\N	\N	\N	\N	0	chart
1432	DANGCEM	2025-06-23	440	\N	\N	\N	\N	0	chart
1433	DANGCEM	2025-06-24	440	\N	\N	\N	\N	0	chart
1434	DANGCEM	2025-06-25	440	\N	\N	\N	\N	0	chart
1435	DANGCEM	2025-06-26	440	\N	\N	\N	\N	0	chart
1436	DANGCEM	2025-06-27	440	\N	\N	\N	\N	0	chart
1437	DANGCEM	2025-06-30	440	\N	\N	\N	\N	0	chart
1438	DANGCEM	2025-07-01	425	\N	\N	\N	\N	-3.4091	chart
1439	DANGCEM	2025-07-02	425	\N	\N	\N	\N	0	chart
1440	DANGCEM	2025-07-03	425	\N	\N	\N	\N	0	chart
1441	DANGCEM	2025-07-04	425	\N	\N	\N	\N	0	chart
1442	DANGCEM	2025-07-07	425	\N	\N	\N	\N	0	chart
1443	DANGCEM	2025-07-08	425	\N	\N	\N	\N	0	chart
1444	DANGCEM	2025-07-09	425	\N	\N	\N	\N	0	chart
1445	DANGCEM	2025-07-10	425	\N	\N	\N	\N	0	chart
1446	DANGCEM	2025-07-11	425	\N	\N	\N	\N	0	chart
1447	DANGCEM	2025-07-14	430	\N	\N	\N	\N	1.1765	chart
1448	DANGCEM	2025-07-16	430.3	\N	\N	\N	\N	0.0698	chart
1449	DANGCEM	2025-07-17	473.3	\N	\N	\N	\N	9.993	chart
1450	DANGCEM	2025-07-18	495	\N	\N	\N	\N	4.5848	chart
1451	DANGCEM	2025-07-21	489	\N	\N	\N	\N	-1.2121	chart
1452	DANGCEM	2025-07-22	489	\N	\N	\N	\N	0	chart
1453	DANGCEM	2025-07-23	490	\N	\N	\N	\N	0.2045	chart
1454	DANGCEM	2025-07-24	490	\N	\N	\N	\N	0	chart
1455	DANGCEM	2025-07-25	493	\N	\N	\N	\N	0.6122	chart
1456	DANGCEM	2025-07-28	494.5	\N	\N	\N	\N	0.3043	chart
1457	DANGCEM	2025-07-29	509.6	\N	\N	\N	\N	3.0536	chart
1458	DANGCEM	2025-07-30	509.6	\N	\N	\N	\N	0	chart
1459	DANGCEM	2025-07-31	528.3	\N	\N	\N	\N	3.6695	chart
1460	DANGCEM	2025-08-01	528.3	\N	\N	\N	\N	0	chart
1461	DANGCEM	2025-08-04	577	\N	\N	\N	\N	9.2182	chart
1462	DANGCEM	2025-08-05	577	\N	\N	\N	\N	0	chart
1463	DANGCEM	2025-08-06	577	\N	\N	\N	\N	0	chart
1464	DANGCEM	2025-08-07	577	\N	\N	\N	\N	0	chart
1465	DANGCEM	2025-08-08	577	\N	\N	\N	\N	0	chart
1466	DANGCEM	2025-08-11	577	\N	\N	\N	\N	0	chart
1467	DANGCEM	2025-08-12	577	\N	\N	\N	\N	0	chart
1468	DANGCEM	2025-08-13	577	\N	\N	\N	\N	0	chart
1469	DANGCEM	2025-08-14	577	\N	\N	\N	\N	0	chart
1470	DANGCEM	2025-08-15	577	\N	\N	\N	\N	0	chart
1471	DANGCEM	2025-08-18	577	\N	\N	\N	\N	0	chart
1472	DANGCEM	2025-08-19	520	\N	\N	\N	\N	-9.8787	chart
1473	DANGCEM	2025-08-20	520	\N	\N	\N	\N	0	chart
1474	DANGCEM	2025-08-21	520	\N	\N	\N	\N	0	chart
1475	DANGCEM	2025-08-22	520	\N	\N	\N	\N	0	chart
1476	DANGCEM	2025-08-25	520	\N	\N	\N	\N	0	chart
1477	DANGCEM	2025-08-26	520	\N	\N	\N	\N	0	chart
1478	DANGCEM	2025-08-27	520	\N	\N	\N	\N	0	chart
1479	DANGCEM	2025-08-28	520.2	\N	\N	\N	\N	0.0385	chart
1480	DANGCEM	2025-08-29	520.2	\N	\N	\N	\N	0	chart
1481	DANGCEM	2025-09-01	520.2	\N	\N	\N	\N	0	chart
1482	DANGCEM	2025-09-02	520.2	\N	\N	\N	\N	0	chart
1483	DANGCEM	2025-09-03	520.2	\N	\N	\N	\N	0	chart
1484	DANGCEM	2025-09-04	520.2	\N	\N	\N	\N	0	chart
1485	DANGCEM	2025-09-08	520.2	\N	\N	\N	\N	0	chart
1486	DANGCEM	2025-09-09	520.2	\N	\N	\N	\N	0	chart
1487	DANGCEM	2025-09-10	528	\N	\N	\N	\N	1.4994	chart
1488	DANGCEM	2025-09-11	528	\N	\N	\N	\N	0	chart
1489	DANGCEM	2025-09-12	511.2	\N	\N	\N	\N	-3.1818	chart
1490	DANGCEM	2025-09-15	511.2	\N	\N	\N	\N	0	chart
1491	DANGCEM	2025-09-16	511.2	\N	\N	\N	\N	0	chart
1492	DANGCEM	2025-09-17	516.2	\N	\N	\N	\N	0.9781	chart
4477	CUSTODIAN	2025-09-18	44.15	44.15	44.15	44.15	216976	0	history
4479	CUSTODIAN	2025-09-19	44.15	44.15	44.15	44.15	574793	0	history
4481	CUSTODIAN	2025-09-22	44.15	44.15	44.15	44.15	373437	0	history
4483	CUSTODIAN	2025-09-23	48.3	43	48.3	43	6647131	9.4	history
4486	CUSTODIAN	2025-09-24	48.3	48.3	48.3	48.3	711108	0	history
4491	CUSTODIAN	2025-09-25	48.3	48.3	48.3	48.3	404325	0	history
4495	CUSTODIAN	2025-09-26	44	43.5	44	43.5	2640997	-8.9	history
4499	CUSTODIAN	2025-09-29	43	43	43	43	748791	-2.27	history
4503	CUSTODIAN	2025-09-30	40.8	40.85	40.85	40.8	2841105	-5.12	history
4506	CUSTODIAN	2025-10-02	42.25	40.15	42.25	39.35	2210077	3.55	history
4510	CUSTODIAN	2025-10-03	41.9	40.8	41.9	40.5	1857294	-0.83	history
4513	CUSTODIAN	2025-10-06	41.5	40.3	41.5	40.25	21826360	-0.95	history
4517	CUSTODIAN	2025-10-07	40.7	41	41	40.7	3751510	-1.93	history
4521	CUSTODIAN	2025-10-08	40.65	40	40.65	40	1684583	-0.12	history
4525	CUSTODIAN	2025-10-09	40.65	40.65	40.65	40.65	600186	0	history
4529	CUSTODIAN	2025-10-10	40.65	40.65	40.65	40.65	300812	0	history
4533	CUSTODIAN	2025-10-13	43	43	43	43	767680	5.78	history
4537	CUSTODIAN	2025-10-14	44	44	44	44	385868	2.33	history
4541	CUSTODIAN	2025-10-15	44	44	44	44	453612	0	history
4545	CUSTODIAN	2025-10-16	42	40.8	42	40.8	2587667	-4.55	history
4549	CUSTODIAN	2025-10-17	42	42	42	42	432125	0	history
4553	CUSTODIAN	2025-10-20	41.6	41.6	41.6	41.6	5089063	-0.95	history
4557	CUSTODIAN	2025-10-21	41.6	41.6	41.6	41.6	648047	0	history
4561	CUSTODIAN	2025-10-22	41.6	41.45	41.6	37.5	3356878	0	history
4565	CUSTODIAN	2025-10-23	41.6	41.6	41.6	41.6	1309297	0	history
4569	CUSTODIAN	2025-10-24	43.2	43.2	43.2	43.2	972248	3.85	history
4573	CUSTODIAN	2025-10-27	43.2	43.2	43.2	43.2	609525	0	history
4577	CUSTODIAN	2025-10-28	43.2	43.2	43.2	43.2	1324701	0	history
4581	CUSTODIAN	2025-10-29	40.45	40.4	42.55	40.4	1813119	-6.37	history
4585	CUSTODIAN	2025-10-30	42.45	41.4	42.45	41.4	919692	4.94	history
4589	CUSTODIAN	2025-10-31	42.45	42.45	42.45	42.45	1167841	0	history
4594	CUSTODIAN	2025-11-03	42.45	42.45	42.45	42.45	255879.00000000003	0	history
4598	CUSTODIAN	2025-11-04	42.45	42.45	42.45	42.45	1116239	0	history
4602	CUSTODIAN	2025-11-05	42.45	42.45	42.45	42.45	2309495	0	history
4607	CUSTODIAN	2025-11-06	42.45	42.45	42.45	42.45	1694546	0	history
4611	CUSTODIAN	2025-11-07	38.5	38.5	38.5	38.5	1004271	-9.31	history
4615	CUSTODIAN	2025-11-10	38	34.75	38	34.75	1138701	-1.3	history
4619	CUSTODIAN	2025-11-11	34.2	34.2	34.2	34.2	457795	-10	history
4623	CUSTODIAN	2025-11-12	35	35.5	35.5	35	1185941	2.34	history
4627	CUSTODIAN	2025-11-13	38.5	38.5	38.5	38.5	1920422	10	history
4631	CUSTODIAN	2025-11-14	39.5	39.5	39.5	39.5	214764	2.6	history
4635	CUSTODIAN	2025-11-17	39.5	39.5	39.5	39.5	188899	0	history
4639	CUSTODIAN	2025-11-18	39.9	39.9	39.9	39.9	1614490	1.01	history
4643	CUSTODIAN	2025-11-19	39.9	39.5	39.9	39.5	1041091	0	history
4647	CUSTODIAN	2025-11-20	39.9	39.9	39.9	39.9	78299	0	history
4652	CUSTODIAN	2025-11-21	39.9	39.9	39.9	39.9	169362	0	history
4656	CUSTODIAN	2025-11-24	39.9	39.9	39.9	39.9	237876	0	history
4660	CUSTODIAN	2025-11-25	39.9	39.9	39.9	39.9	277466	0	history
4664	CUSTODIAN	2025-11-26	39.9	39.9	39.9	39.9	502422.99999999994	0	history
4668	CUSTODIAN	2025-11-27	39.9	39.9	39.9	39.9	98429	0	history
4672	CUSTODIAN	2025-11-28	39.9	39.9	39.9	39.9	291246	0	history
4676	CUSTODIAN	2025-12-01	39.9	39.5	39.9	39.5	20607702	0	history
4680	CUSTODIAN	2025-12-02	39.9	39.9	39.9	39.9	145307	0	history
4684	CUSTODIAN	2025-12-03	39.9	39.9	39.9	39.9	167274	0	history
4689	CUSTODIAN	2025-12-04	39.9	39.9	39.9	39.9	246620	0	history
4694	CUSTODIAN	2025-12-05	39.9	39.9	39.9	39.9	77812	0	history
4699	CUSTODIAN	2025-12-08	38.95	38	38.95	38	768846	-2.38	history
4704	CUSTODIAN	2025-12-09	36.75	36.75	36.75	36.75	440002	-5.65	history
4709	CUSTODIAN	2025-12-10	37	37	37	37	787188	0.68	history
4714	CUSTODIAN	2025-12-11	37	37	37	37	138266	0	history
4719	CUSTODIAN	2025-12-12	37	37	37	37	30126230	0	history
4724	CUSTODIAN	2025-12-15	37	37	37	37	643721	0	history
4729	CUSTODIAN	2025-12-16	39.9	38	39.9	38	4927667	7.84	history
4734	CUSTODIAN	2025-12-17	39	39	39	39	19890158	-2.26	history
4739	CUSTODIAN	2025-12-18	38	38	38	38	786057	-2.56	history
4744	CUSTODIAN	2025-12-19	39	39	39	39	20770180	2.63	history
4750	CUSTODIAN	2025-12-22	35.1	39	39	35.1	22096657	-10	history
4755	CUSTODIAN	2025-12-23	38.5	38.5	38.5	38.5	239309	9.69	history
2833	BUACEMENT	2025-08-28	151.8	\N	\N	\N	\N	0	chart
4478	FIDSON	2025-09-18	43	41.925	41.925	41.925	209375	0	history
4480	FIDSON	2025-09-19	43	41.925	41.925	41.925	419619	0	history
4482	FIDSON	2025-09-22	43	41.925	41.925	41.925	294202	0	history
4485	FIDSON	2025-09-23	43	41.925	41.925	41.925	1435136	0	history
4488	FIDSON	2025-09-24	43	41.925	41.925	41.925	532226	0	history
4493	FIDSON	2025-09-25	41.4	40	41.4	40	889717	-3.72	history
4497	FIDSON	2025-09-26	41.4	40.365	40.365	40.365	188760	0	history
4501	FIDSON	2025-09-29	42.9	40	42.9	40	1725804	3.62	history
4504	FIDSON	2025-09-30	42.9	41.828	41.828	41.828	654050	0	history
4507	FIDSON	2025-10-02	42.9	41.828	41.828	41.828	853069	0	history
4511	FIDSON	2025-10-03	42.9	41.828	41.828	41.828	603935	0	history
4514	FIDSON	2025-10-06	43.5	43.5	43.5	43.5	341452	1.4	history
4518	FIDSON	2025-10-07	43.5	42.413	42.413	42.413	535927	0	history
4522	FIDSON	2025-10-08	43.5	42.413	42.413	42.413	413443	0	history
4526	FIDSON	2025-10-09	43.5	42.413	42.413	42.413	315045	0	history
4530	FIDSON	2025-10-10	43.5	42.413	42.413	42.413	491223	0	history
4534	FIDSON	2025-10-13	43.5	42.413	42.413	42.413	1575356	0	history
4538	FIDSON	2025-10-14	40.6	40.6	40.6	40.6	2155383	-6.67	history
4542	FIDSON	2025-10-15	41.9	41.9	41.9	41.9	1104285	3.2	history
4546	FIDSON	2025-10-16	42.35	42.35	42.35	42.35	907790	1.07	history
4552	FIDSON	2025-10-17	42.35	41.291	41.291	41.291	211408	0	history
4555	FIDSON	2025-10-20	42.35	41.291	41.291	41.291	237484	0	history
4560	FIDSON	2025-10-21	42.15	40.25	42.15	40.1	781897	-0.47	history
4564	FIDSON	2025-10-22	42.3	42.3	42.3	42.3	583820	0.36	history
4567	FIDSON	2025-10-23	42.3	41.243	41.243	41.243	515783	0	history
4570	FIDSON	2025-10-24	42.3	41.243	41.243	41.243	335818	0	history
4574	FIDSON	2025-10-27	42	42	42	42	2009474	-0.71	history
4578	FIDSON	2025-10-28	42	40.95	40.95	40.95	447379	0	history
4582	FIDSON	2025-10-29	42	40.95	40.95	40.95	444011	0	history
4586	FIDSON	2025-10-30	42	40.95	40.95	40.95	256675	0	history
4590	FIDSON	2025-10-31	42	40.95	40.95	40.95	488702	0	history
4593	FIDSON	2025-11-03	42	40.95	40.95	40.95	198594	0	history
4597	FIDSON	2025-11-04	42	40.95	40.95	40.95	492010	0	history
4603	FIDSON	2025-11-05	42	40.95	40.95	40.95	126982	0	history
4605	FIDSON	2025-11-06	42	40.95	40.95	40.95	276062	0	history
4609	FIDSON	2025-11-07	40	37.8	40	37.8	728907	-4.76	history
4613	FIDSON	2025-11-10	40	39	39	39	489212	0	history
4617	FIDSON	2025-11-11	40	39	39	39	1180429	0	history
4622	FIDSON	2025-11-12	40	39	39	39	421579	0	history
4626	FIDSON	2025-11-13	40	40	40	40	157299	0	history
4630	FIDSON	2025-11-14	40	40	40	40	138346	0	history
4634	FIDSON	2025-11-17	40	40	40	40	211843	0	history
4638	FIDSON	2025-11-18	40	40	40	40	193423	0	history
4642	FIDSON	2025-11-19	40	40	40	40	601469	0	history
4646	FIDSON	2025-11-20	40	40	40	40	351005	0	history
4649	FIDSON	2025-11-21	40	40	40	40	1040815	0	history
4654	FIDSON	2025-11-24	40	40	40	40	145669	0	history
4658	FIDSON	2025-11-25	40	40	40	40	94920	0	history
4661	FIDSON	2025-11-26	40	40	40	40	141402	0	history
4665	FIDSON	2025-11-27	40	40	40	40	97208	0	history
4669	FIDSON	2025-11-28	40	40	40	40	520302.99999999994	0	history
4673	FIDSON	2025-12-01	40	40	40	40	212463	0	history
4677	FIDSON	2025-12-02	40	40	40	40	178016	0	history
4681	FIDSON	2025-12-03	40	40	40	40	247447	0	history
4685	FIDSON	2025-12-04	40	40	40	40	175940	0	history
4690	FIDSON	2025-12-05	40	40	40	40	92196	0	history
4695	FIDSON	2025-12-08	40	40	40	40	306691	0	history
4700	FIDSON	2025-12-09	40	40	40	40	302811	0	history
4705	FIDSON	2025-12-10	40	40	40	40	445188	0	history
4710	FIDSON	2025-12-11	40	40	40	40	86120	0	history
4715	FIDSON	2025-12-12	40	40	40	40	345327	0	history
4720	FIDSON	2025-12-15	40	40	40	40	380451	0	history
4725	FIDSON	2025-12-16	43	43	43	43	366763	7.5	history
4730	FIDSON	2025-12-17	43	43	43	43	305437	0	history
4735	FIDSON	2025-12-18	43	43	43	43	294788	0	history
4740	FIDSON	2025-12-19	43	43	43	43	127475	0	history
4745	FIDSON	2025-12-22	43	43	43	43	187443	0	history
4749	FIDSON	2025-12-23	43.9	43.9	43.9	43.9	708835	2.09	history
4754	FIDSON	2025-12-24	43.9	43.9	43.9	43.9	1569471	0	history
4759	FIDSON	2025-12-29	44.5	44.5	44.5	44.5	1648313	1.37	history
4764	FIDSON	2025-12-30	48	46.9	48	46.9	8587699	7.87	history
4769	FIDSON	2025-12-31	50.1	50	50.1	48.8	7321594	4.38	history
4774	FIDSON	2026-01-02	55	54.5	55	54.5	3824820	9.78	history
4779	FIDSON	2026-01-05	60.5	56.35	60.5	56.35	2975963	10	history
4784	FIDSON	2026-01-06	65.45	65.45	65.45	65.45	1745566	8.18	history
4484	MTNN	2025-03-19	245	\N	\N	\N	\N	\N	chart
4487	MTNN	2025-03-20	245	\N	\N	\N	\N	0	chart
4490	MTNN	2025-03-21	245	\N	\N	\N	\N	0	chart
4494	MTNN	2025-03-24	245	\N	\N	\N	\N	0	chart
4498	MTNN	2025-03-25	245	\N	\N	\N	\N	0	chart
4502	MTNN	2025-03-26	238.4	\N	\N	\N	\N	-2.6939	chart
4509	MTNN	2025-03-27	245	\N	\N	\N	\N	2.7685	chart
4512	MTNN	2025-03-28	245	\N	\N	\N	\N	0	chart
4516	MTNN	2025-04-02	245	\N	\N	\N	\N	0	chart
4520	MTNN	2025-04-03	245	\N	\N	\N	\N	0	chart
4524	MTNN	2025-04-04	245	\N	\N	\N	\N	0	chart
4528	MTNN	2025-04-07	245	\N	\N	\N	\N	0	chart
4532	MTNN	2025-04-08	245	\N	\N	\N	\N	0	chart
4535	MTNN	2025-04-09	245	\N	\N	\N	\N	0	chart
4539	MTNN	2025-04-10	245	\N	\N	\N	\N	0	chart
4543	MTNN	2025-04-11	235	\N	\N	\N	\N	-4.0816	chart
4547	MTNN	2025-04-14	243.4	\N	\N	\N	\N	3.5745	chart
4550	MTNN	2025-04-15	243	\N	\N	\N	\N	-0.1643	chart
4554	MTNN	2025-04-16	243	\N	\N	\N	\N	0	chart
4558	MTNN	2025-04-17	242	\N	\N	\N	\N	-0.4115	chart
4562	MTNN	2025-04-22	242	\N	\N	\N	\N	0	chart
4566	MTNN	2025-04-23	239	\N	\N	\N	\N	-1.2397	chart
4571	MTNN	2025-04-24	245	\N	\N	\N	\N	2.5105	chart
4575	MTNN	2025-04-25	255.5	\N	\N	\N	\N	4.2857	chart
4579	MTNN	2025-04-28	255.5	\N	\N	\N	\N	0	chart
4583	MTNN	2025-04-29	240	\N	\N	\N	\N	-6.0665	chart
4587	MTNN	2025-04-30	250	\N	\N	\N	\N	4.1667	chart
4591	MTNN	2025-05-02	255	\N	\N	\N	\N	2	chart
4595	MTNN	2025-05-05	261	\N	\N	\N	\N	2.3529	chart
4599	MTNN	2025-05-06	284.9	\N	\N	\N	\N	9.1571	chart
4601	MTNN	2025-05-07	284.9	\N	\N	\N	\N	0	chart
4606	MTNN	2025-05-08	284.9	\N	\N	\N	\N	0	chart
4610	MTNN	2025-05-09	284.9	\N	\N	\N	\N	0	chart
4614	MTNN	2025-05-12	279	\N	\N	\N	\N	-2.0709	chart
4618	MTNN	2025-05-13	279	\N	\N	\N	\N	0	chart
4621	MTNN	2025-05-14	278	\N	\N	\N	\N	-0.3584	chart
4625	MTNN	2025-05-15	278	\N	\N	\N	\N	0	chart
4629	MTNN	2025-05-16	278	\N	\N	\N	\N	0	chart
4633	MTNN	2025-05-19	275	\N	\N	\N	\N	-1.0791	chart
4637	MTNN	2025-05-20	275	\N	\N	\N	\N	0	chart
4641	MTNN	2025-05-21	275	\N	\N	\N	\N	0	chart
4645	MTNN	2025-05-22	275	\N	\N	\N	\N	0	chart
4650	MTNN	2025-05-23	270	\N	\N	\N	\N	-1.8182	chart
4653	MTNN	2025-05-26	270	\N	\N	\N	\N	0	chart
4657	MTNN	2025-05-27	270	\N	\N	\N	\N	0	chart
4662	MTNN	2025-05-28	275	\N	\N	\N	\N	1.8519	chart
4666	MTNN	2025-05-29	275	\N	\N	\N	\N	0	chart
4670	MTNN	2025-05-30	280.1	\N	\N	\N	\N	1.8545	chart
4674	MTNN	2025-06-02	289	\N	\N	\N	\N	3.1774	chart
4678	MTNN	2025-06-03	290.2	\N	\N	\N	\N	0.4152	chart
4682	MTNN	2025-06-04	290.2	\N	\N	\N	\N	0	chart
4686	MTNN	2025-06-05	319.2	\N	\N	\N	\N	9.9931	chart
4692	MTNN	2025-06-10	310	\N	\N	\N	\N	-2.8822	chart
4697	MTNN	2025-06-11	320	\N	\N	\N	\N	3.2258	chart
4702	MTNN	2025-06-13	325	\N	\N	\N	\N	1.5625	chart
4707	MTNN	2025-06-16	326	\N	\N	\N	\N	0.3077	chart
4712	MTNN	2025-06-17	334	\N	\N	\N	\N	2.454	chart
4716	MTNN	2025-06-18	350	\N	\N	\N	\N	4.7904	chart
4721	MTNN	2025-06-19	355.9	\N	\N	\N	\N	1.6857	chart
4726	MTNN	2025-06-20	355.9	\N	\N	\N	\N	0	chart
4731	MTNN	2025-06-23	352.6	\N	\N	\N	\N	-0.9272	chart
4737	MTNN	2025-06-24	356.2	\N	\N	\N	\N	1.021	chart
4742	MTNN	2025-06-25	358	\N	\N	\N	\N	0.5053	chart
4747	MTNN	2025-06-26	357.5	\N	\N	\N	\N	-0.1397	chart
4752	MTNN	2025-06-27	357.5	\N	\N	\N	\N	0	chart
4757	MTNN	2025-06-30	357.5	\N	\N	\N	\N	0	chart
4762	MTNN	2025-07-01	357.5	\N	\N	\N	\N	0	chart
4767	MTNN	2025-07-02	357.5	\N	\N	\N	\N	0	chart
4772	MTNN	2025-07-03	357.5	\N	\N	\N	\N	0	chart
4777	MTNN	2025-07-04	357.5	\N	\N	\N	\N	0	chart
4782	MTNN	2025-07-07	357.5	\N	\N	\N	\N	0	chart
4786	MTNN	2025-07-08	355	\N	\N	\N	\N	-0.6993	chart
4792	MTNN	2025-07-09	355	\N	\N	\N	\N	0	chart
4798	MTNN	2025-07-10	390	\N	\N	\N	\N	9.8592	chart
4803	MTNN	2025-07-11	395	\N	\N	\N	\N	1.2821	chart
4809	MTNN	2025-07-14	395	\N	\N	\N	\N	0	chart
4815	MTNN	2025-07-16	400	\N	\N	\N	\N	1.2658	chart
4820	MTNN	2025-07-17	400	\N	\N	\N	\N	0	chart
4826	MTNN	2025-07-18	400	\N	\N	\N	\N	0	chart
4832	MTNN	2025-07-21	400	\N	\N	\N	\N	0	chart
4838	MTNN	2025-07-22	400	\N	\N	\N	\N	0	chart
4844	MTNN	2025-07-23	400	\N	\N	\N	\N	0	chart
4850	MTNN	2025-07-24	395	\N	\N	\N	\N	-1.25	chart
4859	MTNN	2025-07-25	400	\N	\N	\N	\N	1.2658	chart
4862	MTNN	2025-07-28	410.6	\N	\N	\N	\N	2.65	chart
4868	MTNN	2025-07-29	451.6	\N	\N	\N	\N	9.9854	chart
4874	MTNN	2025-07-30	471.1	\N	\N	\N	\N	4.318	chart
4880	MTNN	2025-07-31	472	\N	\N	\N	\N	0.191	chart
4886	MTNN	2025-08-01	480	\N	\N	\N	\N	1.6949	chart
4893	MTNN	2025-08-04	480	\N	\N	\N	\N	0	chart
4898	MTNN	2025-08-05	480	\N	\N	\N	\N	0	chart
4904	MTNN	2025-08-06	480	\N	\N	\N	\N	0	chart
4911	MTNN	2025-08-07	480	\N	\N	\N	\N	0	chart
4917	MTNN	2025-08-08	460	\N	\N	\N	\N	-4.1667	chart
4923	MTNN	2025-08-11	460	\N	\N	\N	\N	0	chart
4929	MTNN	2025-08-12	460	\N	\N	\N	\N	0	chart
4935	MTNN	2025-08-13	460	\N	\N	\N	\N	0	chart
4489	GTCO	2025-03-19	60	\N	\N	\N	\N	\N	chart
4492	GTCO	2025-03-20	60	\N	\N	\N	\N	0	chart
4496	GTCO	2025-03-21	58.2	\N	\N	\N	\N	-3	chart
4500	GTCO	2025-03-24	62	\N	\N	\N	\N	6.5292	chart
4505	GTCO	2025-03-25	62.85	\N	\N	\N	\N	1.371	chart
4508	GTCO	2025-03-26	64.1	\N	\N	\N	\N	1.9889	chart
4515	GTCO	2025-03-27	64.25	\N	\N	\N	\N	0.234	chart
4519	GTCO	2025-03-28	68.8	\N	\N	\N	\N	7.0817	chart
4523	GTCO	2025-04-02	69.6	\N	\N	\N	\N	1.1628	chart
4527	GTCO	2025-04-03	69.5	\N	\N	\N	\N	-0.1437	chart
4531	GTCO	2025-04-04	69.4	\N	\N	\N	\N	-0.1439	chart
4536	GTCO	2025-04-07	65.5	\N	\N	\N	\N	-5.6196	chart
4540	GTCO	2025-04-08	65.95	\N	\N	\N	\N	0.687	chart
4544	GTCO	2025-04-09	64.8	\N	\N	\N	\N	-1.7437	chart
4548	GTCO	2025-04-10	66.5	\N	\N	\N	\N	2.6235	chart
4551	GTCO	2025-04-11	68	\N	\N	\N	\N	2.2556	chart
4556	GTCO	2025-04-14	68	\N	\N	\N	\N	0	chart
4559	GTCO	2025-04-15	67	\N	\N	\N	\N	-1.4706	chart
4563	GTCO	2025-04-16	59	\N	\N	\N	\N	-11.9403	chart
4568	GTCO	2025-04-17	59	\N	\N	\N	\N	0	chart
4572	GTCO	2025-04-22	60	\N	\N	\N	\N	1.6949	chart
4576	GTCO	2025-04-23	61	\N	\N	\N	\N	1.6667	chart
4580	GTCO	2025-04-24	61.1	\N	\N	\N	\N	0.1639	chart
4584	GTCO	2025-04-25	63	\N	\N	\N	\N	3.1097	chart
4588	GTCO	2025-04-28	67	\N	\N	\N	\N	6.3492	chart
4592	GTCO	2025-04-29	67.8	\N	\N	\N	\N	1.194	chart
4596	GTCO	2025-04-30	65.4	\N	\N	\N	\N	-3.5398	chart
4600	GTCO	2025-05-02	64	\N	\N	\N	\N	-2.1407	chart
4604	GTCO	2025-05-05	63.45	\N	\N	\N	\N	-0.8594	chart
4608	GTCO	2025-05-06	65	\N	\N	\N	\N	2.4429	chart
4612	GTCO	2025-05-07	67.5	\N	\N	\N	\N	3.8462	chart
4616	GTCO	2025-05-08	68	\N	\N	\N	\N	0.7407	chart
4620	GTCO	2025-05-09	69.05	\N	\N	\N	\N	1.5441	chart
4624	GTCO	2025-05-12	69	\N	\N	\N	\N	-0.0724	chart
4628	GTCO	2025-05-13	69.05	\N	\N	\N	\N	0.0725	chart
4632	GTCO	2025-05-14	68.6	\N	\N	\N	\N	-0.6517	chart
4636	GTCO	2025-05-15	68.55	\N	\N	\N	\N	-0.0729	chart
4640	GTCO	2025-05-16	68	\N	\N	\N	\N	-0.8023	chart
4644	GTCO	2025-05-19	68.5	\N	\N	\N	\N	0.7353	chart
4648	GTCO	2025-05-20	69.3	\N	\N	\N	\N	1.1679	chart
4651	GTCO	2025-05-21	69.75	\N	\N	\N	\N	0.6494	chart
4655	GTCO	2025-05-22	69	\N	\N	\N	\N	-1.0753	chart
4659	GTCO	2025-05-23	70	\N	\N	\N	\N	1.4493	chart
4663	GTCO	2025-05-26	68.4	\N	\N	\N	\N	-2.2857	chart
4667	GTCO	2025-05-27	69.8	\N	\N	\N	\N	2.0468	chart
4671	GTCO	2025-05-28	69.5	\N	\N	\N	\N	-0.4298	chart
4675	GTCO	2025-05-29	69	\N	\N	\N	\N	-0.7194	chart
4679	GTCO	2025-05-30	67	\N	\N	\N	\N	-2.8986	chart
4683	GTCO	2025-06-02	66.6	\N	\N	\N	\N	-0.597	chart
4688	GTCO	2025-06-03	68	\N	\N	\N	\N	2.1021	chart
4693	GTCO	2025-06-04	69.5	\N	\N	\N	\N	2.2059	chart
4698	GTCO	2025-06-05	70.05	\N	\N	\N	\N	0.7914	chart
4703	GTCO	2025-06-10	71.2	\N	\N	\N	\N	1.6417	chart
4708	GTCO	2025-06-11	71	\N	\N	\N	\N	-0.2809	chart
4713	GTCO	2025-06-13	71.5	\N	\N	\N	\N	0.7042	chart
4717	GTCO	2025-06-16	71.5	\N	\N	\N	\N	0	chart
4722	GTCO	2025-06-17	75.65	\N	\N	\N	\N	5.8042	chart
4727	GTCO	2025-06-18	79	\N	\N	\N	\N	4.4283	chart
4733	GTCO	2025-06-19	79.75	\N	\N	\N	\N	0.9494	chart
4738	GTCO	2025-06-20	84.95	\N	\N	\N	\N	6.5204	chart
4743	GTCO	2025-06-23	83.55	\N	\N	\N	\N	-1.648	chart
868	SEPLAT	2025-09-18	5379.3	5281.013	5281.013	5281.013	32918	0	history
869	SEPLAT	2025-09-19	5379.3	5281.013	5281.013	5281.013	152311	0	history
870	SEPLAT	2025-09-22	5379.3	5281.013	5281.013	5281.013	12135	0	history
871	SEPLAT	2025-09-23	5379.3	5281.013	5281.013	5281.013	21098	0	history
872	SEPLAT	2025-09-24	5379.3	5281.013	5281.013	5281.013	11632	0	history
874	SEPLAT	2025-09-25	5379.3	5281.013	5281.013	5281.013	3789	0	history
876	SEPLAT	2025-09-26	5379.3	5281.013	5281.013	5281.013	2651	0	history
877	SEPLAT	2025-09-29	5379.3	5281.013	5281.013	5281.013	17074	0	history
878	SEPLAT	2025-09-30	5379.3	5281.013	5281.013	5281.013	34748	0	history
880	SEPLAT	2025-10-02	5379.3	5281.013	5281.013	5281.013	7725	0	history
881	SEPLAT	2025-10-03	5379.3	5281.013	5281.013	5281.013	11527	0	history
882	SEPLAT	2025-10-06	5917.2	5917.2	5917.2	5917.2	278031	10	history
883	SEPLAT	2025-10-07	5917.2	5809.085	5809.085	5809.085	14254	0	history
884	SEPLAT	2025-10-08	5917.2	5809.085	5809.085	5809.085	22142	0	history
4748	GTCO	2025-06-24	83.6	\N	\N	\N	\N	0.0598	chart
4753	GTCO	2025-06-25	83	\N	\N	\N	\N	-0.7177	chart
4758	GTCO	2025-06-26	83	\N	\N	\N	\N	0	chart
4763	GTCO	2025-06-27	82.5	\N	\N	\N	\N	-0.6024	chart
4768	GTCO	2025-06-30	81.25	\N	\N	\N	\N	-1.5152	chart
4773	GTCO	2025-07-01	80.25	\N	\N	\N	\N	-1.2308	chart
4778	GTCO	2025-07-02	80	\N	\N	\N	\N	-0.3115	chart
4783	GTCO	2025-07-03	82.75	\N	\N	\N	\N	3.4375	chart
4788	GTCO	2025-07-04	83.2	\N	\N	\N	\N	0.5438	chart
4795	GTCO	2025-07-07	84.5	\N	\N	\N	\N	1.5625	chart
4801	GTCO	2025-07-08	85.95	\N	\N	\N	\N	1.716	chart
4806	GTCO	2025-07-09	88	\N	\N	\N	\N	2.3851	chart
4812	GTCO	2025-07-10	90.5	\N	\N	\N	\N	2.8409	chart
4817	GTCO	2025-07-11	94.1	\N	\N	\N	\N	3.9779	chart
4823	GTCO	2025-07-14	93.85	\N	\N	\N	\N	-0.2657	chart
4829	GTCO	2025-07-16	101	\N	\N	\N	\N	7.6185	chart
4836	GTCO	2025-07-17	93.05	\N	\N	\N	\N	-7.8713	chart
4842	GTCO	2025-07-18	95.05	\N	\N	\N	\N	2.1494	chart
885	SEPLAT	2025-10-09	5917.2	5809.085	5809.085	5809.085	7017	0	history
886	SEPLAT	2025-10-10	5917.2	5809.085	5809.085	5809.085	214910	0	history
887	SEPLAT	2025-10-13	5917.2	5809.085	5809.085	5809.085	27981	0	history
888	SEPLAT	2025-10-14	5917.2	5809.085	5809.085	5809.085	61348	0	history
889	SEPLAT	2025-10-15	5917.2	5809.085	5809.085	5809.085	3263	0	history
890	SEPLAT	2025-10-16	5917.2	5809.085	5809.085	5809.085	41538	0	history
891	SEPLAT	2025-10-17	5917.2	5809.085	5809.085	5809.085	32272.000000000004	0	history
892	SEPLAT	2025-10-20	5917.2	5809.085	5809.085	5809.085	108749	0	history
893	SEPLAT	2025-10-21	5917.2	5809.085	5809.085	5809.085	154451	0	history
894	SEPLAT	2025-10-22	5917.2	5809.085	5809.085	5809.085	160318	0	history
895	SEPLAT	2025-10-23	5917.2	5809.085	5809.085	5809.085	399061	0	history
896	SEPLAT	2025-10-24	5917.2	5809.085	5809.085	5809.085	39710	0	history
897	SEPLAT	2025-10-27	5917.2	5809.085	5809.085	5809.085	252807.99999999997	0	history
898	SEPLAT	2025-10-28	5917.2	5809.085	5809.085	5809.085	166800	0	history
899	SEPLAT	2025-10-29	5917.2	5809.085	5809.085	5809.085	5128	0	history
900	SEPLAT	2025-10-30	5917.2	5809.085	5809.085	5809.085	112697	0	history
901	SEPLAT	2025-10-31	5917.2	5809.085	5809.085	5809.085	25170	0	history
902	SEPLAT	2025-11-03	5917.2	5809.085	5809.085	5809.085	61092	0	history
903	SEPLAT	2025-11-04	5917.2	5809.085	5809.085	5809.085	87313	0	history
904	SEPLAT	2025-11-05	5917.2	5809.085	5809.085	5809.085	29321	0	history
905	SEPLAT	2025-11-06	5917.2	5809.085	5809.085	5809.085	46850	0	history
906	SEPLAT	2025-11-07	5917.2	5809.085	5809.085	5809.085	130998	0	history
907	SEPLAT	2025-11-10	5917.2	5809.085	5809.085	5809.085	5969	0	history
908	SEPLAT	2025-11-11	5917.2	5809.085	5809.085	5809.085	7683	0	history
909	SEPLAT	2025-11-12	5917.2	5809.085	5809.085	5809.085	58918	0	history
910	SEPLAT	2025-11-13	5917.2	5809.085	5809.085	5809.085	93069	0	history
911	SEPLAT	2025-11-14	5809	5809	5809	5809	18335	-1.83	history
912	SEPLAT	2025-11-17	5809	5809	5809	5809	103806	0	history
913	SEPLAT	2025-11-18	5809	5809	5809	5809	105596	0	history
914	SEPLAT	2025-11-19	5809	5809	5809	5809	7990.000000000001	0	history
915	SEPLAT	2025-11-20	5809	5809	5809	5809	14850	0	history
916	SEPLAT	2025-11-21	5809	5809	5809	5809	7299	0	history
917	SEPLAT	2025-11-24	5809	5809	5809	5809	4826	0	history
918	SEPLAT	2025-11-25	5809	5809	5809	5809	4740	0	history
919	SEPLAT	2025-11-26	5809	5809	5809	5809	168518	0	history
920	SEPLAT	2025-11-27	5809	5809	5809	5809	108715	0	history
921	SEPLAT	2025-11-28	5809	5809	5809	5809	67915	0	history
922	SEPLAT	2025-12-01	5809	5809	5809	5809	87622	0	history
923	SEPLAT	2025-12-02	5809	5809	5809	5809	4976	0	history
924	SEPLAT	2025-12-03	5809	5809	5809	5809	181327	0	history
925	SEPLAT	2025-12-04	5809	5809	5809	5809	45238	0	history
926	SEPLAT	2025-12-05	5809	5809	5809	5809	63460	0	history
927	SEPLAT	2025-12-08	5809	5809	5809	5809	14779	0	history
928	SEPLAT	2025-12-09	5809	5809	5809	5809	6942	0	history
929	SEPLAT	2025-12-10	5809	5809	5809	5809	12677	0	history
930	SEPLAT	2025-12-11	5809	5809	5809	5809	19194	0	history
931	SEPLAT	2025-12-12	5809	5809	5809	5809	47297	0	history
932	SEPLAT	2025-12-15	5809	5809	5809	5809	5970	0	history
933	SEPLAT	2025-12-16	5809	5809	5809	5809	19662	0	history
934	SEPLAT	2025-12-17	5809	5809	5809	5809	10262	0	history
935	SEPLAT	2025-12-18	5809	5809	5809	5809	9454	0	history
936	SEPLAT	2025-12-19	5809	5809	5809	5809	18026	0	history
937	SEPLAT	2025-12-22	5809	5809	5809	5809	83509	0	history
938	SEPLAT	2025-12-23	5809	5809	5809	5809	11456	0	history
939	SEPLAT	2025-12-24	5809	5809	5809	5809	125510	0	history
940	SEPLAT	2025-12-29	5809	5809	5809	5809	22524	0	history
941	SEPLAT	2025-12-30	5809	5809	5809	5809	35598	0	history
942	SEPLAT	2025-12-31	5809	5809	5809	5809	1228799	0	history
943	SEPLAT	2026-01-02	5610	5610	5610	5610	1130159	-3.43	history
944	SEPLAT	2026-01-05	5610	5610	5610	5610	16559	0	history
945	SEPLAT	2026-01-06	5610	5610	5610	5610	140597	0	history
946	SEPLAT	2026-01-07	6171	6171	6171	6171	566828	10	history
947	SEPLAT	2026-01-08	6171	6171	6171	6171	180418	0	history
948	SEPLAT	2026-01-09	6171	6171	6171	6171	15453	0	history
949	SEPLAT	2026-01-12	6171	6171	6171	6171	56498	0	history
950	SEPLAT	2026-01-13	6171	6171	6171	6171	328212	0	history
951	SEPLAT	2026-01-14	6700	6700	6700	6700	610767	8.57	history
952	SEPLAT	2026-01-15	6700	6700	6700	6700	45002	0	history
953	SEPLAT	2026-01-16	6700	6700	6700	6700	17058	0	history
954	SEPLAT	2026-01-19	6700	6700	6700	6700	59109	0	history
955	SEPLAT	2026-01-20	6700	6700	6700	6700	26843	0	history
956	SEPLAT	2026-01-21	6700	6700	6700	6700	138639	0	history
957	SEPLAT	2026-01-22	6700	6700	6700	6700	70638	0	history
958	SEPLAT	2026-01-23	6700	6700	6700	6700	262093.00000000003	0	history
959	SEPLAT	2026-01-26	6700	6700	6700	6700	16653	0	history
960	SEPLAT	2026-01-27	6700	6700	6700	6700	215929	0	history
961	SEPLAT	2026-01-28	6700	6700	6700	6700	6841	0	history
962	SEPLAT	2026-01-29	6700	6700	6700	6700	39702	0	history
963	SEPLAT	2026-01-30	6700	6700	6700	6700	13417	0	history
964	SEPLAT	2026-02-02	6700	6700	6700	6700	64261	0	history
965	SEPLAT	2026-02-03	6700	6700	6700	6700	108127	0	history
966	SEPLAT	2026-02-04	6700	6700	6700	6700	355722	0	history
967	SEPLAT	2026-02-05	7370	7370	7370	7370	246643	10	history
968	SEPLAT	2026-02-06	7370	7370	7370	7370	261324.99999999997	0	history
969	SEPLAT	2026-02-09	7370	7370	7370	7370	196469	0	history
970	SEPLAT	2026-02-10	7370	7370	7370	7370	196479	0	history
971	SEPLAT	2026-02-11	7370	7370	7370	7370	126313	0	history
972	SEPLAT	2026-02-12	8107	8107	8107	8107	228446	10	history
973	SEPLAT	2026-02-13	8400	8400	8400	8400	473805	3.61	history
974	SEPLAT	2026-02-16	8400	8400	8400	8400	132806	0	history
975	SEPLAT	2026-02-17	8400	8400	8400	8400	178740	0	history
976	SEPLAT	2026-02-18	9099.9	9099.9	9099.9	9099.9	174597	8.33	history
977	SEPLAT	2026-02-19	9099.9	9099.9	9099.9	9099.9	97410	0	history
978	SEPLAT	2026-02-20	9099.9	9099.9	9099.9	9099.9	192241	0	history
979	SEPLAT	2026-02-23	9099.9	9099.9	9099.9	9099.9	30077	0	history
980	SEPLAT	2026-02-24	9099.9	9099.9	9099.9	9099.9	78404	0	history
981	SEPLAT	2026-02-25	9099.9	9099.9	9099.9	9099.9	70605	0	history
982	SEPLAT	2026-02-26	9099.9	9099.9	9099.9	9099.9	59648	0	history
983	SEPLAT	2026-02-27	9099.9	9099.9	9099.9	9099.9	117754	0	history
984	SEPLAT	2026-03-02	9099.9	9099.9	9099.9	9099.9	124585	0	history
985	SEPLAT	2026-03-03	9099.9	9099.9	9099.9	9099.9	165497	0	history
986	SEPLAT	2026-03-04	9099.9	9099.9	9099.9	9099.9	38192	0	history
987	SEPLAT	2026-03-05	9099.9	9099.9	9099.9	9099.9	82872	0	history
988	SEPLAT	2026-03-06	9099.9	9099.9	9099.9	9099.9	24731	0	history
989	SEPLAT	2026-03-09	9099.9	9099.9	9099.9	9099.9	166377	0	history
990	SEPLAT	2026-03-10	9099.9	9099.9	9099.9	9099.9	105982	0	history
991	SEPLAT	2026-03-11	9099.9	9099.9	9099.9	9099.9	81684	0	history
992	SEPLAT	2026-03-12	9099.9	9099.9	9099.9	9099.9	56985	0	history
993	SEPLAT	2026-03-13	9099.9	9099.9	9099.9	9099.9	13888	0	history
994	SEPLAT	2026-03-16	9099.9	9099.9	9099.9	9099.9	393254	0	history
995	SEPLAT	2026-03-17	9099.9	9099.9	9099.9	9099.9	222816	0	history
996	SEPLAT	2026-03-18	9099.9	9099.9	9099.9	9099.9	190795	0	history
4687	OANDO	2025-03-19	44.585	\N	\N	\N	\N	\N	chart
4691	OANDO	2025-03-20	44.585	\N	\N	\N	\N	0	chart
4696	OANDO	2025-03-21	47.077	\N	\N	\N	\N	5.5893	chart
4701	OANDO	2025-03-24	48.923	\N	\N	\N	\N	3.9212	chart
4706	OANDO	2025-03-25	46.154	\N	\N	\N	\N	-5.6599	chart
4711	OANDO	2025-03-26	46.154	\N	\N	\N	\N	0	chart
4718	OANDO	2025-03-27	44.4	\N	\N	\N	\N	-3.8003	chart
4723	OANDO	2025-03-28	44.631	\N	\N	\N	\N	0.5203	chart
4728	OANDO	2025-04-02	42.185	\N	\N	\N	\N	-5.4805	chart
4732	OANDO	2025-04-03	41.262	\N	\N	\N	\N	-2.188	chart
4736	OANDO	2025-04-04	38.769	\N	\N	\N	\N	-6.0419	chart
4741	OANDO	2025-04-07	34.892	\N	\N	\N	\N	-10.0003	chart
4746	OANDO	2025-04-08	35.077	\N	\N	\N	\N	0.5302	chart
4751	OANDO	2025-04-09	37.385	\N	\N	\N	\N	6.5798	chart
4756	OANDO	2025-04-10	38.123	\N	\N	\N	\N	1.9741	chart
4761	OANDO	2025-04-11	36	\N	\N	\N	\N	-5.5688	chart
4765	OANDO	2025-04-14	35.077	\N	\N	\N	\N	-2.5639	chart
4770	OANDO	2025-04-15	35.077	\N	\N	\N	\N	0	chart
4775	OANDO	2025-04-16	34.754	\N	\N	\N	\N	-0.9208	chart
4781	OANDO	2025-04-17	36.923	\N	\N	\N	\N	6.241	chart
4787	OANDO	2025-04-22	36.369	\N	\N	\N	\N	-1.5004	chart
4793	OANDO	2025-04-23	36.369	\N	\N	\N	\N	0	chart
4800	OANDO	2025-04-24	37.385	\N	\N	\N	\N	2.7936	chart
4805	OANDO	2025-04-25	37.385	\N	\N	\N	\N	0	chart
4810	OANDO	2025-04-28	38.769	\N	\N	\N	\N	3.702	chart
4816	OANDO	2025-04-29	38.815	\N	\N	\N	\N	0.1187	chart
4822	OANDO	2025-04-30	38.815	\N	\N	\N	\N	0	chart
4827	OANDO	2025-05-02	38.492	\N	\N	\N	\N	-0.8322	chart
4833	OANDO	2025-05-05	37.846	\N	\N	\N	\N	-1.6783	chart
4841	OANDO	2025-05-06	40.385	\N	\N	\N	\N	6.7088	chart
4846	OANDO	2025-05-07	39.462	\N	\N	\N	\N	-2.2855	chart
4852	OANDO	2025-05-08	39.785	\N	\N	\N	\N	0.8185	chart
4857	OANDO	2025-05-09	39.785	\N	\N	\N	\N	0	chart
4865	OANDO	2025-05-12	41.538	\N	\N	\N	\N	4.4062	chart
4871	OANDO	2025-05-13	45.692	\N	\N	\N	\N	10.0005	chart
2835	BUACEMENT	2025-08-29	151.8	\N	\N	\N	\N	0	chart
4876	OANDO	2025-05-14	49.385	\N	\N	\N	\N	8.0824	chart
4882	OANDO	2025-05-15	48.462	\N	\N	\N	\N	-1.869	chart
4888	OANDO	2025-05-16	48	\N	\N	\N	\N	-0.9533	chart
4894	OANDO	2025-05-19	48.923	\N	\N	\N	\N	1.9229	chart
4900	OANDO	2025-05-20	48.462	\N	\N	\N	\N	-0.9423	chart
4905	OANDO	2025-05-21	46.154	\N	\N	\N	\N	-4.7625	chart
4914	OANDO	2025-05-22	46.154	\N	\N	\N	\N	0	chart
4918	OANDO	2025-05-23	44.769	\N	\N	\N	\N	-3.0008	chart
4924	OANDO	2025-05-26	44.862	\N	\N	\N	\N	0.2077	chart
4930	OANDO	2025-05-27	44.031	\N	\N	\N	\N	-1.8523	chart
4936	OANDO	2025-05-28	45.231	\N	\N	\N	\N	2.7254	chart
4942	OANDO	2025-05-29	44.308	\N	\N	\N	\N	-2.0406	chart
4948	OANDO	2025-05-30	41.723	\N	\N	\N	\N	-5.8342	chart
4760	CUSTODIAN	2025-12-24	39	39	39	39	115020163	1.3	history
4766	CUSTODIAN	2025-12-29	39	39	39	39	338389	0	history
4771	CUSTODIAN	2025-12-30	42	38.95	42	38.95	1653764	7.69	history
4776	CUSTODIAN	2025-12-31	43	38.9	43	38.9	4088958	2.38	history
4780	CUSTODIAN	2026-01-02	43	43	43	43	188801	0	history
4785	CUSTODIAN	2026-01-05	43	43	43	43	700032	0	history
4791	CUSTODIAN	2026-01-06	44	44	44	44	1090631	2.33	history
4797	CUSTODIAN	2026-01-07	44	44	44	44	6274441	0	history
4807	CUSTODIAN	2026-01-08	44.25	44.25	44.25	44.25	982500	0.57	history
4813	CUSTODIAN	2026-01-09	44.9	44.9	44.9	44.9	1604734	1.47	history
4818	CUSTODIAN	2026-01-12	45	45	45	45	1872313	0.22	history
4824	CUSTODIAN	2026-01-13	45	45	46	45	6509851	0	history
4831	CUSTODIAN	2026-01-14	44.15	45	45	44.15	1062051	-1.89	history
4837	CUSTODIAN	2026-01-15	44	44	44	44	2591520	-0.34	history
3616	BETAGLAS	2025-03-19	99.85	\N	\N	\N	\N	\N	chart
4843	CUSTODIAN	2026-01-16	44	44	44	44	325863	0	history
4851	CUSTODIAN	2026-01-19	44	44	44	44	317104	0	history
4860	CUSTODIAN	2026-01-20	43	44	44	43	813290	-2.27	history
4863	CUSTODIAN	2026-01-21	45	40	45	40	20075408	4.65	history
4870	CUSTODIAN	2026-01-22	45	45	45	45	313077	0	history
4877	CUSTODIAN	2026-01-23	45	45	45	45	791281	0	history
4883	CUSTODIAN	2026-01-26	45	45	45	45	552924	0	history
4889	CUSTODIAN	2026-01-27	45	45	45	45	431877	0	history
4895	CUSTODIAN	2026-01-28	45	45	45	45	241177	0	history
4901	CUSTODIAN	2026-01-29	44	44	44	44	4301107	-2.22	history
4907	CUSTODIAN	2026-01-30	44	44	44	44	188265	0	history
2793	BUACEMENT	2025-07-31	135	\N	\N	\N	\N	0	chart
2795	BUACEMENT	2025-08-01	148	\N	\N	\N	\N	9.6296	chart
4913	CUSTODIAN	2026-02-02	48	45	48.15	45	4282020	9.09	history
2797	BUACEMENT	2025-08-04	155	\N	\N	\N	\N	4.7297	chart
4920	CUSTODIAN	2026-02-03	47	45	47	45	49817599	-2.08	history
2799	BUACEMENT	2025-08-05	170.5	\N	\N	\N	\N	10	chart
4926	CUSTODIAN	2026-02-04	48	47	48	47	13730080	2.13	history
2801	BUACEMENT	2025-08-06	183	\N	\N	\N	\N	7.3314	chart
4932	CUSTODIAN	2026-02-05	52	52.75	52.75	51.75	3326920	8.33	history
2803	BUACEMENT	2025-08-07	175	\N	\N	\N	\N	-4.3716	chart
4938	CUSTODIAN	2026-02-06	55	52.75	57.2	52.75	9267941	5.77	history
2805	BUACEMENT	2025-08-08	168.6	\N	\N	\N	\N	-3.6571	chart
4944	CUSTODIAN	2026-02-09	55	55	55	55	4899188	0	history
2806	BUACEMENT	2025-08-11	168.6	\N	\N	\N	\N	0	chart
4950	CUSTODIAN	2026-02-10	55	55	55	55	10713767	0	history
2809	BUACEMENT	2025-08-12	168.6	\N	\N	\N	\N	0	chart
4956	CUSTODIAN	2026-02-11	54	54	54	54	10334894	-1.82	history
2811	BUACEMENT	2025-08-13	168.6	\N	\N	\N	\N	0	chart
4962	CUSTODIAN	2026-02-12	54	54	54	54	517808.00000000006	0	history
2813	BUACEMENT	2025-08-14	168.6	\N	\N	\N	\N	0	chart
2815	BUACEMENT	2025-08-15	168.6	\N	\N	\N	\N	0	chart
4969	CUSTODIAN	2026-02-13	54.9	54.9	54.9	54.9	1114594	1.67	history
2817	BUACEMENT	2025-08-18	168.6	\N	\N	\N	\N	0	chart
4975	CUSTODIAN	2026-02-16	56	55	56	55	4092323.000000001	2	history
2819	BUACEMENT	2025-08-19	168.6	\N	\N	\N	\N	0	chart
4980	CUSTODIAN	2026-02-17	56	56	56.05	55.8	4542659	0	history
2821	BUACEMENT	2025-08-20	168.6	\N	\N	\N	\N	0	chart
4986	CUSTODIAN	2026-02-18	58.4	58.4	58.4	58.4	518389	4.29	history
2823	BUACEMENT	2025-08-21	151.8	\N	\N	\N	\N	-9.9644	chart
4993	CUSTODIAN	2026-02-19	63.9	63.9	63.9	63.9	1529620	9.42	history
4998	CUSTODIAN	2026-02-20	70.25	70.25	70.25	70.25	1460704	9.94	history
2825	BUACEMENT	2025-08-22	151.8	\N	\N	\N	\N	0	chart
2827	BUACEMENT	2025-08-25	151.8	\N	\N	\N	\N	0	chart
2829	BUACEMENT	2025-08-26	151.8	\N	\N	\N	\N	0	chart
2831	BUACEMENT	2025-08-27	151.8	\N	\N	\N	\N	0	chart
5005	CUSTODIAN	2026-02-23	73.3	73.05	73.3	73	2109279	4.34	history
5010	CUSTODIAN	2026-02-24	73.3	73.3	73.3	73.3	1656129	0	history
5018	CUSTODIAN	2026-02-25	66.2	68	68	66.2	1312488	-9.69	history
5024	CUSTODIAN	2026-02-26	65.45	66	66	64.05	1786464	-1.13	history
5030	CUSTODIAN	2026-02-27	68	68	68	68	1071582	3.9	history
5036	CUSTODIAN	2026-03-02	61.2	65	65	61.2	2939091	-10	history
5042	CUSTODIAN	2026-03-03	66	66	66	66	1466275	7.84	history
5048	CUSTODIAN	2026-03-04	70	68	70	68	2168920	6.06	history
5054	CUSTODIAN	2026-03-05	76.8	76.8	76.8	76.8	1692014	9.71	history
5059	CUSTODIAN	2026-03-06	81.9	81.9	81.9	81.9	1494248	6.64	history
5065	CUSTODIAN	2026-03-09	81.9	81.9	81.9	81.9	1362260	0	history
5071	CUSTODIAN	2026-03-10	79	78.5	81.9	73.75	12234899	-3.54	history
5077	CUSTODIAN	2026-03-11	79	79	79	79	1165896	0	history
3832	BETAGLAS	2025-08-29	486	\N	\N	\N	\N	0	chart
3835	BETAGLAS	2025-09-01	486	\N	\N	\N	\N	0	chart
3836	BETAGLAS	2025-09-02	486	\N	\N	\N	\N	0	chart
3838	BETAGLAS	2025-09-03	486	\N	\N	\N	\N	0	chart
3840	BETAGLAS	2025-09-04	486	\N	\N	\N	\N	0	chart
3842	BETAGLAS	2025-09-08	486	\N	\N	\N	\N	0	chart
3844	BETAGLAS	2025-09-09	486	\N	\N	\N	\N	0	chart
3847	BETAGLAS	2025-09-10	486	\N	\N	\N	\N	0	chart
2618	BUACEMENT	2025-03-19	83.7	\N	\N	\N	\N	\N	chart
2620	BUACEMENT	2025-03-20	83.7	\N	\N	\N	\N	0	chart
2622	BUACEMENT	2025-03-21	83.7	\N	\N	\N	\N	0	chart
2624	BUACEMENT	2025-03-24	83.7	\N	\N	\N	\N	0	chart
2626	BUACEMENT	2025-03-25	83.7	\N	\N	\N	\N	0	chart
2628	BUACEMENT	2025-03-26	83.7	\N	\N	\N	\N	0	chart
2631	BUACEMENT	2025-03-27	83.7	\N	\N	\N	\N	0	chart
2633	BUACEMENT	2025-03-28	83.7	\N	\N	\N	\N	0	chart
2635	BUACEMENT	2025-04-02	83.7	\N	\N	\N	\N	0	chart
2637	BUACEMENT	2025-04-03	83.7	\N	\N	\N	\N	0	chart
2639	BUACEMENT	2025-04-04	83.7	\N	\N	\N	\N	0	chart
2641	BUACEMENT	2025-04-07	83.7	\N	\N	\N	\N	0	chart
2643	BUACEMENT	2025-04-08	83.7	\N	\N	\N	\N	0	chart
2645	BUACEMENT	2025-04-09	83.7	\N	\N	\N	\N	0	chart
2647	BUACEMENT	2025-04-10	83.7	\N	\N	\N	\N	0	chart
2649	BUACEMENT	2025-04-11	83.7	\N	\N	\N	\N	0	chart
2651	BUACEMENT	2025-04-14	83.7	\N	\N	\N	\N	0	chart
2653	BUACEMENT	2025-04-15	83.7	\N	\N	\N	\N	0	chart
2655	BUACEMENT	2025-04-16	83.7	\N	\N	\N	\N	0	chart
2657	BUACEMENT	2025-04-17	83.7	\N	\N	\N	\N	0	chart
2659	BUACEMENT	2025-04-22	83.7	\N	\N	\N	\N	0	chart
2661	BUACEMENT	2025-04-23	83.7	\N	\N	\N	\N	0	chart
2663	BUACEMENT	2025-04-24	83.7	\N	\N	\N	\N	0	chart
2665	BUACEMENT	2025-04-25	83.7	\N	\N	\N	\N	0	chart
2667	BUACEMENT	2025-04-28	83.7	\N	\N	\N	\N	0	chart
2669	BUACEMENT	2025-04-29	83.7	\N	\N	\N	\N	0	chart
2671	BUACEMENT	2025-04-30	83.7	\N	\N	\N	\N	0	chart
2673	BUACEMENT	2025-05-02	83.7	\N	\N	\N	\N	0	chart
2675	BUACEMENT	2025-05-05	83.7	\N	\N	\N	\N	0	chart
2677	BUACEMENT	2025-05-06	83.7	\N	\N	\N	\N	0	chart
2679	BUACEMENT	2025-05-07	83.7	\N	\N	\N	\N	0	chart
2681	BUACEMENT	2025-05-08	83.7	\N	\N	\N	\N	0	chart
2683	BUACEMENT	2025-05-09	83.7	\N	\N	\N	\N	0	chart
2685	BUACEMENT	2025-05-12	83.7	\N	\N	\N	\N	0	chart
2687	BUACEMENT	2025-05-13	83.7	\N	\N	\N	\N	0	chart
2689	BUACEMENT	2025-05-14	83.7	\N	\N	\N	\N	0	chart
2691	BUACEMENT	2025-05-15	83.7	\N	\N	\N	\N	0	chart
2693	BUACEMENT	2025-05-16	83.7	\N	\N	\N	\N	0	chart
2695	BUACEMENT	2025-05-19	83.7	\N	\N	\N	\N	0	chart
2697	BUACEMENT	2025-05-20	83.7	\N	\N	\N	\N	0	chart
2699	BUACEMENT	2025-05-21	83.7	\N	\N	\N	\N	0	chart
2701	BUACEMENT	2025-05-22	83.7	\N	\N	\N	\N	0	chart
2703	BUACEMENT	2025-05-23	83.7	\N	\N	\N	\N	0	chart
2705	BUACEMENT	2025-05-26	83.7	\N	\N	\N	\N	0	chart
2707	BUACEMENT	2025-05-27	83.7	\N	\N	\N	\N	0	chart
2709	BUACEMENT	2025-05-28	83.7	\N	\N	\N	\N	0	chart
2711	BUACEMENT	2025-05-29	83.7	\N	\N	\N	\N	0	chart
2713	BUACEMENT	2025-05-30	83.7	\N	\N	\N	\N	0	chart
2714	BUACEMENT	2025-06-02	83.7	\N	\N	\N	\N	0	chart
2716	BUACEMENT	2025-06-03	83.7	\N	\N	\N	\N	0	chart
2718	BUACEMENT	2025-06-04	83.7	\N	\N	\N	\N	0	chart
2720	BUACEMENT	2025-06-05	83.7	\N	\N	\N	\N	0	chart
2722	BUACEMENT	2025-06-10	83.7	\N	\N	\N	\N	0	chart
2724	BUACEMENT	2025-06-11	83.7	\N	\N	\N	\N	0	chart
2726	BUACEMENT	2025-06-13	90	\N	\N	\N	\N	7.5269	chart
2728	BUACEMENT	2025-06-16	90	\N	\N	\N	\N	0	chart
2730	BUACEMENT	2025-06-17	90	\N	\N	\N	\N	0	chart
2732	BUACEMENT	2025-06-18	90	\N	\N	\N	\N	0	chart
2734	BUACEMENT	2025-06-19	90	\N	\N	\N	\N	0	chart
2736	BUACEMENT	2025-06-20	87.9	\N	\N	\N	\N	-2.3333	chart
2738	BUACEMENT	2025-06-23	87.9	\N	\N	\N	\N	0	chart
2740	BUACEMENT	2025-06-24	92	\N	\N	\N	\N	4.6644	chart
3849	BETAGLAS	2025-09-11	486	\N	\N	\N	\N	0	chart
3851	BETAGLAS	2025-09-12	486	\N	\N	\N	\N	0	chart
3853	BETAGLAS	2025-09-15	486	\N	\N	\N	\N	0	chart
3854	BETAGLAS	2025-09-16	486	\N	\N	\N	\N	0	chart
3856	BETAGLAS	2025-09-17	486	\N	\N	\N	\N	0	chart
4789	OKOMUOIL	2025-09-18	1020	1010.556	1010.556	1010.556	65993	0	history
4794	OKOMUOIL	2025-09-19	1020	1010.556	1010.556	1010.556	47384	0	history
4799	OKOMUOIL	2025-09-22	1020	1010.556	1010.556	1010.556	77688	0	history
4804	OKOMUOIL	2025-09-23	1020	1010.556	1010.556	1010.556	78449	0	history
4811	OKOMUOIL	2025-09-24	1020	1010.556	1010.556	1010.556	96536	0	history
4821	OKOMUOIL	2025-09-25	1020	1010.556	1010.556	1010.556	90520	0	history
4828	OKOMUOIL	2025-09-26	1020	1010.556	1010.556	1010.556	685667	0	history
4834	OKOMUOIL	2025-09-29	1020	1010.556	1010.556	1010.556	115731	0	history
4839	OKOMUOIL	2025-09-30	1020	1010.556	1010.556	1010.556	190357	0	history
4845	OKOMUOIL	2025-10-02	1020	1010.556	1010.556	1010.556	163166	0	history
4849	OKOMUOIL	2025-10-03	1020	1010.556	1010.556	1010.556	458838	0	history
4855	OKOMUOIL	2025-10-06	1020	1010.556	1010.556	1010.556	119192	0	history
4790	FIDSON	2026-01-07	65.45	65.45	65.45	65.45	1078568	0	history
4796	FIDSON	2026-01-08	69	65	69	65	1267968	5.42	history
4802	FIDSON	2026-01-09	73.1	70	73.1	70	1179392	5.94	history
4808	FIDSON	2026-01-12	73.1	73.1	73.1	73.1	1442340	0	history
4814	FIDSON	2026-01-13	73.1	73.1	73.1	73.1	1956686	0	history
4819	FIDSON	2026-01-14	73.1	73.1	73.1	73.1	2278068	0	history
4825	FIDSON	2026-01-15	73.1	73.1	73.1	73.1	922613	0	history
4830	FIDSON	2026-01-16	70	69	70	69	1476253	-4.24	history
4835	FIDSON	2026-01-19	69.9	73	73	64	2188485	-0.14	history
4840	FIDSON	2026-01-20	69.9	69.9	69.9	69.9	895787	0	history
4847	FIDSON	2026-01-21	74	74	74	74	1867048	5.87	history
4853	FIDSON	2026-01-22	71.5	70	71.5	70	1276209	-3.38	history
4858	FIDSON	2026-01-23	71.5	71.5	71.5	71.5	1733266	0	history
4864	FIDSON	2026-01-26	71.5	71.5	71.5	71.5	797294	0	history
4869	FIDSON	2026-01-27	71.5	71.5	71.5	71.5	566592	0	history
4875	FIDSON	2026-01-28	71.5	71.5	71.5	71.5	608414	0	history
4881	FIDSON	2026-01-29	68	66.9	68	66.9	1146794	-4.9	history
4887	FIDSON	2026-01-30	68.75	70.75	70.75	61.2	3134323	1.1	history
4892	FIDSON	2026-02-02	68.75	68.75	68.75	68.75	1541578	0	history
4899	FIDSON	2026-02-03	68.75	68.75	68.75	68.75	794730	0	history
4906	FIDSON	2026-02-04	68.75	68.75	68.75	68.75	533681	0	history
4910	FIDSON	2026-02-05	68.75	68.75	68.75	68.75	604621	0	history
4916	FIDSON	2026-02-06	70	68	70	68	940290	1.82	history
4922	FIDSON	2026-02-09	73	73	73	73	996754	4.29	history
4928	FIDSON	2026-02-10	71.9	71.6	72	67	2879445	-1.51	history
4934	FIDSON	2026-02-11	72.5	72.5	72.5	72.5	783912	0.83	history
4940	FIDSON	2026-02-12	73	73	73	73	1140667	0.69	history
4946	FIDSON	2026-02-13	78	78	78	78	956932	6.85	history
4952	FIDSON	2026-02-16	73	70.2	73	70.2	1555092	-6.41	history
4958	FIDSON	2026-02-17	74	74	74	74	1273644	1.37	history
4964	FIDSON	2026-02-18	75	75	75	75	794579	1.35	history
4970	FIDSON	2026-02-19	79	78	79	78	1415567	5.33	history
4976	FIDSON	2026-02-20	86.9	85	86.9	85	1776827	10	history
4982	FIDSON	2026-02-23	95.5	95.5	95.5	95.5	1758518	9.9	history
4988	FIDSON	2026-02-24	95.5	95.5	95.5	95.5	1238451	0	history
4994	FIDSON	2026-02-25	90	88.35	90	88.35	1260097	-5.76	history
5000	FIDSON	2026-02-26	90	90	90	90	720296	0	history
5006	FIDSON	2026-02-27	90	90	90	90	674067	0	history
5012	FIDSON	2026-03-02	90	90	90	90	869646	0	history
5017	FIDSON	2026-03-03	81	81	81	81	1067185	-10	history
5021	FIDSON	2026-03-04	81	81	81	81	1097274	0	history
5027	FIDSON	2026-03-05	82.5	84.45	84.45	82.5	1488768	1.85	history
5033	FIDSON	2026-03-06	88.5	88.5	88.5	88.5	765913	7.27	history
5039	FIDSON	2026-03-09	93.9	93.9	93.9	93.9	1377313	6.1	history
5045	FIDSON	2026-03-10	93.9	93.9	93.9	93.9	1103948	0	history
5051	FIDSON	2026-03-11	95.8	95.8	95.8	95.8	1463453	2.02	history
5057	FIDSON	2026-03-12	105.35	105	105.35	105	2170512	9.97	history
5063	FIDSON	2026-03-13	105.35	105.35	105.35	105.35	964623	0	history
5068	FIDSON	2026-03-16	105.35	105.35	105.35	105.35	950416	0	history
5074	FIDSON	2026-03-17	105.35	105.35	105.35	105.35	665139	0	history
5080	FIDSON	2026-03-18	105.35	105.35	105.35	105.35	576258	0	history
5120	FIDSON	2025-03-19	18.9	\N	\N	\N	\N	\N	chart
5124	FIDSON	2025-03-20	18.9	\N	\N	\N	\N	0	chart
5129	FIDSON	2025-03-21	18.9	\N	\N	\N	\N	0	chart
5134	FIDSON	2025-03-24	18.9	\N	\N	\N	\N	0	chart
5139	FIDSON	2025-03-25	18.9	\N	\N	\N	\N	0	chart
5145	FIDSON	2025-03-26	18.9	\N	\N	\N	\N	0	chart
5156	FIDSON	2025-03-27	18.05	\N	\N	\N	\N	-4.4974	chart
5161	FIDSON	2025-03-28	18.05	\N	\N	\N	\N	0	chart
5167	FIDSON	2025-04-02	19	\N	\N	\N	\N	5.2632	chart
5176	FIDSON	2025-04-03	19.45	\N	\N	\N	\N	2.3684	chart
5182	FIDSON	2025-04-04	19.45	\N	\N	\N	\N	0	chart
5188	FIDSON	2025-04-07	19.45	\N	\N	\N	\N	0	chart
5192	FIDSON	2025-04-08	18.1	\N	\N	\N	\N	-6.9409	chart
5199	FIDSON	2025-04-09	18.4	\N	\N	\N	\N	1.6575	chart
5205	FIDSON	2025-04-10	18.4	\N	\N	\N	\N	0	chart
5212	FIDSON	2025-04-11	18.7	\N	\N	\N	\N	1.6304	chart
5218	FIDSON	2025-04-14	18.7	\N	\N	\N	\N	0	chart
5224	FIDSON	2025-04-15	18	\N	\N	\N	\N	-3.7433	chart
5230	FIDSON	2025-04-16	18.6	\N	\N	\N	\N	3.3333	chart
5235	FIDSON	2025-04-17	18.6	\N	\N	\N	\N	0	chart
5241	FIDSON	2025-04-22	18.6	\N	\N	\N	\N	0	chart
5246	OKOMUOIL	2026-01-09	1206.5	1206.5	1206.5	1206.5	819620	0.17	history
5247	FIDSON	2025-04-23	18.6	\N	\N	\N	\N	0	chart
5251	FIDSON	2025-04-24	18.6	\N	\N	\N	\N	0	chart
5252	OKOMUOIL	2026-01-12	1206.5	1206.5	1206.5	1206.5	115819	0	history
5256	OKOMUOIL	2026-01-13	1206.5	1206.5	1206.5	1206.5	485000	0	history
5257	FIDSON	2025-04-25	18.6	\N	\N	\N	\N	0	chart
5261	OKOMUOIL	2026-01-14	1206.5	1206.5	1206.5	1206.5	358156	0	history
5262	FIDSON	2025-04-28	20.45	\N	\N	\N	\N	9.9462	chart
5266	OKOMUOIL	2026-01-15	1206.5	1206.5	1206.5	1206.5	283168	0	history
2742	BUACEMENT	2025-06-25	100	\N	\N	\N	\N	8.6957	chart
2744	BUACEMENT	2025-06-26	105.9	\N	\N	\N	\N	5.9	chart
2746	BUACEMENT	2025-06-27	95.4	\N	\N	\N	\N	-9.915	chart
2748	BUACEMENT	2025-06-30	95.4	\N	\N	\N	\N	0	chart
2750	BUACEMENT	2025-07-01	95.4	\N	\N	\N	\N	0	chart
2752	BUACEMENT	2025-07-02	95.4	\N	\N	\N	\N	0	chart
2754	BUACEMENT	2025-07-03	95.4	\N	\N	\N	\N	0	chart
2756	BUACEMENT	2025-07-04	92.5	\N	\N	\N	\N	-3.0398	chart
2758	BUACEMENT	2025-07-07	92.5	\N	\N	\N	\N	0	chart
2760	BUACEMENT	2025-07-08	92.5	\N	\N	\N	\N	0	chart
2762	BUACEMENT	2025-07-09	92.5	\N	\N	\N	\N	0	chart
2764	BUACEMENT	2025-07-10	92.5	\N	\N	\N	\N	0	chart
2766	BUACEMENT	2025-07-11	94	\N	\N	\N	\N	1.6216	chart
2768	BUACEMENT	2025-07-14	99	\N	\N	\N	\N	5.3191	chart
2770	BUACEMENT	2025-07-16	102	\N	\N	\N	\N	3.0303	chart
2772	BUACEMENT	2025-07-17	112.2	\N	\N	\N	\N	10	chart
2774	BUACEMENT	2025-07-18	123.4	\N	\N	\N	\N	9.9822	chart
2776	BUACEMENT	2025-07-21	129.8	\N	\N	\N	\N	5.1864	chart
2778	BUACEMENT	2025-07-22	135	\N	\N	\N	\N	4.0062	chart
2780	BUACEMENT	2025-07-23	135	\N	\N	\N	\N	0	chart
2782	BUACEMENT	2025-07-24	135	\N	\N	\N	\N	0	chart
2785	BUACEMENT	2025-07-25	135	\N	\N	\N	\N	0	chart
2787	BUACEMENT	2025-07-28	135	\N	\N	\N	\N	0	chart
2789	BUACEMENT	2025-07-29	135	\N	\N	\N	\N	0	chart
2791	BUACEMENT	2025-07-30	135	\N	\N	\N	\N	0	chart
3618	BETAGLAS	2025-03-20	99.85	\N	\N	\N	\N	0	chart
3620	BETAGLAS	2025-03-21	99.85	\N	\N	\N	\N	0	chart
3622	BETAGLAS	2025-03-24	99.85	\N	\N	\N	\N	0	chart
3624	BETAGLAS	2025-03-25	99.85	\N	\N	\N	\N	0	chart
3626	BETAGLAS	2025-03-26	99.85	\N	\N	\N	\N	0	chart
1493	ARADEL	2025-03-19	522	\N	\N	\N	\N	\N	chart
1494	ARADEL	2025-03-20	522	\N	\N	\N	\N	0	chart
1495	ARADEL	2025-03-21	522	\N	\N	\N	\N	0	chart
1497	ARADEL	2025-03-24	522	\N	\N	\N	\N	0	chart
1500	ARADEL	2025-03-25	505	\N	\N	\N	\N	-3.2567	chart
1501	ARADEL	2025-03-26	505	\N	\N	\N	\N	0	chart
1502	ARADEL	2025-03-27	505	\N	\N	\N	\N	0	chart
1503	ARADEL	2025-03-28	500	\N	\N	\N	\N	-0.9901	chart
1504	ARADEL	2025-04-02	500	\N	\N	\N	\N	0	chart
1505	ARADEL	2025-04-03	500	\N	\N	\N	\N	0	chart
1506	ARADEL	2025-04-04	500	\N	\N	\N	\N	0	chart
1507	ARADEL	2025-04-07	497	\N	\N	\N	\N	-0.6	chart
1508	ARADEL	2025-04-08	497	\N	\N	\N	\N	0	chart
1509	ARADEL	2025-04-09	497	\N	\N	\N	\N	0	chart
1510	ARADEL	2025-04-10	497	\N	\N	\N	\N	0	chart
1511	ARADEL	2025-04-11	497	\N	\N	\N	\N	0	chart
1512	ARADEL	2025-04-14	497	\N	\N	\N	\N	0	chart
1513	ARADEL	2025-04-15	497	\N	\N	\N	\N	0	chart
1514	ARADEL	2025-04-16	497	\N	\N	\N	\N	0	chart
1515	ARADEL	2025-04-17	497	\N	\N	\N	\N	0	chart
1516	ARADEL	2025-04-22	497	\N	\N	\N	\N	0	chart
1517	ARADEL	2025-04-23	497	\N	\N	\N	\N	0	chart
1518	ARADEL	2025-04-24	497	\N	\N	\N	\N	0	chart
1519	ARADEL	2025-04-25	497	\N	\N	\N	\N	0	chart
1520	ARADEL	2025-04-28	448	\N	\N	\N	\N	-9.8592	chart
1521	ARADEL	2025-04-29	448	\N	\N	\N	\N	0	chart
1522	ARADEL	2025-04-30	448	\N	\N	\N	\N	0	chart
1523	ARADEL	2025-05-02	448	\N	\N	\N	\N	0	chart
1524	ARADEL	2025-05-05	488	\N	\N	\N	\N	8.9286	chart
1525	ARADEL	2025-05-06	525	\N	\N	\N	\N	7.582	chart
1526	ARADEL	2025-05-07	503	\N	\N	\N	\N	-4.1905	chart
1527	ARADEL	2025-05-08	503	\N	\N	\N	\N	0	chart
1528	ARADEL	2025-05-09	503	\N	\N	\N	\N	0	chart
1529	ARADEL	2025-05-12	503	\N	\N	\N	\N	0	chart
1530	ARADEL	2025-05-13	503	\N	\N	\N	\N	0	chart
1531	ARADEL	2025-05-14	503	\N	\N	\N	\N	0	chart
1532	ARADEL	2025-05-15	503	\N	\N	\N	\N	0	chart
1533	ARADEL	2025-05-16	503	\N	\N	\N	\N	0	chart
1534	ARADEL	2025-05-19	503	\N	\N	\N	\N	0	chart
1535	ARADEL	2025-05-20	460	\N	\N	\N	\N	-8.5487	chart
1536	ARADEL	2025-05-21	460	\N	\N	\N	\N	0	chart
1537	ARADEL	2025-05-22	460	\N	\N	\N	\N	0	chart
1538	ARADEL	2025-05-23	460	\N	\N	\N	\N	0	chart
1539	ARADEL	2025-05-26	505.9	\N	\N	\N	\N	9.9783	chart
1540	ARADEL	2025-05-27	530	\N	\N	\N	\N	4.7638	chart
1541	ARADEL	2025-05-28	530	\N	\N	\N	\N	0	chart
1542	ARADEL	2025-05-29	530	\N	\N	\N	\N	0	chart
1543	ARADEL	2025-05-30	530	\N	\N	\N	\N	0	chart
1544	ARADEL	2025-06-02	530	\N	\N	\N	\N	0	chart
1545	ARADEL	2025-06-03	530	\N	\N	\N	\N	0	chart
1546	ARADEL	2025-06-04	530	\N	\N	\N	\N	0	chart
1547	ARADEL	2025-06-05	550	\N	\N	\N	\N	3.7736	chart
1548	ARADEL	2025-06-10	500	\N	\N	\N	\N	-9.0909	chart
1549	ARADEL	2025-06-11	500	\N	\N	\N	\N	0	chart
1550	ARADEL	2025-06-13	500	\N	\N	\N	\N	0	chart
1551	ARADEL	2025-06-16	500	\N	\N	\N	\N	0	chart
1552	ARADEL	2025-06-17	500	\N	\N	\N	\N	0	chart
1553	ARADEL	2025-06-18	536.8	\N	\N	\N	\N	7.36	chart
1554	ARADEL	2025-06-19	536.8	\N	\N	\N	\N	0	chart
1555	ARADEL	2025-06-20	536.8	\N	\N	\N	\N	0	chart
1556	ARADEL	2025-06-23	536.8	\N	\N	\N	\N	0	chart
1557	ARADEL	2025-06-24	515	\N	\N	\N	\N	-4.0611	chart
1558	ARADEL	2025-06-25	514.5	\N	\N	\N	\N	-0.0971	chart
1559	ARADEL	2025-06-26	514.5	\N	\N	\N	\N	0	chart
1560	ARADEL	2025-06-27	514.5	\N	\N	\N	\N	0	chart
1561	ARADEL	2025-06-30	514.5	\N	\N	\N	\N	0	chart
1562	ARADEL	2025-07-01	514.5	\N	\N	\N	\N	0	chart
1563	ARADEL	2025-07-02	515	\N	\N	\N	\N	0.0972	chart
1564	ARADEL	2025-07-03	515	\N	\N	\N	\N	0	chart
1565	ARADEL	2025-07-04	530	\N	\N	\N	\N	2.9126	chart
1566	ARADEL	2025-07-07	530	\N	\N	\N	\N	0	chart
1567	ARADEL	2025-07-08	530	\N	\N	\N	\N	0	chart
1568	ARADEL	2025-07-09	529.5	\N	\N	\N	\N	-0.0943	chart
1569	ARADEL	2025-07-10	529.5	\N	\N	\N	\N	0	chart
1570	ARADEL	2025-07-11	529	\N	\N	\N	\N	-0.0944	chart
1571	ARADEL	2025-07-14	529	\N	\N	\N	\N	0	chart
1572	ARADEL	2025-07-16	526	\N	\N	\N	\N	-0.5671	chart
1573	ARADEL	2025-07-17	521	\N	\N	\N	\N	-0.9506	chart
1574	ARADEL	2025-07-18	521	\N	\N	\N	\N	0	chart
1575	ARADEL	2025-07-21	521	\N	\N	\N	\N	0	chart
1576	ARADEL	2025-07-22	500	\N	\N	\N	\N	-4.0307	chart
1577	ARADEL	2025-07-23	502	\N	\N	\N	\N	0.4	chart
1578	ARADEL	2025-07-24	507	\N	\N	\N	\N	0.996	chart
1579	ARADEL	2025-07-25	507	\N	\N	\N	\N	0	chart
1580	ARADEL	2025-07-28	507	\N	\N	\N	\N	0	chart
1581	ARADEL	2025-07-29	512.9	\N	\N	\N	\N	1.1637	chart
1582	ARADEL	2025-07-30	514.1	\N	\N	\N	\N	0.234	chart
1583	ARADEL	2025-07-31	530	\N	\N	\N	\N	3.0928	chart
1584	ARADEL	2025-08-01	520	\N	\N	\N	\N	-1.8868	chart
1585	ARADEL	2025-08-04	514	\N	\N	\N	\N	-1.1538	chart
1586	ARADEL	2025-08-05	520	\N	\N	\N	\N	1.1673	chart
1587	ARADEL	2025-08-06	520	\N	\N	\N	\N	0	chart
1588	ARADEL	2025-08-07	520	\N	\N	\N	\N	0	chart
1589	ARADEL	2025-08-08	520	\N	\N	\N	\N	0	chart
1590	ARADEL	2025-08-11	520	\N	\N	\N	\N	0	chart
1591	ARADEL	2025-08-12	520	\N	\N	\N	\N	0	chart
1592	ARADEL	2025-08-13	519	\N	\N	\N	\N	-0.1923	chart
1593	ARADEL	2025-08-14	519	\N	\N	\N	\N	0	chart
1594	ARADEL	2025-08-15	519	\N	\N	\N	\N	0	chart
1595	ARADEL	2025-08-18	519	\N	\N	\N	\N	0	chart
1596	ARADEL	2025-08-19	519	\N	\N	\N	\N	0	chart
1597	ARADEL	2025-08-20	519	\N	\N	\N	\N	0	chart
1598	ARADEL	2025-08-21	519	\N	\N	\N	\N	0	chart
1599	ARADEL	2025-08-22	519	\N	\N	\N	\N	0	chart
1600	ARADEL	2025-08-25	510	\N	\N	\N	\N	-1.7341	chart
1601	ARADEL	2025-08-26	510	\N	\N	\N	\N	0	chart
1602	ARADEL	2025-08-27	510	\N	\N	\N	\N	0	chart
1603	ARADEL	2025-08-28	510	\N	\N	\N	\N	0	chart
1604	ARADEL	2025-08-29	510	\N	\N	\N	\N	0	chart
1605	ARADEL	2025-09-01	513.5	\N	\N	\N	\N	0.6863	chart
1606	ARADEL	2025-09-02	513.5	\N	\N	\N	\N	0	chart
1607	ARADEL	2025-09-03	511.2	\N	\N	\N	\N	-0.4479	chart
1608	ARADEL	2025-09-04	511.2	\N	\N	\N	\N	0	chart
1609	ARADEL	2025-09-08	511.2	\N	\N	\N	\N	0	chart
1610	ARADEL	2025-09-09	511.2	\N	\N	\N	\N	0	chart
1611	ARADEL	2025-09-10	530	\N	\N	\N	\N	3.6776	chart
1612	ARADEL	2025-09-11	530.2	\N	\N	\N	\N	0.0377	chart
1613	ARADEL	2025-09-12	545	\N	\N	\N	\N	2.7914	chart
1614	ARADEL	2025-09-15	545	\N	\N	\N	\N	0	chart
1615	ARADEL	2025-09-16	545	\N	\N	\N	\N	0	chart
1616	ARADEL	2025-09-17	583	\N	\N	\N	\N	6.9725	chart
1617	ARADEL	2025-09-18	588	\N	\N	\N	\N	0.8576	chart
1618	ARADEL	2025-09-19	588	\N	\N	\N	\N	0	chart
1619	ARADEL	2025-09-22	588	\N	\N	\N	\N	0	chart
1620	ARADEL	2025-09-23	560	\N	\N	\N	\N	-4.7619	chart
1621	ARADEL	2025-09-24	560	\N	\N	\N	\N	0	chart
1622	ARADEL	2025-09-25	560	\N	\N	\N	\N	0	chart
1623	ARADEL	2025-09-26	560	\N	\N	\N	\N	0	chart
1624	ARADEL	2025-09-29	560	\N	\N	\N	\N	0	chart
1625	ARADEL	2025-09-30	615	\N	\N	\N	\N	9.8214	chart
1626	ARADEL	2025-10-02	615.4	\N	\N	\N	\N	0.065	chart
1627	ARADEL	2025-10-03	650.1	\N	\N	\N	\N	5.6386	chart
1628	ARADEL	2025-10-06	630	\N	\N	\N	\N	-3.0918	chart
1629	ARADEL	2025-10-07	620	\N	\N	\N	\N	-1.5873	chart
1630	ARADEL	2025-10-08	629.8	\N	\N	\N	\N	1.5806	chart
1631	ARADEL	2025-10-09	629.8	\N	\N	\N	\N	0	chart
1632	ARADEL	2025-10-10	628	\N	\N	\N	\N	-0.2858	chart
1633	ARADEL	2025-10-13	628	\N	\N	\N	\N	0	chart
1634	ARADEL	2025-10-14	628	\N	\N	\N	\N	0	chart
1635	ARADEL	2025-10-15	628	\N	\N	\N	\N	0	chart
1636	ARADEL	2025-10-16	631	\N	\N	\N	\N	0.4777	chart
1637	ARADEL	2025-10-17	631	\N	\N	\N	\N	0	chart
1638	ARADEL	2025-10-20	640.2	\N	\N	\N	\N	1.458	chart
1639	ARADEL	2025-10-21	671.8	\N	\N	\N	\N	4.936	chart
1640	ARADEL	2025-10-22	712	\N	\N	\N	\N	5.9839	chart
1641	ARADEL	2025-10-23	740	\N	\N	\N	\N	3.9326	chart
1642	ARADEL	2025-10-24	790	\N	\N	\N	\N	6.7568	chart
1643	ARADEL	2025-10-27	869	\N	\N	\N	\N	10	chart
1644	ARADEL	2025-10-28	869	\N	\N	\N	\N	0	chart
1645	ARADEL	2025-10-29	800	\N	\N	\N	\N	-7.9402	chart
1646	ARADEL	2025-10-30	782	\N	\N	\N	\N	-2.25	chart
1647	ARADEL	2025-10-31	782	\N	\N	\N	\N	0	chart
1648	ARADEL	2025-11-03	710	\N	\N	\N	\N	-9.2072	chart
1649	ARADEL	2025-11-04	710	\N	\N	\N	\N	0	chart
1650	ARADEL	2025-11-05	717.5	\N	\N	\N	\N	1.0563	chart
1651	ARADEL	2025-11-06	717.5	\N	\N	\N	\N	0	chart
1652	ARADEL	2025-11-07	717.5	\N	\N	\N	\N	0	chart
1653	ARADEL	2025-11-10	717.5	\N	\N	\N	\N	0	chart
1654	ARADEL	2025-11-11	648.1	\N	\N	\N	\N	-9.6725	chart
1655	ARADEL	2025-11-12	706	\N	\N	\N	\N	8.9338	chart
1656	ARADEL	2025-11-13	706	\N	\N	\N	\N	0	chart
1657	ARADEL	2025-11-14	708.7	\N	\N	\N	\N	0.3824	chart
1658	ARADEL	2025-11-17	706	\N	\N	\N	\N	-0.381	chart
1659	ARADEL	2025-11-18	706	\N	\N	\N	\N	0	chart
1660	ARADEL	2025-11-19	700	\N	\N	\N	\N	-0.8499	chart
1661	ARADEL	2025-11-20	700	\N	\N	\N	\N	0	chart
1662	ARADEL	2025-11-21	690	\N	\N	\N	\N	-1.4286	chart
1663	ARADEL	2025-11-24	690	\N	\N	\N	\N	0	chart
1664	ARADEL	2025-11-25	690	\N	\N	\N	\N	0	chart
1665	ARADEL	2025-11-26	690	\N	\N	\N	\N	0	chart
1666	ARADEL	2025-11-27	690	\N	\N	\N	\N	0	chart
1667	ARADEL	2025-11-28	690	\N	\N	\N	\N	0	chart
1668	ARADEL	2025-12-01	688	\N	\N	\N	\N	-0.2899	chart
1669	ARADEL	2025-12-02	688	\N	\N	\N	\N	0	chart
1670	ARADEL	2025-12-03	680	\N	\N	\N	\N	-1.1628	chart
1671	ARADEL	2025-12-04	680	\N	\N	\N	\N	0	chart
1672	ARADEL	2025-12-05	680	\N	\N	\N	\N	0	chart
1673	ARADEL	2025-12-08	680	\N	\N	\N	\N	0	chart
1674	ARADEL	2025-12-09	680	\N	\N	\N	\N	0	chart
1675	ARADEL	2025-12-10	680	\N	\N	\N	\N	0	chart
1676	ARADEL	2025-12-11	680	\N	\N	\N	\N	0	chart
1677	ARADEL	2025-12-12	680	\N	\N	\N	\N	0	chart
1678	ARADEL	2025-12-15	680	\N	\N	\N	\N	0	chart
1679	ARADEL	2025-12-16	680	\N	\N	\N	\N	0	chart
1680	ARADEL	2025-12-17	680	\N	\N	\N	\N	0	chart
1681	ARADEL	2025-12-18	679.9	\N	\N	\N	\N	-0.0147	chart
1682	ARADEL	2025-12-19	679.9	\N	\N	\N	\N	0	chart
1683	ARADEL	2025-12-22	679.9	\N	\N	\N	\N	0	chart
1684	ARADEL	2025-12-23	679.9	\N	\N	\N	\N	0	chart
1685	ARADEL	2025-12-24	679.9	\N	\N	\N	\N	0	chart
1686	ARADEL	2025-12-29	679.9	\N	\N	\N	\N	0	chart
1687	ARADEL	2025-12-30	679.9	\N	\N	\N	\N	0	chart
1688	ARADEL	2025-12-31	670	\N	\N	\N	\N	-1.4561	chart
1689	ARADEL	2026-01-02	720.3	\N	\N	\N	\N	7.5075	chart
1690	ARADEL	2026-01-05	772	\N	\N	\N	\N	7.1776	chart
1691	ARADEL	2026-01-06	735	\N	\N	\N	\N	-4.7927	chart
1692	ARADEL	2026-01-07	724	\N	\N	\N	\N	-1.4966	chart
1693	ARADEL	2026-01-08	724	\N	\N	\N	\N	0	chart
1694	ARADEL	2026-01-09	724	\N	\N	\N	\N	0	chart
1695	ARADEL	2026-01-12	751	\N	\N	\N	\N	3.7293	chart
1696	ARADEL	2026-01-13	751	\N	\N	\N	\N	0	chart
1697	ARADEL	2026-01-14	792.6	\N	\N	\N	\N	5.5393	chart
1698	ARADEL	2026-01-15	752.1	\N	\N	\N	\N	-5.1098	chart
1699	ARADEL	2026-01-16	752.1	\N	\N	\N	\N	0	chart
1700	ARADEL	2026-01-19	752.1	\N	\N	\N	\N	0	chart
1701	ARADEL	2026-01-20	794.8	\N	\N	\N	\N	5.6774	chart
1702	ARADEL	2026-01-21	780	\N	\N	\N	\N	-1.8621	chart
1703	ARADEL	2026-01-22	780	\N	\N	\N	\N	0	chart
1704	ARADEL	2026-01-23	780	\N	\N	\N	\N	0	chart
1705	ARADEL	2026-01-26	780	\N	\N	\N	\N	0	chart
1706	ARADEL	2026-01-27	780	\N	\N	\N	\N	0	chart
1707	ARADEL	2026-01-28	780	\N	\N	\N	\N	0	chart
1708	ARADEL	2026-01-29	780	\N	\N	\N	\N	0	chart
1709	ARADEL	2026-01-30	780.2	\N	\N	\N	\N	0.0256	chart
1710	ARADEL	2026-02-02	820	\N	\N	\N	\N	5.1013	chart
1711	ARADEL	2026-02-03	820	\N	\N	\N	\N	0	chart
1712	ARADEL	2026-02-04	850	\N	\N	\N	\N	3.6585	chart
1713	ARADEL	2026-02-05	850	\N	\N	\N	\N	0	chart
1714	ARADEL	2026-02-06	900	\N	\N	\N	\N	5.8824	chart
1715	ARADEL	2026-02-09	925	\N	\N	\N	\N	2.7778	chart
1716	ARADEL	2026-02-10	991	\N	\N	\N	\N	7.1351	chart
1717	ARADEL	2026-02-11	991	\N	\N	\N	\N	0	chart
1718	ARADEL	2026-02-12	991	\N	\N	\N	\N	0	chart
1719	ARADEL	2026-02-13	997	\N	\N	\N	\N	0.6054	chart
1720	ARADEL	2026-02-16	1096.7	\N	\N	\N	\N	10	chart
1721	ARADEL	2026-02-17	1094	\N	\N	\N	\N	-0.2462	chart
1722	ARADEL	2026-02-18	1094	\N	\N	\N	\N	0	chart
1723	ARADEL	2026-02-19	1094	\N	\N	\N	\N	0	chart
1724	ARADEL	2026-02-20	1094	\N	\N	\N	\N	0	chart
1725	ARADEL	2026-02-23	1094	\N	\N	\N	\N	0	chart
1726	ARADEL	2026-02-24	1093.9	\N	\N	\N	\N	-0.0091	chart
1727	ARADEL	2026-02-25	1093.9	\N	\N	\N	\N	0	chart
1728	ARADEL	2026-02-26	1093.9	\N	\N	\N	\N	0	chart
1729	ARADEL	2026-02-27	1084	\N	\N	\N	\N	-0.905	chart
1730	ARADEL	2026-03-02	1192.3	\N	\N	\N	\N	9.9908	chart
1731	ARADEL	2026-03-03	1300.4	\N	\N	\N	\N	9.0665	chart
1732	ARADEL	2026-03-04	1300.4	\N	\N	\N	\N	0	chart
1733	ARADEL	2026-03-05	1300.4	\N	\N	\N	\N	0	chart
1734	ARADEL	2026-03-06	1300.4	\N	\N	\N	\N	0	chart
1735	ARADEL	2026-03-09	1340	\N	\N	\N	\N	3.0452	chart
1736	ARADEL	2026-03-10	1340	\N	\N	\N	\N	0	chart
1737	ARADEL	2026-03-11	1340	\N	\N	\N	\N	0	chart
1738	ARADEL	2026-03-12	1340	\N	\N	\N	\N	0	chart
1739	ARADEL	2026-03-13	1340	\N	\N	\N	\N	0	chart
1740	ARADEL	2026-03-16	1340	\N	\N	\N	\N	0	chart
1741	ARADEL	2026-03-17	1340	\N	\N	\N	\N	0	chart
1742	ARADEL	2026-03-18	1210.3	\N	\N	\N	\N	-9.6791	chart
4848	GTCO	2025-07-21	94.5	\N	\N	\N	\N	-0.5786	chart
4854	GTCO	2025-07-22	93.8	\N	\N	\N	\N	-0.7407	chart
4856	GTCO	2025-07-23	94	\N	\N	\N	\N	0.2132	chart
4866	GTCO	2025-07-24	94.1	\N	\N	\N	\N	0.1064	chart
4872	GTCO	2025-07-25	94	\N	\N	\N	\N	-0.1063	chart
4878	GTCO	2025-07-28	94.1	\N	\N	\N	\N	0.1064	chart
4884	GTCO	2025-07-29	98	\N	\N	\N	\N	4.1445	chart
4890	GTCO	2025-07-30	101.95	\N	\N	\N	\N	4.0306	chart
4896	GTCO	2025-07-31	100.5	\N	\N	\N	\N	-1.4223	chart
4902	GTCO	2025-08-01	99.5	\N	\N	\N	\N	-0.995	chart
4908	GTCO	2025-08-04	100	\N	\N	\N	\N	0.5025	chart
3630	BETAGLAS	2025-03-27	99.85	\N	\N	\N	\N	0	chart
3632	BETAGLAS	2025-03-28	99.85	\N	\N	\N	\N	0	chart
3634	BETAGLAS	2025-04-02	99.85	\N	\N	\N	\N	0	chart
3636	BETAGLAS	2025-04-03	99.85	\N	\N	\N	\N	0	chart
3638	BETAGLAS	2025-04-04	99.85	\N	\N	\N	\N	0	chart
3640	BETAGLAS	2025-04-07	99.85	\N	\N	\N	\N	0	chart
3642	BETAGLAS	2025-04-08	99.85	\N	\N	\N	\N	0	chart
3644	BETAGLAS	2025-04-09	99.85	\N	\N	\N	\N	0	chart
3645	BETAGLAS	2025-04-10	99.85	\N	\N	\N	\N	0	chart
3647	BETAGLAS	2025-04-11	99.85	\N	\N	\N	\N	0	chart
3649	BETAGLAS	2025-04-14	99.85	\N	\N	\N	\N	0	chart
3651	BETAGLAS	2025-04-15	99.85	\N	\N	\N	\N	0	chart
3653	BETAGLAS	2025-04-16	99.85	\N	\N	\N	\N	0	chart
3655	BETAGLAS	2025-04-17	99.85	\N	\N	\N	\N	0	chart
3657	BETAGLAS	2025-04-22	99.85	\N	\N	\N	\N	0	chart
3659	BETAGLAS	2025-04-23	99.85	\N	\N	\N	\N	0	chart
3661	BETAGLAS	2025-04-24	99.85	\N	\N	\N	\N	0	chart
3664	BETAGLAS	2025-04-25	99.85	\N	\N	\N	\N	0	chart
3666	BETAGLAS	2025-04-28	99.85	\N	\N	\N	\N	0	chart
3668	BETAGLAS	2025-04-29	99.85	\N	\N	\N	\N	0	chart
3670	BETAGLAS	2025-04-30	99.85	\N	\N	\N	\N	0	chart
3672	BETAGLAS	2025-05-02	109.8	\N	\N	\N	\N	9.9649	chart
3674	BETAGLAS	2025-05-05	120.75	\N	\N	\N	\N	9.9727	chart
3676	BETAGLAS	2025-05-06	132.8	\N	\N	\N	\N	9.9793	chart
3678	BETAGLAS	2025-05-07	146.05	\N	\N	\N	\N	9.9774	chart
3680	BETAGLAS	2025-05-08	160.65	\N	\N	\N	\N	9.9966	chart
3682	BETAGLAS	2025-05-09	160.65	\N	\N	\N	\N	0	chart
3684	BETAGLAS	2025-05-12	176.7	\N	\N	\N	\N	9.9907	chart
3686	BETAGLAS	2025-05-13	194.3	\N	\N	\N	\N	9.9604	chart
3688	BETAGLAS	2025-05-14	194.3	\N	\N	\N	\N	0	chart
3690	BETAGLAS	2025-05-15	213.7	\N	\N	\N	\N	9.9846	chart
3691	BETAGLAS	2025-05-16	235.05	\N	\N	\N	\N	9.9906	chart
3693	BETAGLAS	2025-05-19	258.5	\N	\N	\N	\N	9.9766	chart
3695	BETAGLAS	2025-05-20	258.5	\N	\N	\N	\N	0	chart
2595	BUACEMENT	2026-02-24	219	219	219	219	942623	0	history
2596	BUACEMENT	2026-02-25	219	219	219	219	1470961	0	history
2597	BUACEMENT	2026-02-26	219	219	219	219	1943070	0	history
2598	BUACEMENT	2026-02-27	219	219	219	219	660215	0	history
2599	BUACEMENT	2026-03-02	219	219	219	219	1570664	0	history
2600	BUACEMENT	2026-03-03	219	219	219	219	1336463	0	history
2601	BUACEMENT	2026-03-04	219	219	219	219	908574	0	history
2602	BUACEMENT	2026-03-05	219	219	219	219	661497	0	history
2603	BUACEMENT	2026-03-06	225	225	225	225	1185153	2.74	history
2604	BUACEMENT	2026-03-09	225	225	225	225	1684155	0	history
2605	BUACEMENT	2026-03-10	225	225	225	225	2046627	0	history
2606	BUACEMENT	2026-03-11	235	230	235	230	2465108	4.44	history
2607	BUACEMENT	2026-03-12	247.3	247.3	247.3	247.3	1124219	5.23	history
2608	BUACEMENT	2026-03-13	270	269.9	270	269.9	2963429	9.18	history
2609	BUACEMENT	2026-03-16	297	291.8	297	291.8	1425247	10	history
2610	BUACEMENT	2026-03-17	326.7	326.7	326.7	326.7	3281092	10	history
2611	BUACEMENT	2026-03-18	326.7	326.7	326.7	326.7	2011984	0	history
3697	BETAGLAS	2025-05-21	258.5	\N	\N	\N	\N	0	chart
3699	BETAGLAS	2025-05-22	258.5	\N	\N	\N	\N	0	chart
3701	BETAGLAS	2025-05-23	258.5	\N	\N	\N	\N	0	chart
3703	BETAGLAS	2025-05-26	258.5	\N	\N	\N	\N	0	chart
3705	BETAGLAS	2025-05-27	258.5	\N	\N	\N	\N	0	chart
3707	BETAGLAS	2025-05-28	258.5	\N	\N	\N	\N	0	chart
3709	BETAGLAS	2025-05-29	258.5	\N	\N	\N	\N	0	chart
3711	BETAGLAS	2025-05-30	232.65	\N	\N	\N	\N	-10	chart
3713	BETAGLAS	2025-06-02	232.65	\N	\N	\N	\N	0	chart
3715	BETAGLAS	2025-06-03	232.65	\N	\N	\N	\N	0	chart
3717	BETAGLAS	2025-06-04	232.65	\N	\N	\N	\N	0	chart
3718	BETAGLAS	2025-06-05	232.65	\N	\N	\N	\N	0	chart
3720	BETAGLAS	2025-06-10	210.1	\N	\N	\N	\N	-9.6927	chart
3722	BETAGLAS	2025-06-11	231.1	\N	\N	\N	\N	9.9952	chart
3724	BETAGLAS	2025-06-13	231.1	\N	\N	\N	\N	0	chart
3727	BETAGLAS	2025-06-16	231.1	\N	\N	\N	\N	0	chart
3729	BETAGLAS	2025-06-17	231.1	\N	\N	\N	\N	0	chart
3731	BETAGLAS	2025-06-18	250.95	\N	\N	\N	\N	8.5894	chart
3733	BETAGLAS	2025-06-19	276	\N	\N	\N	\N	9.9821	chart
3734	BETAGLAS	2025-06-20	276	\N	\N	\N	\N	0	chart
3736	BETAGLAS	2025-06-23	303.6	\N	\N	\N	\N	10	chart
3738	BETAGLAS	2025-06-24	333.95	\N	\N	\N	\N	9.9967	chart
3740	BETAGLAS	2025-06-25	333.95	\N	\N	\N	\N	0	chart
3742	BETAGLAS	2025-06-26	333.95	\N	\N	\N	\N	0	chart
3744	BETAGLAS	2025-06-27	333.95	\N	\N	\N	\N	0	chart
3746	BETAGLAS	2025-06-30	333.95	\N	\N	\N	\N	0	chart
3748	BETAGLAS	2025-07-01	333.95	\N	\N	\N	\N	0	chart
3750	BETAGLAS	2025-07-02	333.95	\N	\N	\N	\N	0	chart
3752	BETAGLAS	2025-07-03	333.95	\N	\N	\N	\N	0	chart
3754	BETAGLAS	2025-07-04	333.95	\N	\N	\N	\N	0	chart
3756	BETAGLAS	2025-07-07	333.95	\N	\N	\N	\N	0	chart
3758	BETAGLAS	2025-07-08	333.95	\N	\N	\N	\N	0	chart
3760	BETAGLAS	2025-07-09	333.95	\N	\N	\N	\N	0	chart
3762	BETAGLAS	2025-07-10	333.95	\N	\N	\N	\N	0	chart
3764	BETAGLAS	2025-07-11	333.95	\N	\N	\N	\N	0	chart
3766	BETAGLAS	2025-07-14	333.95	\N	\N	\N	\N	0	chart
3768	BETAGLAS	2025-07-16	333.95	\N	\N	\N	\N	0	chart
3770	BETAGLAS	2025-07-17	333.95	\N	\N	\N	\N	0	chart
2837	BUACEMENT	2025-09-01	151.8	\N	\N	\N	\N	0	chart
2839	BUACEMENT	2025-09-02	151.8	\N	\N	\N	\N	0	chart
2841	BUACEMENT	2025-09-03	151.8	\N	\N	\N	\N	0	chart
2843	BUACEMENT	2025-09-04	151.8	\N	\N	\N	\N	0	chart
2845	BUACEMENT	2025-09-08	151.8	\N	\N	\N	\N	0	chart
2847	BUACEMENT	2025-09-09	151.8	\N	\N	\N	\N	0	chart
2849	BUACEMENT	2025-09-10	151.8	\N	\N	\N	\N	0	chart
2851	BUACEMENT	2025-09-11	151.8	\N	\N	\N	\N	0	chart
2853	BUACEMENT	2025-09-12	151.8	\N	\N	\N	\N	0	chart
2855	BUACEMENT	2025-09-15	151.8	\N	\N	\N	\N	0	chart
2856	BUACEMENT	2025-09-16	151.8	\N	\N	\N	\N	0	chart
2858	BUACEMENT	2025-09-17	151.8	\N	\N	\N	\N	0	chart
4861	OKOMUOIL	2025-10-07	1020	1010.556	1010.556	1010.556	147212	0	history
4867	OKOMUOIL	2025-10-08	1020	1010.556	1010.556	1010.556	84228	0	history
4873	OKOMUOIL	2025-10-09	1020	1010.556	1010.556	1010.556	51636	0	history
4879	OKOMUOIL	2025-10-10	1020	1010.556	1010.556	1010.556	36434	0	history
4885	OKOMUOIL	2025-10-13	1020	1010.556	1010.556	1010.556	85818	0	history
4891	OKOMUOIL	2025-10-14	1020	1010.556	1010.556	1010.556	214108	0	history
4897	OKOMUOIL	2025-10-15	1020	1010.556	1010.556	1010.556	84564	0	history
4903	OKOMUOIL	2025-10-16	1020	1010.556	1010.556	1010.556	298250	0	history
4909	OKOMUOIL	2025-10-17	1020	1010.556	1010.556	1010.556	63492.00000000001	0	history
4915	OKOMUOIL	2025-10-20	1020	1010.556	1010.556	1010.556	593684	0	history
4921	OKOMUOIL	2025-10-21	1020	1010.556	1010.556	1010.556	250135	0	history
4927	OKOMUOIL	2025-10-22	1020	1010.556	1010.556	1010.556	130709	0	history
4933	OKOMUOIL	2025-10-23	1020	1010.556	1010.556	1010.556	148735	0	history
4939	OKOMUOIL	2025-10-24	1020	1010.556	1010.556	1010.556	211741	0	history
4945	OKOMUOIL	2025-10-27	1020	1010.556	1010.556	1010.556	234459	0	history
4951	OKOMUOIL	2025-10-28	1020	1010.556	1010.556	1010.556	402362	0	history
4957	OKOMUOIL	2025-10-29	1080.2	1050	1080.2	1050	670413	5.9	history
4963	OKOMUOIL	2025-10-30	1080	1080	1080	1080	565432	-0.02	history
4968	OKOMUOIL	2025-10-31	1080	1070	1070	1070	521047.00000000006	0	history
4974	OKOMUOIL	2025-11-03	1110	1110	1110	1110	2138162	2.78	history
4978	OKOMUOIL	2025-11-04	1110	1110	1110	1110	103018	0	history
4985	OKOMUOIL	2025-11-05	1110	1110	1110	1110	152608	0	history
4991	OKOMUOIL	2025-11-06	1110	1110	1110	1110	196923	0	history
4999	OKOMUOIL	2025-11-07	1110	1110	1110	1110	90662	0	history
5004	OKOMUOIL	2025-11-10	1110	1110	1110	1110	127598	0	history
5011	OKOMUOIL	2025-11-11	1110	1110	1110	1110	94545	0	history
5015	OKOMUOIL	2025-11-12	1110	1110	1110	1110	287939	0	history
5022	OKOMUOIL	2025-11-13	1110	1110	1110	1110	115524	0	history
5028	OKOMUOIL	2025-11-14	1110	1110	1110	1110	417824	0	history
5034	OKOMUOIL	2025-11-17	1110	1110	1110	1110	182160	0	history
5040	OKOMUOIL	2025-11-18	1110	1110	1110	1110	126931	0	history
5046	OKOMUOIL	2025-11-19	1110	1110	1110	1110	104558	0	history
5052	OKOMUOIL	2025-11-20	1110	1110	1110	1110	110845	0	history
5058	OKOMUOIL	2025-11-21	1110	1110	1110	1110	0	0	history
5064	OKOMUOIL	2025-11-24	1110	1110	1110	1110	245069	0	history
5070	OKOMUOIL	2025-11-25	1110	1110	1110	1110	231179	0	history
5076	OKOMUOIL	2025-11-26	1110	1110	1110	1110	164041	0	history
5082	OKOMUOIL	2025-11-27	1110	1110	1110	1110	216667	0	history
5087	OKOMUOIL	2025-11-28	1110	1110	1110	1110	257404.00000000003	0	history
5092	OKOMUOIL	2025-12-01	1110	1110	1110	1110	215757	0	history
5097	OKOMUOIL	2025-12-02	1110	1110	1110	1110	136970	0	history
5102	OKOMUOIL	2025-12-03	1110	1110	1110	1110	101380	0	history
5107	OKOMUOIL	2025-12-04	1110	1110	1110	1110	262975	0	history
5111	OKOMUOIL	2025-12-05	1110	1110	1110	1110	301737	0	history
5115	OKOMUOIL	2025-12-08	1110	1110	1110	1110	294060	0	history
5119	OKOMUOIL	2025-12-09	1038	1038	1038	1038	347083	-6.49	history
5125	OKOMUOIL	2025-12-10	1038	1038	1038	1038	95233	0	history
5130	OKOMUOIL	2025-12-11	1038	1038	1038	1038	103198	0	history
5135	OKOMUOIL	2025-12-12	1038	1038	1038	1038	177418	0	history
5140	OKOMUOIL	2025-12-15	1038	1038	1038	1038	447795	0	history
5146	OKOMUOIL	2025-12-16	1038	1038	1038	1038	75731	0	history
5151	OKOMUOIL	2025-12-17	1109	1109	1109	1109	342949	6.84	history
5159	OKOMUOIL	2025-12-18	1109	1109	1109	1109	76846	0	history
5166	OKOMUOIL	2025-12-19	1109	1109	1109	1109	58015	0	history
5173	OKOMUOIL	2025-12-22	1109	1109	1109	1109	297861	0	history
5180	OKOMUOIL	2025-12-23	1109	1109	1109	1109	128174	0	history
5186	OKOMUOIL	2025-12-24	1095	1095	1095	1095	268586	-1.26	history
5195	OKOMUOIL	2025-12-29	1095	1095	1095	1095	191920	0	history
5201	OKOMUOIL	2025-12-30	1095	1095	1095	1095	102981	0	history
5209	OKOMUOIL	2025-12-31	1095	1095	1095	1095	101632	0	history
5215	OKOMUOIL	2026-01-02	1095	1095	1095	1095	111576	0	history
5221	OKOMUOIL	2026-01-05	1095	1095	1095	1095	166301	0	history
5227	OKOMUOIL	2026-01-06	1095	1095	1095	1095	179568	0	history
5234	OKOMUOIL	2026-01-07	1204.5	1204.5	1204.5	1204.5	172086	10	history
5240	OKOMUOIL	2026-01-08	1204.5	1204.5	1204.5	1204.5	272152	0	history
4912	GTCO	2025-08-05	99	\N	\N	\N	\N	-1	chart
4919	GTCO	2025-08-06	99.4	\N	\N	\N	\N	0.404	chart
4925	GTCO	2025-08-07	99.95	\N	\N	\N	\N	0.5533	chart
4931	GTCO	2025-08-08	100	\N	\N	\N	\N	0.05	chart
4937	GTCO	2025-08-11	99.85	\N	\N	\N	\N	-0.15	chart
4943	GTCO	2025-08-12	99	\N	\N	\N	\N	-0.8513	chart
4949	GTCO	2025-08-13	97.7	\N	\N	\N	\N	-1.3131	chart
4955	GTCO	2025-08-14	97.2	\N	\N	\N	\N	-0.5118	chart
4961	GTCO	2025-08-15	97.7	\N	\N	\N	\N	0.5144	chart
4967	GTCO	2025-08-18	97	\N	\N	\N	\N	-0.7165	chart
4973	GTCO	2025-08-19	95	\N	\N	\N	\N	-2.0619	chart
4981	GTCO	2025-08-20	90.15	\N	\N	\N	\N	-5.1053	chart
4987	GTCO	2025-08-21	92.75	\N	\N	\N	\N	2.8841	chart
4992	GTCO	2025-08-22	94	\N	\N	\N	\N	1.3477	chart
4997	GTCO	2025-08-25	96.05	\N	\N	\N	\N	2.1809	chart
5003	GTCO	2025-08-26	98	\N	\N	\N	\N	2.0302	chart
5009	GTCO	2025-08-27	95	\N	\N	\N	\N	-3.0612	chart
5016	GTCO	2025-08-28	92.05	\N	\N	\N	\N	-3.1053	chart
5023	GTCO	2025-08-29	92	\N	\N	\N	\N	-0.0543	chart
5029	GTCO	2025-09-01	92	\N	\N	\N	\N	0	chart
5035	GTCO	2025-09-02	91.5	\N	\N	\N	\N	-0.5435	chart
5041	GTCO	2025-09-03	90.5	\N	\N	\N	\N	-1.0929	chart
5047	GTCO	2025-09-04	92	\N	\N	\N	\N	1.6575	chart
5053	GTCO	2025-09-08	92	\N	\N	\N	\N	0	chart
5060	GTCO	2025-09-09	92.5	\N	\N	\N	\N	0.5435	chart
5066	GTCO	2025-09-10	92.4	\N	\N	\N	\N	-0.1081	chart
5072	GTCO	2025-09-11	92.65	\N	\N	\N	\N	0.2706	chart
5078	GTCO	2025-09-12	93	\N	\N	\N	\N	0.3778	chart
5083	GTCO	2025-09-15	94.2	\N	\N	\N	\N	1.2903	chart
5088	GTCO	2025-09-16	95	\N	\N	\N	\N	0.8493	chart
5093	GTCO	2025-09-17	94	\N	\N	\N	\N	-1.0526	chart
5099	GTCO	2025-09-18	94.7	\N	\N	\N	\N	0.7447	chart
5105	GTCO	2025-09-19	94	\N	\N	\N	\N	-0.7392	chart
5109	GTCO	2025-09-22	93	\N	\N	\N	\N	-1.0638	chart
5113	GTCO	2025-09-23	90	\N	\N	\N	\N	-3.2258	chart
5117	GTCO	2025-09-24	91	\N	\N	\N	\N	1.1111	chart
5122	GTCO	2025-09-25	92.8	\N	\N	\N	\N	1.978	chart
5127	GTCO	2025-09-26	93	\N	\N	\N	\N	0.2155	chart
5132	GTCO	2025-09-29	94	\N	\N	\N	\N	1.0753	chart
5137	GTCO	2025-09-30	93.9	\N	\N	\N	\N	-0.1064	chart
5143	GTCO	2025-10-02	95.9	\N	\N	\N	\N	2.1299	chart
5149	GTCO	2025-10-03	95.85	\N	\N	\N	\N	-0.0521	chart
5154	GTCO	2025-10-06	99	\N	\N	\N	\N	3.2864	chart
5160	GTCO	2025-10-07	95	\N	\N	\N	\N	-4.0404	chart
5165	GTCO	2025-10-08	94	\N	\N	\N	\N	-1.0526	chart
5170	GTCO	2025-10-09	95	\N	\N	\N	\N	1.0638	chart
5175	GTCO	2025-10-10	95	\N	\N	\N	\N	0	chart
5181	GTCO	2025-10-13	94	\N	\N	\N	\N	-1.0526	chart
5187	GTCO	2025-10-14	94	\N	\N	\N	\N	0	chart
5196	GTCO	2025-10-15	93.4	\N	\N	\N	\N	-0.6383	chart
5200	GTCO	2025-10-16	93.5	\N	\N	\N	\N	0.1071	chart
5207	GTCO	2025-10-17	93.3	\N	\N	\N	\N	-0.2139	chart
5214	GTCO	2025-10-20	93.25	\N	\N	\N	\N	-0.0536	chart
5220	GTCO	2025-10-21	92.95	\N	\N	\N	\N	-0.3217	chart
5226	GTCO	2025-10-22	93	\N	\N	\N	\N	0.0538	chart
5232	GTCO	2025-10-23	92.8	\N	\N	\N	\N	-0.2151	chart
5238	GTCO	2025-10-24	92.5	\N	\N	\N	\N	-0.3233	chart
5244	GTCO	2025-10-27	90.65	\N	\N	\N	\N	-2	chart
5255	OANDO	2025-08-26	53	\N	\N	\N	\N	4.9505	chart
5260	OANDO	2025-08-27	53.95	\N	\N	\N	\N	1.7925	chart
5264	OANDO	2025-08-28	53.85	\N	\N	\N	\N	-0.1854	chart
5269	GTCO	2025-10-28	90.45	\N	\N	\N	\N	-0.2206	chart
5270	OANDO	2025-08-29	51.2	\N	\N	\N	\N	-4.9211	chart
5275	GTCO	2025-10-29	90.35	\N	\N	\N	\N	-0.1106	chart
5277	OANDO	2025-09-01	48	\N	\N	\N	\N	-6.25	chart
5281	GTCO	2025-10-30	89	\N	\N	\N	\N	-1.4942	chart
5282	OANDO	2025-09-02	48.5	\N	\N	\N	\N	1.0417	chart
5287	GTCO	2025-10-31	89.5	\N	\N	\N	\N	0.5618	chart
5289	OANDO	2025-09-03	47	\N	\N	\N	\N	-3.0928	chart
5293	GTCO	2025-11-03	89.5	\N	\N	\N	\N	0	chart
5295	OANDO	2025-09-04	47.15	\N	\N	\N	\N	0.3191	chart
5297	MTNN	2025-11-11	429.3	\N	\N	\N	\N	-10	chart
5299	GTCO	2025-11-04	85.15	\N	\N	\N	\N	-4.8603	chart
5301	OANDO	2025-09-08	47.5	\N	\N	\N	\N	0.7423	chart
5303	MTNN	2025-11-12	472	\N	\N	\N	\N	9.9464	chart
5305	GTCO	2025-11-05	85.95	\N	\N	\N	\N	0.9395	chart
5306	OANDO	2025-09-09	47.25	\N	\N	\N	\N	-0.5263	chart
5309	MTNN	2025-11-13	472	\N	\N	\N	\N	0	chart
5311	OANDO	2025-09-10	47.55	\N	\N	\N	\N	0.6349	chart
5314	GTCO	2025-11-06	85.5	\N	\N	\N	\N	-0.5236	chart
5315	MTNN	2025-11-14	475	\N	\N	\N	\N	0.6356	chart
5317	OANDO	2025-09-11	48	\N	\N	\N	\N	0.9464	chart
5319	GTCO	2025-11-07	85	\N	\N	\N	\N	-0.5848	chart
5321	MTNN	2025-11-17	475	\N	\N	\N	\N	0	chart
5323	OANDO	2025-09-12	48	\N	\N	\N	\N	0	chart
5326	GTCO	2025-11-10	84.5	\N	\N	\N	\N	-0.5882	chart
5327	MTNN	2025-11-18	475	\N	\N	\N	\N	0	chart
5329	OANDO	2025-09-15	47.5	\N	\N	\N	\N	-1.0417	chart
5332	GTCO	2025-11-11	78	\N	\N	\N	\N	-7.6923	chart
5333	MTNN	2025-11-19	475	\N	\N	\N	\N	0	chart
5335	OANDO	2025-09-16	48.25	\N	\N	\N	\N	1.5789	chart
5338	GTCO	2025-11-12	85.8	\N	\N	\N	\N	10	chart
5339	MTNN	2025-11-20	475	\N	\N	\N	\N	0	chart
5341	OANDO	2025-09-17	48.7	\N	\N	\N	\N	0.9326	chart
5344	GTCO	2025-11-13	88.5	\N	\N	\N	\N	3.1469	chart
5345	MTNN	2025-11-21	465	\N	\N	\N	\N	-2.1053	chart
5347	OANDO	2025-09-18	48.45	\N	\N	\N	\N	-0.5133	chart
3772	BETAGLAS	2025-07-18	333.95	\N	\N	\N	\N	0	chart
3774	BETAGLAS	2025-07-21	333.95	\N	\N	\N	\N	0	chart
3776	BETAGLAS	2025-07-22	350	\N	\N	\N	\N	4.8061	chart
3778	BETAGLAS	2025-07-23	350	\N	\N	\N	\N	0	chart
3780	BETAGLAS	2025-07-24	350	\N	\N	\N	\N	0	chart
3782	BETAGLAS	2025-07-25	350	\N	\N	\N	\N	0	chart
3784	BETAGLAS	2025-07-28	350	\N	\N	\N	\N	0	chart
3786	BETAGLAS	2025-07-29	374	\N	\N	\N	\N	6.8571	chart
3788	BETAGLAS	2025-07-30	374	\N	\N	\N	\N	0	chart
3790	BETAGLAS	2025-07-31	374	\N	\N	\N	\N	0	chart
3792	BETAGLAS	2025-08-01	408.5	\N	\N	\N	\N	9.2246	chart
3794	BETAGLAS	2025-08-04	408.5	\N	\N	\N	\N	0	chart
3796	BETAGLAS	2025-08-05	408.5	\N	\N	\N	\N	0	chart
3798	BETAGLAS	2025-08-06	408.5	\N	\N	\N	\N	0	chart
3800	BETAGLAS	2025-08-07	408.5	\N	\N	\N	\N	0	chart
3802	BETAGLAS	2025-08-08	408.5	\N	\N	\N	\N	0	chart
3804	BETAGLAS	2025-08-11	408.5	\N	\N	\N	\N	0	chart
3806	BETAGLAS	2025-08-12	408.5	\N	\N	\N	\N	0	chart
3808	BETAGLAS	2025-08-13	408.5	\N	\N	\N	\N	0	chart
3810	BETAGLAS	2025-08-14	408.5	\N	\N	\N	\N	0	chart
3812	BETAGLAS	2025-08-15	408.5	\N	\N	\N	\N	0	chart
3814	BETAGLAS	2025-08-18	408.5	\N	\N	\N	\N	0	chart
3816	BETAGLAS	2025-08-19	408.5	\N	\N	\N	\N	0	chart
3818	BETAGLAS	2025-08-20	408.5	\N	\N	\N	\N	0	chart
3820	BETAGLAS	2025-08-21	408.5	\N	\N	\N	\N	0	chart
3822	BETAGLAS	2025-08-22	449.35	\N	\N	\N	\N	10	chart
3824	BETAGLAS	2025-08-25	449.35	\N	\N	\N	\N	0	chart
3826	BETAGLAS	2025-08-26	486	\N	\N	\N	\N	8.1562	chart
3828	BETAGLAS	2025-08-27	486	\N	\N	\N	\N	0	chart
3830	BETAGLAS	2025-08-28	486	\N	\N	\N	\N	0	chart
4941	MTNN	2025-08-14	460	\N	\N	\N	\N	0	chart
4947	MTNN	2025-08-15	445	\N	\N	\N	\N	-3.2609	chart
4953	MTNN	2025-08-18	445	\N	\N	\N	\N	0	chart
4960	MTNN	2025-08-19	445	\N	\N	\N	\N	0	chart
4966	MTNN	2025-08-20	445	\N	\N	\N	\N	0	chart
4971	MTNN	2025-08-21	435	\N	\N	\N	\N	-2.2472	chart
4979	MTNN	2025-08-22	435	\N	\N	\N	\N	0	chart
4984	MTNN	2025-08-25	435	\N	\N	\N	\N	0	chart
4990	MTNN	2025-08-26	435	\N	\N	\N	\N	0	chart
4996	MTNN	2025-08-27	435	\N	\N	\N	\N	0	chart
5002	MTNN	2025-08-28	435	\N	\N	\N	\N	0	chart
5008	MTNN	2025-08-29	435	\N	\N	\N	\N	0	chart
5014	MTNN	2025-09-01	435	\N	\N	\N	\N	0	chart
5020	MTNN	2025-09-02	435	\N	\N	\N	\N	0	chart
5026	MTNN	2025-09-03	435	\N	\N	\N	\N	0	chart
5032	MTNN	2025-09-04	435	\N	\N	\N	\N	0	chart
5038	MTNN	2025-09-08	435	\N	\N	\N	\N	0	chart
5044	MTNN	2025-09-09	435	\N	\N	\N	\N	0	chart
5050	MTNN	2025-09-10	435	\N	\N	\N	\N	0	chart
5056	MTNN	2025-09-11	435	\N	\N	\N	\N	0	chart
5062	MTNN	2025-09-12	435	\N	\N	\N	\N	0	chart
5069	MTNN	2025-09-15	435	\N	\N	\N	\N	0	chart
5075	MTNN	2025-09-16	435	\N	\N	\N	\N	0	chart
5081	MTNN	2025-09-17	435	\N	\N	\N	\N	0	chart
5086	MTNN	2025-09-18	435	\N	\N	\N	\N	0	chart
5091	MTNN	2025-09-19	435	\N	\N	\N	\N	0	chart
5096	MTNN	2025-09-22	435	\N	\N	\N	\N	0	chart
5101	MTNN	2025-09-23	435	\N	\N	\N	\N	0	chart
5106	MTNN	2025-09-24	414.1	\N	\N	\N	\N	-4.8046	chart
5110	MTNN	2025-09-25	415	\N	\N	\N	\N	0.2173	chart
5114	MTNN	2025-09-26	420	\N	\N	\N	\N	1.2048	chart
5118	MTNN	2025-09-29	423	\N	\N	\N	\N	0.7143	chart
5123	MTNN	2025-09-30	423	\N	\N	\N	\N	0	chart
5128	MTNN	2025-10-02	425	\N	\N	\N	\N	0.4728	chart
5133	MTNN	2025-10-03	425	\N	\N	\N	\N	0	chart
5138	MTNN	2025-10-06	440	\N	\N	\N	\N	3.5294	chart
5144	MTNN	2025-10-07	450	\N	\N	\N	\N	2.2727	chart
5150	MTNN	2025-10-08	470.9	\N	\N	\N	\N	4.6444	chart
5155	MTNN	2025-10-09	471	\N	\N	\N	\N	0.0212	chart
5163	MTNN	2025-10-10	471	\N	\N	\N	\N	0	chart
5169	MTNN	2025-10-13	471	\N	\N	\N	\N	0	chart
5174	MTNN	2025-10-14	471	\N	\N	\N	\N	0	chart
5183	MTNN	2025-10-15	471	\N	\N	\N	\N	0	chart
5189	MTNN	2025-10-16	471.3	\N	\N	\N	\N	0.0637	chart
5194	MTNN	2025-10-17	474.4	\N	\N	\N	\N	0.6578	chart
5202	MTNN	2025-10-20	480	\N	\N	\N	\N	1.1804	chart
5208	MTNN	2025-10-21	480	\N	\N	\N	\N	0	chart
5213	MTNN	2025-10-22	500	\N	\N	\N	\N	4.1667	chart
5219	MTNN	2025-10-23	510	\N	\N	\N	\N	2	chart
5225	MTNN	2025-10-24	515	\N	\N	\N	\N	0.9804	chart
5231	MTNN	2025-10-27	515	\N	\N	\N	\N	0	chart
5237	MTNN	2025-10-28	520.1	\N	\N	\N	\N	0.9903	chart
5243	MTNN	2025-10-29	520.1	\N	\N	\N	\N	0	chart
5249	MTNN	2025-10-30	520.1	\N	\N	\N	\N	0	chart
5254	MTNN	2025-10-31	520.1	\N	\N	\N	\N	0	chart
5259	MTNN	2025-11-03	520.1	\N	\N	\N	\N	0	chart
5265	MTNN	2025-11-04	520.1	\N	\N	\N	\N	0	chart
5267	FIDSON	2025-04-29	21	\N	\N	\N	\N	2.6895	chart
5271	MTNN	2025-11-05	489.2	\N	\N	\N	\N	-5.9412	chart
5272	FIDSON	2025-04-30	22	\N	\N	\N	\N	4.7619	chart
5276	MTNN	2025-11-06	477	\N	\N	\N	\N	-2.4939	chart
5278	FIDSON	2025-05-02	22.85	\N	\N	\N	\N	3.8636	chart
5283	FIDSON	2025-05-05	22.85	\N	\N	\N	\N	0	chart
5284	MTNN	2025-11-07	477	\N	\N	\N	\N	0	chart
5288	FIDSON	2025-05-06	22.85	\N	\N	\N	\N	0	chart
5291	MTNN	2025-11-10	477	\N	\N	\N	\N	0	chart
5294	FIDSON	2025-05-07	23	\N	\N	\N	\N	0.6565	chart
4954	OANDO	2025-06-02	42.831	\N	\N	\N	\N	2.6556	chart
4959	OANDO	2025-06-03	43.385	\N	\N	\N	\N	1.2935	chart
4965	OANDO	2025-06-04	47.723	\N	\N	\N	\N	9.9988	chart
4972	OANDO	2025-06-05	52.477	\N	\N	\N	\N	9.9617	chart
4977	OANDO	2025-06-10	54.785	\N	\N	\N	\N	4.3981	chart
4983	OANDO	2025-06-11	58.246	\N	\N	\N	\N	6.3174	chart
4989	OANDO	2025-06-13	63.692	\N	\N	\N	\N	9.35	chart
4995	OANDO	2025-06-16	59.723	\N	\N	\N	\N	-6.2316	chart
5001	OANDO	2025-06-17	53.769	\N	\N	\N	\N	-9.9694	chart
5007	OANDO	2025-06-18	56.308	\N	\N	\N	\N	4.7221	chart
5013	OANDO	2025-06-19	57.138	\N	\N	\N	\N	1.474	chart
5019	OANDO	2025-06-20	56.308	\N	\N	\N	\N	-1.4526	chart
5025	OANDO	2025-06-23	58.338	\N	\N	\N	\N	3.6052	chart
5031	OANDO	2025-06-24	57.692	\N	\N	\N	\N	-1.1073	chart
5037	OANDO	2025-06-25	63.462	\N	\N	\N	\N	10.0014	chart
5043	OANDO	2025-06-26	57.138	\N	\N	\N	\N	-9.965	chart
5049	OANDO	2025-06-27	52.154	\N	\N	\N	\N	-8.7227	chart
5055	OANDO	2025-06-30	50.723	\N	\N	\N	\N	-2.7438	chart
2481	BUACEMENT	2025-09-18	151.8	151.8	151.8	151.8	230757	0	history
2482	BUACEMENT	2025-09-19	151.8	151.8	151.8	151.8	153019	0	history
2483	BUACEMENT	2025-09-22	151.8	151.8	151.8	151.8	324791	0	history
2484	BUACEMENT	2025-09-23	151.8	151.8	151.8	151.8	1152719	0	history
2485	BUACEMENT	2025-09-24	151.8	151.8	151.8	151.8	401982	0	history
2488	BUACEMENT	2025-09-25	151.8	151.8	151.8	151.8	232701	0	history
2490	BUACEMENT	2025-09-26	151.8	151.8	151.8	151.8	334270	0	history
2491	BUACEMENT	2025-09-29	160	160	160	160	445082	5.4	history
2492	BUACEMENT	2025-09-30	160	160	160	160	281279	0	history
2493	BUACEMENT	2025-10-02	160	160	160	160	291435	0	history
2494	BUACEMENT	2025-10-03	160	160	160	160	344097	0	history
2495	BUACEMENT	2025-10-06	160	160	160	160	395267	0	history
2496	BUACEMENT	2025-10-07	160	160	160	160	390272	0	history
2498	BUACEMENT	2025-10-08	160	160	160	160	281950	0	history
2499	BUACEMENT	2025-10-09	159	159	159	159	382073	-0.63	history
2500	BUACEMENT	2025-10-10	159	159	159	159	377865	0	history
2501	BUACEMENT	2025-10-13	159	159	159	159	433768	0	history
2503	BUACEMENT	2025-10-14	160	160	160	160	451949	0.63	history
2504	BUACEMENT	2025-10-15	160	160	160	160	578860	0	history
2505	BUACEMENT	2025-10-16	160	160	160	160	276256	0	history
2506	BUACEMENT	2025-10-17	160	160	160	160	739729	0	history
2507	BUACEMENT	2025-10-20	170	170	170	170	339474	6.25	history
2508	BUACEMENT	2025-10-21	170	169	170	169	874986	0	history
2509	BUACEMENT	2025-10-22	172	172	172	172	558653	1.18	history
2510	BUACEMENT	2025-10-23	177	177	177	177	1782926	2.91	history
2511	BUACEMENT	2025-10-24	180	180	180	180	1142922	1.69	history
2512	BUACEMENT	2025-10-27	180	180	180	180	4075148.999999999	0	history
2513	BUACEMENT	2025-10-28	180	180	180	180	3879757	0	history
2514	BUACEMENT	2025-10-29	175	185	185	175	3589001	-2.78	history
2515	BUACEMENT	2025-10-30	175	175	175	175	3335584	0	history
2516	BUACEMENT	2025-10-31	180	180	180	180	4888702	2.86	history
2517	BUACEMENT	2025-11-03	180	180	180	180	2432696	0	history
2518	BUACEMENT	2025-11-04	180	180	180	180	285313	0	history
2519	BUACEMENT	2025-11-05	180	180	180	180	113488	0	history
2520	BUACEMENT	2025-11-06	180	180	180	180	212690	0	history
2521	BUACEMENT	2025-11-07	180	180	180	180	354993	0	history
2522	BUACEMENT	2025-11-10	180	180	180	180	298914	0	history
2523	BUACEMENT	2025-11-11	162	162	162	162	274020	-10	history
2524	BUACEMENT	2025-11-12	162	165	165	155	2523568	0	history
2525	BUACEMENT	2025-11-13	162	162	162	162	452233	0	history
2526	BUACEMENT	2025-11-14	168	168	168	168	511549.99999999994	3.7	history
2527	BUACEMENT	2025-11-17	168	168	168	168	659380	0	history
2528	BUACEMENT	2025-11-18	168	168	168	168	330945	0	history
2529	BUACEMENT	2025-11-19	168	168	168	168	649392	0	history
2530	BUACEMENT	2025-11-20	168	168	168	168	200867	0	history
2531	BUACEMENT	2025-11-21	168	168	168	168	137595	0	history
2532	BUACEMENT	2025-11-24	168	168	168	168	138941	0	history
2533	BUACEMENT	2025-11-25	168	168	168	168	119396	0	history
2534	BUACEMENT	2025-11-26	160	151.2	160	151.2	688609	-4.76	history
2535	BUACEMENT	2025-11-27	160	160	160	160	750578	0	history
2536	BUACEMENT	2025-11-28	160	160	160	160	721948	0	history
2537	BUACEMENT	2025-12-01	160	160	160	160	609621	0	history
5061	OANDO	2025-07-01	54.95	\N	\N	\N	\N	8.3335	chart
5067	OANDO	2025-07-02	52.35	\N	\N	\N	\N	-4.7316	chart
5073	OANDO	2025-07-03	56	\N	\N	\N	\N	6.9723	chart
5079	OANDO	2025-07-04	55.05	\N	\N	\N	\N	-1.6964	chart
5085	OANDO	2025-07-07	55.1	\N	\N	\N	\N	0.0908	chart
5090	OANDO	2025-07-08	53.9	\N	\N	\N	\N	-2.1779	chart
5095	OANDO	2025-07-09	54	\N	\N	\N	\N	0.1855	chart
2538	BUACEMENT	2025-12-02	160	160	160	160	273664	0	history
2539	BUACEMENT	2025-12-03	162	162	162	162	307893	1.25	history
2540	BUACEMENT	2025-12-04	162	162	162	162	93149	0	history
2541	BUACEMENT	2025-12-05	162	162	162	162	387703	0	history
2542	BUACEMENT	2025-12-08	162	162	162	162	243547	0	history
2543	BUACEMENT	2025-12-09	162	162	162	162	641493	0	history
2544	BUACEMENT	2025-12-10	162	162	162	162	833175	0	history
2545	BUACEMENT	2025-12-11	162	162	162	162	772827	0	history
2546	BUACEMENT	2025-12-12	162	162	162	162	298329	0	history
2547	BUACEMENT	2025-12-15	162	162	162	162	572610	0	history
2548	BUACEMENT	2025-12-16	162	162	162	162	713549	0	history
2549	BUACEMENT	2025-12-17	162	162	162	162	875373	0	history
2550	BUACEMENT	2025-12-18	162	162	162	162	631153	0	history
2551	BUACEMENT	2025-12-19	170	170	170	170	587239	4.94	history
2552	BUACEMENT	2025-12-22	174	174	174	174	496191	2.35	history
2553	BUACEMENT	2025-12-23	174	174	174	174	604922	0	history
2554	BUACEMENT	2025-12-24	175	175	175	175	295080	0.57	history
2555	BUACEMENT	2025-12-29	175	175	175	175	411111	0	history
2556	BUACEMENT	2025-12-30	178.5	178.5	178.5	178.5	363015	2	history
2557	BUACEMENT	2025-12-31	178.5	178.5	178.5	178.5	414877	0	history
2558	BUACEMENT	2026-01-02	178.5	178.5	178.5	178.5	231548	0	history
2559	BUACEMENT	2026-01-05	183	183	183	183	606235	2.52	history
2560	BUACEMENT	2026-01-06	183	183	183	183	558324	0	history
2561	BUACEMENT	2026-01-07	183	183	183	183	509522.00000000006	0	history
2562	BUACEMENT	2026-01-08	183	183	183	183	562672	0	history
2563	BUACEMENT	2026-01-09	183	183	183	183	402520	0	history
2564	BUACEMENT	2026-01-12	183	183	183	183	723416	0	history
2565	BUACEMENT	2026-01-13	183	183	183	183	1183783	0	history
2566	BUACEMENT	2026-01-14	183	183	183	183	1211359	0	history
2567	BUACEMENT	2026-01-15	183	183	183	183	1284388	0	history
2568	BUACEMENT	2026-01-16	183	183	183	183	849817	0	history
2569	BUACEMENT	2026-01-19	183	183	183	183	579841	0	history
2570	BUACEMENT	2026-01-20	183	183	183	183	942418	0	history
2571	BUACEMENT	2026-01-21	183	183	183	183	264166	0	history
2572	BUACEMENT	2026-01-22	183	183	183	183	783874	0	history
2573	BUACEMENT	2026-01-23	183	183	183	183	662088	0	history
2574	BUACEMENT	2026-01-26	183	183	183	183	608997	0	history
2575	BUACEMENT	2026-01-27	183	183	183	183	421569	0	history
2576	BUACEMENT	2026-01-28	183	183	183	183	656771	0	history
2577	BUACEMENT	2026-01-29	183	183	183	183	379688	0	history
2578	BUACEMENT	2026-01-30	183	183	183	183	203276	0	history
2579	BUACEMENT	2026-02-02	183	183	183	183	614990	0	history
2580	BUACEMENT	2026-02-03	183	183	183	183	259973.99999999997	0	history
2581	BUACEMENT	2026-02-04	183	183	183	183	673271	0	history
2582	BUACEMENT	2026-02-05	183	183	183	183	708142	0	history
2583	BUACEMENT	2026-02-06	183	183	183	183	615324	0	history
2584	BUACEMENT	2026-02-09	183	183	183	183	1646360	0	history
2585	BUACEMENT	2026-02-10	192	189.8	192	189.8	7074407	4.92	history
2586	BUACEMENT	2026-02-11	192	192	192	192	2085469	0	history
2587	BUACEMENT	2026-02-12	192	192	192	192	648255	0	history
2588	BUACEMENT	2026-02-13	192	192	192	192	1765209	0	history
2589	BUACEMENT	2026-02-16	203	196	203	173	3132753	5.73	history
2590	BUACEMENT	2026-02-17	203	203	203	203	2868221	0	history
2591	BUACEMENT	2026-02-18	203	203	203	203	1661406	0	history
2592	BUACEMENT	2026-02-19	203	203	203	203	1401568	0	history
2593	BUACEMENT	2026-02-20	210	205	210	205	1251676	3.45	history
2594	BUACEMENT	2026-02-23	219	214.5	219	214.5	4089130	4.29	history
5084	CUSTODIAN	2026-03-12	77	79	81.9	77	10785796	-2.53	history
5089	CUSTODIAN	2026-03-13	77	77	77	77	633145	0	history
5094	CUSTODIAN	2026-03-16	79	79	79	79	1610044	2.6	history
5098	CUSTODIAN	2026-03-17	77	74.55	77	74.55	2616493	-2.53	history
5104	CUSTODIAN	2026-03-18	78.5	76	78.5	75.1	2053603	1.95	history
5142	CUSTODIAN	2025-03-19	21.5	\N	\N	\N	\N	\N	chart
5148	CUSTODIAN	2025-03-20	20	\N	\N	\N	\N	-6.9767	chart
5153	CUSTODIAN	2025-03-21	20.9	\N	\N	\N	\N	4.5	chart
5158	CUSTODIAN	2025-03-24	20.9	\N	\N	\N	\N	0	chart
5164	CUSTODIAN	2025-03-25	20.9	\N	\N	\N	\N	0	chart
5171	CUSTODIAN	2025-03-26	20.9	\N	\N	\N	\N	0	chart
5179	CUSTODIAN	2025-03-27	19.5	\N	\N	\N	\N	-6.6986	chart
5185	CUSTODIAN	2025-03-28	19.5	\N	\N	\N	\N	0	chart
5191	CUSTODIAN	2025-04-02	18.4	\N	\N	\N	\N	-5.641	chart
5197	CUSTODIAN	2025-04-03	18.45	\N	\N	\N	\N	0.2717	chart
5100	OANDO	2025-07-10	54.2	\N	\N	\N	\N	0.3704	chart
5103	OANDO	2025-07-11	51.7	\N	\N	\N	\N	-4.6125	chart
5108	OANDO	2025-07-14	52.05	\N	\N	\N	\N	0.677	chart
5112	OANDO	2025-07-16	52	\N	\N	\N	\N	-0.0961	chart
5116	OANDO	2025-07-17	50.5	\N	\N	\N	\N	-2.8846	chart
5121	OANDO	2025-07-18	50.5	\N	\N	\N	\N	0	chart
5126	OANDO	2025-07-21	50	\N	\N	\N	\N	-0.9901	chart
5131	OANDO	2025-07-22	51.8	\N	\N	\N	\N	3.6	chart
5136	OANDO	2025-07-23	52.2	\N	\N	\N	\N	0.7722	chart
5141	OANDO	2025-07-24	57.4	\N	\N	\N	\N	9.9617	chart
5147	OANDO	2025-07-25	60.05	\N	\N	\N	\N	4.6167	chart
5152	OANDO	2025-07-28	61.2	\N	\N	\N	\N	1.9151	chart
5157	OANDO	2025-07-29	60.15	\N	\N	\N	\N	-1.7157	chart
5162	OANDO	2025-07-30	59.3	\N	\N	\N	\N	-1.4131	chart
5168	OANDO	2025-07-31	59	\N	\N	\N	\N	-0.5059	chart
5172	OANDO	2025-08-01	53.1	\N	\N	\N	\N	-10	chart
5177	OANDO	2025-08-04	51	\N	\N	\N	\N	-3.9548	chart
5178	OANDO	2025-08-05	53.9	\N	\N	\N	\N	5.6863	chart
5184	OANDO	2025-08-06	59	\N	\N	\N	\N	9.462	chart
5190	OANDO	2025-08-07	54	\N	\N	\N	\N	-8.4746	chart
5193	OANDO	2025-08-08	56	\N	\N	\N	\N	3.7037	chart
5198	OANDO	2025-08-11	53	\N	\N	\N	\N	-5.3571	chart
5203	OANDO	2025-08-12	52	\N	\N	\N	\N	-1.8868	chart
5206	OANDO	2025-08-13	53	\N	\N	\N	\N	1.9231	chart
5211	OANDO	2025-08-14	52.4	\N	\N	\N	\N	-1.1321	chart
3479	BETAGLAS	2025-09-18	486	486	486	486	47121	0	history
3481	BETAGLAS	2025-09-19	486	486	486	486	73330	0	history
3482	BETAGLAS	2025-09-22	486	486	486	486	33505	0	history
3484	BETAGLAS	2025-09-23	486	486	486	486	34532	0	history
3486	BETAGLAS	2025-09-24	486	486	486	486	17809	0	history
3487	BETAGLAS	2025-09-25	486	486	486	486	14365	0	history
3488	BETAGLAS	2025-09-26	486	486	486	486	38254	0	history
3489	BETAGLAS	2025-09-29	486	486	486	486	39547	0	history
3490	BETAGLAS	2025-09-30	486	486	486	486	28900	0	history
3491	BETAGLAS	2025-10-02	486	486	486	486	56400	0	history
3492	BETAGLAS	2025-10-03	486	486	486	486	18935	0	history
3493	BETAGLAS	2025-10-06	486	486	486	486	35421	0	history
3495	BETAGLAS	2025-10-07	486	486	486	486	267087	0	history
3497	BETAGLAS	2025-10-08	486	486	486	486	22575	0	history
3498	BETAGLAS	2025-10-09	486	486	486	486	57844	0	history
3499	BETAGLAS	2025-10-10	486	486	486	486	25990	0	history
3500	BETAGLAS	2025-10-13	486	486	486	486	41118	0	history
3501	BETAGLAS	2025-10-14	486	486	486	486	13556	0	history
3502	BETAGLAS	2025-10-15	486	486	486	486	14536	0	history
3503	BETAGLAS	2025-10-16	486	486	486	486	12474	0	history
3504	BETAGLAS	2025-10-17	486	486	486	486	21447	0	history
3505	BETAGLAS	2025-10-20	486	486	486	486	34727	0	history
3506	BETAGLAS	2025-10-21	486	486	486	486	76756	0	history
3507	BETAGLAS	2025-10-22	486	486	486	486	69739	0	history
3508	BETAGLAS	2025-10-23	486	486	486	486	48986	0	history
3509	BETAGLAS	2025-10-24	486	486	486	486	24483	0	history
3510	BETAGLAS	2025-10-27	486	486	486	486	55026	0	history
3511	BETAGLAS	2025-10-28	486	486	486	486	133046	0	history
3512	BETAGLAS	2025-10-29	437.4	437.4	437.4	437.4	223038	-10	history
3513	BETAGLAS	2025-10-30	437.4	437.4	437.4	437.4	109396	0	history
3514	BETAGLAS	2025-10-31	437.4	437.4	437.4	437.4	637625	0	history
3515	BETAGLAS	2025-11-03	437.4	437.4	437.4	437.4	50920	0	history
3516	BETAGLAS	2025-11-04	437.4	437.4	437.4	437.4	112194	0	history
3517	BETAGLAS	2025-11-05	393.7	393.7	393.7	393.7	218543	-9.99	history
3518	BETAGLAS	2025-11-06	393.7	393.7	393.7	393.7	228597	0	history
3519	BETAGLAS	2025-11-07	393.7	393.7	393.7	393.7	798587	0	history
3520	BETAGLAS	2025-11-10	393.7	393.7	393.7	393.7	717366	0	history
3521	BETAGLAS	2025-11-11	370	370	370	370	526193	-6.02	history
3522	BETAGLAS	2025-11-12	370	370	370	370	246949	0	history
3523	BETAGLAS	2025-11-13	370	370	370	370	509686	0	history
3524	BETAGLAS	2025-11-14	370	370	370	370	501285	0	history
3525	BETAGLAS	2025-11-17	370	370	370	370	409647	0	history
3526	BETAGLAS	2025-11-18	370	370	370	370	350994	0	history
3527	BETAGLAS	2025-11-19	370	370	370	370	214177	0	history
3528	BETAGLAS	2025-11-20	370	370	370	370	184623	0	history
3529	BETAGLAS	2025-11-21	370	370	370	370	115206	0	history
3530	BETAGLAS	2025-11-24	370	370	370	370	68478	0	history
3531	BETAGLAS	2025-11-25	370	370	370	370	59905	0	history
3532	BETAGLAS	2025-11-26	370	370	370	370	437777	0	history
3533	BETAGLAS	2025-11-27	370	370	370	370	321080	0	history
5217	OANDO	2025-08-15	52.15	\N	\N	\N	\N	-0.4771	chart
5223	OANDO	2025-08-18	50.65	\N	\N	\N	\N	-2.8763	chart
5228	OANDO	2025-08-19	47.05	\N	\N	\N	\N	-7.1076	chart
5233	OANDO	2025-08-20	48.95	\N	\N	\N	\N	4.0383	chart
5239	OANDO	2025-08-21	48.65	\N	\N	\N	\N	-0.6129	chart
5245	OANDO	2025-08-22	49	\N	\N	\N	\N	0.7194	chart
5250	OANDO	2025-08-25	50.5	\N	\N	\N	\N	3.0612	chart
3534	BETAGLAS	2025-11-28	370	370	370	370	23438	0	history
3535	BETAGLAS	2025-12-01	370	370	370	370	132943	0	history
3536	BETAGLAS	2025-12-02	370	370	370	370	34296	0	history
3537	BETAGLAS	2025-12-03	370	370	370	370	29110	0	history
3538	BETAGLAS	2025-12-04	370	370	370	370	169648	0	history
3539	BETAGLAS	2025-12-05	370	370	370	370	17368	0	history
3540	BETAGLAS	2025-12-08	370	370	370	370	460503	0	history
3541	BETAGLAS	2025-12-09	370	370	370	370	201834	0	history
3542	BETAGLAS	2025-12-10	370	370	370	370	256064	0	history
3543	BETAGLAS	2025-12-11	370	370	370	370	58295	0	history
3544	BETAGLAS	2025-12-12	370	370	370	370	21447	0	history
3545	BETAGLAS	2025-12-15	370	370	370	370	58367	0	history
3546	BETAGLAS	2025-12-16	370	370	370	370	50199	0	history
3547	BETAGLAS	2025-12-17	370	370	370	370	63437.99999999999	0	history
3548	BETAGLAS	2025-12-18	370	370	370	370	285390	0	history
3549	BETAGLAS	2025-12-19	370	370	370	370	50451	0	history
3550	BETAGLAS	2025-12-22	370	370	370	370	72387	0	history
3551	BETAGLAS	2025-12-23	370	370	370	370	641300	0	history
3552	BETAGLAS	2025-12-24	370	370	370	370	754220	0	history
3553	BETAGLAS	2025-12-29	370	370	370	370	249001	0	history
3554	BETAGLAS	2025-12-30	370	370	370	370	200254	0	history
3555	BETAGLAS	2025-12-31	370	370	370	370	1176196	0	history
3556	BETAGLAS	2026-01-02	370	370	370	370	127345	0	history
3557	BETAGLAS	2026-01-05	370	370	370	370	169113	0	history
3558	BETAGLAS	2026-01-06	380	380	380	380	305318	2.7	history
3559	BETAGLAS	2026-01-07	380	380	380	380	431736	0	history
3560	BETAGLAS	2026-01-08	380	380	380	380	545740	0	history
3561	BETAGLAS	2026-01-09	417.5	417.5	417.5	417.5	266203	9.87	history
3562	BETAGLAS	2026-01-12	417.5	417.5	417.5	417.5	302132	0	history
3563	BETAGLAS	2026-01-13	417.5	417.5	417.5	417.5	130816	0	history
3564	BETAGLAS	2026-01-14	417.5	417.5	417.5	417.5	336183	0	history
3565	BETAGLAS	2026-01-15	420	420	420	420	261062.00000000003	0.6	history
3566	BETAGLAS	2026-01-16	420	420	420	420	488019	0	history
3567	BETAGLAS	2026-01-19	420	420	420	420	160349	0	history
3568	BETAGLAS	2026-01-20	420	420	420	420	291053	0	history
3569	BETAGLAS	2026-01-21	420	420	420	420	102566	0	history
3570	BETAGLAS	2026-01-22	420	420	420	420	565831	0	history
3571	BETAGLAS	2026-01-23	420	420	420	420	319610	0	history
3572	BETAGLAS	2026-01-26	420	420	420	420	596483	0	history
3573	BETAGLAS	2026-01-27	420	420	420	420	874924	0	history
3574	BETAGLAS	2026-01-28	420	420	420	420	103058	0	history
3575	BETAGLAS	2026-01-29	420	420	420	420	43578	0	history
3576	BETAGLAS	2026-01-30	420	420	420	420	62127	0	history
3577	BETAGLAS	2026-02-02	397.7	397.7	397.7	397.7	372569	-5.31	history
3578	BETAGLAS	2026-02-03	397.7	397.7	397.7	397.7	67849	0	history
3579	BETAGLAS	2026-02-04	397.7	397.7	397.7	397.7	116952	0	history
3580	BETAGLAS	2026-02-05	397.7	397.7	397.7	397.7	181313	0	history
3581	BETAGLAS	2026-02-06	397.7	397.7	397.7	397.7	202566	0	history
3582	BETAGLAS	2026-02-09	397.7	397.7	397.7	397.7	427326	0	history
3583	BETAGLAS	2026-02-10	397.7	397.7	397.7	397.7	247144	0	history
3584	BETAGLAS	2026-02-11	397.7	397.7	397.7	397.7	297201	0	history
3585	BETAGLAS	2026-02-12	412	412	412	412	283565	3.6	history
3586	BETAGLAS	2026-02-13	412	412	412	412	259500.99999999997	0	history
3587	BETAGLAS	2026-02-16	453.2	453.2	453.2	453.2	492627	10	history
3588	BETAGLAS	2026-02-17	453.2	453.2	453.2	453.2	733650	0	history
3589	BETAGLAS	2026-02-18	498.5	498.5	498.5	498.5	579608	10	history
3590	BETAGLAS	2026-02-19	498.5	498.5	498.5	498.5	455902	0	history
3591	BETAGLAS	2026-02-20	498.5	498.5	498.5	498.5	276236	0	history
3592	BETAGLAS	2026-02-23	498.5	498.5	498.5	498.5	324409	0	history
3593	BETAGLAS	2026-02-24	498.5	498.5	498.5	498.5	281584	0	history
3594	BETAGLAS	2026-02-25	498.5	498.5	498.5	498.5	176554	0	history
3595	BETAGLAS	2026-02-26	498.5	498.5	498.5	498.5	161928	0	history
3596	BETAGLAS	2026-02-27	498.5	498.5	498.5	498.5	147358	0	history
3597	BETAGLAS	2026-03-02	498.5	498.5	498.5	498.5	185136	0	history
3598	BETAGLAS	2026-03-03	498.5	498.5	498.5	498.5	144115	0	history
3599	BETAGLAS	2026-03-04	498.5	498.5	498.5	498.5	276737	0	history
3600	BETAGLAS	2026-03-05	498.5	498.5	498.5	498.5	216106	0	history
3601	BETAGLAS	2026-03-06	498.5	498.5	498.5	498.5	135928	0	history
3602	BETAGLAS	2026-03-09	498.5	498.5	498.5	498.5	169621	0	history
3603	BETAGLAS	2026-03-10	498.5	498.5	498.5	498.5	111580	0	history
3604	BETAGLAS	2026-03-11	498.5	498.5	498.5	498.5	52631	0	history
3605	BETAGLAS	2026-03-12	498.5	498.5	498.5	498.5	169429	0	history
3606	BETAGLAS	2026-03-13	498.5	498.5	498.5	498.5	161360	0	history
3607	BETAGLAS	2026-03-16	498.5	498.5	498.5	498.5	170350	0	history
3608	BETAGLAS	2026-03-17	498.5	498.5	498.5	498.5	108414	0	history
3609	BETAGLAS	2026-03-18	498.5	498.5	498.5	498.5	75794	0	history
5204	CUSTODIAN	2025-04-04	18.45	\N	\N	\N	\N	0	chart
5210	CUSTODIAN	2025-04-07	18	\N	\N	\N	\N	-2.439	chart
5216	CUSTODIAN	2025-04-08	17	\N	\N	\N	\N	-5.5556	chart
5222	CUSTODIAN	2025-04-09	17.2	\N	\N	\N	\N	1.1765	chart
5229	CUSTODIAN	2025-04-10	17	\N	\N	\N	\N	-1.1628	chart
5236	CUSTODIAN	2025-04-11	17	\N	\N	\N	\N	0	chart
5242	CUSTODIAN	2025-04-14	17.9	\N	\N	\N	\N	5.2941	chart
5248	CUSTODIAN	2025-04-15	17.8	\N	\N	\N	\N	-0.5587	chart
5253	CUSTODIAN	2025-04-16	16.8	\N	\N	\N	\N	-5.618	chart
5258	CUSTODIAN	2025-04-17	17.9	\N	\N	\N	\N	6.5476	chart
5263	CUSTODIAN	2025-04-22	18	\N	\N	\N	\N	0.5587	chart
5268	CUSTODIAN	2025-04-23	18.1	\N	\N	\N	\N	0.5556	chart
5273	OKOMUOIL	2026-01-16	1206.5	1206.5	1206.5	1206.5	1265736	0	history
5274	CUSTODIAN	2025-04-24	18.1	\N	\N	\N	\N	0	chart
5279	OKOMUOIL	2026-01-19	1206.5	1206.5	1206.5	1206.5	108986	0	history
5280	CUSTODIAN	2025-04-25	17.2	\N	\N	\N	\N	-4.9724	chart
5285	OKOMUOIL	2026-01-20	1206.5	1206.5	1206.5	1206.5	105024	0	history
5286	CUSTODIAN	2025-04-28	18	\N	\N	\N	\N	4.6512	chart
5290	OKOMUOIL	2026-01-21	1206.5	1206.5	1206.5	1206.5	325554	0	history
5292	CUSTODIAN	2025-04-29	18	\N	\N	\N	\N	0	chart
5296	OKOMUOIL	2026-01-22	1206.5	1206.5	1206.5	1206.5	105125	0	history
5298	CUSTODIAN	2025-04-30	18	\N	\N	\N	\N	0	chart
5300	FIDSON	2025-05-08	23	\N	\N	\N	\N	0	chart
5302	OKOMUOIL	2026-01-23	1206.5	1206.5	1206.5	1206.5	66430	0	history
5304	CUSTODIAN	2025-05-02	18	\N	\N	\N	\N	0	chart
5308	FIDSON	2025-05-09	25.2	\N	\N	\N	\N	9.5652	chart
5307	OKOMUOIL	2026-01-26	1206.5	1206.5	1206.5	1206.5	147769	0	history
5310	CUSTODIAN	2025-05-05	17.15	\N	\N	\N	\N	-4.7222	chart
5312	FIDSON	2025-05-12	25.55	\N	\N	\N	\N	1.3889	chart
5313	OKOMUOIL	2026-01-27	1206.5	1206.5	1206.5	1206.5	786497	0	history
5316	CUSTODIAN	2025-05-06	17.95	\N	\N	\N	\N	4.6647	chart
5318	FIDSON	2025-05-13	27.5	\N	\N	\N	\N	7.6321	chart
5320	OKOMUOIL	2026-01-28	1206.5	1206.5	1206.5	1206.5	199034	0	history
5322	CUSTODIAN	2025-05-07	17.95	\N	\N	\N	\N	0	chart
5324	FIDSON	2025-05-14	27.1	\N	\N	\N	\N	-1.4545	chart
5325	OKOMUOIL	2026-01-29	1206.5	1206.5	1206.5	1206.5	69440	0	history
5328	CUSTODIAN	2025-05-08	17.95	\N	\N	\N	\N	0	chart
5330	FIDSON	2025-05-15	27.1	\N	\N	\N	\N	0	chart
5331	OKOMUOIL	2026-01-30	1206.5	1206.5	1206.5	1206.5	147405	0	history
5334	CUSTODIAN	2025-05-09	17.95	\N	\N	\N	\N	0	chart
5336	FIDSON	2025-05-16	27.85	\N	\N	\N	\N	2.7675	chart
5337	OKOMUOIL	2026-02-02	1206.5	1206.5	1206.5	1206.5	189154	0	history
5340	CUSTODIAN	2025-05-12	17.95	\N	\N	\N	\N	0	chart
5342	FIDSON	2025-05-19	27.85	\N	\N	\N	\N	0	chart
5343	OKOMUOIL	2026-02-03	1206.5	1206.5	1206.5	1206.5	84504	0	history
5346	CUSTODIAN	2025-05-13	18	\N	\N	\N	\N	0.2786	chart
5348	FIDSON	2025-05-20	27.85	\N	\N	\N	\N	0	chart
5349	OKOMUOIL	2026-02-04	1206.5	1206.5	1206.5	1206.5	127367	0	history
5350	MTNN	2025-11-24	465	\N	\N	\N	\N	0	chart
5351	CUSTODIAN	2025-05-14	18	\N	\N	\N	\N	0	chart
5352	OANDO	2025-09-19	47.75	\N	\N	\N	\N	-1.4448	chart
5353	FIDSON	2025-05-21	27.85	\N	\N	\N	\N	0	chart
5354	OKOMUOIL	2026-02-05	1206.5	1206.5	1206.5	1206.5	182070	0	history
5355	MTNN	2025-11-25	465	\N	\N	\N	\N	0	chart
5356	OANDO	2025-09-22	45	\N	\N	\N	\N	-5.7592	chart
5357	CUSTODIAN	2025-05-15	17.95	\N	\N	\N	\N	-0.2778	chart
5358	FIDSON	2025-05-22	27.85	\N	\N	\N	\N	0	chart
5359	MTNN	2025-11-26	465	\N	\N	\N	\N	0	chart
5360	OKOMUOIL	2026-02-06	1206.5	1206.5	1206.5	1206.5	285422	0	history
5361	OANDO	2025-09-23	45	\N	\N	\N	\N	0	chart
5362	CUSTODIAN	2025-05-16	17.95	\N	\N	\N	\N	0	chart
5363	FIDSON	2025-05-23	27.85	\N	\N	\N	\N	0	chart
5364	MTNN	2025-11-27	470	\N	\N	\N	\N	1.0753	chart
5365	OKOMUOIL	2026-02-09	1206.5	1206.5	1206.5	1206.5	638826	0	history
5366	CUSTODIAN	2025-05-19	19.45	\N	\N	\N	\N	8.3565	chart
5367	OANDO	2025-09-24	44.75	\N	\N	\N	\N	-0.5556	chart
5368	FIDSON	2025-05-26	27.85	\N	\N	\N	\N	0	chart
5369	GTCO	2025-11-14	86	\N	\N	\N	\N	-2.8249	chart
5370	MTNN	2025-11-28	470.6	\N	\N	\N	\N	0.1277	chart
5371	OKOMUOIL	2026-02-10	1206.5	1206.5	1206.5	1206.5	221104	0	history
5372	OANDO	2025-09-25	49	\N	\N	\N	\N	9.4972	chart
5373	CUSTODIAN	2025-05-20	19.6	\N	\N	\N	\N	0.7712	chart
5374	FIDSON	2025-05-27	27.85	\N	\N	\N	\N	0	chart
5375	GTCO	2025-11-17	85.5	\N	\N	\N	\N	-0.5814	chart
5376	MTNN	2025-12-01	470.6	\N	\N	\N	\N	0	chart
5377	OKOMUOIL	2026-02-11	1206.5	1206.5	1206.5	1206.5	234489	0	history
5378	OANDO	2025-09-26	49	\N	\N	\N	\N	0	chart
5379	CUSTODIAN	2025-05-21	20	\N	\N	\N	\N	2.0408	chart
5380	FIDSON	2025-05-28	27.85	\N	\N	\N	\N	0	chart
5381	GTCO	2025-11-18	85.8	\N	\N	\N	\N	0.3509	chart
5382	MTNN	2025-12-02	470.6	\N	\N	\N	\N	0	chart
5383	OKOMUOIL	2026-02-12	1206.5	1206.5	1206.5	1206.5	159770	0	history
5384	OANDO	2025-09-29	46	\N	\N	\N	\N	-6.1224	chart
5385	FIDSON	2025-05-29	27.85	\N	\N	\N	\N	0	chart
5386	CUSTODIAN	2025-05-22	21.8	\N	\N	\N	\N	9	chart
5387	GTCO	2025-11-19	84.6	\N	\N	\N	\N	-1.3986	chart
5388	MTNN	2025-12-03	470.6	\N	\N	\N	\N	0	chart
5389	OANDO	2025-09-30	46	\N	\N	\N	\N	0	chart
5394	OANDO	2025-10-02	46.15	\N	\N	\N	\N	0.3261	chart
5400	OANDO	2025-10-03	47	\N	\N	\N	\N	1.8418	chart
5405	OANDO	2025-10-06	47	\N	\N	\N	\N	0	chart
5411	OANDO	2025-10-07	45.25	\N	\N	\N	\N	-3.7234	chart
5417	OANDO	2025-10-08	44.95	\N	\N	\N	\N	-0.663	chart
5423	OANDO	2025-10-09	44.95	\N	\N	\N	\N	0	chart
5429	OANDO	2025-10-10	44.95	\N	\N	\N	\N	0	chart
5435	OANDO	2025-10-13	44.65	\N	\N	\N	\N	-0.6674	chart
5441	OANDO	2025-10-14	44.1	\N	\N	\N	\N	-1.2318	chart
5447	OANDO	2025-10-15	44.65	\N	\N	\N	\N	1.2472	chart
5453	OANDO	2025-10-16	44.65	\N	\N	\N	\N	0	chart
5459	OANDO	2025-10-17	44	\N	\N	\N	\N	-1.4558	chart
5465	OANDO	2025-10-20	45.05	\N	\N	\N	\N	2.3864	chart
5471	OANDO	2025-10-21	46.55	\N	\N	\N	\N	3.3296	chart
5477	OANDO	2025-10-22	45	\N	\N	\N	\N	-3.3298	chart
5483	OANDO	2025-10-23	42.1	\N	\N	\N	\N	-6.4444	chart
5489	OANDO	2025-10-24	42.95	\N	\N	\N	\N	2.019	chart
5495	OANDO	2025-10-27	42	\N	\N	\N	\N	-2.2119	chart
5501	OANDO	2025-10-28	42.55	\N	\N	\N	\N	1.3095	chart
5507	OANDO	2025-10-29	42.55	\N	\N	\N	\N	0	chart
5513	OANDO	2025-10-30	46.8	\N	\N	\N	\N	9.9882	chart
5519	OANDO	2025-10-31	48.05	\N	\N	\N	\N	2.6709	chart
5525	OANDO	2025-11-03	48.05	\N	\N	\N	\N	0	chart
5532	OANDO	2025-11-04	43.25	\N	\N	\N	\N	-9.9896	chart
5536	OANDO	2025-11-05	42	\N	\N	\N	\N	-2.8902	chart
5542	OANDO	2025-11-06	41.5	\N	\N	\N	\N	-1.1905	chart
5546	OANDO	2025-11-07	40	\N	\N	\N	\N	-3.6145	chart
5550	OANDO	2025-11-10	40	\N	\N	\N	\N	0	chart
5554	OANDO	2025-11-11	36	\N	\N	\N	\N	-10	chart
5560	OANDO	2025-11-12	39.6	\N	\N	\N	\N	10	chart
5564	OANDO	2025-11-13	43.55	\N	\N	\N	\N	9.9747	chart
5571	OANDO	2025-11-14	43.15	\N	\N	\N	\N	-0.9185	chart
5577	OANDO	2025-11-17	42.15	\N	\N	\N	\N	-2.3175	chart
5582	OANDO	2025-11-18	41.9	\N	\N	\N	\N	-0.5931	chart
5588	OANDO	2025-11-19	42.9	\N	\N	\N	\N	2.3866	chart
5594	OANDO	2025-11-20	40.5	\N	\N	\N	\N	-5.5944	chart
5600	OANDO	2025-11-21	40	\N	\N	\N	\N	-1.2346	chart
5606	OANDO	2025-11-24	40	\N	\N	\N	\N	0	chart
5612	OANDO	2025-11-25	39	\N	\N	\N	\N	-2.5	chart
5617	OANDO	2025-11-26	40	\N	\N	\N	\N	2.5641	chart
5623	OANDO	2025-11-27	39.95	\N	\N	\N	\N	-0.125	chart
5629	OANDO	2025-11-28	38.85	\N	\N	\N	\N	-2.7534	chart
5635	OANDO	2025-12-01	38.9	\N	\N	\N	\N	0.1287	chart
5641	OANDO	2025-12-02	39	\N	\N	\N	\N	0.2571	chart
5647	OANDO	2025-12-03	39	\N	\N	\N	\N	0	chart
5653	OANDO	2025-12-04	39.5	\N	\N	\N	\N	1.2821	chart
5659	OANDO	2025-12-05	39	\N	\N	\N	\N	-1.2658	chart
5665	OANDO	2025-12-08	39	\N	\N	\N	\N	0	chart
5671	OANDO	2025-12-09	39.85	\N	\N	\N	\N	2.1795	chart
5677	OANDO	2025-12-10	39.35	\N	\N	\N	\N	-1.2547	chart
5683	OANDO	2025-12-11	39.35	\N	\N	\N	\N	0	chart
5689	OANDO	2025-12-12	38.8	\N	\N	\N	\N	-1.3977	chart
5695	OANDO	2025-12-15	38.5	\N	\N	\N	\N	-0.7732	chart
5701	OANDO	2025-12-16	38	\N	\N	\N	\N	-1.2987	chart
5706	OANDO	2025-12-17	37.7	\N	\N	\N	\N	-0.7895	chart
5712	OANDO	2025-12-18	38	\N	\N	\N	\N	0.7958	chart
5717	OANDO	2025-12-19	38	\N	\N	\N	\N	0	chart
5721	OANDO	2025-12-22	38	\N	\N	\N	\N	0	chart
5726	OANDO	2025-12-23	37.9	\N	\N	\N	\N	-0.2632	chart
5732	OANDO	2025-12-24	38	\N	\N	\N	\N	0.2639	chart
5736	OANDO	2025-12-29	38.05	\N	\N	\N	\N	0.1316	chart
5740	OANDO	2025-12-30	40	\N	\N	\N	\N	5.1248	chart
5744	OANDO	2025-12-31	40.2	\N	\N	\N	\N	0.5	chart
5749	OANDO	2026-01-02	40.2	\N	\N	\N	\N	0	chart
5755	OANDO	2026-01-05	44.2	\N	\N	\N	\N	9.9502	chart
5761	OANDO	2026-01-06	40.8	\N	\N	\N	\N	-7.6923	chart
5765	OANDO	2026-01-07	40.7	\N	\N	\N	\N	-0.2451	chart
5771	OANDO	2026-01-08	40.75	\N	\N	\N	\N	0.1229	chart
5777	OANDO	2026-01-09	40.1	\N	\N	\N	\N	-1.5951	chart
5783	OANDO	2026-01-12	40	\N	\N	\N	\N	-0.2494	chart
5787	OANDO	2026-01-13	42.2	\N	\N	\N	\N	5.5	chart
5793	OANDO	2026-01-14	42	\N	\N	\N	\N	-0.4739	chart
5797	OANDO	2026-01-15	41.5	\N	\N	\N	\N	-1.1905	chart
5802	OANDO	2026-01-16	40.6	\N	\N	\N	\N	-2.1687	chart
5806	OANDO	2026-01-19	40.85	\N	\N	\N	\N	0.6158	chart
5809	OANDO	2026-01-20	41.9	\N	\N	\N	\N	2.5704	chart
5813	OANDO	2026-01-21	40.85	\N	\N	\N	\N	-2.506	chart
5817	OANDO	2026-01-22	40	\N	\N	\N	\N	-2.0808	chart
5822	OANDO	2026-01-23	40.35	\N	\N	\N	\N	0.875	chart
5827	OANDO	2026-01-26	40	\N	\N	\N	\N	-0.8674	chart
5831	OANDO	2026-01-27	40	\N	\N	\N	\N	0	chart
5835	OANDO	2026-01-28	39.55	\N	\N	\N	\N	-1.125	chart
5839	OANDO	2026-01-29	40.4	\N	\N	\N	\N	2.1492	chart
5843	OANDO	2026-01-30	40.5	\N	\N	\N	\N	0.2475	chart
5846	OANDO	2026-02-02	40	\N	\N	\N	\N	-1.2346	chart
5850	OANDO	2026-02-03	39.05	\N	\N	\N	\N	-2.375	chart
5853	OANDO	2026-02-04	38.9	\N	\N	\N	\N	-0.3841	chart
5854	OANDO	2026-02-05	39	\N	\N	\N	\N	0.2571	chart
5856	OANDO	2026-02-06	39.2	\N	\N	\N	\N	0.5128	chart
5858	OANDO	2026-02-09	39.85	\N	\N	\N	\N	1.6582	chart
5860	OANDO	2026-02-10	39	\N	\N	\N	\N	-2.133	chart
5862	OANDO	2026-02-11	39.05	\N	\N	\N	\N	0.1282	chart
5864	OANDO	2026-02-12	40	\N	\N	\N	\N	2.4328	chart
5866	OANDO	2026-02-13	40	\N	\N	\N	\N	0	chart
5868	OANDO	2026-02-16	44	\N	\N	\N	\N	10	chart
5870	OANDO	2026-02-17	44	\N	\N	\N	\N	0	chart
5390	FIDSON	2025-05-30	27.85	\N	\N	\N	\N	0	chart
5395	FIDSON	2025-06-02	28	\N	\N	\N	\N	0.5386	chart
5399	FIDSON	2025-06-03	30	\N	\N	\N	\N	7.1429	chart
5406	FIDSON	2025-06-04	30	\N	\N	\N	\N	0	chart
5412	FIDSON	2025-06-05	31.8	\N	\N	\N	\N	6	chart
5418	FIDSON	2025-06-10	31.8	\N	\N	\N	\N	0	chart
5424	FIDSON	2025-06-11	34.95	\N	\N	\N	\N	9.9057	chart
5430	FIDSON	2025-06-13	38.4	\N	\N	\N	\N	9.8712	chart
5436	FIDSON	2025-06-16	42.1	\N	\N	\N	\N	9.6354	chart
5442	FIDSON	2025-06-17	44.6	\N	\N	\N	\N	5.9382	chart
5448	FIDSON	2025-06-18	43	\N	\N	\N	\N	-3.5874	chart
5454	FIDSON	2025-06-19	41	\N	\N	\N	\N	-4.6512	chart
5460	FIDSON	2025-06-20	41	\N	\N	\N	\N	0	chart
5466	FIDSON	2025-06-23	40.95	\N	\N	\N	\N	-0.122	chart
5472	FIDSON	2025-06-24	43.1	\N	\N	\N	\N	5.2503	chart
5478	FIDSON	2025-06-25	44	\N	\N	\N	\N	2.0882	chart
5484	FIDSON	2025-06-26	44	\N	\N	\N	\N	0	chart
5490	FIDSON	2025-06-27	44	\N	\N	\N	\N	0	chart
5496	FIDSON	2025-06-30	44	\N	\N	\N	\N	0	chart
5502	FIDSON	2025-07-01	44	\N	\N	\N	\N	0	chart
5508	FIDSON	2025-07-02	43.8	\N	\N	\N	\N	-0.4545	chart
5514	FIDSON	2025-07-03	43.8	\N	\N	\N	\N	0	chart
5520	FIDSON	2025-07-04	43.8	\N	\N	\N	\N	0	chart
5526	FIDSON	2025-07-07	43.8	\N	\N	\N	\N	0	chart
5530	FIDSON	2025-07-08	44.05	\N	\N	\N	\N	0.5708	chart
5535	FIDSON	2025-07-09	45	\N	\N	\N	\N	2.1566	chart
5540	FIDSON	2025-07-10	46.5	\N	\N	\N	\N	3.3333	chart
5544	FIDSON	2025-07-11	47	\N	\N	\N	\N	1.0753	chart
5548	FIDSON	2025-07-14	46.1	\N	\N	\N	\N	-1.9149	chart
5552	FIDSON	2025-07-16	46.1	\N	\N	\N	\N	0	chart
5556	FIDSON	2025-07-17	46.1	\N	\N	\N	\N	0	chart
5561	FIDSON	2025-07-18	46.1	\N	\N	\N	\N	0	chart
5566	FIDSON	2025-07-21	46.1	\N	\N	\N	\N	0	chart
5572	FIDSON	2025-07-22	46.1	\N	\N	\N	\N	0	chart
5578	FIDSON	2025-07-23	43.9	\N	\N	\N	\N	-4.7722	chart
5584	FIDSON	2025-07-24	43.9	\N	\N	\N	\N	0	chart
5590	FIDSON	2025-07-25	43.9	\N	\N	\N	\N	0	chart
5595	FIDSON	2025-07-28	43.9	\N	\N	\N	\N	0	chart
5601	FIDSON	2025-07-29	43.9	\N	\N	\N	\N	0	chart
5605	FIDSON	2025-07-30	43.9	\N	\N	\N	\N	0	chart
5610	FIDSON	2025-07-31	43.9	\N	\N	\N	\N	0	chart
5616	FIDSON	2025-08-01	43.9	\N	\N	\N	\N	0	chart
5622	FIDSON	2025-08-04	43.9	\N	\N	\N	\N	0	chart
5628	FIDSON	2025-08-05	43.9	\N	\N	\N	\N	0	chart
5634	FIDSON	2025-08-06	43.9	\N	\N	\N	\N	0	chart
5640	FIDSON	2025-08-07	41.45	\N	\N	\N	\N	-5.5809	chart
5646	FIDSON	2025-08-08	41.45	\N	\N	\N	\N	0	chart
5652	FIDSON	2025-08-11	41.45	\N	\N	\N	\N	0	chart
5658	FIDSON	2025-08-12	41.45	\N	\N	\N	\N	0	chart
5663	FIDSON	2025-08-13	41.45	\N	\N	\N	\N	0	chart
5669	FIDSON	2025-08-14	41.45	\N	\N	\N	\N	0	chart
5675	FIDSON	2025-08-15	43.9	\N	\N	\N	\N	5.9107	chart
5681	FIDSON	2025-08-18	43.9	\N	\N	\N	\N	0	chart
5687	FIDSON	2025-08-19	41.8	\N	\N	\N	\N	-4.7836	chart
5693	FIDSON	2025-08-20	41.8	\N	\N	\N	\N	0	chart
5699	FIDSON	2025-08-21	41.8	\N	\N	\N	\N	0	chart
5705	FIDSON	2025-08-22	43	\N	\N	\N	\N	2.8708	chart
5710	FIDSON	2025-08-25	43	\N	\N	\N	\N	0	chart
5715	FIDSON	2025-08-26	43	\N	\N	\N	\N	0	chart
5719	FIDSON	2025-08-27	43	\N	\N	\N	\N	0	chart
5725	FIDSON	2025-08-28	43	\N	\N	\N	\N	0	chart
5730	FIDSON	2025-08-29	43	\N	\N	\N	\N	0	chart
5735	FIDSON	2025-09-01	43	\N	\N	\N	\N	0	chart
5739	FIDSON	2025-09-02	43	\N	\N	\N	\N	0	chart
5743	FIDSON	2025-09-03	43	\N	\N	\N	\N	0	chart
5748	FIDSON	2025-09-04	43	\N	\N	\N	\N	0	chart
5754	FIDSON	2025-09-08	43	\N	\N	\N	\N	0	chart
5758	FIDSON	2025-09-09	43	\N	\N	\N	\N	0	chart
5764	FIDSON	2025-09-10	43	\N	\N	\N	\N	0	chart
5770	FIDSON	2025-09-11	43	\N	\N	\N	\N	0	chart
5776	FIDSON	2025-09-12	43	\N	\N	\N	\N	0	chart
5779	FIDSON	2025-09-15	43	\N	\N	\N	\N	0	chart
5785	FIDSON	2025-09-16	43	\N	\N	\N	\N	0	chart
5791	FIDSON	2025-09-17	43	\N	\N	\N	\N	0	chart
5959	PRESCO	2025-03-19	785	\N	\N	\N	\N	\N	chart
5960	PRESCO	2025-03-20	785	\N	\N	\N	\N	0	chart
5961	PRESCO	2025-03-21	785	\N	\N	\N	\N	0	chart
5962	PRESCO	2025-03-24	785	\N	\N	\N	\N	0	chart
5963	PRESCO	2025-03-25	785	\N	\N	\N	\N	0	chart
5964	PRESCO	2025-03-26	785	\N	\N	\N	\N	0	chart
5965	PRESCO	2025-03-27	785	\N	\N	\N	\N	0	chart
5966	PRESCO	2025-03-28	785	\N	\N	\N	\N	0	chart
5967	PRESCO	2025-04-02	785	\N	\N	\N	\N	0	chart
5968	PRESCO	2025-04-03	785	\N	\N	\N	\N	0	chart
5969	PRESCO	2025-04-04	785	\N	\N	\N	\N	0	chart
5970	PRESCO	2025-04-07	785	\N	\N	\N	\N	0	chart
5971	PRESCO	2025-04-08	785	\N	\N	\N	\N	0	chart
5973	PRESCO	2025-04-09	785	\N	\N	\N	\N	0	chart
5975	PRESCO	2025-04-10	785	\N	\N	\N	\N	0	chart
5977	PRESCO	2025-04-11	785	\N	\N	\N	\N	0	chart
5979	PRESCO	2025-04-14	785	\N	\N	\N	\N	0	chart
5981	PRESCO	2025-04-15	785	\N	\N	\N	\N	0	chart
5983	PRESCO	2025-04-16	785	\N	\N	\N	\N	0	chart
5984	PRESCO	2025-04-17	785	\N	\N	\N	\N	0	chart
5986	PRESCO	2025-04-22	785	\N	\N	\N	\N	0	chart
5988	PRESCO	2025-04-23	785	\N	\N	\N	\N	0	chart
5991	PRESCO	2025-04-24	785	\N	\N	\N	\N	0	chart
5391	CUSTODIAN	2025-05-23	21.8	\N	\N	\N	\N	0	chart
5397	CUSTODIAN	2025-05-26	19.7	\N	\N	\N	\N	-9.633	chart
5402	CUSTODIAN	2025-05-27	20	\N	\N	\N	\N	1.5228	chart
5407	CUSTODIAN	2025-05-28	20.6	\N	\N	\N	\N	3	chart
5413	CUSTODIAN	2025-05-29	22.4	\N	\N	\N	\N	8.7379	chart
5419	CUSTODIAN	2025-05-30	22.4	\N	\N	\N	\N	0	chart
5425	CUSTODIAN	2025-06-02	22	\N	\N	\N	\N	-1.7857	chart
5431	CUSTODIAN	2025-06-03	22	\N	\N	\N	\N	0	chart
5437	CUSTODIAN	2025-06-04	22	\N	\N	\N	\N	0	chart
5443	CUSTODIAN	2025-06-05	22	\N	\N	\N	\N	0	chart
5449	CUSTODIAN	2025-06-10	22	\N	\N	\N	\N	0	chart
5455	CUSTODIAN	2025-06-11	23	\N	\N	\N	\N	4.5455	chart
5461	CUSTODIAN	2025-06-13	24.9	\N	\N	\N	\N	8.2609	chart
5467	CUSTODIAN	2025-06-16	24.9	\N	\N	\N	\N	0	chart
5473	CUSTODIAN	2025-06-17	22.75	\N	\N	\N	\N	-8.6345	chart
5479	CUSTODIAN	2025-06-18	24.7	\N	\N	\N	\N	8.5714	chart
5485	CUSTODIAN	2025-06-19	26	\N	\N	\N	\N	5.2632	chart
5491	CUSTODIAN	2025-06-20	25.5	\N	\N	\N	\N	-1.9231	chart
5497	CUSTODIAN	2025-06-23	25	\N	\N	\N	\N	-1.9608	chart
5503	CUSTODIAN	2025-06-24	25.05	\N	\N	\N	\N	0.2	chart
5509	CUSTODIAN	2025-06-25	25.05	\N	\N	\N	\N	0	chart
5515	CUSTODIAN	2025-06-26	25	\N	\N	\N	\N	-0.1996	chart
5521	CUSTODIAN	2025-06-27	25.05	\N	\N	\N	\N	0.2	chart
5527	CUSTODIAN	2025-06-30	27.1	\N	\N	\N	\N	8.1836	chart
5531	CUSTODIAN	2025-07-01	27.1	\N	\N	\N	\N	0	chart
5537	CUSTODIAN	2025-07-02	27.1	\N	\N	\N	\N	0	chart
5541	CUSTODIAN	2025-07-03	28.1	\N	\N	\N	\N	3.69	chart
5545	CUSTODIAN	2025-07-04	28.1	\N	\N	\N	\N	0	chart
5549	CUSTODIAN	2025-07-07	28.1	\N	\N	\N	\N	0	chart
5553	CUSTODIAN	2025-07-08	27.9	\N	\N	\N	\N	-0.7117	chart
5558	CUSTODIAN	2025-07-09	29.8	\N	\N	\N	\N	6.81	chart
5563	CUSTODIAN	2025-07-10	29.15	\N	\N	\N	\N	-2.1812	chart
5569	CUSTODIAN	2025-07-11	29	\N	\N	\N	\N	-0.5146	chart
5575	CUSTODIAN	2025-07-14	29	\N	\N	\N	\N	0	chart
5581	CUSTODIAN	2025-07-16	29	\N	\N	\N	\N	0	chart
5587	CUSTODIAN	2025-07-17	29	\N	\N	\N	\N	0	chart
5593	CUSTODIAN	2025-07-18	30	\N	\N	\N	\N	3.4483	chart
5599	CUSTODIAN	2025-07-21	30	\N	\N	\N	\N	0	chart
5604	CUSTODIAN	2025-07-22	30	\N	\N	\N	\N	0	chart
5611	CUSTODIAN	2025-07-23	30	\N	\N	\N	\N	0	chart
5618	CUSTODIAN	2025-07-24	30.5	\N	\N	\N	\N	1.6667	chart
5624	CUSTODIAN	2025-07-25	30.5	\N	\N	\N	\N	0	chart
5630	CUSTODIAN	2025-07-28	30.5	\N	\N	\N	\N	0	chart
5636	CUSTODIAN	2025-07-29	33	\N	\N	\N	\N	8.1967	chart
5642	CUSTODIAN	2025-07-30	33	\N	\N	\N	\N	0	chart
5648	CUSTODIAN	2025-07-31	36	\N	\N	\N	\N	9.0909	chart
5654	CUSTODIAN	2025-08-01	39	\N	\N	\N	\N	8.3333	chart
5660	CUSTODIAN	2025-08-04	39.15	\N	\N	\N	\N	0.3846	chart
5666	CUSTODIAN	2025-08-05	39.15	\N	\N	\N	\N	0	chart
5672	CUSTODIAN	2025-08-06	43.05	\N	\N	\N	\N	9.9617	chart
5678	CUSTODIAN	2025-08-07	44.2	\N	\N	\N	\N	2.6713	chart
5684	CUSTODIAN	2025-08-08	40.45	\N	\N	\N	\N	-8.4842	chart
5690	CUSTODIAN	2025-08-11	41.9	\N	\N	\N	\N	3.5847	chart
5696	CUSTODIAN	2025-08-12	37.9	\N	\N	\N	\N	-9.5465	chart
5702	CUSTODIAN	2025-08-13	41	\N	\N	\N	\N	8.1794	chart
5708	CUSTODIAN	2025-08-14	37.5	\N	\N	\N	\N	-8.5366	chart
5714	CUSTODIAN	2025-08-15	37.5	\N	\N	\N	\N	0	chart
5718	CUSTODIAN	2025-08-18	40.95	\N	\N	\N	\N	9.2	chart
5723	CUSTODIAN	2025-08-19	40	\N	\N	\N	\N	-2.3199	chart
5729	CUSTODIAN	2025-08-20	38.05	\N	\N	\N	\N	-4.875	chart
5734	CUSTODIAN	2025-08-21	39.9	\N	\N	\N	\N	4.862	chart
5738	CUSTODIAN	2025-08-22	40.75	\N	\N	\N	\N	2.1303	chart
5742	CUSTODIAN	2025-08-25	40.75	\N	\N	\N	\N	0	chart
5747	CUSTODIAN	2025-08-26	40.75	\N	\N	\N	\N	0	chart
5751	CUSTODIAN	2025-08-27	40.75	\N	\N	\N	\N	0	chart
5757	CUSTODIAN	2025-08-28	40.75	\N	\N	\N	\N	0	chart
5763	CUSTODIAN	2025-08-29	40.75	\N	\N	\N	\N	0	chart
5769	CUSTODIAN	2025-09-01	40.75	\N	\N	\N	\N	0	chart
5775	CUSTODIAN	2025-09-02	40.75	\N	\N	\N	\N	0	chart
5780	CUSTODIAN	2025-09-03	40.75	\N	\N	\N	\N	0	chart
5786	CUSTODIAN	2025-09-04	40.75	\N	\N	\N	\N	0	chart
5792	CUSTODIAN	2025-09-08	40.75	\N	\N	\N	\N	0	chart
5796	CUSTODIAN	2025-09-09	40.75	\N	\N	\N	\N	0	chart
5800	CUSTODIAN	2025-09-10	40.75	\N	\N	\N	\N	0	chart
5805	CUSTODIAN	2025-09-11	40.75	\N	\N	\N	\N	0	chart
5808	CUSTODIAN	2025-09-12	40.75	\N	\N	\N	\N	0	chart
5812	CUSTODIAN	2025-09-15	40.75	\N	\N	\N	\N	0	chart
5818	CUSTODIAN	2025-09-16	44.8	\N	\N	\N	\N	9.9387	chart
5823	CUSTODIAN	2025-09-17	44.15	\N	\N	\N	\N	-1.4509	chart
5972	SEPLAT	2025-03-19	5700	\N	\N	\N	\N	\N	chart
5974	SEPLAT	2025-03-20	5700	\N	\N	\N	\N	0	chart
5976	SEPLAT	2025-03-21	5700	\N	\N	\N	\N	0	chart
5978	SEPLAT	2025-03-24	5700	\N	\N	\N	\N	0	chart
5980	SEPLAT	2025-03-25	5700	\N	\N	\N	\N	0	chart
5982	SEPLAT	2025-03-26	5700	\N	\N	\N	\N	0	chart
5985	SEPLAT	2025-03-27	5700	\N	\N	\N	\N	0	chart
5987	SEPLAT	2025-03-28	5700	\N	\N	\N	\N	0	chart
5989	SEPLAT	2025-04-02	5700	\N	\N	\N	\N	0	chart
5990	SEPLAT	2025-04-03	5700	\N	\N	\N	\N	0	chart
5392	GTCO	2025-11-20	84	\N	\N	\N	\N	-0.7092	chart
5398	GTCO	2025-11-21	84.5	\N	\N	\N	\N	0.5952	chart
5403	GTCO	2025-11-24	84.8	\N	\N	\N	\N	0.355	chart
5409	GTCO	2025-11-25	86	\N	\N	\N	\N	1.4151	chart
5414	GTCO	2025-11-26	86	\N	\N	\N	\N	0	chart
5420	GTCO	2025-11-27	86.1	\N	\N	\N	\N	0.1163	chart
5426	GTCO	2025-11-28	86.4	\N	\N	\N	\N	0.3484	chart
5432	GTCO	2025-12-01	86.4	\N	\N	\N	\N	0	chart
5438	GTCO	2025-12-02	86.4	\N	\N	\N	\N	0	chart
5444	GTCO	2025-12-03	87	\N	\N	\N	\N	0.6944	chart
5450	GTCO	2025-12-04	88	\N	\N	\N	\N	1.1494	chart
5457	GTCO	2025-12-05	89	\N	\N	\N	\N	1.1364	chart
5463	GTCO	2025-12-08	90.05	\N	\N	\N	\N	1.1798	chart
5469	GTCO	2025-12-09	91	\N	\N	\N	\N	1.055	chart
5475	GTCO	2025-12-10	91.25	\N	\N	\N	\N	0.2747	chart
5481	GTCO	2025-12-11	90.85	\N	\N	\N	\N	-0.4384	chart
5488	GTCO	2025-12-12	89.9	\N	\N	\N	\N	-1.0457	chart
5494	GTCO	2025-12-15	89.9	\N	\N	\N	\N	0	chart
5500	GTCO	2025-12-16	88	\N	\N	\N	\N	-2.1135	chart
5506	GTCO	2025-12-17	88.4	\N	\N	\N	\N	0.4545	chart
5512	GTCO	2025-12-18	88.1	\N	\N	\N	\N	-0.3394	chart
5518	GTCO	2025-12-19	88.1	\N	\N	\N	\N	0	chart
5524	GTCO	2025-12-22	88.1	\N	\N	\N	\N	0	chart
5529	GTCO	2025-12-23	88	\N	\N	\N	\N	-0.1135	chart
5538	GTCO	2025-12-24	88.65	\N	\N	\N	\N	0.7386	chart
5557	GTCO	2025-12-29	89.55	\N	\N	\N	\N	1.0152	chart
5562	GTCO	2025-12-30	91	\N	\N	\N	\N	1.6192	chart
5567	GTCO	2025-12-31	90.7	\N	\N	\N	\N	-0.3297	chart
5573	GTCO	2026-01-02	92.3	\N	\N	\N	\N	1.7641	chart
5579	GTCO	2026-01-05	97	\N	\N	\N	\N	5.0921	chart
5585	GTCO	2026-01-06	99.95	\N	\N	\N	\N	3.0412	chart
5591	GTCO	2026-01-07	99	\N	\N	\N	\N	-0.9505	chart
5597	GTCO	2026-01-08	99	\N	\N	\N	\N	0	chart
5603	GTCO	2026-01-09	99.2	\N	\N	\N	\N	0.202	chart
5608	GTCO	2026-01-12	99.45	\N	\N	\N	\N	0.252	chart
5614	GTCO	2026-01-13	99.5	\N	\N	\N	\N	0.0503	chart
5620	GTCO	2026-01-14	99	\N	\N	\N	\N	-0.5025	chart
5626	GTCO	2026-01-15	98.9	\N	\N	\N	\N	-0.101	chart
5632	GTCO	2026-01-16	98.95	\N	\N	\N	\N	0.0506	chart
5638	GTCO	2026-01-19	97.4	\N	\N	\N	\N	-1.5664	chart
5644	GTCO	2026-01-20	95	\N	\N	\N	\N	-2.4641	chart
5650	GTCO	2026-01-21	94.95	\N	\N	\N	\N	-0.0526	chart
5656	GTCO	2026-01-22	95.6	\N	\N	\N	\N	0.6846	chart
5662	GTCO	2026-01-23	98.5	\N	\N	\N	\N	3.0335	chart
5668	GTCO	2026-01-26	98.5	\N	\N	\N	\N	0	chart
5674	GTCO	2026-01-27	98.5	\N	\N	\N	\N	0	chart
5680	GTCO	2026-01-28	99	\N	\N	\N	\N	0.5076	chart
5686	GTCO	2026-01-29	98.85	\N	\N	\N	\N	-0.1515	chart
5692	GTCO	2026-01-30	99	\N	\N	\N	\N	0.1517	chart
5698	GTCO	2026-02-02	98.8	\N	\N	\N	\N	-0.202	chart
5704	GTCO	2026-02-03	99.5	\N	\N	\N	\N	0.7085	chart
5711	GTCO	2026-02-04	99.8	\N	\N	\N	\N	0.3015	chart
5716	GTCO	2026-02-05	100	\N	\N	\N	\N	0.2004	chart
5720	GTCO	2026-02-06	100.25	\N	\N	\N	\N	0.25	chart
5727	GTCO	2026-02-09	100.2	\N	\N	\N	\N	-0.0499	chart
5733	GTCO	2026-02-10	101	\N	\N	\N	\N	0.7984	chart
5737	GTCO	2026-02-11	106	\N	\N	\N	\N	4.9505	chart
5741	GTCO	2026-02-12	107	\N	\N	\N	\N	0.9434	chart
5745	GTCO	2026-02-13	112	\N	\N	\N	\N	4.6729	chart
5750	GTCO	2026-02-16	120	\N	\N	\N	\N	7.1429	chart
5756	GTCO	2026-02-17	117.2	\N	\N	\N	\N	-2.3333	chart
5762	GTCO	2026-02-18	115.95	\N	\N	\N	\N	-1.0666	chart
5766	GTCO	2026-02-19	117	\N	\N	\N	\N	0.9056	chart
5772	GTCO	2026-02-20	118	\N	\N	\N	\N	0.8547	chart
5778	GTCO	2026-02-23	120	\N	\N	\N	\N	1.6949	chart
5784	GTCO	2026-02-24	120	\N	\N	\N	\N	0	chart
5789	GTCO	2026-02-25	118	\N	\N	\N	\N	-1.6667	chart
5794	GTCO	2026-02-26	117.1	\N	\N	\N	\N	-0.7627	chart
5799	GTCO	2026-02-27	117	\N	\N	\N	\N	-0.0854	chart
5804	GTCO	2026-03-02	117.95	\N	\N	\N	\N	0.812	chart
5807	GTCO	2026-03-03	118.9	\N	\N	\N	\N	0.8054	chart
5810	GTCO	2026-03-04	119	\N	\N	\N	\N	0.0841	chart
5814	GTCO	2026-03-05	119	\N	\N	\N	\N	0	chart
5819	GTCO	2026-03-06	119	\N	\N	\N	\N	0	chart
5824	GTCO	2026-03-09	118	\N	\N	\N	\N	-0.8403	chart
5828	GTCO	2026-03-10	117	\N	\N	\N	\N	-0.8475	chart
5832	GTCO	2026-03-11	118	\N	\N	\N	\N	0.8547	chart
5836	GTCO	2026-03-12	117.45	\N	\N	\N	\N	-0.4661	chart
5840	GTCO	2026-03-13	117.5	\N	\N	\N	\N	0.0426	chart
5844	GTCO	2026-03-16	118.15	\N	\N	\N	\N	0.5532	chart
5848	GTCO	2026-03-17	123.5	\N	\N	\N	\N	4.5281	chart
5851	GTCO	2026-03-18	114.35	\N	\N	\N	\N	-7.4089	chart
5992	SEPLAT	2025-04-04	5700	\N	\N	\N	\N	0	chart
5994	SEPLAT	2025-04-07	5700	\N	\N	\N	\N	0	chart
5996	SEPLAT	2025-04-08	5700	\N	\N	\N	\N	0	chart
5998	SEPLAT	2025-04-09	5700	\N	\N	\N	\N	0	chart
6000	SEPLAT	2025-04-10	5700	\N	\N	\N	\N	0	chart
6002	SEPLAT	2025-04-11	5700	\N	\N	\N	\N	0	chart
6005	SEPLAT	2025-04-14	5700	\N	\N	\N	\N	0	chart
6006	SEPLAT	2025-04-15	5700	\N	\N	\N	\N	0	chart
6008	SEPLAT	2025-04-16	5700	\N	\N	\N	\N	0	chart
6010	SEPLAT	2025-04-17	5700	\N	\N	\N	\N	0	chart
6012	SEPLAT	2025-04-22	5700	\N	\N	\N	\N	0	chart
6014	SEPLAT	2025-04-23	5700	\N	\N	\N	\N	0	chart
6016	SEPLAT	2025-04-24	5700	\N	\N	\N	\N	0	chart
6018	SEPLAT	2025-04-25	5700	\N	\N	\N	\N	0	chart
6020	SEPLAT	2025-04-28	5700	\N	\N	\N	\N	0	chart
5393	OKOMUOIL	2026-02-13	1327	1327	1327	1327	276080	9.99	history
5401	OKOMUOIL	2026-02-16	1327	1327	1327	1327	516648	0	history
5408	OKOMUOIL	2026-02-17	1327	1327	1327	1327	407714	0	history
5415	OKOMUOIL	2026-02-18	1327	1327	1327	1327	152563	0	history
5421	OKOMUOIL	2026-02-19	1459.7	1459.7	1459.7	1459.7	184045	10	history
5427	OKOMUOIL	2026-02-20	1459.7	1459.7	1459.7	1459.7	348290	0	history
5433	OKOMUOIL	2026-02-23	1605.6	1605.6	1605.6	1605.6	166234	10	history
5439	OKOMUOIL	2026-02-24	1605.6	1605.6	1605.6	1605.6	571564	0	history
5445	OKOMUOIL	2026-02-25	1765	1765	1765	1765	1232814	9.93	history
5451	OKOMUOIL	2026-02-26	1765	1765	1765	1765	1031162	0	history
5456	OKOMUOIL	2026-02-27	1765	1765	1765	1765	175706	0	history
5462	OKOMUOIL	2026-03-02	1765	1765	1765	1765	241292	0	history
5468	OKOMUOIL	2026-03-03	1765	1765	1765	1765	210560	0	history
5474	OKOMUOIL	2026-03-04	1765	1765	1765	1765	184477	0	history
5482	OKOMUOIL	2026-03-05	1765	1765	1765	1765	105626	0	history
5486	OKOMUOIL	2026-03-06	1765	1765	1765	1765	1440600	0	history
5493	OKOMUOIL	2026-03-09	1765	1765	1765	1765	1272986	0	history
5499	OKOMUOIL	2026-03-10	1765	1765	1765	1765	163107	0	history
5505	OKOMUOIL	2026-03-11	1765	1765	1765	1765	234366	0	history
5511	OKOMUOIL	2026-03-12	1765	1765	1765	1765	99285	0	history
5517	OKOMUOIL	2026-03-13	1765	1765	1765	1765	53183	0	history
5523	OKOMUOIL	2026-03-16	1765	1765	1765	1765	77223	0	history
5528	OKOMUOIL	2026-03-17	1765	1765	1765	1765	216255	0	history
5533	OKOMUOIL	2026-03-18	1765	1765	1765	1765	158726	0	history
5568	OKOMUOIL	2025-03-19	545.2	\N	\N	\N	\N	\N	chart
5574	OKOMUOIL	2025-03-20	545.2	\N	\N	\N	\N	0	chart
5580	OKOMUOIL	2025-03-21	545.2	\N	\N	\N	\N	0	chart
5586	OKOMUOIL	2025-03-24	545.2	\N	\N	\N	\N	0	chart
5592	OKOMUOIL	2025-03-25	545.2	\N	\N	\N	\N	0	chart
5598	OKOMUOIL	2025-03-26	545.2	\N	\N	\N	\N	0	chart
5609	OKOMUOIL	2025-03-27	545.2	\N	\N	\N	\N	0	chart
5615	OKOMUOIL	2025-03-28	545.2	\N	\N	\N	\N	0	chart
5621	OKOMUOIL	2025-04-02	545.2	\N	\N	\N	\N	0	chart
5627	OKOMUOIL	2025-04-03	545.2	\N	\N	\N	\N	0	chart
5633	OKOMUOIL	2025-04-04	545.2	\N	\N	\N	\N	0	chart
5639	OKOMUOIL	2025-04-07	545.2	\N	\N	\N	\N	0	chart
5645	OKOMUOIL	2025-04-08	545.2	\N	\N	\N	\N	0	chart
5651	OKOMUOIL	2025-04-09	545.2	\N	\N	\N	\N	0	chart
5657	OKOMUOIL	2025-04-10	545.2	\N	\N	\N	\N	0	chart
5664	OKOMUOIL	2025-04-11	545.2	\N	\N	\N	\N	0	chart
5670	OKOMUOIL	2025-04-14	545.2	\N	\N	\N	\N	0	chart
5676	OKOMUOIL	2025-04-15	545.2	\N	\N	\N	\N	0	chart
5682	OKOMUOIL	2025-04-16	545.2	\N	\N	\N	\N	0	chart
5688	OKOMUOIL	2025-04-17	545.2	\N	\N	\N	\N	0	chart
5694	OKOMUOIL	2025-04-22	545.2	\N	\N	\N	\N	0	chart
5700	OKOMUOIL	2025-04-23	545.2	\N	\N	\N	\N	0	chart
5707	OKOMUOIL	2025-04-24	545.2	\N	\N	\N	\N	0	chart
5713	OKOMUOIL	2025-04-25	524.7	\N	\N	\N	\N	-3.7601	chart
5722	OKOMUOIL	2025-04-28	524.7	\N	\N	\N	\N	0	chart
5728	OKOMUOIL	2025-04-29	524.7	\N	\N	\N	\N	0	chart
5746	OKOMUOIL	2025-04-30	524.7	\N	\N	\N	\N	0	chart
5753	OKOMUOIL	2025-05-02	524.7	\N	\N	\N	\N	0	chart
5760	OKOMUOIL	2025-05-05	524.7	\N	\N	\N	\N	0	chart
5768	OKOMUOIL	2025-05-06	568	\N	\N	\N	\N	8.2523	chart
5774	OKOMUOIL	2025-05-07	555	\N	\N	\N	\N	-2.2887	chart
5782	OKOMUOIL	2025-05-08	555	\N	\N	\N	\N	0	chart
5790	OKOMUOIL	2025-05-09	555	\N	\N	\N	\N	0	chart
5798	OKOMUOIL	2025-05-12	555	\N	\N	\N	\N	0	chart
5803	OKOMUOIL	2025-05-13	555	\N	\N	\N	\N	0	chart
5811	OKOMUOIL	2025-05-14	555	\N	\N	\N	\N	0	chart
5815	OKOMUOIL	2025-05-15	574	\N	\N	\N	\N	3.4234	chart
5821	OKOMUOIL	2025-05-16	574	\N	\N	\N	\N	0	chart
5825	OKOMUOIL	2025-05-19	590	\N	\N	\N	\N	2.7875	chart
5829	OKOMUOIL	2025-05-20	590	\N	\N	\N	\N	0	chart
5833	OKOMUOIL	2025-05-21	590	\N	\N	\N	\N	0	chart
5838	OKOMUOIL	2025-05-22	600	\N	\N	\N	\N	1.6949	chart
5842	OKOMUOIL	2025-05-23	600	\N	\N	\N	\N	0	chart
5845	OKOMUOIL	2025-05-26	600	\N	\N	\N	\N	0	chart
5849	OKOMUOIL	2025-05-27	620	\N	\N	\N	\N	3.3333	chart
5852	OKOMUOIL	2025-05-28	640	\N	\N	\N	\N	3.2258	chart
5855	OKOMUOIL	2025-05-29	650	\N	\N	\N	\N	1.5625	chart
5857	OKOMUOIL	2025-05-30	650	\N	\N	\N	\N	0	chart
5859	OKOMUOIL	2025-06-02	650	\N	\N	\N	\N	0	chart
5861	OKOMUOIL	2025-06-03	650	\N	\N	\N	\N	0	chart
5863	OKOMUOIL	2025-06-04	650	\N	\N	\N	\N	0	chart
5865	OKOMUOIL	2025-06-05	650	\N	\N	\N	\N	0	chart
5867	OKOMUOIL	2025-06-10	650	\N	\N	\N	\N	0	chart
5869	OKOMUOIL	2025-06-11	650	\N	\N	\N	\N	0	chart
5871	OKOMUOIL	2025-06-13	650	\N	\N	\N	\N	0	chart
5873	OKOMUOIL	2025-06-16	650	\N	\N	\N	\N	0	chart
5875	OKOMUOIL	2025-06-17	650	\N	\N	\N	\N	0	chart
5877	OKOMUOIL	2025-06-18	650	\N	\N	\N	\N	0	chart
5879	OKOMUOIL	2025-06-19	650	\N	\N	\N	\N	0	chart
5881	OKOMUOIL	2025-06-20	680	\N	\N	\N	\N	4.6154	chart
5883	OKOMUOIL	2025-06-23	680	\N	\N	\N	\N	0	chart
5886	OKOMUOIL	2025-06-24	748	\N	\N	\N	\N	10	chart
5888	OKOMUOIL	2025-06-25	790	\N	\N	\N	\N	5.615	chart
5890	OKOMUOIL	2025-06-26	790	\N	\N	\N	\N	0	chart
5892	OKOMUOIL	2025-06-27	790	\N	\N	\N	\N	0	chart
5894	OKOMUOIL	2025-06-30	790	\N	\N	\N	\N	0	chart
5396	MTNN	2025-12-04	470.6	\N	\N	\N	\N	0	chart
5404	MTNN	2025-12-05	470.6	\N	\N	\N	\N	0	chart
5410	MTNN	2025-12-08	472.5	\N	\N	\N	\N	0.4037	chart
5416	MTNN	2025-12-09	472.5	\N	\N	\N	\N	0	chart
5422	MTNN	2025-12-10	472.5	\N	\N	\N	\N	0	chart
5428	MTNN	2025-12-11	495.7	\N	\N	\N	\N	4.9101	chart
5434	MTNN	2025-12-12	531.7	\N	\N	\N	\N	7.2625	chart
5440	MTNN	2025-12-15	531.7	\N	\N	\N	\N	0	chart
5446	MTNN	2025-12-16	531.7	\N	\N	\N	\N	0	chart
5452	MTNN	2025-12-17	531.7	\N	\N	\N	\N	0	chart
5458	MTNN	2025-12-18	531.7	\N	\N	\N	\N	0	chart
5464	MTNN	2025-12-19	531.7	\N	\N	\N	\N	0	chart
5470	MTNN	2025-12-22	531.7	\N	\N	\N	\N	0	chart
5476	MTNN	2025-12-23	531.7	\N	\N	\N	\N	0	chart
5480	MTNN	2025-12-24	504	\N	\N	\N	\N	-5.2097	chart
5487	MTNN	2025-12-29	506.9	\N	\N	\N	\N	0.5754	chart
5492	MTNN	2025-12-30	506.9	\N	\N	\N	\N	0	chart
5498	MTNN	2025-12-31	511	\N	\N	\N	\N	0.8088	chart
5504	MTNN	2026-01-02	511	\N	\N	\N	\N	0	chart
5510	MTNN	2026-01-05	511	\N	\N	\N	\N	0	chart
5516	MTNN	2026-01-06	511	\N	\N	\N	\N	0	chart
5522	MTNN	2026-01-07	511	\N	\N	\N	\N	0	chart
5534	MTNN	2026-01-08	511	\N	\N	\N	\N	0	chart
5539	MTNN	2026-01-09	550	\N	\N	\N	\N	7.6321	chart
5543	MTNN	2026-01-12	550	\N	\N	\N	\N	0	chart
5547	MTNN	2026-01-13	605	\N	\N	\N	\N	10	chart
5551	MTNN	2026-01-14	605	\N	\N	\N	\N	0	chart
5555	MTNN	2026-01-15	580	\N	\N	\N	\N	-4.1322	chart
5559	MTNN	2026-01-16	580	\N	\N	\N	\N	0	chart
5565	MTNN	2026-01-19	580	\N	\N	\N	\N	0	chart
5570	MTNN	2026-01-20	580	\N	\N	\N	\N	0	chart
5576	MTNN	2026-01-21	580	\N	\N	\N	\N	0	chart
5583	MTNN	2026-01-22	580	\N	\N	\N	\N	0	chart
5589	MTNN	2026-01-23	580	\N	\N	\N	\N	0	chart
5596	MTNN	2026-01-26	580	\N	\N	\N	\N	0	chart
5602	MTNN	2026-01-27	580	\N	\N	\N	\N	0	chart
5607	MTNN	2026-01-28	572	\N	\N	\N	\N	-1.3793	chart
5613	MTNN	2026-01-29	572	\N	\N	\N	\N	0	chart
5619	MTNN	2026-01-30	572	\N	\N	\N	\N	0	chart
5625	MTNN	2026-02-02	572	\N	\N	\N	\N	0	chart
5631	MTNN	2026-02-03	572	\N	\N	\N	\N	0	chart
5637	MTNN	2026-02-04	588.5	\N	\N	\N	\N	2.8846	chart
5643	MTNN	2026-02-05	610	\N	\N	\N	\N	3.6534	chart
5649	MTNN	2026-02-06	620.1	\N	\N	\N	\N	1.6557	chart
5655	MTNN	2026-02-09	620	\N	\N	\N	\N	-0.0161	chart
5661	MTNN	2026-02-10	643	\N	\N	\N	\N	3.7097	chart
5667	MTNN	2026-02-11	650	\N	\N	\N	\N	1.0886	chart
5673	MTNN	2026-02-12	653	\N	\N	\N	\N	0.4615	chart
5679	MTNN	2026-02-13	708.9	\N	\N	\N	\N	8.5605	chart
5685	MTNN	2026-02-16	779.7	\N	\N	\N	\N	9.9873	chart
5691	MTNN	2026-02-17	750	\N	\N	\N	\N	-3.8092	chart
5697	MTNN	2026-02-18	750	\N	\N	\N	\N	0	chart
5703	MTNN	2026-02-19	780	\N	\N	\N	\N	4	chart
5709	MTNN	2026-02-20	780	\N	\N	\N	\N	0	chart
5724	MTNN	2026-02-23	780	\N	\N	\N	\N	0	chart
5731	MTNN	2026-02-24	760	\N	\N	\N	\N	-2.5641	chart
5752	MTNN	2026-02-25	760	\N	\N	\N	\N	0	chart
5759	MTNN	2026-02-26	760	\N	\N	\N	\N	0	chart
5767	MTNN	2026-02-27	760	\N	\N	\N	\N	0	chart
5773	MTNN	2026-03-02	783	\N	\N	\N	\N	3.0263	chart
5781	MTNN	2026-03-03	780	\N	\N	\N	\N	-0.3831	chart
5788	MTNN	2026-03-04	790	\N	\N	\N	\N	1.2821	chart
5795	MTNN	2026-03-05	795	\N	\N	\N	\N	0.6329	chart
5801	MTNN	2026-03-06	790	\N	\N	\N	\N	-0.6289	chart
5816	MTNN	2026-03-09	790	\N	\N	\N	\N	0	chart
5820	MTNN	2026-03-10	773	\N	\N	\N	\N	-2.1519	chart
5826	MTNN	2026-03-11	773	\N	\N	\N	\N	0	chart
5830	MTNN	2026-03-12	777.9	\N	\N	\N	\N	0.6339	chart
5834	MTNN	2026-03-13	779.1	\N	\N	\N	\N	0.1543	chart
5837	MTNN	2026-03-16	798	\N	\N	\N	\N	2.4259	chart
5841	MTNN	2026-03-17	760	\N	\N	\N	\N	-4.7619	chart
5847	MTNN	2026-03-18	758	\N	\N	\N	\N	-0.2632	chart
5993	PRESCO	2025-04-25	785	\N	\N	\N	\N	0	chart
5995	PRESCO	2025-04-28	785	\N	\N	\N	\N	0	chart
5997	PRESCO	2025-04-29	785	\N	\N	\N	\N	0	chart
5999	PRESCO	2025-04-30	785	\N	\N	\N	\N	0	chart
6001	PRESCO	2025-05-02	860	\N	\N	\N	\N	9.5541	chart
6003	PRESCO	2025-05-05	880.6	\N	\N	\N	\N	2.3953	chart
6004	PRESCO	2025-05-06	870	\N	\N	\N	\N	-1.2037	chart
6007	PRESCO	2025-05-07	850.2	\N	\N	\N	\N	-2.2759	chart
6009	PRESCO	2025-05-08	850.2	\N	\N	\N	\N	0	chart
6011	PRESCO	2025-05-09	880	\N	\N	\N	\N	3.5051	chart
6013	PRESCO	2025-05-12	880	\N	\N	\N	\N	0	chart
6015	PRESCO	2025-05-13	880	\N	\N	\N	\N	0	chart
6017	PRESCO	2025-05-14	880	\N	\N	\N	\N	0	chart
6019	PRESCO	2025-05-15	880	\N	\N	\N	\N	0	chart
6021	PRESCO	2025-05-16	880	\N	\N	\N	\N	0	chart
6023	PRESCO	2025-05-19	880	\N	\N	\N	\N	0	chart
6025	PRESCO	2025-05-20	880	\N	\N	\N	\N	0	chart
6027	PRESCO	2025-05-21	880	\N	\N	\N	\N	0	chart
6029	PRESCO	2025-05-22	880	\N	\N	\N	\N	0	chart
6031	PRESCO	2025-05-23	950	\N	\N	\N	\N	7.9545	chart
6033	PRESCO	2025-05-26	950	\N	\N	\N	\N	0	chart
6035	PRESCO	2025-05-27	950	\N	\N	\N	\N	0	chart
6037	PRESCO	2025-05-28	900	\N	\N	\N	\N	-5.2632	chart
6039	PRESCO	2025-05-29	940	\N	\N	\N	\N	4.4444	chart
6041	PRESCO	2025-05-30	940	\N	\N	\N	\N	0	chart
5872	OANDO	2026-02-18	43.4	\N	\N	\N	\N	-1.3636	chart
5874	OANDO	2026-02-19	42	\N	\N	\N	\N	-3.2258	chart
5876	OANDO	2026-02-20	42	\N	\N	\N	\N	0	chart
5878	OANDO	2026-02-23	40	\N	\N	\N	\N	-4.7619	chart
5880	OANDO	2026-02-24	41.9	\N	\N	\N	\N	4.75	chart
5882	OANDO	2026-02-25	40.1	\N	\N	\N	\N	-4.2959	chart
5884	OANDO	2026-02-26	40.8	\N	\N	\N	\N	1.7456	chart
5885	OANDO	2026-02-27	41.8	\N	\N	\N	\N	2.451	chart
5887	OANDO	2026-03-02	45.7	\N	\N	\N	\N	9.3301	chart
5889	OANDO	2026-03-03	50.25	\N	\N	\N	\N	9.9562	chart
5891	OANDO	2026-03-04	50	\N	\N	\N	\N	-0.4975	chart
5893	OANDO	2026-03-05	48	\N	\N	\N	\N	-4	chart
5895	OANDO	2026-03-06	49.7	\N	\N	\N	\N	3.5417	chart
5897	OANDO	2026-03-09	54.65	\N	\N	\N	\N	9.9598	chart
5899	OANDO	2026-03-10	50.5	\N	\N	\N	\N	-7.5938	chart
5901	OANDO	2026-03-11	50.2	\N	\N	\N	\N	-0.5941	chart
5903	OANDO	2026-03-12	48.05	\N	\N	\N	\N	-4.2829	chart
5905	OANDO	2026-03-13	48.85	\N	\N	\N	\N	1.6649	chart
5907	OANDO	2026-03-16	48.1	\N	\N	\N	\N	-1.5353	chart
5909	OANDO	2026-03-17	47	\N	\N	\N	\N	-2.2869	chart
5911	OANDO	2026-03-18	47.15	\N	\N	\N	\N	0.3191	chart
6022	SEPLAT	2025-04-29	5700	\N	\N	\N	\N	0	chart
6024	SEPLAT	2025-04-30	5700	\N	\N	\N	\N	0	chart
6026	SEPLAT	2025-05-02	5700	\N	\N	\N	\N	0	chart
6028	SEPLAT	2025-05-05	5700	\N	\N	\N	\N	0	chart
6030	SEPLAT	2025-05-06	5700	\N	\N	\N	\N	0	chart
6032	SEPLAT	2025-05-07	5700	\N	\N	\N	\N	0	chart
6034	SEPLAT	2025-05-08	5700	\N	\N	\N	\N	0	chart
6036	SEPLAT	2025-05-09	5700	\N	\N	\N	\N	0	chart
6038	SEPLAT	2025-05-12	5588.9	\N	\N	\N	\N	-1.9491	chart
6040	SEPLAT	2025-05-13	5588.9	\N	\N	\N	\N	0	chart
6042	SEPLAT	2025-05-14	5588.9	\N	\N	\N	\N	0	chart
6044	SEPLAT	2025-05-15	5588.9	\N	\N	\N	\N	0	chart
6046	SEPLAT	2025-05-16	5588.9	\N	\N	\N	\N	0	chart
6048	SEPLAT	2025-05-19	5588.9	\N	\N	\N	\N	0	chart
6050	SEPLAT	2025-05-20	5588.9	\N	\N	\N	\N	0	chart
6052	SEPLAT	2025-05-21	5588.9	\N	\N	\N	\N	0	chart
6054	SEPLAT	2025-05-22	5588.9	\N	\N	\N	\N	0	chart
6056	SEPLAT	2025-05-23	5588.9	\N	\N	\N	\N	0	chart
6058	SEPLAT	2025-05-26	5516	\N	\N	\N	\N	-1.3044	chart
6060	SEPLAT	2025-05-27	5516	\N	\N	\N	\N	0	chart
6062	SEPLAT	2025-05-28	5516	\N	\N	\N	\N	0	chart
6064	SEPLAT	2025-05-29	4964.4	\N	\N	\N	\N	-10	chart
6066	SEPLAT	2025-05-30	4964.4	\N	\N	\N	\N	0	chart
6068	SEPLAT	2025-06-02	4964.4	\N	\N	\N	\N	0	chart
6070	SEPLAT	2025-06-03	4964.4	\N	\N	\N	\N	0	chart
6072	SEPLAT	2025-06-04	4964.4	\N	\N	\N	\N	0	chart
6074	SEPLAT	2025-06-05	4964.4	\N	\N	\N	\N	0	chart
6076	SEPLAT	2025-06-10	4964.4	\N	\N	\N	\N	0	chart
6078	SEPLAT	2025-06-11	4964.4	\N	\N	\N	\N	0	chart
6080	SEPLAT	2025-06-13	4964.4	\N	\N	\N	\N	0	chart
6082	SEPLAT	2025-06-16	4964.4	\N	\N	\N	\N	0	chart
6084	SEPLAT	2025-06-17	4964.4	\N	\N	\N	\N	0	chart
6086	SEPLAT	2025-06-18	5450	\N	\N	\N	\N	9.7816	chart
6088	SEPLAT	2025-06-19	5450	\N	\N	\N	\N	0	chart
6090	SEPLAT	2025-06-20	5450	\N	\N	\N	\N	0	chart
6092	SEPLAT	2025-06-23	5450	\N	\N	\N	\N	0	chart
6094	SEPLAT	2025-06-24	5450	\N	\N	\N	\N	0	chart
6096	SEPLAT	2025-06-25	5450	\N	\N	\N	\N	0	chart
6097	SEPLAT	2025-06-26	5450	\N	\N	\N	\N	0	chart
6099	SEPLAT	2025-06-27	5450	\N	\N	\N	\N	0	chart
6101	SEPLAT	2025-06-30	5450	\N	\N	\N	\N	0	chart
6103	SEPLAT	2025-07-01	5450	\N	\N	\N	\N	0	chart
6105	SEPLAT	2025-07-02	5450	\N	\N	\N	\N	0	chart
6107	SEPLAT	2025-07-03	5450	\N	\N	\N	\N	0	chart
6109	SEPLAT	2025-07-04	5450	\N	\N	\N	\N	0	chart
6111	SEPLAT	2025-07-07	5450	\N	\N	\N	\N	0	chart
6113	SEPLAT	2025-07-08	5450	\N	\N	\N	\N	0	chart
6115	SEPLAT	2025-07-09	5450	\N	\N	\N	\N	0	chart
6117	SEPLAT	2025-07-10	5450	\N	\N	\N	\N	0	chart
6119	SEPLAT	2025-07-11	5450	\N	\N	\N	\N	0	chart
6121	SEPLAT	2025-07-14	5450	\N	\N	\N	\N	0	chart
6123	SEPLAT	2025-07-16	5450	\N	\N	\N	\N	0	chart
6125	SEPLAT	2025-07-17	5450	\N	\N	\N	\N	0	chart
6127	SEPLAT	2025-07-18	5450	\N	\N	\N	\N	0	chart
6128	PRESCO	2025-08-05	1550	\N	\N	\N	\N	0	chart
6129	SEPLAT	2025-07-21	5450	\N	\N	\N	\N	0	chart
6130	PRESCO	2025-08-06	1550	\N	\N	\N	\N	0	chart
6131	SEPLAT	2025-07-22	5450	\N	\N	\N	\N	0	chart
6132	PRESCO	2025-08-07	1480	\N	\N	\N	\N	-4.5161	chart
6133	SEPLAT	2025-07-23	5450	\N	\N	\N	\N	0	chart
6134	PRESCO	2025-08-08	1480	\N	\N	\N	\N	0	chart
6135	SEPLAT	2025-07-24	5450	\N	\N	\N	\N	0	chart
6136	PRESCO	2025-08-11	1480	\N	\N	\N	\N	0	chart
6137	SEPLAT	2025-07-25	5450	\N	\N	\N	\N	0	chart
6138	PRESCO	2025-08-12	1480	\N	\N	\N	\N	0	chart
6139	SEPLAT	2025-07-28	5450	\N	\N	\N	\N	0	chart
6140	PRESCO	2025-08-13	1480	\N	\N	\N	\N	0	chart
6141	SEPLAT	2025-07-29	5450	\N	\N	\N	\N	0	chart
6142	PRESCO	2025-08-14	1480	\N	\N	\N	\N	0	chart
6143	SEPLAT	2025-07-30	5450	\N	\N	\N	\N	0	chart
6144	PRESCO	2025-08-15	1480	\N	\N	\N	\N	0	chart
6145	SEPLAT	2025-07-31	5450	\N	\N	\N	\N	0	chart
6146	PRESCO	2025-08-18	1480	\N	\N	\N	\N	0	chart
6147	SEPLAT	2025-08-01	5450	\N	\N	\N	\N	0	chart
6148	PRESCO	2025-08-19	1480	\N	\N	\N	\N	0	chart
6149	SEPLAT	2025-08-04	5450	\N	\N	\N	\N	0	chart
5896	OKOMUOIL	2025-07-01	790	\N	\N	\N	\N	0	chart
5898	OKOMUOIL	2025-07-02	790	\N	\N	\N	\N	0	chart
5900	OKOMUOIL	2025-07-03	790	\N	\N	\N	\N	0	chart
5902	OKOMUOIL	2025-07-04	790	\N	\N	\N	\N	0	chart
5904	OKOMUOIL	2025-07-07	790	\N	\N	\N	\N	0	chart
5906	OKOMUOIL	2025-07-08	800	\N	\N	\N	\N	1.2658	chart
5908	OKOMUOIL	2025-07-09	800	\N	\N	\N	\N	0	chart
5910	OKOMUOIL	2025-07-10	835	\N	\N	\N	\N	4.375	chart
5912	OKOMUOIL	2025-07-11	835	\N	\N	\N	\N	0	chart
5913	OKOMUOIL	2025-07-14	890	\N	\N	\N	\N	6.5868	chart
5914	OKOMUOIL	2025-07-16	930	\N	\N	\N	\N	4.4944	chart
5915	OKOMUOIL	2025-07-17	930	\N	\N	\N	\N	0	chart
5916	OKOMUOIL	2025-07-18	930	\N	\N	\N	\N	0	chart
5917	OKOMUOIL	2025-07-21	930	\N	\N	\N	\N	0	chart
5918	OKOMUOIL	2025-07-22	930	\N	\N	\N	\N	0	chart
5919	OKOMUOIL	2025-07-23	930	\N	\N	\N	\N	0	chart
5920	OKOMUOIL	2025-07-24	950	\N	\N	\N	\N	2.1505	chart
5921	OKOMUOIL	2025-07-25	998	\N	\N	\N	\N	5.0526	chart
5922	OKOMUOIL	2025-07-28	1000	\N	\N	\N	\N	0.2004	chart
5923	OKOMUOIL	2025-07-29	1050	\N	\N	\N	\N	5	chart
5924	OKOMUOIL	2025-07-30	1050	\N	\N	\N	\N	0	chart
5925	OKOMUOIL	2025-07-31	1050	\N	\N	\N	\N	0	chart
5926	OKOMUOIL	2025-08-01	1050	\N	\N	\N	\N	0	chart
5927	OKOMUOIL	2025-08-04	1050	\N	\N	\N	\N	0	chart
5928	OKOMUOIL	2025-08-05	1050	\N	\N	\N	\N	0	chart
5929	OKOMUOIL	2025-08-06	1050	\N	\N	\N	\N	0	chart
5930	OKOMUOIL	2025-08-07	1050	\N	\N	\N	\N	0	chart
5931	OKOMUOIL	2025-08-08	1050	\N	\N	\N	\N	0	chart
5932	OKOMUOIL	2025-08-11	1020	\N	\N	\N	\N	-2.8571	chart
5933	OKOMUOIL	2025-08-12	1020	\N	\N	\N	\N	0	chart
5934	OKOMUOIL	2025-08-13	1020	\N	\N	\N	\N	0	chart
5935	OKOMUOIL	2025-08-14	1020	\N	\N	\N	\N	0	chart
5936	OKOMUOIL	2025-08-15	1020	\N	\N	\N	\N	0	chart
5937	OKOMUOIL	2025-08-18	1020	\N	\N	\N	\N	0	chart
5938	OKOMUOIL	2025-08-19	1020	\N	\N	\N	\N	0	chart
5939	OKOMUOIL	2025-08-20	1020	\N	\N	\N	\N	0	chart
5940	OKOMUOIL	2025-08-21	1020	\N	\N	\N	\N	0	chart
5941	OKOMUOIL	2025-08-22	1020	\N	\N	\N	\N	0	chart
5942	OKOMUOIL	2025-08-25	1020	\N	\N	\N	\N	0	chart
5943	OKOMUOIL	2025-08-26	1020	\N	\N	\N	\N	0	chart
5944	OKOMUOIL	2025-08-27	1020	\N	\N	\N	\N	0	chart
5945	OKOMUOIL	2025-08-28	1020	\N	\N	\N	\N	0	chart
5946	OKOMUOIL	2025-08-29	1020	\N	\N	\N	\N	0	chart
5947	OKOMUOIL	2025-09-01	1020	\N	\N	\N	\N	0	chart
5948	OKOMUOIL	2025-09-02	1020	\N	\N	\N	\N	0	chart
5949	OKOMUOIL	2025-09-03	1020	\N	\N	\N	\N	0	chart
5950	OKOMUOIL	2025-09-04	1020	\N	\N	\N	\N	0	chart
5951	OKOMUOIL	2025-09-08	1020	\N	\N	\N	\N	0	chart
5952	OKOMUOIL	2025-09-09	1020	\N	\N	\N	\N	0	chart
5953	OKOMUOIL	2025-09-10	1020	\N	\N	\N	\N	0	chart
5954	OKOMUOIL	2025-09-11	1020	\N	\N	\N	\N	0	chart
5955	OKOMUOIL	2025-09-12	1020	\N	\N	\N	\N	0	chart
5956	OKOMUOIL	2025-09-15	1020	\N	\N	\N	\N	0	chart
5957	OKOMUOIL	2025-09-16	1020	\N	\N	\N	\N	0	chart
5958	OKOMUOIL	2025-09-17	1020	\N	\N	\N	\N	0	chart
6043	PRESCO	2025-06-02	940	\N	\N	\N	\N	0	chart
6045	PRESCO	2025-06-03	940	\N	\N	\N	\N	0	chart
6047	PRESCO	2025-06-04	940	\N	\N	\N	\N	0	chart
6049	PRESCO	2025-06-05	940	\N	\N	\N	\N	0	chart
6051	PRESCO	2025-06-10	972	\N	\N	\N	\N	3.4043	chart
6053	PRESCO	2025-06-11	972	\N	\N	\N	\N	0	chart
6055	PRESCO	2025-06-13	985	\N	\N	\N	\N	1.3374	chart
6057	PRESCO	2025-06-16	985	\N	\N	\N	\N	0	chart
6059	PRESCO	2025-06-17	1000	\N	\N	\N	\N	1.5228	chart
6061	PRESCO	2025-06-18	1035	\N	\N	\N	\N	3.5	chart
6063	PRESCO	2025-06-19	1035	\N	\N	\N	\N	0	chart
6065	PRESCO	2025-06-20	1100	\N	\N	\N	\N	6.2802	chart
6067	PRESCO	2025-06-23	1210	\N	\N	\N	\N	10	chart
6069	PRESCO	2025-06-24	1275	\N	\N	\N	\N	5.3719	chart
6071	PRESCO	2025-06-25	1275	\N	\N	\N	\N	0	chart
6073	PRESCO	2025-06-26	1275	\N	\N	\N	\N	0	chart
6075	PRESCO	2025-06-27	1275	\N	\N	\N	\N	0	chart
6077	PRESCO	2025-06-30	1275	\N	\N	\N	\N	0	chart
6079	PRESCO	2025-07-01	1275	\N	\N	\N	\N	0	chart
6081	PRESCO	2025-07-02	1275	\N	\N	\N	\N	0	chart
6083	PRESCO	2025-07-03	1275	\N	\N	\N	\N	0	chart
6085	PRESCO	2025-07-04	1275	\N	\N	\N	\N	0	chart
6087	PRESCO	2025-07-07	1233	\N	\N	\N	\N	-3.2941	chart
6089	PRESCO	2025-07-08	1233	\N	\N	\N	\N	0	chart
6091	PRESCO	2025-07-09	1233	\N	\N	\N	\N	0	chart
6093	PRESCO	2025-07-10	1233	\N	\N	\N	\N	0	chart
6095	PRESCO	2025-07-11	1233	\N	\N	\N	\N	0	chart
6098	PRESCO	2025-07-14	1233	\N	\N	\N	\N	0	chart
6100	PRESCO	2025-07-16	1233	\N	\N	\N	\N	0	chart
6102	PRESCO	2025-07-17	1233	\N	\N	\N	\N	0	chart
6104	PRESCO	2025-07-18	1265	\N	\N	\N	\N	2.5953	chart
6106	PRESCO	2025-07-21	1330	\N	\N	\N	\N	5.1383	chart
6108	PRESCO	2025-07-22	1330	\N	\N	\N	\N	0	chart
6110	PRESCO	2025-07-23	1330	\N	\N	\N	\N	0	chart
6112	PRESCO	2025-07-24	1439.5	\N	\N	\N	\N	8.2331	chart
6114	PRESCO	2025-07-25	1550	\N	\N	\N	\N	7.6763	chart
6116	PRESCO	2025-07-28	1550	\N	\N	\N	\N	0	chart
6118	PRESCO	2025-07-29	1550	\N	\N	\N	\N	0	chart
6120	PRESCO	2025-07-30	1550	\N	\N	\N	\N	0	chart
6122	PRESCO	2025-07-31	1550	\N	\N	\N	\N	0	chart
6124	PRESCO	2025-08-01	1550	\N	\N	\N	\N	0	chart
6126	PRESCO	2025-08-04	1550	\N	\N	\N	\N	0	chart
6150	PRESCO	2025-08-20	1480	\N	\N	\N	\N	0	chart
6152	PRESCO	2025-08-21	1480	\N	\N	\N	\N	0	chart
6154	PRESCO	2025-08-22	1480	\N	\N	\N	\N	0	chart
6156	PRESCO	2025-08-25	1480	\N	\N	\N	\N	0	chart
6158	PRESCO	2025-08-26	1480	\N	\N	\N	\N	0	chart
6160	PRESCO	2025-08-27	1480	\N	\N	\N	\N	0	chart
6162	PRESCO	2025-08-28	1480	\N	\N	\N	\N	0	chart
6164	PRESCO	2025-08-29	1480	\N	\N	\N	\N	0	chart
6166	PRESCO	2025-09-01	1480	\N	\N	\N	\N	0	chart
6168	PRESCO	2025-09-02	1480	\N	\N	\N	\N	0	chart
6170	PRESCO	2025-09-03	1480	\N	\N	\N	\N	0	chart
6172	PRESCO	2025-09-04	1480	\N	\N	\N	\N	0	chart
6174	PRESCO	2025-09-08	1480	\N	\N	\N	\N	0	chart
6177	PRESCO	2025-09-09	1480	\N	\N	\N	\N	0	chart
6178	PRESCO	2025-09-10	1480	\N	\N	\N	\N	0	chart
6181	PRESCO	2025-09-11	1480	\N	\N	\N	\N	0	chart
6182	PRESCO	2025-09-12	1480	\N	\N	\N	\N	0	chart
6184	PRESCO	2025-09-15	1480	\N	\N	\N	\N	0	chart
6187	PRESCO	2025-09-16	1480	\N	\N	\N	\N	0	chart
6188	PRESCO	2025-09-17	1480	\N	\N	\N	\N	0	chart
6191	PRESCO	2025-09-18	1480	\N	\N	\N	\N	0	chart
6193	PRESCO	2025-09-19	1480	\N	\N	\N	\N	0	chart
6195	PRESCO	2025-09-22	1480	\N	\N	\N	\N	0	chart
6197	PRESCO	2025-09-23	1480	\N	\N	\N	\N	0	chart
6199	PRESCO	2025-09-24	1480	\N	\N	\N	\N	0	chart
6201	PRESCO	2025-09-25	1479.9	\N	\N	\N	\N	-0.0068	chart
6203	PRESCO	2025-09-26	1479.9	\N	\N	\N	\N	0	chart
6205	PRESCO	2025-09-29	1479.9	\N	\N	\N	\N	0	chart
6207	PRESCO	2025-09-30	1479.9	\N	\N	\N	\N	0	chart
6209	PRESCO	2025-10-02	1479.9	\N	\N	\N	\N	0	chart
6211	PRESCO	2025-10-03	1479.9	\N	\N	\N	\N	0	chart
6212	PRESCO	2025-10-06	1479.9	\N	\N	\N	\N	0	chart
6213	PRESCO	2025-10-07	1479.9	\N	\N	\N	\N	0	chart
6214	PRESCO	2025-10-08	1479.9	\N	\N	\N	\N	0	chart
6215	PRESCO	2025-10-09	1479.9	\N	\N	\N	\N	0	chart
6216	PRESCO	2025-10-10	1479.9	\N	\N	\N	\N	0	chart
6217	PRESCO	2025-10-13	1479.9	\N	\N	\N	\N	0	chart
6218	PRESCO	2025-10-14	1479.9	\N	\N	\N	\N	0	chart
6219	PRESCO	2025-10-15	1479.9	\N	\N	\N	\N	0	chart
6220	PRESCO	2025-10-16	1479.9	\N	\N	\N	\N	0	chart
6221	PRESCO	2025-10-17	1479.9	\N	\N	\N	\N	0	chart
6222	PRESCO	2025-10-20	1479.9	\N	\N	\N	\N	0	chart
6223	PRESCO	2025-10-21	1479.9	\N	\N	\N	\N	0	chart
6224	PRESCO	2025-10-22	1479.9	\N	\N	\N	\N	0	chart
6225	PRESCO	2025-10-23	1480	\N	\N	\N	\N	0.0068	chart
6226	PRESCO	2025-10-24	1480	\N	\N	\N	\N	0	chart
6227	PRESCO	2025-10-27	1480	\N	\N	\N	\N	0	chart
6228	PRESCO	2025-10-28	1480	\N	\N	\N	\N	0	chart
6229	PRESCO	2025-10-29	1480	\N	\N	\N	\N	0	chart
6230	PRESCO	2025-10-30	1480	\N	\N	\N	\N	0	chart
6231	PRESCO	2025-10-31	1480	\N	\N	\N	\N	0	chart
6232	PRESCO	2025-11-03	1480	\N	\N	\N	\N	0	chart
6233	PRESCO	2025-11-04	1480	\N	\N	\N	\N	0	chart
6234	PRESCO	2025-11-05	1480	\N	\N	\N	\N	0	chart
6235	PRESCO	2025-11-06	1480	\N	\N	\N	\N	0	chart
6236	PRESCO	2025-11-07	1480	\N	\N	\N	\N	0	chart
6237	PRESCO	2025-11-10	1450	\N	\N	\N	\N	-2.027	chart
6238	PRESCO	2025-11-11	1450	\N	\N	\N	\N	0	chart
6239	PRESCO	2025-11-12	1450	\N	\N	\N	\N	0	chart
6240	PRESCO	2025-11-13	1450	\N	\N	\N	\N	0	chart
6241	PRESCO	2025-11-14	1450	\N	\N	\N	\N	0	chart
6242	PRESCO	2025-11-17	1450	\N	\N	\N	\N	0	chart
6243	PRESCO	2025-11-18	1450	\N	\N	\N	\N	0	chart
6244	PRESCO	2025-11-19	1450	\N	\N	\N	\N	0	chart
6245	PRESCO	2025-11-20	1450	\N	\N	\N	\N	0	chart
6246	PRESCO	2025-11-21	1450	\N	\N	\N	\N	0	chart
6247	PRESCO	2025-11-24	1450	\N	\N	\N	\N	0	chart
6248	PRESCO	2025-11-25	1450	\N	\N	\N	\N	0	chart
6249	PRESCO	2025-11-26	1450	\N	\N	\N	\N	0	chart
6250	PRESCO	2025-11-27	1450	\N	\N	\N	\N	0	chart
6251	PRESCO	2025-11-28	1450	\N	\N	\N	\N	0	chart
6252	PRESCO	2025-12-01	1450	\N	\N	\N	\N	0	chart
6253	PRESCO	2025-12-02	1450	\N	\N	\N	\N	0	chart
6254	PRESCO	2025-12-03	1450	\N	\N	\N	\N	0	chart
6255	PRESCO	2025-12-04	1450	\N	\N	\N	\N	0	chart
6256	PRESCO	2025-12-05	1450	\N	\N	\N	\N	0	chart
6257	PRESCO	2025-12-08	1450	\N	\N	\N	\N	0	chart
6258	PRESCO	2025-12-09	1450	\N	\N	\N	\N	0	chart
6259	PRESCO	2025-12-10	1450	\N	\N	\N	\N	0	chart
6260	PRESCO	2025-12-11	1450	\N	\N	\N	\N	0	chart
6261	PRESCO	2025-12-12	1450	\N	\N	\N	\N	0	chart
6262	PRESCO	2025-12-15	1450	\N	\N	\N	\N	0	chart
6263	PRESCO	2025-12-16	1450	\N	\N	\N	\N	0	chart
6264	PRESCO	2025-12-17	1450	\N	\N	\N	\N	0	chart
6265	PRESCO	2025-12-18	1450	\N	\N	\N	\N	0	chart
6266	PRESCO	2025-12-19	1430	\N	\N	\N	\N	-1.3793	chart
6267	PRESCO	2025-12-22	1450	\N	\N	\N	\N	1.3986	chart
6268	PRESCO	2025-12-23	1450	\N	\N	\N	\N	0	chart
6269	PRESCO	2025-12-24	1450	\N	\N	\N	\N	0	chart
6270	PRESCO	2025-12-29	1450	\N	\N	\N	\N	0	chart
6271	PRESCO	2025-12-30	1450	\N	\N	\N	\N	0	chart
6272	PRESCO	2025-12-31	1450	\N	\N	\N	\N	0	chart
6273	PRESCO	2026-01-02	1450	\N	\N	\N	\N	0	chart
6274	PRESCO	2026-01-05	1450	\N	\N	\N	\N	0	chart
6275	PRESCO	2026-01-06	1540	\N	\N	\N	\N	6.2069	chart
6276	PRESCO	2026-01-07	1540	\N	\N	\N	\N	0	chart
6277	PRESCO	2026-01-08	1635	\N	\N	\N	\N	6.1688	chart
6151	SEPLAT	2025-08-05	5450	\N	\N	\N	\N	0	chart
6153	SEPLAT	2025-08-06	5450	\N	\N	\N	\N	0	chart
6155	SEPLAT	2025-08-07	5450	\N	\N	\N	\N	0	chart
6157	SEPLAT	2025-08-08	5450	\N	\N	\N	\N	0	chart
6159	SEPLAT	2025-08-11	5450	\N	\N	\N	\N	0	chart
6161	SEPLAT	2025-08-12	5450	\N	\N	\N	\N	0	chart
6163	SEPLAT	2025-08-13	5450	\N	\N	\N	\N	0	chart
6165	SEPLAT	2025-08-14	5379.3	\N	\N	\N	\N	-1.2972	chart
6167	SEPLAT	2025-08-15	5379.3	\N	\N	\N	\N	0	chart
6169	SEPLAT	2025-08-18	5379.3	\N	\N	\N	\N	0	chart
6171	SEPLAT	2025-08-19	5379.3	\N	\N	\N	\N	0	chart
6173	SEPLAT	2025-08-20	5379.3	\N	\N	\N	\N	0	chart
6175	SEPLAT	2025-08-21	5379.3	\N	\N	\N	\N	0	chart
6176	SEPLAT	2025-08-22	5379.3	\N	\N	\N	\N	0	chart
6179	SEPLAT	2025-08-25	5379.3	\N	\N	\N	\N	0	chart
6180	SEPLAT	2025-08-26	5379.3	\N	\N	\N	\N	0	chart
6183	SEPLAT	2025-08-27	5379.3	\N	\N	\N	\N	0	chart
6185	SEPLAT	2025-08-28	5379.3	\N	\N	\N	\N	0	chart
6186	SEPLAT	2025-08-29	5379.3	\N	\N	\N	\N	0	chart
6189	SEPLAT	2025-09-01	5379.3	\N	\N	\N	\N	0	chart
6190	SEPLAT	2025-09-02	5379.3	\N	\N	\N	\N	0	chart
6192	SEPLAT	2025-09-03	5379.3	\N	\N	\N	\N	0	chart
6194	SEPLAT	2025-09-04	5379.3	\N	\N	\N	\N	0	chart
6196	SEPLAT	2025-09-08	5379.3	\N	\N	\N	\N	0	chart
6198	SEPLAT	2025-09-09	5379.3	\N	\N	\N	\N	0	chart
6200	SEPLAT	2025-09-10	5379.3	\N	\N	\N	\N	0	chart
6202	SEPLAT	2025-09-11	5379.3	\N	\N	\N	\N	0	chart
6204	SEPLAT	2025-09-12	5379.3	\N	\N	\N	\N	0	chart
6206	SEPLAT	2025-09-15	5379.3	\N	\N	\N	\N	0	chart
6208	SEPLAT	2025-09-16	5379.3	\N	\N	\N	\N	0	chart
6210	SEPLAT	2025-09-17	5379.3	\N	\N	\N	\N	0	chart
6278	PRESCO	2026-01-09	1635	\N	\N	\N	\N	0	chart
6279	PRESCO	2026-01-12	1635	\N	\N	\N	\N	0	chart
6280	PRESCO	2026-01-13	1635	\N	\N	\N	\N	0	chart
6281	PRESCO	2026-01-14	1635	\N	\N	\N	\N	0	chart
6282	PRESCO	2026-01-15	1635	\N	\N	\N	\N	0	chart
6283	PRESCO	2026-01-16	1635	\N	\N	\N	\N	0	chart
6284	PRESCO	2026-01-19	1635	\N	\N	\N	\N	0	chart
6285	PRESCO	2026-01-20	1635	\N	\N	\N	\N	0	chart
6286	PRESCO	2026-01-21	1635	\N	\N	\N	\N	0	chart
6287	PRESCO	2026-01-22	1635	\N	\N	\N	\N	0	chart
6288	PRESCO	2026-01-23	1635	\N	\N	\N	\N	0	chart
6289	PRESCO	2026-01-26	1635	\N	\N	\N	\N	0	chart
6290	PRESCO	2026-01-27	1635	\N	\N	\N	\N	0	chart
6291	PRESCO	2026-01-28	1635	\N	\N	\N	\N	0	chart
6292	PRESCO	2026-01-29	1635	\N	\N	\N	\N	0	chart
6293	PRESCO	2026-01-30	1635	\N	\N	\N	\N	0	chart
6294	PRESCO	2026-02-02	1635	\N	\N	\N	\N	0	chart
6295	PRESCO	2026-02-03	1663	\N	\N	\N	\N	1.7125	chart
6296	PRESCO	2026-02-04	1663	\N	\N	\N	\N	0	chart
6297	PRESCO	2026-02-05	1663	\N	\N	\N	\N	0	chart
6298	PRESCO	2026-02-06	1690	\N	\N	\N	\N	1.6236	chart
6299	PRESCO	2026-02-09	1690	\N	\N	\N	\N	0	chart
6300	PRESCO	2026-02-10	1700	\N	\N	\N	\N	0.5917	chart
6301	PRESCO	2026-02-11	1700	\N	\N	\N	\N	0	chart
6302	PRESCO	2026-02-12	1780	\N	\N	\N	\N	4.7059	chart
6303	PRESCO	2026-02-13	1900	\N	\N	\N	\N	6.7416	chart
6304	PRESCO	2026-02-16	2015	\N	\N	\N	\N	6.0526	chart
6305	PRESCO	2026-02-17	2076	\N	\N	\N	\N	3.0273	chart
6306	PRESCO	2026-02-18	2160	\N	\N	\N	\N	4.0462	chart
6307	PRESCO	2026-02-19	2315.4	\N	\N	\N	\N	7.1944	chart
6308	PRESCO	2026-02-20	2315.4	\N	\N	\N	\N	0	chart
6309	PRESCO	2026-02-23	2315.4	\N	\N	\N	\N	0	chart
6310	PRESCO	2026-02-24	2315.4	\N	\N	\N	\N	0	chart
6311	PRESCO	2026-02-25	2315.4	\N	\N	\N	\N	0	chart
6312	PRESCO	2026-02-26	2315.4	\N	\N	\N	\N	0	chart
6313	PRESCO	2026-02-27	2315.4	\N	\N	\N	\N	0	chart
6314	PRESCO	2026-03-02	2315.4	\N	\N	\N	\N	0	chart
6315	PRESCO	2026-03-03	2315.4	\N	\N	\N	\N	0	chart
6316	PRESCO	2026-03-04	2315.4	\N	\N	\N	\N	0	chart
6317	PRESCO	2026-03-05	2315.4	\N	\N	\N	\N	0	chart
6318	PRESCO	2026-03-06	2315.4	\N	\N	\N	\N	0	chart
6319	PRESCO	2026-03-09	2315.4	\N	\N	\N	\N	0	chart
6320	PRESCO	2026-03-10	2315.4	\N	\N	\N	\N	0	chart
6321	PRESCO	2026-03-11	2083.9	\N	\N	\N	\N	-9.9983	chart
6322	PRESCO	2026-03-12	2083.9	\N	\N	\N	\N	0	chart
6323	PRESCO	2026-03-13	2083.9	\N	\N	\N	\N	0	chart
6324	PRESCO	2026-03-16	2083.9	\N	\N	\N	\N	0	chart
6325	PRESCO	2026-03-17	1875.6	\N	\N	\N	\N	-9.9957	chart
6326	PRESCO	2026-03-18	1701.1	\N	\N	\N	\N	-9.3037	chart
6327	ACCESSCORP	2025-03-19	22.4	\N	\N	\N	\N	\N	chart
6328	ACCESSCORP	2025-03-20	22	\N	\N	\N	\N	-1.7857	chart
6329	ACCESSCORP	2025-03-21	22.1	\N	\N	\N	\N	0.4545	chart
6330	ACCESSCORP	2025-03-24	22.5	\N	\N	\N	\N	1.81	chart
6331	ACCESSCORP	2025-03-25	22.45	\N	\N	\N	\N	-0.2222	chart
6332	ACCESSCORP	2025-03-26	22.5	\N	\N	\N	\N	0.2227	chart
6333	ACCESSCORP	2025-03-27	22	\N	\N	\N	\N	-2.2222	chart
6334	ACCESSCORP	2025-03-28	22.35	\N	\N	\N	\N	1.5909	chart
6335	ACCESSCORP	2025-04-02	22.65	\N	\N	\N	\N	1.3423	chart
6336	ACCESSCORP	2025-04-03	22.55	\N	\N	\N	\N	-0.4415	chart
6337	ACCESSCORP	2025-04-04	22.65	\N	\N	\N	\N	0.4435	chart
6338	ACCESSCORP	2025-04-07	20.55	\N	\N	\N	\N	-9.2715	chart
6339	ACCESSCORP	2025-04-08	21	\N	\N	\N	\N	2.1898	chart
6340	ACCESSCORP	2025-04-09	21	\N	\N	\N	\N	0	chart
6341	ACCESSCORP	2025-04-10	20.75	\N	\N	\N	\N	-1.1905	chart
6342	ACCESSCORP	2025-04-11	20.45	\N	\N	\N	\N	-1.4458	chart
6343	ACCESSCORP	2025-04-14	20.75	\N	\N	\N	\N	1.467	chart
6344	ACCESSCORP	2025-04-15	21.4	\N	\N	\N	\N	3.1325	chart
6345	ACCESSCORP	2025-04-16	21.5	\N	\N	\N	\N	0.4673	chart
6346	ACCESSCORP	2025-04-17	22.1	\N	\N	\N	\N	2.7907	chart
6347	ACCESSCORP	2025-04-22	22.65	\N	\N	\N	\N	2.4887	chart
6348	ACCESSCORP	2025-04-23	23.7	\N	\N	\N	\N	4.6358	chart
6349	ACCESSCORP	2025-04-24	23.9	\N	\N	\N	\N	0.8439	chart
6350	ACCESSCORP	2025-04-25	23.8	\N	\N	\N	\N	-0.4184	chart
6351	ACCESSCORP	2025-04-28	23.7	\N	\N	\N	\N	-0.4202	chart
6352	ACCESSCORP	2025-04-29	24.05	\N	\N	\N	\N	1.4768	chart
6353	ACCESSCORP	2025-04-30	22.5	\N	\N	\N	\N	-6.4449	chart
6354	ACCESSCORP	2025-05-02	21.9	\N	\N	\N	\N	-2.6667	chart
6355	ACCESSCORP	2025-05-05	21.05	\N	\N	\N	\N	-3.8813	chart
6356	ACCESSCORP	2025-05-06	21.25	\N	\N	\N	\N	0.9501	chart
6357	ACCESSCORP	2025-05-07	21.55	\N	\N	\N	\N	1.4118	chart
6358	ACCESSCORP	2025-05-08	21.8	\N	\N	\N	\N	1.1601	chart
6359	ACCESSCORP	2025-05-09	21.3	\N	\N	\N	\N	-2.2936	chart
6360	ACCESSCORP	2025-05-12	21.3	\N	\N	\N	\N	0	chart
6361	ACCESSCORP	2025-05-13	21.3	\N	\N	\N	\N	0	chart
6362	ACCESSCORP	2025-05-14	21.45	\N	\N	\N	\N	0.7042	chart
6363	ACCESSCORP	2025-05-15	22	\N	\N	\N	\N	2.5641	chart
6364	ACCESSCORP	2025-05-16	23.5	\N	\N	\N	\N	6.8182	chart
6365	ACCESSCORP	2025-05-19	23	\N	\N	\N	\N	-2.1277	chart
6366	ACCESSCORP	2025-05-20	22.8	\N	\N	\N	\N	-0.8696	chart
6367	ACCESSCORP	2025-05-21	21.85	\N	\N	\N	\N	-4.1667	chart
6368	ACCESSCORP	2025-05-22	21.5	\N	\N	\N	\N	-1.6018	chart
6369	ACCESSCORP	2025-05-23	21.6	\N	\N	\N	\N	0.4651	chart
6370	ACCESSCORP	2025-05-26	21.95	\N	\N	\N	\N	1.6204	chart
6371	ACCESSCORP	2025-05-27	22	\N	\N	\N	\N	0.2278	chart
6372	ACCESSCORP	2025-05-28	22.1	\N	\N	\N	\N	0.4545	chart
6373	ACCESSCORP	2025-05-29	22	\N	\N	\N	\N	-0.4525	chart
6374	ACCESSCORP	2025-05-30	22	\N	\N	\N	\N	0	chart
6375	ACCESSCORP	2025-06-02	22	\N	\N	\N	\N	0	chart
6376	ACCESSCORP	2025-06-03	21.85	\N	\N	\N	\N	-0.6818	chart
6377	ACCESSCORP	2025-06-04	22	\N	\N	\N	\N	0.6865	chart
6378	ACCESSCORP	2025-06-05	23.2	\N	\N	\N	\N	5.4545	chart
6379	ACCESSCORP	2025-06-10	22.1	\N	\N	\N	\N	-4.7414	chart
6380	ACCESSCORP	2025-06-11	22.25	\N	\N	\N	\N	0.6787	chart
6381	ACCESSCORP	2025-06-13	22.35	\N	\N	\N	\N	0.4494	chart
6382	ACCESSCORP	2025-06-16	20.5	\N	\N	\N	\N	-8.2774	chart
6383	ACCESSCORP	2025-06-17	20.05	\N	\N	\N	\N	-2.1951	chart
6384	ACCESSCORP	2025-06-18	20.95	\N	\N	\N	\N	4.4888	chart
6385	ACCESSCORP	2025-06-19	21.8	\N	\N	\N	\N	4.0573	chart
6386	ACCESSCORP	2025-06-20	21.9	\N	\N	\N	\N	0.4587	chart
6387	ACCESSCORP	2025-06-23	22.4	\N	\N	\N	\N	2.2831	chart
6388	ACCESSCORP	2025-06-24	22.8	\N	\N	\N	\N	1.7857	chart
6389	ACCESSCORP	2025-06-25	23.1	\N	\N	\N	\N	1.3158	chart
6390	ACCESSCORP	2025-06-26	22.65	\N	\N	\N	\N	-1.9481	chart
6391	ACCESSCORP	2025-06-27	22.1	\N	\N	\N	\N	-2.4283	chart
6392	ACCESSCORP	2025-06-30	22.1	\N	\N	\N	\N	0	chart
6393	ACCESSCORP	2025-07-01	22.9	\N	\N	\N	\N	3.6199	chart
6394	ACCESSCORP	2025-07-02	23.1	\N	\N	\N	\N	0.8734	chart
6395	ACCESSCORP	2025-07-03	22.5	\N	\N	\N	\N	-2.5974	chart
6396	ACCESSCORP	2025-07-04	22.5	\N	\N	\N	\N	0	chart
6397	ACCESSCORP	2025-07-07	22.05	\N	\N	\N	\N	-2	chart
6398	ACCESSCORP	2025-07-08	22.1	\N	\N	\N	\N	0.2268	chart
6399	ACCESSCORP	2025-07-09	22.25	\N	\N	\N	\N	0.6787	chart
6400	ACCESSCORP	2025-07-10	23.1	\N	\N	\N	\N	3.8202	chart
6401	ACCESSCORP	2025-07-11	24.8	\N	\N	\N	\N	7.3593	chart
6402	ACCESSCORP	2025-07-14	24.9	\N	\N	\N	\N	0.4032	chart
6403	ACCESSCORP	2025-07-16	26.8	\N	\N	\N	\N	7.6305	chart
6404	ACCESSCORP	2025-07-17	27.45	\N	\N	\N	\N	2.4254	chart
6405	ACCESSCORP	2025-07-18	26.85	\N	\N	\N	\N	-2.1858	chart
6406	ACCESSCORP	2025-07-21	26.5	\N	\N	\N	\N	-1.3035	chart
6407	ACCESSCORP	2025-07-22	27.5	\N	\N	\N	\N	3.7736	chart
6408	ACCESSCORP	2025-07-23	28.5	\N	\N	\N	\N	3.6364	chart
6409	ACCESSCORP	2025-07-24	28.5	\N	\N	\N	\N	0	chart
6410	ACCESSCORP	2025-07-25	27.7	\N	\N	\N	\N	-2.807	chart
6411	ACCESSCORP	2025-07-28	27.3	\N	\N	\N	\N	-1.444	chart
6412	ACCESSCORP	2025-07-29	27.2	\N	\N	\N	\N	-0.3663	chart
6413	ACCESSCORP	2025-07-30	27.6	\N	\N	\N	\N	1.4706	chart
6414	ACCESSCORP	2025-07-31	27.9	\N	\N	\N	\N	1.087	chart
6415	ACCESSCORP	2025-08-01	28	\N	\N	\N	\N	0.3584	chart
6416	ACCESSCORP	2025-08-04	27.8	\N	\N	\N	\N	-0.7143	chart
6417	ACCESSCORP	2025-08-05	27.35	\N	\N	\N	\N	-1.6187	chart
6418	ACCESSCORP	2025-08-06	27.5	\N	\N	\N	\N	0.5484	chart
6419	ACCESSCORP	2025-08-07	27.4	\N	\N	\N	\N	-0.3636	chart
6420	ACCESSCORP	2025-08-08	27.6	\N	\N	\N	\N	0.7299	chart
6421	ACCESSCORP	2025-08-11	27.7	\N	\N	\N	\N	0.3623	chart
6422	ACCESSCORP	2025-08-12	27.55	\N	\N	\N	\N	-0.5415	chart
6423	ACCESSCORP	2025-08-13	27.6	\N	\N	\N	\N	0.1815	chart
6424	ACCESSCORP	2025-08-14	27.65	\N	\N	\N	\N	0.1812	chart
6425	ACCESSCORP	2025-08-15	27.95	\N	\N	\N	\N	1.085	chart
6426	ACCESSCORP	2025-08-18	27.5	\N	\N	\N	\N	-1.61	chart
6427	ACCESSCORP	2025-08-19	27.45	\N	\N	\N	\N	-0.1818	chart
6428	ACCESSCORP	2025-08-20	27.4	\N	\N	\N	\N	-0.1821	chart
6429	ACCESSCORP	2025-08-21	26.95	\N	\N	\N	\N	-1.6423	chart
6430	ACCESSCORP	2025-08-22	27	\N	\N	\N	\N	0.1855	chart
6431	ACCESSCORP	2025-08-25	27.45	\N	\N	\N	\N	1.6667	chart
6432	ACCESSCORP	2025-08-26	27.5	\N	\N	\N	\N	0.1821	chart
6433	ACCESSCORP	2025-08-27	27.2	\N	\N	\N	\N	-1.0909	chart
6434	ACCESSCORP	2025-08-28	27	\N	\N	\N	\N	-0.7353	chart
6435	ACCESSCORP	2025-08-29	26.5	\N	\N	\N	\N	-1.8519	chart
6436	ACCESSCORP	2025-09-01	26.2	\N	\N	\N	\N	-1.1321	chart
6437	ACCESSCORP	2025-09-02	25.85	\N	\N	\N	\N	-1.3359	chart
6438	ACCESSCORP	2025-09-03	25.6	\N	\N	\N	\N	-0.9671	chart
6439	ACCESSCORP	2025-09-04	25.9	\N	\N	\N	\N	1.1719	chart
6440	ACCESSCORP	2025-09-08	25.7	\N	\N	\N	\N	-0.7722	chart
6441	ACCESSCORP	2025-09-09	25.9	\N	\N	\N	\N	0.7782	chart
6442	ACCESSCORP	2025-09-10	26.5	\N	\N	\N	\N	2.3166	chart
6443	ACCESSCORP	2025-09-11	26.45	\N	\N	\N	\N	-0.1887	chart
6444	ACCESSCORP	2025-09-12	26.8	\N	\N	\N	\N	1.3233	chart
6445	ACCESSCORP	2025-09-15	27	\N	\N	\N	\N	0.7463	chart
6446	ACCESSCORP	2025-09-16	27.1	\N	\N	\N	\N	0.3704	chart
6447	ACCESSCORP	2025-09-17	27.1	\N	\N	\N	\N	0	chart
6448	ACCESSCORP	2025-09-18	27	\N	\N	\N	\N	-0.369	chart
6449	ACCESSCORP	2025-09-19	25.9	\N	\N	\N	\N	-4.0741	chart
6450	ACCESSCORP	2025-09-22	26.1	\N	\N	\N	\N	0.7722	chart
6451	ACCESSCORP	2025-09-23	24.8	\N	\N	\N	\N	-4.9808	chart
6452	ACCESSCORP	2025-09-24	24.9	\N	\N	\N	\N	0.4032	chart
6453	ACCESSCORP	2025-09-25	25.5	\N	\N	\N	\N	2.4096	chart
6454	ACCESSCORP	2025-09-26	25.85	\N	\N	\N	\N	1.3725	chart
6455	ACCESSCORP	2025-09-29	25.7	\N	\N	\N	\N	-0.5803	chart
6456	ACCESSCORP	2025-09-30	25.65	\N	\N	\N	\N	-0.1946	chart
6457	ACCESSCORP	2025-10-02	25.8	\N	\N	\N	\N	0.5848	chart
6458	ACCESSCORP	2025-10-03	26.5	\N	\N	\N	\N	2.7132	chart
6459	ACCESSCORP	2025-10-06	26	\N	\N	\N	\N	-1.8868	chart
6460	ACCESSCORP	2025-10-07	26	\N	\N	\N	\N	0	chart
6461	ACCESSCORP	2025-10-08	26.2	\N	\N	\N	\N	0.7692	chart
6462	ACCESSCORP	2025-10-09	26	\N	\N	\N	\N	-0.7634	chart
6463	ACCESSCORP	2025-10-10	26	\N	\N	\N	\N	0	chart
6464	ACCESSCORP	2025-10-13	26.15	\N	\N	\N	\N	0.5769	chart
6465	ACCESSCORP	2025-10-14	25.9	\N	\N	\N	\N	-0.956	chart
6466	ACCESSCORP	2025-10-15	25.75	\N	\N	\N	\N	-0.5792	chart
6467	ACCESSCORP	2025-10-16	25.8	\N	\N	\N	\N	0.1942	chart
6468	ACCESSCORP	2025-10-17	25.65	\N	\N	\N	\N	-0.5814	chart
6469	ACCESSCORP	2025-10-20	25.45	\N	\N	\N	\N	-0.7797	chart
6470	ACCESSCORP	2025-10-21	25	\N	\N	\N	\N	-1.7682	chart
6471	ACCESSCORP	2025-10-22	24.45	\N	\N	\N	\N	-2.2	chart
6472	ACCESSCORP	2025-10-23	24.95	\N	\N	\N	\N	2.045	chart
6473	ACCESSCORP	2025-10-24	25	\N	\N	\N	\N	0.2004	chart
6474	ACCESSCORP	2025-10-27	23.65	\N	\N	\N	\N	-5.4	chart
6475	ACCESSCORP	2025-10-28	23.1	\N	\N	\N	\N	-2.3256	chart
6476	ACCESSCORP	2025-10-29	23.15	\N	\N	\N	\N	0.2165	chart
6477	ACCESSCORP	2025-10-30	23	\N	\N	\N	\N	-0.6479	chart
6478	ACCESSCORP	2025-10-31	24.45	\N	\N	\N	\N	6.3043	chart
6479	ACCESSCORP	2025-11-03	23.7	\N	\N	\N	\N	-3.0675	chart
6480	ACCESSCORP	2025-11-04	23	\N	\N	\N	\N	-2.9536	chart
6481	ACCESSCORP	2025-11-05	23	\N	\N	\N	\N	0	chart
6482	ACCESSCORP	2025-11-06	22.5	\N	\N	\N	\N	-2.1739	chart
6483	ACCESSCORP	2025-11-07	22	\N	\N	\N	\N	-2.2222	chart
6484	ACCESSCORP	2025-11-10	21.8	\N	\N	\N	\N	-0.9091	chart
6485	ACCESSCORP	2025-11-11	20	\N	\N	\N	\N	-8.2569	chart
6486	ACCESSCORP	2025-11-12	22	\N	\N	\N	\N	10	chart
6487	ACCESSCORP	2025-11-13	23	\N	\N	\N	\N	4.5455	chart
6488	ACCESSCORP	2025-11-14	23	\N	\N	\N	\N	0	chart
6489	ACCESSCORP	2025-11-17	22.25	\N	\N	\N	\N	-3.2609	chart
6490	ACCESSCORP	2025-11-18	22	\N	\N	\N	\N	-1.1236	chart
6491	ACCESSCORP	2025-11-19	21.65	\N	\N	\N	\N	-1.5909	chart
6492	ACCESSCORP	2025-11-20	21	\N	\N	\N	\N	-3.0023	chart
6493	ACCESSCORP	2025-11-21	20.5	\N	\N	\N	\N	-2.381	chart
6494	ACCESSCORP	2025-11-24	20.8	\N	\N	\N	\N	1.4634	chart
6495	ACCESSCORP	2025-11-25	20.7	\N	\N	\N	\N	-0.4808	chart
6496	ACCESSCORP	2025-11-26	20.8	\N	\N	\N	\N	0.4831	chart
6497	ACCESSCORP	2025-11-27	21	\N	\N	\N	\N	0.9615	chart
6498	ACCESSCORP	2025-11-28	21	\N	\N	\N	\N	0	chart
6499	ACCESSCORP	2025-12-01	21	\N	\N	\N	\N	0	chart
6500	ACCESSCORP	2025-12-02	20.9	\N	\N	\N	\N	-0.4762	chart
6501	ACCESSCORP	2025-12-03	21	\N	\N	\N	\N	0.4785	chart
6502	ACCESSCORP	2025-12-04	20.9	\N	\N	\N	\N	-0.4762	chart
6503	ACCESSCORP	2025-12-05	21.5	\N	\N	\N	\N	2.8708	chart
6504	ACCESSCORP	2025-12-08	21.05	\N	\N	\N	\N	-2.093	chart
6505	ACCESSCORP	2025-12-09	20.9	\N	\N	\N	\N	-0.7126	chart
6506	ACCESSCORP	2025-12-10	20.3	\N	\N	\N	\N	-2.8708	chart
6507	ACCESSCORP	2025-12-11	20.2	\N	\N	\N	\N	-0.4926	chart
6508	ACCESSCORP	2025-12-12	20.1	\N	\N	\N	\N	-0.495	chart
6509	ACCESSCORP	2025-12-15	20	\N	\N	\N	\N	-0.4975	chart
6510	ACCESSCORP	2025-12-16	20	\N	\N	\N	\N	0	chart
6511	ACCESSCORP	2025-12-17	20.8	\N	\N	\N	\N	4	chart
6512	ACCESSCORP	2025-12-18	20.95	\N	\N	\N	\N	0.7212	chart
6513	ACCESSCORP	2025-12-19	20.5	\N	\N	\N	\N	-2.148	chart
6514	ACCESSCORP	2025-12-22	20.5	\N	\N	\N	\N	0	chart
6515	ACCESSCORP	2025-12-23	20.5	\N	\N	\N	\N	0	chart
6516	ACCESSCORP	2025-12-24	20.5	\N	\N	\N	\N	0	chart
6517	ACCESSCORP	2025-12-29	21	\N	\N	\N	\N	2.439	chart
6518	ACCESSCORP	2025-12-30	21.35	\N	\N	\N	\N	1.6667	chart
6519	ACCESSCORP	2025-12-31	21	\N	\N	\N	\N	-1.6393	chart
6520	ACCESSCORP	2026-01-02	23	\N	\N	\N	\N	9.5238	chart
6521	ACCESSCORP	2026-01-05	25	\N	\N	\N	\N	8.6957	chart
6522	ACCESSCORP	2026-01-06	23.5	\N	\N	\N	\N	-6	chart
6523	ACCESSCORP	2026-01-07	22.9	\N	\N	\N	\N	-2.5532	chart
6524	ACCESSCORP	2026-01-08	22.6	\N	\N	\N	\N	-1.31	chart
6525	ACCESSCORP	2026-01-09	22.65	\N	\N	\N	\N	0.2212	chart
6526	ACCESSCORP	2026-01-12	23	\N	\N	\N	\N	1.5453	chart
6527	ACCESSCORP	2026-01-13	22.95	\N	\N	\N	\N	-0.2174	chart
6528	ACCESSCORP	2026-01-14	22.95	\N	\N	\N	\N	0	chart
6531	ACCESSCORP	2026-01-15	22.8	\N	\N	\N	\N	-0.6536	chart
6532	ACCESSCORP	2026-01-16	22.75	\N	\N	\N	\N	-0.2193	chart
6533	ACCESSCORP	2026-01-19	22.9	\N	\N	\N	\N	0.6593	chart
6534	ACCESSCORP	2026-01-20	22.9	\N	\N	\N	\N	0	chart
6535	ACCESSCORP	2026-01-21	22.95	\N	\N	\N	\N	0.2183	chart
6536	ACCESSCORP	2026-01-22	22.05	\N	\N	\N	\N	-3.9216	chart
6537	ACCESSCORP	2026-01-23	22.4	\N	\N	\N	\N	1.5873	chart
6538	ACCESSCORP	2026-01-26	22.05	\N	\N	\N	\N	-1.5625	chart
6539	ACCESSCORP	2026-01-27	22.5	\N	\N	\N	\N	2.0408	chart
6540	ACCESSCORP	2026-01-28	22.6	\N	\N	\N	\N	0.4444	chart
6541	ACCESSCORP	2026-01-29	22.8	\N	\N	\N	\N	0.885	chart
6542	ACCESSCORP	2026-01-30	22.6	\N	\N	\N	\N	-0.8772	chart
6543	ACCESSCORP	2026-02-02	22.55	\N	\N	\N	\N	-0.2212	chart
6544	ACCESSCORP	2026-02-03	22.75	\N	\N	\N	\N	0.8869	chart
6545	ACCESSCORP	2026-02-04	22.8	\N	\N	\N	\N	0.2198	chart
6546	ACCESSCORP	2026-02-05	23	\N	\N	\N	\N	0.8772	chart
6547	ACCESSCORP	2026-02-06	23	\N	\N	\N	\N	0	chart
6548	ACCESSCORP	2026-02-09	23.2	\N	\N	\N	\N	0.8696	chart
6549	ACCESSCORP	2026-02-10	24.1	\N	\N	\N	\N	3.8793	chart
6550	ACCESSCORP	2026-02-11	24	\N	\N	\N	\N	-0.4149	chart
6551	ACCESSCORP	2026-02-12	24.15	\N	\N	\N	\N	0.625	chart
6552	ACCESSCORP	2026-02-13	24.8	\N	\N	\N	\N	2.6915	chart
6553	ACCESSCORP	2026-02-16	27	\N	\N	\N	\N	8.871	chart
6554	ACCESSCORP	2026-02-17	25.75	\N	\N	\N	\N	-4.6296	chart
6555	ACCESSCORP	2026-02-18	25	\N	\N	\N	\N	-2.9126	chart
6556	ACCESSCORP	2026-02-19	26	\N	\N	\N	\N	4	chart
6557	ACCESSCORP	2026-02-20	25.9	\N	\N	\N	\N	-0.3846	chart
6558	ACCESSCORP	2026-02-23	25.85	\N	\N	\N	\N	-0.1931	chart
6559	ACCESSCORP	2026-02-24	27	\N	\N	\N	\N	4.4487	chart
6560	ACCESSCORP	2026-02-25	26.6	\N	\N	\N	\N	-1.4815	chart
6561	ACCESSCORP	2026-02-26	26.2	\N	\N	\N	\N	-1.5038	chart
6562	ACCESSCORP	2026-02-27	26.5	\N	\N	\N	\N	1.145	chart
6563	ACCESSCORP	2026-03-02	25.95	\N	\N	\N	\N	-2.0755	chart
6564	ACCESSCORP	2026-03-03	26.5	\N	\N	\N	\N	2.1195	chart
6565	ACCESSCORP	2026-03-04	26	\N	\N	\N	\N	-1.8868	chart
6566	ACCESSCORP	2026-03-05	26	\N	\N	\N	\N	0	chart
6567	ACCESSCORP	2026-03-06	25.95	\N	\N	\N	\N	-0.1923	chart
6568	ACCESSCORP	2026-03-09	25	\N	\N	\N	\N	-3.6609	chart
6569	ACCESSCORP	2026-03-10	25	\N	\N	\N	\N	0	chart
6570	ACCESSCORP	2026-03-11	25	\N	\N	\N	\N	0	chart
6571	ACCESSCORP	2026-03-12	24.9	\N	\N	\N	\N	-0.4	chart
6572	ACCESSCORP	2026-03-13	24.9	\N	\N	\N	\N	0	chart
6573	ACCESSCORP	2026-03-16	25.3	\N	\N	\N	\N	1.6064	chart
6574	ACCESSCORP	2026-03-17	26	\N	\N	\N	\N	2.7668	chart
6575	ACCESSCORP	2026-03-18	25.7	\N	\N	\N	\N	-1.1538	chart
7068	UBA	2026-03-23	48.4	\N	\N	\N	\N	-0.7179	chart
7069	GTCO	2026-03-23	105	\N	\N	\N	\N	-8.1767	chart
7070	PRESCO	2026-03-23	1871.2	\N	\N	\N	\N	9.9994	chart
7071	OANDO	2026-03-23	50	\N	\N	\N	\N	6.0445	chart
7072	MTNN	2026-03-23	709	\N	\N	\N	\N	-6.4644	chart
7073	DANGCEM	2026-03-23	810	\N	\N	\N	\N	0	chart
7074	ARADEL	2026-03-23	1210.3	\N	\N	\N	\N	0	chart
7075	FIDSON	2026-03-23	105.35	\N	\N	\N	\N	0	chart
7076	NNFM	2026-03-23	79.4	\N	\N	\N	\N	0	chart
7077	OKOMUOIL	2026-03-23	1765	\N	\N	\N	\N	0	chart
7078	CUSTODIAN	2026-03-23	78.5	\N	\N	\N	\N	0	chart
7079	BETAGLAS	2026-03-23	498.5	\N	\N	\N	\N	0	chart
7080	SEPLAT	2026-03-23	9099.9	\N	\N	\N	\N	0	chart
7081	BUACEMENT	2026-03-23	326.7	\N	\N	\N	\N	0	chart
7082	MTNN	2026-03-24	701.1	\N	\N	\N	\N	-1.1142	chart
7083	UBA	2026-03-24	47.9	\N	\N	\N	\N	-1.0331	chart
7084	OKOMUOIL	2026-03-24	1765	\N	\N	\N	\N	0	chart
7085	OANDO	2026-03-24	49.95	\N	\N	\N	\N	-0.1	chart
7086	BUACEMENT	2026-03-24	326.7	\N	\N	\N	\N	0	chart
7087	ARADEL	2026-03-24	1210.3	\N	\N	\N	\N	0	chart
7088	FIDSON	2026-03-24	105.35	\N	\N	\N	\N	0	chart
7089	BETAGLAS	2026-03-24	498.5	\N	\N	\N	\N	0	chart
7091	PRESCO	2026-03-24	1980	\N	\N	\N	\N	5.8145	chart
7090	DANGCEM	2026-03-24	810	\N	\N	\N	\N	0	chart
7093	GTCO	2026-03-24	111	\N	\N	\N	\N	5.7143	chart
7094	GTCO	2026-03-25	114.55	\N	\N	\N	\N	3.1982	chart
7095	ARADEL	2026-03-25	1210.3	\N	\N	\N	\N	0	chart
7096	DANGCEM	2026-03-25	810	\N	\N	\N	\N	0	chart
7097	CUSTODIAN	2026-03-24	78.5	\N	\N	\N	\N	0	chart
7098	CUSTODIAN	2026-03-25	77	\N	\N	\N	\N	-1.9108	chart
7099	PRESCO	2026-03-25	1980	\N	\N	\N	\N	0	chart
7100	MTNN	2026-03-25	718	\N	\N	\N	\N	2.4105	chart
7101	OANDO	2026-03-25	49.95	\N	\N	\N	\N	0	chart
7102	NNFM	2026-03-24	79.4	\N	\N	\N	\N	0	chart
7103	OKOMUOIL	2026-03-25	1765	\N	\N	\N	\N	0	chart
7104	BETAGLAS	2026-03-25	498.5	\N	\N	\N	\N	0	chart
7106	BUACEMENT	2026-03-25	326.7	\N	\N	\N	\N	0	chart
7107	UBA	2026-03-25	47.2	\N	\N	\N	\N	-1.4614	chart
7109	ACCESSCORP	2026-03-23	25.9	\N	\N	\N	\N	0.7782	chart
7110	ACCESSCORP	2026-03-24	26	\N	\N	\N	\N	0.3861	chart
7111	ACCESSCORP	2026-03-25	26.05	\N	\N	\N	\N	0.1923	chart
7112	FIDELITYBK	2025-03-26	19.15	\N	\N	\N	\N	\N	chart
7113	FIDELITYBK	2025-03-27	19.15	\N	\N	\N	\N	0	chart
7114	FIDELITYBK	2025-03-28	19	\N	\N	\N	\N	-0.7833	chart
7115	FIDELITYBK	2025-04-02	19.05	\N	\N	\N	\N	0.2632	chart
7116	FIDELITYBK	2025-04-03	19.5	\N	\N	\N	\N	2.3622	chart
7117	FIDELITYBK	2025-04-04	19.95	\N	\N	\N	\N	2.3077	chart
7118	FIDELITYBK	2025-04-07	18.05	\N	\N	\N	\N	-9.5238	chart
7119	FIDELITYBK	2025-04-08	18.5	\N	\N	\N	\N	2.4931	chart
7120	FIDELITYBK	2025-04-09	17.9	\N	\N	\N	\N	-3.2432	chart
7121	FIDELITYBK	2025-04-10	19.5	\N	\N	\N	\N	8.9385	chart
7122	FIDELITYBK	2025-04-11	19.4	\N	\N	\N	\N	-0.5128	chart
7123	FIDELITYBK	2025-04-14	18.2	\N	\N	\N	\N	-6.1856	chart
7124	FIDELITYBK	2025-04-15	18.3	\N	\N	\N	\N	0.5495	chart
7125	FIDELITYBK	2025-04-16	18.2	\N	\N	\N	\N	-0.5464	chart
7126	FIDELITYBK	2025-04-17	19.25	\N	\N	\N	\N	5.7692	chart
7127	FIDELITYBK	2025-04-22	18.7	\N	\N	\N	\N	-2.8571	chart
7128	FIDELITYBK	2025-04-23	20.25	\N	\N	\N	\N	8.2888	chart
7129	FIDELITYBK	2025-04-24	20	\N	\N	\N	\N	-1.2346	chart
7130	FIDELITYBK	2025-04-25	20.05	\N	\N	\N	\N	0.25	chart
7131	FIDELITYBK	2025-04-28	20.15	\N	\N	\N	\N	0.4988	chart
7132	FIDELITYBK	2025-04-29	20.25	\N	\N	\N	\N	0.4963	chart
7133	FIDELITYBK	2025-04-30	19.95	\N	\N	\N	\N	-1.4815	chart
7134	FIDELITYBK	2025-05-02	20.35	\N	\N	\N	\N	2.005	chart
7135	FIDELITYBK	2025-05-05	20.1	\N	\N	\N	\N	-1.2285	chart
7136	FIDELITYBK	2025-05-06	20	\N	\N	\N	\N	-0.4975	chart
7137	FIDELITYBK	2025-05-07	20.3	\N	\N	\N	\N	1.5	chart
7138	FIDELITYBK	2025-05-08	20.25	\N	\N	\N	\N	-0.2463	chart
7139	FIDELITYBK	2025-05-09	20	\N	\N	\N	\N	-1.2346	chart
7140	FIDELITYBK	2025-05-12	19.6	\N	\N	\N	\N	-2	chart
7141	FIDELITYBK	2025-05-13	21	\N	\N	\N	\N	7.1429	chart
7142	FIDELITYBK	2025-05-14	21	\N	\N	\N	\N	0	chart
7143	FIDELITYBK	2025-05-15	21	\N	\N	\N	\N	0	chart
7144	FIDELITYBK	2025-05-16	20.8	\N	\N	\N	\N	-0.9524	chart
7145	FIDELITYBK	2025-05-19	20	\N	\N	\N	\N	-3.8462	chart
7146	FIDELITYBK	2025-05-20	19	\N	\N	\N	\N	-5	chart
7147	FIDELITYBK	2025-05-21	18.65	\N	\N	\N	\N	-1.8421	chart
7148	FIDELITYBK	2025-05-22	17.35	\N	\N	\N	\N	-6.9705	chart
7149	FIDELITYBK	2025-05-23	18.65	\N	\N	\N	\N	7.4928	chart
7150	FIDELITYBK	2025-05-26	18.2	\N	\N	\N	\N	-2.4129	chart
7151	FIDELITYBK	2025-05-27	18.5	\N	\N	\N	\N	1.6484	chart
7152	FIDELITYBK	2025-05-28	18.5	\N	\N	\N	\N	0	chart
7153	FIDELITYBK	2025-05-29	19.4	\N	\N	\N	\N	4.8649	chart
7154	FIDELITYBK	2025-05-30	19.4	\N	\N	\N	\N	0	chart
7155	FIDELITYBK	2025-06-02	19	\N	\N	\N	\N	-2.0619	chart
7156	FIDELITYBK	2025-06-03	19	\N	\N	\N	\N	0	chart
7157	FIDELITYBK	2025-06-04	19	\N	\N	\N	\N	0	chart
7158	FIDELITYBK	2025-06-05	19.25	\N	\N	\N	\N	1.3158	chart
7159	FIDELITYBK	2025-06-10	19.75	\N	\N	\N	\N	2.5974	chart
7160	FIDELITYBK	2025-06-11	19.7	\N	\N	\N	\N	-0.2532	chart
7161	FIDELITYBK	2025-06-13	19.25	\N	\N	\N	\N	-2.2843	chart
7162	FIDELITYBK	2025-06-16	18.3	\N	\N	\N	\N	-4.9351	chart
7163	FIDELITYBK	2025-06-17	18.2	\N	\N	\N	\N	-0.5464	chart
7164	FIDELITYBK	2025-06-18	18.55	\N	\N	\N	\N	1.9231	chart
7165	FIDELITYBK	2025-06-19	19.2	\N	\N	\N	\N	3.504	chart
7166	FIDELITYBK	2025-06-20	19.4	\N	\N	\N	\N	1.0417	chart
7167	FIDELITYBK	2025-06-23	19	\N	\N	\N	\N	-2.0619	chart
7168	FIDELITYBK	2025-06-24	19.75	\N	\N	\N	\N	3.9474	chart
7169	FIDELITYBK	2025-06-25	20	\N	\N	\N	\N	1.2658	chart
7170	FIDELITYBK	2025-06-26	20	\N	\N	\N	\N	0	chart
7171	FIDELITYBK	2025-06-27	20	\N	\N	\N	\N	0	chart
7172	FIDELITYBK	2025-06-30	20	\N	\N	\N	\N	0	chart
7173	FIDELITYBK	2025-07-01	20	\N	\N	\N	\N	0	chart
7174	FIDELITYBK	2025-07-02	20	\N	\N	\N	\N	0	chart
7175	FIDELITYBK	2025-07-03	20	\N	\N	\N	\N	0	chart
7176	FIDELITYBK	2025-07-04	20	\N	\N	\N	\N	0	chart
7177	FIDELITYBK	2025-07-07	20	\N	\N	\N	\N	0	chart
7178	FIDELITYBK	2025-07-08	20	\N	\N	\N	\N	0	chart
7179	FIDELITYBK	2025-07-09	20.1	\N	\N	\N	\N	0.5	chart
7180	FIDELITYBK	2025-07-10	20.3	\N	\N	\N	\N	0.995	chart
7181	FIDELITYBK	2025-07-11	21.2	\N	\N	\N	\N	4.4335	chart
7182	FIDELITYBK	2025-07-14	21	\N	\N	\N	\N	-0.9434	chart
7183	FIDELITYBK	2025-07-16	21.55	\N	\N	\N	\N	2.619	chart
7184	FIDELITYBK	2025-07-17	21.1	\N	\N	\N	\N	-2.0882	chart
7185	FIDELITYBK	2025-07-18	20.85	\N	\N	\N	\N	-1.1848	chart
7186	FIDELITYBK	2025-07-21	21.5	\N	\N	\N	\N	3.1175	chart
7187	FIDELITYBK	2025-07-22	21.7	\N	\N	\N	\N	0.9302	chart
7188	FIDELITYBK	2025-07-23	21.3	\N	\N	\N	\N	-1.8433	chart
7189	FIDELITYBK	2025-07-24	20.6	\N	\N	\N	\N	-3.2864	chart
7190	FIDELITYBK	2025-07-25	21.2	\N	\N	\N	\N	2.9126	chart
7191	FIDELITYBK	2025-07-28	21	\N	\N	\N	\N	-0.9434	chart
7192	FIDELITYBK	2025-07-29	20.5	\N	\N	\N	\N	-2.381	chart
7193	FIDELITYBK	2025-07-30	21	\N	\N	\N	\N	2.439	chart
7194	FIDELITYBK	2025-07-31	21.05	\N	\N	\N	\N	0.2381	chart
7195	FIDELITYBK	2025-08-01	21.2	\N	\N	\N	\N	0.7126	chart
7196	FIDELITYBK	2025-08-04	21.2	\N	\N	\N	\N	0	chart
7197	FIDELITYBK	2025-08-05	21.5	\N	\N	\N	\N	1.4151	chart
7198	FIDELITYBK	2025-08-06	21.4	\N	\N	\N	\N	-0.4651	chart
7199	FIDELITYBK	2025-08-07	21.1	\N	\N	\N	\N	-1.4019	chart
7200	FIDELITYBK	2025-08-08	21.1	\N	\N	\N	\N	0	chart
7201	FIDELITYBK	2025-08-11	21.2	\N	\N	\N	\N	0.4739	chart
7202	FIDELITYBK	2025-08-12	21	\N	\N	\N	\N	-0.9434	chart
7203	FIDELITYBK	2025-08-13	21	\N	\N	\N	\N	0	chart
7204	FIDELITYBK	2025-08-14	21	\N	\N	\N	\N	0	chart
7205	FIDELITYBK	2025-08-15	20.95	\N	\N	\N	\N	-0.2381	chart
7206	FIDELITYBK	2025-08-18	20.65	\N	\N	\N	\N	-1.432	chart
7207	FIDELITYBK	2025-08-19	20.85	\N	\N	\N	\N	0.9685	chart
7208	FIDELITYBK	2025-08-20	20.7	\N	\N	\N	\N	-0.7194	chart
7209	FIDELITYBK	2025-08-21	20.75	\N	\N	\N	\N	0.2415	chart
7210	FIDELITYBK	2025-08-22	20.9	\N	\N	\N	\N	0.7229	chart
7211	FIDELITYBK	2025-08-25	20.85	\N	\N	\N	\N	-0.2392	chart
7212	FIDELITYBK	2025-08-26	21.25	\N	\N	\N	\N	1.9185	chart
7213	FIDELITYBK	2025-08-27	21.4	\N	\N	\N	\N	0.7059	chart
7214	FIDELITYBK	2025-08-28	21.3	\N	\N	\N	\N	-0.4673	chart
7215	FIDELITYBK	2025-08-29	21.3	\N	\N	\N	\N	0	chart
7216	FIDELITYBK	2025-09-01	21	\N	\N	\N	\N	-1.4085	chart
7217	FIDELITYBK	2025-09-02	21.15	\N	\N	\N	\N	0.7143	chart
7218	FIDELITYBK	2025-09-03	21.05	\N	\N	\N	\N	-0.4728	chart
7219	FIDELITYBK	2025-09-04	21	\N	\N	\N	\N	-0.2375	chart
7220	FIDELITYBK	2025-09-08	20.4	\N	\N	\N	\N	-2.8571	chart
7221	FIDELITYBK	2025-09-09	20.55	\N	\N	\N	\N	0.7353	chart
7222	FIDELITYBK	2025-09-10	20.6	\N	\N	\N	\N	0.2433	chart
7223	FIDELITYBK	2025-09-11	20.65	\N	\N	\N	\N	0.2427	chart
7224	FIDELITYBK	2025-09-12	21.05	\N	\N	\N	\N	1.937	chart
7225	FIDELITYBK	2025-09-15	21	\N	\N	\N	\N	-0.2375	chart
7226	FIDELITYBK	2025-09-16	20.55	\N	\N	\N	\N	-2.1429	chart
7227	FIDELITYBK	2025-09-17	20.7	\N	\N	\N	\N	0.7299	chart
7228	FIDELITYBK	2025-09-18	20.75	\N	\N	\N	\N	0.2415	chart
7229	FIDELITYBK	2025-09-19	20.75	\N	\N	\N	\N	0	chart
7230	FIDELITYBK	2025-09-22	20.65	\N	\N	\N	\N	-0.4819	chart
7231	FIDELITYBK	2025-09-23	20.75	\N	\N	\N	\N	0.4843	chart
7232	FIDELITYBK	2025-09-24	20.6	\N	\N	\N	\N	-0.7229	chart
7233	FIDELITYBK	2025-09-25	20.5	\N	\N	\N	\N	-0.4854	chart
7234	FIDELITYBK	2025-09-26	18.45	\N	\N	\N	\N	-10	chart
7235	FIDELITYBK	2025-09-29	19.95	\N	\N	\N	\N	8.1301	chart
7236	FIDELITYBK	2025-09-30	21	\N	\N	\N	\N	5.2632	chart
7237	FIDELITYBK	2025-10-02	20.5	\N	\N	\N	\N	-2.381	chart
7238	FIDELITYBK	2025-10-03	20.5	\N	\N	\N	\N	0	chart
7239	FIDELITYBK	2025-10-06	20.95	\N	\N	\N	\N	2.1951	chart
7240	FIDELITYBK	2025-10-07	20.05	\N	\N	\N	\N	-4.2959	chart
7241	FIDELITYBK	2025-10-08	21	\N	\N	\N	\N	4.7382	chart
7242	FIDELITYBK	2025-10-09	20.5	\N	\N	\N	\N	-2.381	chart
7243	FIDELITYBK	2025-10-10	20.3	\N	\N	\N	\N	-0.9756	chart
7244	FIDELITYBK	2025-10-13	20.05	\N	\N	\N	\N	-1.2315	chart
7245	FIDELITYBK	2025-10-14	20.1	\N	\N	\N	\N	0.2494	chart
7246	FIDELITYBK	2025-10-15	20.15	\N	\N	\N	\N	0.2488	chart
7247	FIDELITYBK	2025-10-16	20.1	\N	\N	\N	\N	-0.2481	chart
7248	FIDELITYBK	2025-10-17	20	\N	\N	\N	\N	-0.4975	chart
7249	FIDELITYBK	2025-10-20	19.9	\N	\N	\N	\N	-0.5	chart
7250	FIDELITYBK	2025-10-21	19.85	\N	\N	\N	\N	-0.2513	chart
7251	FIDELITYBK	2025-10-22	19.8	\N	\N	\N	\N	-0.2519	chart
7252	FIDELITYBK	2025-10-23	19.8	\N	\N	\N	\N	0	chart
7253	FIDELITYBK	2025-10-24	19.85	\N	\N	\N	\N	0.2525	chart
7254	FIDELITYBK	2025-10-27	18.85	\N	\N	\N	\N	-5.0378	chart
7255	FIDELITYBK	2025-10-28	19	\N	\N	\N	\N	0.7958	chart
7256	FIDELITYBK	2025-10-29	18.8	\N	\N	\N	\N	-1.0526	chart
7257	FIDELITYBK	2025-10-30	19	\N	\N	\N	\N	1.0638	chart
7258	FIDELITYBK	2025-10-31	19	\N	\N	\N	\N	0	chart
7259	FIDELITYBK	2025-11-03	19.1	\N	\N	\N	\N	0.5263	chart
7260	FIDELITYBK	2025-11-04	19	\N	\N	\N	\N	-0.5236	chart
7261	FIDELITYBK	2025-11-05	19	\N	\N	\N	\N	0	chart
7262	FIDELITYBK	2025-11-06	18.75	\N	\N	\N	\N	-1.3158	chart
7263	FIDELITYBK	2025-11-07	18.7	\N	\N	\N	\N	-0.2667	chart
7264	FIDELITYBK	2025-11-10	19.6	\N	\N	\N	\N	4.8128	chart
7265	FIDELITYBK	2025-11-11	17.9	\N	\N	\N	\N	-8.6735	chart
7266	FIDELITYBK	2025-11-12	19.05	\N	\N	\N	\N	6.4246	chart
7267	FIDELITYBK	2025-11-13	19.1	\N	\N	\N	\N	0.2625	chart
7268	FIDELITYBK	2025-11-14	19.05	\N	\N	\N	\N	-0.2618	chart
7269	FIDELITYBK	2025-11-17	19.2	\N	\N	\N	\N	0.7874	chart
7270	FIDELITYBK	2025-11-18	19.15	\N	\N	\N	\N	-0.2604	chart
7271	FIDELITYBK	2025-11-19	19.15	\N	\N	\N	\N	0	chart
7272	FIDELITYBK	2025-11-20	19	\N	\N	\N	\N	-0.7833	chart
7273	FIDELITYBK	2025-11-21	19.05	\N	\N	\N	\N	0.2632	chart
7274	FIDELITYBK	2025-11-24	19.05	\N	\N	\N	\N	0	chart
7275	FIDELITYBK	2025-11-25	19.1	\N	\N	\N	\N	0.2625	chart
7276	FIDELITYBK	2025-11-26	19.05	\N	\N	\N	\N	-0.2618	chart
7277	FIDELITYBK	2025-11-27	19.15	\N	\N	\N	\N	0.5249	chart
7278	FIDELITYBK	2025-11-28	19.1	\N	\N	\N	\N	-0.2611	chart
7279	FIDELITYBK	2025-12-01	19	\N	\N	\N	\N	-0.5236	chart
7280	FIDELITYBK	2025-12-02	19	\N	\N	\N	\N	0	chart
7281	FIDELITYBK	2025-12-03	19	\N	\N	\N	\N	0	chart
7282	FIDELITYBK	2025-12-04	19	\N	\N	\N	\N	0	chart
7283	FIDELITYBK	2025-12-05	19.2	\N	\N	\N	\N	1.0526	chart
7284	FIDELITYBK	2025-12-08	19	\N	\N	\N	\N	-1.0417	chart
7285	FIDELITYBK	2025-12-09	19	\N	\N	\N	\N	0	chart
7286	FIDELITYBK	2025-12-10	18.95	\N	\N	\N	\N	-0.2632	chart
7287	FIDELITYBK	2025-12-11	18.95	\N	\N	\N	\N	0	chart
7288	FIDELITYBK	2025-12-12	18.8	\N	\N	\N	\N	-0.7916	chart
7289	FIDELITYBK	2025-12-15	18.8	\N	\N	\N	\N	0	chart
7290	FIDELITYBK	2025-12-16	19	\N	\N	\N	\N	1.0638	chart
7291	FIDELITYBK	2025-12-17	19	\N	\N	\N	\N	0	chart
7292	FIDELITYBK	2025-12-18	19	\N	\N	\N	\N	0	chart
7293	FIDELITYBK	2025-12-19	19	\N	\N	\N	\N	0	chart
7294	FIDELITYBK	2025-12-22	19.05	\N	\N	\N	\N	0.2632	chart
7295	FIDELITYBK	2025-12-23	19	\N	\N	\N	\N	-0.2625	chart
7296	FIDELITYBK	2025-12-24	19	\N	\N	\N	\N	0	chart
7297	FIDELITYBK	2025-12-29	19	\N	\N	\N	\N	0	chart
7298	FIDELITYBK	2025-12-30	19	\N	\N	\N	\N	0	chart
7299	FIDELITYBK	2025-12-31	19	\N	\N	\N	\N	0	chart
7300	FIDELITYBK	2026-01-02	19	\N	\N	\N	\N	0	chart
7301	FIDELITYBK	2026-01-05	19.95	\N	\N	\N	\N	5	chart
7302	FIDELITYBK	2026-01-06	19.5	\N	\N	\N	\N	-2.2556	chart
7303	FIDELITYBK	2026-01-07	19.05	\N	\N	\N	\N	-2.3077	chart
7304	FIDELITYBK	2026-01-08	19	\N	\N	\N	\N	-0.2625	chart
7305	FIDELITYBK	2026-01-09	19.05	\N	\N	\N	\N	0.2632	chart
7306	FIDELITYBK	2026-01-12	19.05	\N	\N	\N	\N	0	chart
7307	FIDELITYBK	2026-01-13	19.8	\N	\N	\N	\N	3.937	chart
7308	FIDELITYBK	2026-01-14	19.7	\N	\N	\N	\N	-0.5051	chart
7309	FIDELITYBK	2026-01-15	19.95	\N	\N	\N	\N	1.269	chart
7310	FIDELITYBK	2026-01-16	20.15	\N	\N	\N	\N	1.0025	chart
7311	FIDELITYBK	2026-01-19	20.2	\N	\N	\N	\N	0.2481	chart
7312	FIDELITYBK	2026-01-20	20.25	\N	\N	\N	\N	0.2475	chart
7313	FIDELITYBK	2026-01-21	20.55	\N	\N	\N	\N	1.4815	chart
7314	FIDELITYBK	2026-01-22	20.05	\N	\N	\N	\N	-2.4331	chart
7315	FIDELITYBK	2026-01-23	19	\N	\N	\N	\N	-5.2369	chart
7316	FIDELITYBK	2026-01-26	18.9	\N	\N	\N	\N	-0.5263	chart
7317	FIDELITYBK	2026-01-27	19.75	\N	\N	\N	\N	4.4974	chart
7318	FIDELITYBK	2026-01-28	19	\N	\N	\N	\N	-3.7975	chart
7319	FIDELITYBK	2026-01-29	19	\N	\N	\N	\N	0	chart
7320	FIDELITYBK	2026-01-30	18.6	\N	\N	\N	\N	-2.1053	chart
7321	FIDELITYBK	2026-02-02	18.05	\N	\N	\N	\N	-2.957	chart
7322	FIDELITYBK	2026-02-03	18	\N	\N	\N	\N	-0.277	chart
7323	FIDELITYBK	2026-02-04	18.25	\N	\N	\N	\N	1.3889	chart
7324	FIDELITYBK	2026-02-05	19.4	\N	\N	\N	\N	6.3014	chart
7325	FIDELITYBK	2026-02-06	19.35	\N	\N	\N	\N	-0.2577	chart
7326	FIDELITYBK	2026-02-09	19.2	\N	\N	\N	\N	-0.7752	chart
7327	FIDELITYBK	2026-02-10	19.95	\N	\N	\N	\N	3.9062	chart
7328	FIDELITYBK	2026-02-11	19.55	\N	\N	\N	\N	-2.005	chart
7329	FIDELITYBK	2026-02-12	20	\N	\N	\N	\N	2.3018	chart
7330	FIDELITYBK	2026-02-13	20.9	\N	\N	\N	\N	4.5	chart
7331	FIDELITYBK	2026-02-16	21.3	\N	\N	\N	\N	1.9139	chart
7332	FIDELITYBK	2026-02-17	20.8	\N	\N	\N	\N	-2.3474	chart
7333	FIDELITYBK	2026-02-18	20.45	\N	\N	\N	\N	-1.6827	chart
7334	FIDELITYBK	2026-02-19	20.2	\N	\N	\N	\N	-1.2225	chart
7335	FIDELITYBK	2026-02-20	20.4	\N	\N	\N	\N	0.9901	chart
7336	FIDELITYBK	2026-02-23	20.4	\N	\N	\N	\N	0	chart
7337	FIDELITYBK	2026-02-24	20.5	\N	\N	\N	\N	0.4902	chart
7338	FIDELITYBK	2026-02-25	20.4	\N	\N	\N	\N	-0.4878	chart
7339	FIDELITYBK	2026-02-26	20.2	\N	\N	\N	\N	-0.9804	chart
7340	FIDELITYBK	2026-02-27	19.95	\N	\N	\N	\N	-1.2376	chart
7341	FIDELITYBK	2026-03-02	20	\N	\N	\N	\N	0.2506	chart
7342	FIDELITYBK	2026-03-03	20	\N	\N	\N	\N	0	chart
7343	FIDELITYBK	2026-03-04	20	\N	\N	\N	\N	0	chart
7344	FIDELITYBK	2026-03-05	19.8	\N	\N	\N	\N	-1	chart
7345	FIDELITYBK	2026-03-06	19.6	\N	\N	\N	\N	-1.0101	chart
7346	FIDELITYBK	2026-03-09	19.75	\N	\N	\N	\N	0.7653	chart
7347	FIDELITYBK	2026-03-10	19.8	\N	\N	\N	\N	0.2532	chart
7348	FIDELITYBK	2026-03-11	19.1	\N	\N	\N	\N	-3.5354	chart
7349	FIDELITYBK	2026-03-12	19.2	\N	\N	\N	\N	0.5236	chart
7350	FIDELITYBK	2026-03-13	19.2	\N	\N	\N	\N	0	chart
7351	FIDELITYBK	2026-03-16	19.3	\N	\N	\N	\N	0.5208	chart
7352	FIDELITYBK	2026-03-17	19.35	\N	\N	\N	\N	0.2591	chart
7353	FIDELITYBK	2026-03-18	19.15	\N	\N	\N	\N	-1.0336	chart
7354	FIDELITYBK	2026-03-23	19.7	\N	\N	\N	\N	2.8721	chart
7355	FIDELITYBK	2026-03-24	19.35	\N	\N	\N	\N	-1.7766	chart
7356	FIDELITYBK	2026-03-25	19	\N	\N	\N	\N	-1.8088	chart
7357	GTCO	2026-03-26	115.4	\N	\N	\N	\N	0.742	chart
7358	OANDO	2026-03-26	48.5	\N	\N	\N	\N	-2.9029	chart
7359	UBA	2026-03-26	46.75	\N	\N	\N	\N	-0.9534	chart
7360	MTNN	2026-03-26	719.1	\N	\N	\N	\N	0.1532	chart
7361	NNFM	2026-03-25	79.4	\N	\N	\N	\N	0	chart
7362	FIDELITYBK	2026-03-26	19.05	\N	\N	\N	\N	0.2632	chart
7363	ACCESSCORP	2026-03-26	26	\N	\N	\N	\N	-0.1919	chart
7364	WAPCO	2025-03-27	73.8	\N	\N	\N	\N	\N	chart
7365	WAPCO	2025-03-28	73.8	\N	\N	\N	\N	0	chart
7366	WAPCO	2025-04-02	72.6	\N	\N	\N	\N	-1.626	chart
7367	WAPCO	2025-04-03	72.6	\N	\N	\N	\N	0	chart
7368	WAPCO	2025-04-04	72.6	\N	\N	\N	\N	0	chart
7369	WAPCO	2025-04-07	72.6	\N	\N	\N	\N	0	chart
7370	WAPCO	2025-04-08	72	\N	\N	\N	\N	-0.8264	chart
7371	WAPCO	2025-04-09	71.75	\N	\N	\N	\N	-0.3472	chart
7372	WAPCO	2025-04-10	71.75	\N	\N	\N	\N	0	chart
7373	WAPCO	2025-04-11	71.5	\N	\N	\N	\N	-0.3484	chart
7374	WAPCO	2025-04-14	71.5	\N	\N	\N	\N	0	chart
7375	WAPCO	2025-04-15	71.5	\N	\N	\N	\N	0	chart
7376	WAPCO	2025-04-16	71.5	\N	\N	\N	\N	0	chart
7377	WAPCO	2025-04-17	71.5	\N	\N	\N	\N	0	chart
7378	WAPCO	2025-04-22	72	\N	\N	\N	\N	0.6993	chart
7379	WAPCO	2025-04-23	72	\N	\N	\N	\N	0	chart
7380	WAPCO	2025-04-24	79.2	\N	\N	\N	\N	10	chart
7381	WAPCO	2025-04-25	81	\N	\N	\N	\N	2.2727	chart
7382	WAPCO	2025-04-28	82.7	\N	\N	\N	\N	2.0988	chart
7383	WAPCO	2025-04-29	82.7	\N	\N	\N	\N	0	chart
7384	WAPCO	2025-04-30	82.7	\N	\N	\N	\N	0	chart
7385	WAPCO	2025-05-02	82.7	\N	\N	\N	\N	0	chart
7386	WAPCO	2025-05-05	82.7	\N	\N	\N	\N	0	chart
7387	WAPCO	2025-05-06	82.7	\N	\N	\N	\N	0	chart
7388	WAPCO	2025-05-07	82.95	\N	\N	\N	\N	0.3023	chart
7389	WAPCO	2025-05-08	82.95	\N	\N	\N	\N	0	chart
7390	WAPCO	2025-05-09	81.95	\N	\N	\N	\N	-1.2055	chart
7391	WAPCO	2025-05-12	77.95	\N	\N	\N	\N	-4.881	chart
7392	WAPCO	2025-05-13	77.95	\N	\N	\N	\N	0	chart
7393	WAPCO	2025-05-14	78	\N	\N	\N	\N	0.0641	chart
7394	WAPCO	2025-05-15	78.25	\N	\N	\N	\N	0.3205	chart
7395	WAPCO	2025-05-16	79.75	\N	\N	\N	\N	1.9169	chart
7396	WAPCO	2025-05-19	79.75	\N	\N	\N	\N	0	chart
7397	WAPCO	2025-05-20	79.75	\N	\N	\N	\N	0	chart
7398	WAPCO	2025-05-21	79	\N	\N	\N	\N	-0.9404	chart
7399	WAPCO	2025-05-22	79	\N	\N	\N	\N	0	chart
7400	WAPCO	2025-05-23	82.4	\N	\N	\N	\N	4.3038	chart
7401	WAPCO	2025-05-26	82.4	\N	\N	\N	\N	0	chart
7402	WAPCO	2025-05-27	84.95	\N	\N	\N	\N	3.0947	chart
7403	WAPCO	2025-05-28	85.25	\N	\N	\N	\N	0.3531	chart
7404	WAPCO	2025-05-29	85.25	\N	\N	\N	\N	0	chart
7405	WAPCO	2025-05-30	85.25	\N	\N	\N	\N	0	chart
7406	WAPCO	2025-06-02	85.25	\N	\N	\N	\N	0	chart
7407	WAPCO	2025-06-03	84.65	\N	\N	\N	\N	-0.7038	chart
7408	WAPCO	2025-06-04	84.6	\N	\N	\N	\N	-0.0591	chart
7409	WAPCO	2025-06-05	86	\N	\N	\N	\N	1.6548	chart
7410	WAPCO	2025-06-10	86	\N	\N	\N	\N	0	chart
7411	WAPCO	2025-06-11	86	\N	\N	\N	\N	0	chart
7412	WAPCO	2025-06-13	86	\N	\N	\N	\N	0	chart
7413	WAPCO	2025-06-16	86	\N	\N	\N	\N	0	chart
7414	WAPCO	2025-06-17	86.95	\N	\N	\N	\N	1.1047	chart
7415	WAPCO	2025-06-18	86	\N	\N	\N	\N	-1.0926	chart
7416	WAPCO	2025-06-19	86	\N	\N	\N	\N	0	chart
7417	WAPCO	2025-06-20	86	\N	\N	\N	\N	0	chart
7418	WAPCO	2025-06-23	86	\N	\N	\N	\N	0	chart
7419	WAPCO	2025-06-24	93.85	\N	\N	\N	\N	9.1279	chart
7420	WAPCO	2025-06-25	90	\N	\N	\N	\N	-4.1023	chart
7421	WAPCO	2025-06-26	89.9	\N	\N	\N	\N	-0.1111	chart
7422	WAPCO	2025-06-27	89.9	\N	\N	\N	\N	0	chart
7423	WAPCO	2025-06-30	87.2	\N	\N	\N	\N	-3.0033	chart
7424	WAPCO	2025-07-01	87.5	\N	\N	\N	\N	0.344	chart
7425	WAPCO	2025-07-02	90.15	\N	\N	\N	\N	3.0286	chart
7426	WAPCO	2025-07-03	92	\N	\N	\N	\N	2.0521	chart
7427	WAPCO	2025-07-04	92.5	\N	\N	\N	\N	0.5435	chart
7428	WAPCO	2025-07-07	92.5	\N	\N	\N	\N	0	chart
7429	WAPCO	2025-07-08	92.5	\N	\N	\N	\N	0	chart
7430	WAPCO	2025-07-09	98	\N	\N	\N	\N	5.9459	chart
7431	WAPCO	2025-07-10	99	\N	\N	\N	\N	1.0204	chart
7432	WAPCO	2025-07-11	106	\N	\N	\N	\N	7.0707	chart
7433	WAPCO	2025-07-14	106	\N	\N	\N	\N	0	chart
7434	WAPCO	2025-07-16	107	\N	\N	\N	\N	0.9434	chart
7435	WAPCO	2025-07-17	114	\N	\N	\N	\N	6.5421	chart
7436	WAPCO	2025-07-18	114	\N	\N	\N	\N	0	chart
7437	WAPCO	2025-07-21	116	\N	\N	\N	\N	1.7544	chart
7438	WAPCO	2025-07-22	126	\N	\N	\N	\N	8.6207	chart
7439	WAPCO	2025-07-23	120.55	\N	\N	\N	\N	-4.3254	chart
7440	WAPCO	2025-07-24	122.5	\N	\N	\N	\N	1.6176	chart
7441	WAPCO	2025-07-25	125.05	\N	\N	\N	\N	2.0816	chart
7442	WAPCO	2025-07-28	129	\N	\N	\N	\N	3.1587	chart
7443	WAPCO	2025-07-29	140.3	\N	\N	\N	\N	8.7597	chart
7444	WAPCO	2025-07-30	151	\N	\N	\N	\N	7.6265	chart
7445	WAPCO	2025-07-31	149	\N	\N	\N	\N	-1.3245	chart
7446	WAPCO	2025-08-01	149	\N	\N	\N	\N	0	chart
7447	WAPCO	2025-08-04	149	\N	\N	\N	\N	0	chart
7448	WAPCO	2025-08-05	146.5	\N	\N	\N	\N	-1.6779	chart
7449	WAPCO	2025-08-06	146.5	\N	\N	\N	\N	0	chart
7450	WAPCO	2025-08-07	146.5	\N	\N	\N	\N	0	chart
7451	WAPCO	2025-08-08	145.5	\N	\N	\N	\N	-0.6826	chart
7452	WAPCO	2025-08-11	132	\N	\N	\N	\N	-9.2784	chart
7453	WAPCO	2025-08-12	140	\N	\N	\N	\N	6.0606	chart
7454	WAPCO	2025-08-13	137	\N	\N	\N	\N	-2.1429	chart
7455	WAPCO	2025-08-14	138	\N	\N	\N	\N	0.7299	chart
7456	WAPCO	2025-08-15	138	\N	\N	\N	\N	0	chart
7457	WAPCO	2025-08-18	137	\N	\N	\N	\N	-0.7246	chart
7458	WAPCO	2025-08-19	137.05	\N	\N	\N	\N	0.0365	chart
7459	WAPCO	2025-08-20	137.05	\N	\N	\N	\N	0	chart
7460	WAPCO	2025-08-21	137.05	\N	\N	\N	\N	0	chart
7461	WAPCO	2025-08-22	134.55	\N	\N	\N	\N	-1.8242	chart
7462	WAPCO	2025-08-25	134.55	\N	\N	\N	\N	0	chart
7463	WAPCO	2025-08-26	134	\N	\N	\N	\N	-0.4088	chart
7464	WAPCO	2025-08-27	134	\N	\N	\N	\N	0	chart
7465	WAPCO	2025-08-28	130	\N	\N	\N	\N	-2.9851	chart
7466	WAPCO	2025-08-29	130	\N	\N	\N	\N	0	chart
7467	WAPCO	2025-09-01	123	\N	\N	\N	\N	-5.3846	chart
7468	WAPCO	2025-09-02	110.85	\N	\N	\N	\N	-9.878	chart
7469	WAPCO	2025-09-03	113	\N	\N	\N	\N	1.9396	chart
7470	WAPCO	2025-09-04	113	\N	\N	\N	\N	0	chart
7471	WAPCO	2025-09-08	113	\N	\N	\N	\N	0	chart
7472	WAPCO	2025-09-09	119.95	\N	\N	\N	\N	6.1504	chart
7473	WAPCO	2025-09-10	128	\N	\N	\N	\N	6.7111	chart
7474	WAPCO	2025-09-11	128	\N	\N	\N	\N	0	chart
7475	WAPCO	2025-09-12	128	\N	\N	\N	\N	0	chart
7476	WAPCO	2025-09-15	128	\N	\N	\N	\N	0	chart
7477	WAPCO	2025-09-16	128	\N	\N	\N	\N	0	chart
7478	WAPCO	2025-09-17	125	\N	\N	\N	\N	-2.3438	chart
7479	WAPCO	2025-09-18	125	\N	\N	\N	\N	0	chart
7480	WAPCO	2025-09-19	125	\N	\N	\N	\N	0	chart
7481	WAPCO	2025-09-22	125	\N	\N	\N	\N	0	chart
7482	WAPCO	2025-09-23	120	\N	\N	\N	\N	-4	chart
7483	WAPCO	2025-09-24	122.1	\N	\N	\N	\N	1.75	chart
7484	WAPCO	2025-09-25	122.1	\N	\N	\N	\N	0	chart
7485	WAPCO	2025-09-26	130	\N	\N	\N	\N	6.4701	chart
7486	WAPCO	2025-09-29	126.05	\N	\N	\N	\N	-3.0385	chart
7487	WAPCO	2025-09-30	125.1	\N	\N	\N	\N	-0.7537	chart
7488	WAPCO	2025-10-02	125	\N	\N	\N	\N	-0.0799	chart
7489	WAPCO	2025-10-03	126.5	\N	\N	\N	\N	1.2	chart
7490	WAPCO	2025-10-06	126.5	\N	\N	\N	\N	0	chart
7491	WAPCO	2025-10-07	129	\N	\N	\N	\N	1.9763	chart
7492	WAPCO	2025-10-08	128.75	\N	\N	\N	\N	-0.1938	chart
7493	WAPCO	2025-10-09	129.65	\N	\N	\N	\N	0.699	chart
7494	WAPCO	2025-10-10	129.95	\N	\N	\N	\N	0.2314	chart
7495	WAPCO	2025-10-13	129	\N	\N	\N	\N	-0.7311	chart
7496	WAPCO	2025-10-14	129.3	\N	\N	\N	\N	0.2326	chart
7497	WAPCO	2025-10-15	130	\N	\N	\N	\N	0.5414	chart
7498	WAPCO	2025-10-16	133	\N	\N	\N	\N	2.3077	chart
7499	WAPCO	2025-10-17	135.5	\N	\N	\N	\N	1.8797	chart
7500	WAPCO	2025-10-20	136	\N	\N	\N	\N	0.369	chart
7501	WAPCO	2025-10-21	137.5	\N	\N	\N	\N	1.1029	chart
7502	WAPCO	2025-10-22	138.5	\N	\N	\N	\N	0.7273	chart
7503	WAPCO	2025-10-23	150.45	\N	\N	\N	\N	8.6282	chart
7504	WAPCO	2025-10-24	145	\N	\N	\N	\N	-3.6225	chart
7505	WAPCO	2025-10-27	145	\N	\N	\N	\N	0	chart
7506	WAPCO	2025-10-28	142.5	\N	\N	\N	\N	-1.7241	chart
7507	WAPCO	2025-10-29	142.5	\N	\N	\N	\N	0	chart
7508	WAPCO	2025-10-30	140	\N	\N	\N	\N	-1.7544	chart
7509	WAPCO	2025-10-31	140	\N	\N	\N	\N	0	chart
7510	WAPCO	2025-11-03	140	\N	\N	\N	\N	0	chart
7511	WAPCO	2025-11-04	140	\N	\N	\N	\N	0	chart
7512	WAPCO	2025-11-05	130	\N	\N	\N	\N	-7.1429	chart
7513	WAPCO	2025-11-06	132	\N	\N	\N	\N	1.5385	chart
7514	WAPCO	2025-11-07	131	\N	\N	\N	\N	-0.7576	chart
7515	WAPCO	2025-11-10	131	\N	\N	\N	\N	0	chart
7516	WAPCO	2025-11-11	131	\N	\N	\N	\N	0	chart
7517	WAPCO	2025-11-12	134.95	\N	\N	\N	\N	3.0153	chart
7518	WAPCO	2025-11-13	134	\N	\N	\N	\N	-0.704	chart
7519	WAPCO	2025-11-14	134	\N	\N	\N	\N	0	chart
7520	WAPCO	2025-11-17	134	\N	\N	\N	\N	0	chart
7521	WAPCO	2025-11-18	134	\N	\N	\N	\N	0	chart
7522	WAPCO	2025-11-19	134	\N	\N	\N	\N	0	chart
7523	WAPCO	2025-11-20	134	\N	\N	\N	\N	0	chart
7524	WAPCO	2025-11-21	134	\N	\N	\N	\N	0	chart
7525	WAPCO	2025-11-24	134	\N	\N	\N	\N	0	chart
7526	WAPCO	2025-11-25	134	\N	\N	\N	\N	0	chart
7527	WAPCO	2025-11-26	133	\N	\N	\N	\N	-0.7463	chart
7528	WAPCO	2025-11-27	132.8	\N	\N	\N	\N	-0.1504	chart
7529	WAPCO	2025-11-28	134	\N	\N	\N	\N	0.9036	chart
7530	WAPCO	2025-12-01	133.4	\N	\N	\N	\N	-0.4478	chart
7531	WAPCO	2025-12-02	133.4	\N	\N	\N	\N	0	chart
7532	WAPCO	2025-12-03	133.4	\N	\N	\N	\N	0	chart
7533	WAPCO	2025-12-04	138	\N	\N	\N	\N	3.4483	chart
7534	WAPCO	2025-12-05	138	\N	\N	\N	\N	0	chart
7535	WAPCO	2025-12-08	140.5	\N	\N	\N	\N	1.8116	chart
7536	WAPCO	2025-12-09	140	\N	\N	\N	\N	-0.3559	chart
7537	WAPCO	2025-12-10	140	\N	\N	\N	\N	0	chart
7538	WAPCO	2025-12-11	140	\N	\N	\N	\N	0	chart
7539	WAPCO	2025-12-12	140	\N	\N	\N	\N	0	chart
7540	WAPCO	2025-12-15	140	\N	\N	\N	\N	0	chart
7541	WAPCO	2025-12-16	139.1	\N	\N	\N	\N	-0.6429	chart
7542	WAPCO	2025-12-17	133	\N	\N	\N	\N	-4.3853	chart
7543	WAPCO	2025-12-18	133	\N	\N	\N	\N	0	chart
7544	WAPCO	2025-12-19	133	\N	\N	\N	\N	0	chart
7545	WAPCO	2025-12-22	133	\N	\N	\N	\N	0	chart
7546	WAPCO	2025-12-23	135	\N	\N	\N	\N	1.5038	chart
7547	WAPCO	2025-12-24	134	\N	\N	\N	\N	-0.7407	chart
7548	WAPCO	2025-12-29	136	\N	\N	\N	\N	1.4925	chart
7549	WAPCO	2025-12-30	136	\N	\N	\N	\N	0	chart
7550	WAPCO	2025-12-31	134.5	\N	\N	\N	\N	-1.1029	chart
7551	WAPCO	2026-01-02	134.5	\N	\N	\N	\N	0	chart
7552	WAPCO	2026-01-05	135	\N	\N	\N	\N	0.3717	chart
7553	WAPCO	2026-01-06	140.5	\N	\N	\N	\N	4.0741	chart
7554	WAPCO	2026-01-07	146	\N	\N	\N	\N	3.9146	chart
7555	WAPCO	2026-01-08	147	\N	\N	\N	\N	0.6849	chart
7556	WAPCO	2026-01-09	150	\N	\N	\N	\N	2.0408	chart
7557	WAPCO	2026-01-12	159	\N	\N	\N	\N	6	chart
7558	WAPCO	2026-01-13	160	\N	\N	\N	\N	0.6289	chart
7559	WAPCO	2026-01-14	160	\N	\N	\N	\N	0	chart
7560	WAPCO	2026-01-15	160	\N	\N	\N	\N	0	chart
7561	WAPCO	2026-01-16	157.1	\N	\N	\N	\N	-1.8125	chart
7562	WAPCO	2026-01-19	157.1	\N	\N	\N	\N	0	chart
7563	WAPCO	2026-01-20	157.1	\N	\N	\N	\N	0	chart
7564	WAPCO	2026-01-21	158	\N	\N	\N	\N	0.5729	chart
7565	WAPCO	2026-01-22	150	\N	\N	\N	\N	-5.0633	chart
7566	WAPCO	2026-01-23	156	\N	\N	\N	\N	4	chart
7567	WAPCO	2026-01-26	156	\N	\N	\N	\N	0	chart
7568	WAPCO	2026-01-27	157	\N	\N	\N	\N	0.641	chart
7569	WAPCO	2026-01-28	157	\N	\N	\N	\N	0	chart
7570	WAPCO	2026-01-29	157	\N	\N	\N	\N	0	chart
7571	WAPCO	2026-01-30	157	\N	\N	\N	\N	0	chart
7572	WAPCO	2026-02-02	157	\N	\N	\N	\N	0	chart
7573	WAPCO	2026-02-03	157	\N	\N	\N	\N	0	chart
7574	WAPCO	2026-02-04	165	\N	\N	\N	\N	5.0955	chart
7575	WAPCO	2026-02-05	165	\N	\N	\N	\N	0	chart
7576	WAPCO	2026-02-06	167	\N	\N	\N	\N	1.2121	chart
7577	WAPCO	2026-02-09	169.9	\N	\N	\N	\N	1.7365	chart
7578	WAPCO	2026-02-10	186.8	\N	\N	\N	\N	9.947	chart
7579	WAPCO	2026-02-11	186	\N	\N	\N	\N	-0.4283	chart
7580	WAPCO	2026-02-12	183	\N	\N	\N	\N	-1.6129	chart
7581	WAPCO	2026-02-13	188.5	\N	\N	\N	\N	3.0055	chart
7582	WAPCO	2026-02-16	198	\N	\N	\N	\N	5.0398	chart
7583	WAPCO	2026-02-17	190	\N	\N	\N	\N	-4.0404	chart
7584	WAPCO	2026-02-18	190	\N	\N	\N	\N	0	chart
7585	WAPCO	2026-02-19	194	\N	\N	\N	\N	2.1053	chart
7586	WAPCO	2026-02-20	210	\N	\N	\N	\N	8.2474	chart
7587	WAPCO	2026-02-23	209	\N	\N	\N	\N	-0.4762	chart
7588	WAPCO	2026-02-24	210	\N	\N	\N	\N	0.4785	chart
7589	WAPCO	2026-02-25	207	\N	\N	\N	\N	-1.4286	chart
7590	WAPCO	2026-02-26	190	\N	\N	\N	\N	-8.2126	chart
7591	WAPCO	2026-02-27	200	\N	\N	\N	\N	5.2632	chart
7592	WAPCO	2026-03-02	207.5	\N	\N	\N	\N	3.75	chart
7593	WAPCO	2026-03-03	210	\N	\N	\N	\N	1.2048	chart
7594	WAPCO	2026-03-04	210	\N	\N	\N	\N	0	chart
7595	WAPCO	2026-03-05	210	\N	\N	\N	\N	0	chart
7596	WAPCO	2026-03-06	210	\N	\N	\N	\N	0	chart
7597	WAPCO	2026-03-09	210	\N	\N	\N	\N	0	chart
7598	WAPCO	2026-03-10	200	\N	\N	\N	\N	-4.7619	chart
7599	WAPCO	2026-03-11	203.4	\N	\N	\N	\N	1.7	chart
7600	WAPCO	2026-03-12	204	\N	\N	\N	\N	0.295	chart
7601	WAPCO	2026-03-13	213.9	\N	\N	\N	\N	4.8529	chart
7602	WAPCO	2026-03-16	218	\N	\N	\N	\N	1.9168	chart
7603	WAPCO	2026-03-17	219	\N	\N	\N	\N	0.4587	chart
7604	WAPCO	2026-03-18	226.5	\N	\N	\N	\N	3.4247	chart
7605	WAPCO	2026-03-23	229.3	\N	\N	\N	\N	1.2362	chart
7606	WAPCO	2026-03-24	229.3	\N	\N	\N	\N	0	chart
7607	WAPCO	2026-03-25	227.5	\N	\N	\N	\N	-0.785	chart
7608	WAPCO	2026-03-26	224	\N	\N	\N	\N	-1.5385	chart
7609	FIDSON	2026-03-25	94.85	\N	\N	\N	\N	-9.9668	chart
\.


--
-- Data for Name: dividend_cache; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.dividend_cache (id, ticker, fetched_at, symbol, currency, ex_dividend_date, record_date, pay_date, cash_amount, dividend_ts) FROM stdin;
15	ACCESSCORP	2026-03-20 03:57:11.481182+00	ACCESSCORP	NGN	Apr 30, 2025	Apr 29, 2025	May 15, 2025	2.05	2026-03-19T23:57:10.856958
10	OANDO	2026-03-26 00:36:15.251843+00	OANDO	NGN	\N	\N	\N	\N	\N
11	OKOMUOIL	2026-03-26 00:36:15.669951+00	OKOMUOIL	NGN	Nov 3, 2025	Oct 31, 2025	Nov 14, 2025	10	2026-03-19T18:50:52.462339
12	PRESCO	2026-03-26 00:36:16.180774+00	PRESCO	NGN	Nov 10, 2025	Nov 7, 2025	Nov 21, 2025	30	2026-03-19T18:50:53.413291
13	SEPLAT	2026-03-26 00:36:16.691107+00	SEPLAT	NGN	Nov 14, 2025	Nov 13, 2025	Nov 28, 2025	108.11475	2026-03-19T18:50:54.425663
14	UBA	2026-03-26 00:36:17.278028+00	UBA	NGN	Oct 6, 2025	Oct 3, 2025	Oct 10, 2025	0.25	2026-03-19T18:50:55.432291
16	WAPCO	2026-03-26 15:20:23.905754+00	WAPCO	NGN	Apr 7, 2026	Apr 3, 2026	Apr 30, 2026	6	2026-03-26T15:20:23.900811
17	FIDELITYBK	2026-03-26 15:20:35.202336+00	FIDELITYBK	NGN	Apr 16, 2025	Apr 15, 2025	Apr 29, 2025	1.25	2026-03-26T15:20:35.106252
1	ARADEL	2026-03-26 00:36:11.084315+00	ARADEL	NGN	Nov 21, 2025	Nov 20, 2025	Nov 28, 2025	10	2026-03-19T18:50:42.230510
2	BETAGLAS	2026-03-26 00:36:11.484262+00	BETAGLAS	NGN	Jun 18, 2025	Jun 17, 2025	Jun 26, 2025	2.95	2026-03-19T18:50:43.227415
3	BUACEMENT	2026-03-26 00:36:11.977235+00	BUACEMENT	NGN	May 11, 2026	May 8, 2026	May 21, 2026	10	2026-03-19T18:50:44.330543
4	CUSTODIAN	2026-03-26 00:36:12.386881+00	CUSTODIAN	NGN	Aug 18, 2025	Aug 15, 2025	Sep 9, 2025	0.25	2026-03-19T18:50:45.442036
5	DANGCEM	2026-03-26 00:36:12.918788+00	DANGCEM	NGN	Jun 18, 2026	Jun 17, 2026	Jul 2, 2026	45	2026-03-19T18:50:46.455400
6	FIDSON	2026-03-26 00:36:13.379914+00	FIDSON	NGN	Jul 14, 2025	Jul 11, 2025	Aug 1, 2025	1	2026-03-19T18:50:47.393516
7	GTCO	2026-03-26 00:36:13.890693+00	GTCO	NGN	Oct 8, 2025	Oct 7, 2025	Oct 15, 2025	1	2026-03-19T18:50:48.402681
8	MTNN	2026-03-26 00:36:14.384975+00	MTNN	NGN	Apr 9, 2026	Apr 8, 2026	May 5, 2026	15	2026-03-19T18:50:49.419256
9	NNFM	2026-03-26 00:36:14.876988+00	NNFM	NGN	Sep 18, 2025	Sep 17, 2025	Sep 26, 2025	0.25	2026-03-19T18:50:50.396214
\.


--
-- Data for Name: financials_cache; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.financials_cache (id, ticker, cache_type, fetched_at, periods, col_a, col_b, col_c, col_d) FROM stdin;
13	ARADEL	balance	2026-03-24 00:04:48.322723+00	["2022", "2023", "2024", "2025"]	[473381537000, 923434561000, 1749835623000, 10418272887000]	[]	[326765634000, 704644581000, 1404109963000, 3478163926000]	[6961002000, 121036633000, 315401982000, -551643202000]
24	BUACEMENT	balance	2026-03-24 00:05:57.325694+00	["2022", "2023", "2024", "2025"]	[874011884000, 1215686377000, 1570351865000, 1856127006000]	[]	[411112542000, 385224150000, 388548235000, 672899646000]	[-191377550000, -307277879000, -494219514000, -246395258000]
68	FIDELITYBK	balance	2026-03-26 15:20:35.305872+00	["2022", "2023", "2024", "2025"]	[3989009000000, 6234688000000, 8821737000000, 10550510000000]	[3674649000000, 5797381000000, 7923863000000, 9497265000000]	[314360000000, 437307000000, 897874000000, 1053245000000]	[43960000000, -196855000000, -169816000000, 231247000000]
15	DANGCEM	earnings	2026-03-26 00:36:48.484251+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[817350000000, 942705000000, 800518000000, 1019977000000, 994659000000, 1076939000000, 1083159000000, 1151947000000]	[6.684634, 4.570857, 5.291069, 13.192693, 12.291248, 18.44514, 13.084885, 16.043039]	[111981000000, 76571000000, 88636000000, 221004000000, 205903000000, 308993000000, 219198000000, 268753000000]	[]
19	BETAGLAS	earnings	2026-03-26 00:37:01.581515+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[24309293000, 23575294000, 31876641000, 37818956000, 41164866000, 37068041000, 36148983000, 34740635000]	[2.39915, 4.833133, 6.631929, 8.848454, 16.660519, 14.516824, 14.198466, 10.393057]	[1439409000, 2899716000, 3978932000, 5308772000, 9995745000, 8709601000, 8518597000, 6235481000]	[]
25	BUACEMENT	earnings	2026-03-26 00:37:03.182107+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[161131448000, 202811578000, 219462332000, 293064492000, 290820966000, 289482962000, 278429739000, 320711233000]	[0.530639, 0.480857, 0.434572, 0.736438, 2.395555, 2.946203, 3.217543, 1.954355]	[17969772000, 16283944000, 14716519000, 24939000000, 81123952000, 99771273000, 108960049000, 66182994999.99999]	[]
7	UBA	earnings	2026-03-26 00:37:13.180346+00	["Q4 2023", "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025"]	[476884000000, 375309000000, 496790000000, 543586000000, 429937000000, 450057000000, 453347000000, 521342000000]	[4.569022, 3.964004, 4.935875, 6.248106, 6.951811, 5.351443, 3.60257, 4.684529]	[156256000000, 135565000000, 168802000000, 213679000000, 237745000000, 183014000000, 137910000000, 192492000000]	[]
63	FIDELITYBK	earnings	2026-03-26 05:31:50.656723+00	["Q4 2023", "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025"]	[82899000000, 107728000000, 155881000000, 255236000000, 197849000000, 221600000000, 209119000000, 181771000000]	[0.241296, 0.982531, 4.830356, 2.52, 0.751488, 1.81476, 0.983612, 1.42]	[7701000000, 31441000000, 66657000000, 126505000000, 53503000000, 91101000000, 49457000000, 71169000000]	[]
11	UBA	balance	2026-03-19 23:11:01.260169+00	["2022", "2023", "2024", "2025"]	[10857571000000, 20653197000000, 30323355000000, 32491560000000]	[9935467000000, 18623002000000, 26904716000000, 28190423000000]	[922104000000, 2030195000000, 3418639000000, 4301137000000]	[769367000000, 3024427000000, 3022465000000, 4870416000000]
20	BETAGLAS	balance	2026-03-19 23:55:28.308773+00	["2022", "2023", "2024", "2025"]	[75944552000, 106851898000, 134352196999.99998, 184300543000]	[]	[46263350000, 52005006000, 64791883000, 96481439000]	[6194719000, 2162035000, -16068483000, -19501805000]
12	UBA	cashflow	2026-03-26 14:58:26.001905+00	["Q4 2023", "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025"]	[-13524000000, null, -46326000000, null, -51565000000, -18113000000, -72704000000, -976000000]	[-2270157000000, -1300432000000, -19989000000, -1180309000000, 53680000000, 127895000000, -1444520000000, 3066279000000]	[-3024427000000, -4813479000000, -4238537000000, -5494850000000, -3022465000000, -5260541000000, -4667220000000, -4870416000000]	[]
14	DANGCEM	balance	2026-03-19 23:43:22.521489+00	["2022", "2023", "2024", "2025"]	[2615655000000, 3938725000000, 6403238000000, 6040727000000]	[]	[1078947000000, 1725840000000, 2175245000000, 2620136000000]	[-451803000000, -586127000000, -2213910000000, -792824000000]
29	CUSTODIAN	balance	2026-03-19 23:56:24.238155+00	["2022", "2023", "2024", "2025"]	[212211882000, 269800306999.99997, 407294048000, 1023238840000]	[]	[64900989000, 81466269000, 134526825000.00002, 220804080000]	[19865676000, 22905300000, 40575687000, -21944315000]
31	FIDSON	balance	2026-03-19 23:59:20.058849+00	["2022", "2023", "2024", "2025"]	[42981291000, 61991126000, 73493480000, 80448559000]	[]	[16919278999.999998, 19293728000, 23726312000, 30777685000]	[-12775301000, -17769036000, -27996687000, -28861122000]
46	OANDO	balance	2026-03-23 14:45:06.372488+00	["2022", "2023", "2024", "2025"]	[1252330482000, 2676117927000, 6434159344000, 6704080273000]	[]	[-197205768000, -267178721000.00003, -360979377000, -553825867000]	[-489138920000, -748657214000, -2578274743000, -2595963957000]
36	GTCO	earnings	2026-03-26 00:36:43.987814+00	["Q4 2023", "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025"]	[243825639000, 608726550000, 596844464000, 308244678000, 155456581000, 422858769000, 436531295000, 406396000000]	[6.09149, 16.234447, 15.888532, 6.41, -2.353352, 7.836023, 5.754389, 7.54]	[170695737000, 454921679000, 444974090000, 175875352000, -69551232000, 254485705000, 186808916000, 246777274000]	[]
52	PRESCO	earnings	2026-03-26 00:36:55.179562+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[42545419000, 45474832000, 40548000000, 78936047000, 93785145000, 104951855000, 75764000000, 56688000000]	[24.055588, 14.82, 12.89, 24.303448, 47.57786, 41.264616, 21.94, 27.46]	[24055588000, 14821657000, 12888000000, 24303448000, 47577860000, 41272140000, 21936000000, 27459000000]	[]
35	GTCO	balance	2026-03-19 23:59:47.80839+00	["2022", "2023", "2024", "2025"]	[6446456429000, 9691254678000, 14795706831000, 16659399179000]	[5515307227000, 8214126607000, 12083689217000, 13293480509000]	[931149202000, 1477128071000, 2712017614000, 3365918670000]	[1613845263000, 1968428400000, 4115046294000, 4441206246000]
32	FIDSON	earnings	2026-03-26 00:37:03.175416+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[18884593000, 18368057000, 22476572000, 24459778000, 35015439000, 27628724000, 30437514000, 25979578000]	[0.45, 0.21, 0.84, 1.018917, 1.42, 1.21, 0.85, 0.56]	[1036923000, 475507000, 1928620000, 2338335000, 3250658000, 2774144000, 1949685000, 1333327000]	[]
49	OKOMUOIL	earnings	2026-03-26 00:37:10.074736+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[43482839000, 31524765000, 28941385000, 26732672000, 58110161000, 71724013000, 44116856000, 24201847000]	[15.81, 5.36, 8.54, 12.178755, 22.79, 27.05, 13.41, 3.36]	[15080829000, 5114843000, 8142858000, 11619216000, 21738172000, 25799374000, 12795185000, 3201486000]	[]
39	MTNN	balance	2026-03-20 00:00:33.061533+00	["2022", "2023", "2024", "2025"]	[2539369000000, 3188827000000, 4196991000000, 5403489000000]	[]	[262542000000, -40844000000, -458007000000, 548712000000]	[-979901000000, -1829250000000, -2950553000000, -2119142000000]
64	FIDELITYBK	cashflow	2026-03-26 15:19:38.190723+00	["Q4 2023", "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025"]	[-2778000000, -7865000000, -10835000000, -7672000000, -11726000000, -24356000000, -51954000000, -6220000000]	[-504102000000, -884440000000, 546638000000, 427625000000, -1126361000000, 985622000000, -1493313000000, 403356000000]	[196855000000, 243445000000, 71715000000, -217412000000, 169816000000, -627829000000, -662740000000, -231247000000]	[]
43	NNFM	balance	2026-03-20 00:01:11.779447+00	["2023", "2024", "2025", "2026"]	[17827833000, 17924446000, 30548937000, 31968269000]	[]	[6579568000, 8077739000, 9693366000, 9484280000]	[1548156000, 2945608000, 880166000, 1692420000]
50	OKOMUOIL	balance	2026-03-20 00:02:06.164636+00	["2022", "2023", "2024", "2025"]	[72498290000, 95100383000, 117037938000, 136012419000]	[]	[34033866000, 38874530000, 55478295000, 56054452000]	[-4216071000, -12262386000, -3060833000, -12466087000]
51	PRESCO	balance	2026-03-20 00:03:27.778758+00	["2022", "2023", "2024", "2025"]	[132369448000, 187066954000, 475096189000, 833395000000]	[]	[34160565000.000004, 73911862000, 211184601000, 426660000000]	[-56123743000, -60578381000, -30826236000, 110814000000]
53	SEPLAT	balance	2026-03-20 00:04:27.260729+00	["2022", "2023", "2024", "2025"]	[3332324000, 3395019000, 6827759000, 6082100000]	[]	[1759883000, 1793027000, 1838295000, 1841655000]	[-369892000, -306964000, -972807000, -740288000]
54	SEPLAT	earnings	2026-03-20 00:04:54.348988+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[179820000, 241822000, 293697000, 400829000, 809267000, 588454000, 778908000, 549230000]	[0.001775, 0.067493, -0.003556, 0.187563, 0.034363, 0.005747, 0.115872, 0.113442]	[1045000, 39716000, -2093000, 110371000, 20221000, 3382000, 68481000, 68059000]	[]
60	ACCESSCORP	earnings	2026-03-26 05:30:59.761595+00	["Q4 2023", "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025"]	[612068000000, 482046000000, 643172000000, 519314000000, 661318000000, 571883000000, 555898000000, 650977000000]	[10.308932, 4.3495, 4.868616, 3.18, 4.292555, 3.322912, 0.476133, 4.28]	[366431000000, 154603000000, 172876000000, 113150000000, 178008000000, 173399000000, 24686000000, 228617000000]	[]
37	GTCO	cashflow	2026-03-26 14:57:57.295795+00	["Q4 2023", "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025"]	[-1859920000, -67770329000, 12408558000, -100872847000, 27919794000, -39414010000, -43306298000, -48947270000]	[-200278946000, -155429741000, 544739958999.99994, -87698186000, 723446888000, -1090256692000, 361668678000, 207716682000]	[-1968428400000, -2741769951000, -3718882851000, -4083975509000, -4115046294000, -3440407459000, -4220407062000, -4441206246000]	[]
59	ARADEL	cashflow	2026-03-26 14:58:10.10952+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-12586359000, -36625311000, -29578120000, -57758084000, -29073241000, -19072506000, -68394198000.00001, -29453622000]	[43223623000, 72990738000, 18494916000, 40627684000, 1546679000, 91086962000, -3767094000.000008, -25190123000]	[-253401313000, -339892808000, -401152028000, -315401982000, -259071153000, -213460440000, -205327716000, 551643202000]	[]
62	ACCESSCORP	balance	2026-03-20 03:57:10.990693+00	["2022", "2023", "2024", "2025"]	[14998402000000, 26688831000000, 41498015000000, 52195257000000]	[13767011000000, 24503197000000, 37737837000000, 48215785000000]	[1231391000000, 2185634000000, 3760178000000, 3979472000000]	[1232475000000, 6190912000000, 9684934000000, 8425289000000]
30	CUSTODIAN	cashflow	2026-03-26 14:58:27.002349+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[]	[31290688000, 13346049000, -5826109000, 14527574000, 7001184000, 6964452000, 10047155000, 444879440000]	[-37057892000, -33900773000, -41259175000, -40575687000, -50152023000, -50645706000, -56439234000, 21944315000]	[]
45	NNFM	cashflow	2026-03-26 14:58:27.783625+00	["Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026"]	[-43513000, -1581000, -12338000, null, 18456000, null, null, null]	[-633744000, -1983186000, -1577387000, null, -231963000, 1664205000, -1764217000, 1204976000]	[-2945608000, -4139024999.999999, -2387505000, -1038047000, -880166000, -2544371000, -727232000, -1692420000]	[]
61	ACCESSCORP	cashflow	2026-03-26 15:19:38.311791+00	["Q4 2023", "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025"]	[-52773000000, -70033000000, -27556000000, -7675000000, -154672000000, -41095000000, -50784000000, -8454000000]	[-3508232000000, -4675354000000, 1418670000000, -3830472000000, -5774395000000, 4570106000000, -1259896000000, -3240406000000]	[-6190912000000, -2401285000000, -3102951000000, -5701262000000, -9684934000000, -8821808000000, -5941127000000, -8425289000000]	[]
65	WAPCO	earnings	2026-03-26 15:20:08.408836+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[137772474000, 157803002000, 183920434000, 217262049000, 248350575000, 268626517000, 263508760000, 285818921000]	[0.322389, 1.5, 1.907512, 2.48681, 3.019878, 5.22, 4.662509, 4.06001]	[5192982000, 24157111000, 30725828000, 40069362000, 48643594000, 84033799000, 75102745000, 65340174000]	[]
58	SEPLAT	cashflow	2026-03-20 15:28:03.190357+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-47082000, -55316000, -54637000, -51109000, -40238000, -56247000, -83578000, -86722000]	[-32196000, 102221000, 130724000, -98890000, 176321000, 214080000, 440334000.00000006, 68042000]	[402316000, 383354000, 287599000, 972807000, 819538000, 752628000, 458813000, 740288000]	[]
33	FIDSON	cashflow	2026-03-26 14:58:23.495536+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-522073999.99999994, -1169776000, -1179594000, -821650000, -1176721000, -1505078000, -2378655000, -2769645000]	[-11075870000, 7269518000, -11614698000, 11222663000, -1937228000, 3938068000, 1758242000, 1848727000]	[27046851000, 30654124000, 31386450000, 27996687000, 31040618000, 28416846000, 31615298000, 28861122000]	[]
66	WAPCO	cashflow	2026-03-26 15:20:09.415677+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-4814817000, -22983946000, -22149286000, -24719846000, -10265071000, -18600066000, -24537303000, -21207263000]	[-65502901000, 56472283000, -159741000, 148649036000, -128620672000, 182334239000, -15636091000, 179941820000]	[-72992573000, -91756593000, -87984074000, -235644397000, -103864806000, -208274866000, -205418705000, -386759335000]	[]
9	ARADEL	earnings	2026-03-26 00:36:44.477031+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[101164877000, 167149578000, 109266121000, 203570800000, 199867407000, 168209527000, 170732893000, 158491421000]	[5.099444, 18.866997, 1.43647, 33.94813, 7.771372, 25.493226, 22.63231, 35.690644]	[22156294000, 81974168000, 6241239000, 147499345000, 33765404000.000004, 110764103000, 98333866000, 155070297000]	[]
38	MTNN	earnings	2026-03-26 00:36:50.377184+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[752983000000, 786136000000, 831117000000, 990593000000, 1057973000000, 1321258000000, 1353251000000, 1471954000000]	[-18.632517, -6.08, 0.2, 5.459895, 6.375876, 13.407174, 15.99, 17.294277]	[-390668000000, -127402000000, 4130000000, 114494000000, 133683000000, 281173000000, 335329000000, 362661000000]	[]
47	OANDO	earnings	2026-03-26 00:36:52.571063+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[915419938000, 1115535974000, 1158667246000, 897027838000, 932573600000, 788222650000, 820660794000, 671503536000]	[4.075471, 0.199961, 0.904245, 10.232367, 7.627937, -3.229634, 9.616415, 4.164021]	[59459681000, 2917373000, 13192622000, 149286590000, 111288879000, -47119214000, 140300067000, 39840161000]	[]
44	NNFM	earnings	2026-03-26 00:36:52.985242+00	["Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026"]	[4122718000, 8952126000, 12135163000, 8468361000.000001, 5836798000, 6819573000, 7213572000, 4334965000]	[-0.13059, 1.95, 8.16, 12.96, -13.28933, 1.66, 0.814299, -3.29]	[-23245000, 347707000, 1454738000, 2309421000, -2366790000, 295567000, 145701000, -585721000]	[]
17	DANGCEM	cashflow	2026-03-26 14:58:11.196498+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-44377000000, -36536000000, -104627000000, -228237000000, -41401000000, -124860000000, -295581000000, -399247000000]	[270576000000, 60330000000, 15895000000, 60606000000, 279931000000, 428014000000, 121338000000, 20390000000]	[661581000000, 1029704000000, 1181178000000, 2213910000000, 2007562000000, 2181107000000, 1061563000000, 792824000000]	[]
28	CUSTODIAN	earnings	2026-03-26 00:37:00.672976+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[]	[1.793998, 1.955337, 3.809074, 1.386022, 1.813881, 2.563732, 3.214622, 6.596197]	[10552059000, 11501033000, 22404464000, 8152401000, 8081888000, 17666647000, 18907978000, 23250960000]	[]
56	PRESCO	cashflow	2026-03-26 14:58:21.296234+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-5911801000, -11485439000, -5249760000, -10651709000, -2799961000, -14551831000, 717792000, -24079000000]	[3558116000, 42072673000, -593789000, 11344607000, -49562391000, 88262441000, 75876950000, -9117000000]	[57795058000, 42499347000, 47945568000, 30826236000, 91039289000, 61684587000, 73171000000, -110814000000]	[]
26	BUACEMENT	cashflow	2026-03-26 14:58:21.598871+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-7777021335, -77009833941, -119286459183, -85653584541, -2806740000, -12947595000, -9955749000, -53883509000]	[-39175090077, 16999679792, -14267235462, 151968831747, 66544279000, 67917210000, 60965825000, 176339833000]	[353092406947, 452175124811, 526000829439, 494219514000, 442956495000, 385199463000, 390994878000, 246395258000]	[]
55	OKOMUOIL	cashflow	2026-03-26 14:58:27.003121+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-3285822000, -4021328000, -3270407000, -2661767000, -2134292000, -5745116000, -4958429000, -6716552000]	[23385441000, 1497590000, -4888564000, 18060684000, 35535796000, 14302510000, 13588053000, -1798298000]	[-9306924000, 2754624000, 15330844000, 3060833000, -23296704000, -12622451000, -5284753000, 12466087000]	[]
22	BETAGLAS	cashflow	2026-03-26 14:58:10.303748+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-2067869000, -2484235000, 380939000, -2028899000, -3288171000, -18054915000, -13855437000, -5643726000]	[-71307000.00000024, 6169362000, -5673541000, 23225782000, -1153236999.9999998, -236035000, -2158171000, 6475348000]	[16797981000, 17669520000, 19081414000, 16068483000, 19508902000, 22368736000, 26222678000, 19501805000]	[]
67	WAPCO	balance	2026-03-26 15:20:23.795563+00	["2022", "2023", "2024", "2025"]	[600711473000, 681371573000, 990509585000, 1208024398000]	[]	[416102005000, 435051868000, 504640661000, 693995670000]	[81805645000, 142125092000, 235644397000, 386759335000]
48	OANDO	cashflow	2026-03-26 14:58:15.90649+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-9029411000, -9122914000, -8745858000, 8372174000.000001, -45699294000, 1217760000, -30415743000, -26790612000]	[370259454000, -717928970000, -174362563000, -31774015000, -222675637000, -179271475000, 92065405000, 60805006000]	[661857945000, 1460001545000, 2533182847000, 2578274743000, 2733580177000, 2963367169000, 2651414856000, 2595963957000]	[]
41	MTNN	cashflow	2026-03-26 14:58:19.496422+00	["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"]	[-70609000000, -68465000000, -22569000000, -178257000000, -174310000000, -208156000000, -156794000000, -114775000000]	[312467000000, 81742000000, 176143000000, -41351000000, 266727000000, 306490000000, 446241000000, 643408000000]	[2205435000000, 2179889000000, 2956725000000, 2950553000000, 2976272000000, 2828736000000, 2466692000000, 2119142000000]	[]
\.


--
-- Data for Name: holdings; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.holdings (id, ticker, name, market, shares, avg_cost, sector, is_active, created_at, user_id) FROM stdin;
1	FIDSON	Fidson Healthcare Plc	ngx	15900	40.57	Healthcare	t	2026-03-10 01:58:34.071461+00	1
2	MTNN	MTN Nigeria Communications	ngx	1500	383.86	Telecom	t	2026-03-10 01:58:34.071464+00	1
3	OKOMUOIL	Okomu Oil Palm Plc	ngx	125	963.5	Agro	t	2026-03-10 01:58:34.071464+00	1
4	SEPLAT	Seplat Energy Plc	ngx	70	5099.89	Energy	t	2026-03-10 01:58:34.071465+00	1
5	PRESCO	Presco Plc	ngx	610	1307.52	Agro	t	2026-03-10 01:58:34.071465+00	1
6	DANGCEM	Dangote Cement Plc	ngx	980	520.05	Construction	t	2026-03-10 01:58:34.071465+00	1
7	CUSTODIAN	Custodian Investment Plc	ngx	5600	42	Insurance	t	2026-03-10 01:58:34.071466+00	1
8	BETAGLAS	Beta Glass Plc	ngx	1600	349.32	Manufacturing	t	2026-03-10 01:58:34.071466+00	1
9	ARADEL	Aradel Holdings Plc	ngx	591	778	Energy	t	2026-03-10 01:58:34.071466+00	1
10	GTCO	Guaranty Trust Holding Co	ngx	8700	88.19	Banking	t	2026-03-10 01:58:34.071467+00	1
11	BUACEMENT	BUA Cement Plc	ngx	2360	177	Construction	t	2026-03-10 01:58:34.071467+00	1
12	UBA	United Bank for Africa Plc	ngx	19960	44.04	Banking	t	2026-03-10 01:58:34.071467+00	1
13	OANDO	Oando Plc	ngx	11200	52.78	Energy	t	2026-03-10 01:58:34.071467+00	1
14	NNFM	Northern Nigeria Flour Mills	ngx	120	86	Consumer	t	2026-03-10 01:58:34.071468+00	1
15	TSM	Taiwan Semiconductor	us	0.895883	334.87	Technology	t	2026-03-10 01:58:34.071468+00	1
16	AMZN	Amazon	us	0.7469	200.83	Consumer	t	2026-03-10 01:58:34.071468+00	1
17	NFLX	Netflix	us	0.111657	89.56	Media	t	2026-03-10 01:58:34.071469+00	1
18	MSFT	Microsoft	us	0.498827	400.94	Technology	t	2026-03-10 01:58:34.071469+00	1
19	LLY	Eli Lilly	us	0.143421	1045.87	Healthcare	t	2026-03-10 01:58:34.071469+00	1
20	NVDA	Nvidia	us	1.068779	192.63	Technology	t	2026-03-10 01:58:34.07147+00	1
21	GTCO	Guarantee Trust	ngx	400	62.5	Banking	t	2026-03-15 05:10:28.176064+00	2
22	MTNN	MTN Nigeria	ngx	100000	300	Telecom	t	2026-03-15 05:17:39.373225+00	2
\.


--
-- Data for Name: invite_codes; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.invite_codes (id, code, created_by, used_by, used_at, created_at) FROM stdin;
1	48FC3935	1	2	2026-03-15 05:09:27.520673+00	2026-03-15 04:59:34.065806+00
2	11C5CE1B	1	\N	\N	2026-03-16 03:15:31.832146+00
\.


--
-- Data for Name: portfolio_snapshots; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.portfolio_snapshots (id, ts, ngx_equity_ngn, ngx_cost_ngn, us_equity_usd, us_cost_usd, usdngn, total_usd, user_id) FROM stdin;
1	2026-03-10 02:00:33.215338+00	10912230	6924896.4	1026.8898	1015.8825	1396.3139	8841.9163	1
2	2026-03-10 02:16:39.69757+00	10912230	6924896.4	1026.8898	1015.8825	1396.3139	8841.9163	1
3	2026-03-10 02:31:40.201219+00	10912230	6924896.4	1026.8898	1015.8825	1396.3139	8841.9163	1
4	2026-03-10 02:50:25.59347+00	10912230	6924896.4	1026.8898	1015.8825	1396.3139	8841.9163	1
5	2026-03-10 03:05:26.064582+00	10912230	6924896.4	1026.8898	1015.8825	1396.3139	8841.9163	1
6	2026-03-10 03:21:08.617126+00	10912230	6924896.4	1026.8898	1015.8825	1396.3139	8841.9163	1
7	2026-03-10 03:36:10.0821+00	10912230	6924896.4	1026.8898	1015.8825	1396.3139	8841.9163	1
8	2026-03-10 03:56:10.229264+00	10912230	6924896.4	1026.8898	1015.8825	1396.3139	8841.9163	1
9	2026-03-10 04:14:13.03361+00	10912230	6924896.4	1026.8898	1015.8825	1396.3139	8841.9163	1
10	2026-03-10 22:02:16.993102+00	10804332	6924896.4	1025.356	1015.8825	1396.3139	8763.1091	1
11	2026-03-10 22:17:17.092258+00	10804332	6924896.4	1025.356	1015.8825	1396.3139	8763.1091	1
12	2026-03-10 22:39:19.875344+00	10804332	6924896.4	1025.356	1015.8825	1396.3139	8763.1091	1
13	2026-03-10 22:55:44.125437+00	10804332	6924896.4	1025.356	1015.8825	1396.3139	8763.1091	1
14	2026-03-10 23:13:27.048578+00	10804332	6924896.4	1025.356	1015.8825	1396.3139	8763.1091	1
15	2026-03-10 23:33:26.918436+00	10804332	6924896.4	1025.356	1015.8825	1396.3139	8763.1091	1
16	2026-03-10 23:49:08.969307+00	10804332	6924896.4	1025.356	1015.8825	1396.3139	8763.1091	1
17	2026-03-11 00:09:07.588639+00	10804332	6924896.4	1025.356	1015.8825	1396.3139	8763.1091	1
18	2026-03-11 00:24:08.902904+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
19	2026-03-11 00:42:26.710833+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
20	2026-03-11 00:57:26.783328+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
21	2026-03-11 01:13:09.313237+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
22	2026-03-11 01:33:09.082236+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
23	2026-03-11 01:53:07.313038+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
24	2026-03-11 02:08:08.867969+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
25	2026-03-11 02:23:09.72413+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
26	2026-03-11 04:47:48.294788+00	0	6924896.4	1025.356	1015.8825	1394.8201	1025.356	1
27	2026-03-11 05:04:11.232632+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
28	2026-03-11 05:19:14.612622+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
29	2026-03-11 05:36:42.072207+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
30	2026-03-11 05:51:42.44876+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
31	2026-03-11 06:07:11.559913+00	10804332	6924896.4	1025.356	1015.8825	1394.8201	8771.3956	1
32	2026-03-11 16:30:51.692705+00	10710381	6924896.4	1029.2428	1015.8825	1394.8201	8707.9254	1
33	2026-03-11 16:48:34.265607+00	10710381	6924896.4	1029.4502	1015.8825	1394.8201	8708.1328	1
34	2026-03-11 17:03:47.741996+00	10710381	6924896.4	1030.2909	1015.8825	1394.8201	8708.9735	1
35	2026-03-11 17:22:56.949913+00	10710381	6924896.4	1030.4547	1015.8825	1394.8201	8709.1373	1
36	2026-03-11 17:43:03.861975+00	10710381	6924896.4	1026.7103	1015.8825	1394.8201	8705.3929	1
37	2026-03-11 18:03:10.575405+00	10710381	6924896.4	1028.1383	1015.8825	1394.8201	8706.8209	1
38	2026-03-11 18:23:03.659986+00	10710381	6924896.4	1027.7991	1015.8825	1394.8201	8706.4817	1
39	2026-03-11 18:38:03.809098+00	10710381	6924896.4	1029.4698	1015.8825	1394.8201	8708.1524	1
40	2026-03-11 18:58:03.462422+00	10710381	6924896.4	1029.8644	1015.8825	1394.8201	8708.547	1
41	2026-03-11 19:13:03.503936+00	10710381	6924896.4	1028.1942	1015.8825	1394.8201	8706.8768	1
42	2026-03-11 19:28:03.622471+00	10710381	6924896.4	1028.7953	1015.8825	1394.8201	8707.4779	1
43	2026-03-11 19:43:04.131186+00	10710381	6924896.4	1029.7964	1015.8825	1394.8201	8708.479	1
44	2026-03-11 19:58:04.145816+00	10710381	6924896.4	1030.4482	1015.8825	1394.8201	8709.1308	1
45	2026-03-11 20:18:04.174782+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
46	2026-03-11 20:38:03.803827+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
47	2026-03-11 20:58:04.247254+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
48	2026-03-11 21:18:03.977484+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
49	2026-03-11 21:33:04.367901+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
50	2026-03-11 21:53:04.045317+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
51	2026-03-11 22:08:04.16837+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
52	2026-03-11 22:28:04.667212+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
53	2026-03-11 23:13:08.277289+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
54	2026-03-11 23:34:14.490045+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
55	2026-03-11 23:53:04.161582+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
56	2026-03-12 00:13:04.278793+00	10710381	6924896.4	1031.2559	1015.8825	1394.8201	8709.9385	1
57	2026-03-12 00:39:49.68349+00	10710381	6924896.4	1031.2559	1015.8825	1382.907	8776.0868	1
58	2026-03-12 00:59:25.04408+00	10710381	6924896.4	1031.2559	1015.8825	1382.907	8776.0868	1
59	2026-03-14 00:12:25.147895+00	10896532	6924896.4	1000.0765	1015.8825	1390.2353	8837.9813	1
60	2026-03-14 00:27:26.190018+00	10896532	6924896.4	1000.0765	1015.8825	1370.1907	8952.6426	1
61	2026-03-14 00:44:20.99103+00	10896532	6924896.4	1000.0765	1015.8825	1370.1907	8952.6426	1
62	2026-03-14 01:03:08.89766+00	10896532	6924896.4	1000.0765	1015.8825	1370.1907	8952.6426	1
63	2026-03-14 01:19:31.276554+00	10896532	6924896.4	1000.0765	1015.8825	1370.1907	8952.6426	1
64	2026-03-14 01:43:54.847545+00	10896532	6924896.4	1000.0765	1015.8825	1370.1907	8952.6426	1
65	2026-03-14 02:00:43.423245+00	10896532	6924896.4	1000.0765	1015.8825	1370.1907	8952.6426	1
66	2026-03-14 02:16:09.897714+00	10896532	6924896.4	1000.0765	1015.8825	1370.1907	8952.6426	1
67	2026-03-14 03:17:57.847667+00	10896532	6924896.4	1000.0765	1015.8825	1370.1907	8952.6426	1
68	2026-03-14 03:42:23.770625+00	10896532	6924896.4	1000.0765	1015.8825	1370.1907	8952.6426	1
69	2026-03-15 03:48:59.648496+00	10896532	6924896.4	1000.0765	1015.8825	1371.9189	8942.6247	1
70	2026-03-15 04:47:13.773414+00	10896532	6924896.4	1000.0765	1015.8825	1371.9189	8942.6247	1
71	2026-03-15 05:04:30.224246+00	10896532	6924896.4	1000.0765	1015.8825	1371.9189	8942.6247	1
72	2026-03-15 05:09:29.395999+00	0	0	0	0	1371.9189	0	2
73	2026-03-15 05:22:26.407941+00	10896532	6924896.4	1000.0765	1015.8825	1371.9189	8942.6247	1
74	2026-03-15 05:25:58.428859+00	77957000	30025000	0	0	1371.9189	56823.3298	2
75	2026-03-15 05:43:25.858899+00	77957000	30025000	0	0	1371.9189	56823.3298	2
76	2026-03-15 06:00:44.140442+00	77957000	30025000	0	0	1371.9189	56823.3298	2
77	2026-03-15 06:16:19.263621+00	77957000	30025000	0	0	1371.9189	56823.3298	2
78	2026-03-15 06:53:49.193407+00	10896532	6924896.4	1000.0765	1015.8825	1371.9189	8942.6247	1
79	2026-03-15 07:13:11.979887+00	10896532	6924896.4	1000.0765	1015.8825	1371.9189	8942.6247	1
80	2026-03-16 03:15:50.399554+00	10896532	6924896.4	1000.0765	1015.8825	1384.4641	8870.654	1
81	2026-03-18 02:12:49.668612+00	11028693	6924896.4	1008.3377	1015.8825	1359.0259	9123.483	1
82	2026-03-18 02:27:53.278448+00	11028693	6924896.4	1008.3377	1015.8825	1359.0259	9123.483	1
83	2026-03-18 02:43:53.586459+00	11028693	6924896.4	1008.3377	1015.8825	1359.0259	9123.483	1
84	2026-03-18 03:00:47.360396+00	11028693	6924896.4	1008.3377	1015.8825	1359.0259	9123.483	1
85	2026-03-18 03:44:39.760157+00	11028693	6924896.4	1008.3377	1015.8825	1359.0259	9123.483	1
86	2026-03-18 06:05:14.987925+00	11028693	6924896.4	1008.3377	1015.8825	1359.0259	9123.483	1
87	2026-03-18 13:19:19.494669+00	11028693	6924896.4	1008.3377	1015.8825	1359.0259	9123.483	1
88	2026-03-18 17:01:52.969888+00	10730156.3	6924896.4	997.6361	1015.8825	1359.0259	8893.1118	1
89	2026-03-18 21:58:35.924345+00	10730156.3	6924896.4	991.4515	1015.8825	1359.0259	8886.9272	1
90	2026-03-18 22:13:36.47299+00	10730156.3	6924896.4	991.4515	1015.8825	1359.0259	8886.9272	1
91	2026-03-18 23:09:00.860341+00	10730156.3	6924896.4	991.4515	1015.8825	1359.0259	8886.9272	1
92	2026-03-18 23:28:39.512665+00	10730156.3	6924896.4	991.4515	1015.8825	1359.0259	8886.9272	1
93	2026-03-18 23:43:41.968943+00	10730156.3	6924896.4	991.4515	1015.8825	1359.0259	8886.9272	1
94	2026-03-19 00:03:39.32302+00	10730156.3	6924896.4	991.4515	1015.8825	1359.0259	8886.9272	1
95	2026-03-19 00:18:39.661643+00	10730156.3	6924896.4	991.4515	1015.8825	1357.265	8897.1711	1
96	2026-03-19 00:59:24.345706+00	10730156.3	6924896.4	991.4515	1015.8825	1357.265	8897.1711	1
97	2026-03-19 01:18:39.214303+00	10730156.3	6924896.4	991.4515	1015.8825	1357.265	8897.1711	1
98	2026-03-19 01:38:36.78438+00	10730156.3	6924896.4	991.4515	1015.8825	1357.265	8897.1711	1
99	2026-03-19 15:18:07.677546+00	10730156.3	6924896.4	984.2277	1015.8825	1356.1527	8896.431	1
100	2026-03-19 17:17:17.610883+00	10730156.3	6924896.4	977.727	1015.8825	1356.1527	8889.9303	1
101	2026-03-19 22:34:50.218185+00	10730156.3	6924896.4	986.1661	1015.8825	1356.1527	8898.3694	1
102	2026-03-19 22:50:39.862154+00	10730156.3	6924896.4	986.1661	1015.8825	1356.1527	8898.3694	1
103	2026-03-19 23:05:39.887199+00	10730156.3	6924896.4	986.1661	1015.8825	1356.1527	8898.3694	1
104	2026-03-19 23:22:47.358837+00	10730156.3	6924896.4	986.1661	1015.8825	1356.1527	8898.3694	1
105	2026-03-19 23:40:49.954716+00	10730156.3	6924896.4	986.1661	1015.8825	1356.1527	8898.3694	1
106	2026-03-20 00:00:30.852959+00	10730156.3	6924896.4	986.1661	1015.8825	1356.1527	8898.3694	1
107	2026-03-20 00:16:59.178425+00	10730156.3	6924896.4	986.1661	1015.8825	1356.1527	8898.3694	1
108	2026-03-20 00:35:39.844725+00	10730156.3	6924896.4	986.1661	1015.8825	1356.1527	8898.3694	1
109	2026-03-20 00:54:06.529668+00	10730156.3	6924896.4	986.1661	1015.8825	1356.1527	8898.3694	1
110	2026-03-20 01:43:30.245467+00	10730156.3	6924896.4	986.1661	1015.8825	1358.1559	8886.6995	1
111	2026-03-20 01:58:53.361182+00	10730156.3	6924896.4	986.1661	1015.8825	1358.1559	8886.6995	1
112	2026-03-20 03:43:43.280124+00	10730156.3	6924896.4	986.1661	1015.8825	1358.1559	8886.6995	1
113	2026-03-20 04:00:22.371026+00	10730156.3	6924896.4	986.1661	1015.8825	1358.1559	8886.6995	1
114	2026-03-20 04:20:43.715002+00	10730156.3	6924896.4	986.1661	1015.8825	1358.1559	8886.6995	1
115	2026-03-20 05:23:39.140228+00	10730156.3	6924896.4	986.1661	1015.8825	1358.1559	8886.6995	1
116	2026-03-20 06:24:42.975336+00	10730156.3	6924896.4	986.1661	1015.8825	1358.1559	8886.6995	1
117	2026-03-20 15:27:34.484631+00	10730156.3	6924896.4	969.354	1015.8825	1358.1559	8869.8874	1
118	2026-03-22 22:29:13.418343+00	10730156.3	6924896.4	963.9446	1015.8825	1356.3947	8874.7366	1
119	2026-03-23 14:43:58.761879+00	10704006.3	6924896.4	988.0544	1015.8825	1356.4429	8879.2867	1
120	2026-03-23 23:57:37.006659+00	10704006.3	6924896.4	979.9547	1015.8825	1356.4429	8871.187	1
121	2026-03-24 19:13:56.379552+00	10800184.3	6924896.4	978.2454	1015.8825	1346.2679	9000.5599	1
122	2026-03-24 19:33:52.971312+00	10800184.3	6924896.4	976.527	1015.8825	1346.2679	8998.8415	1
123	2026-03-24 19:48:54.684091+00	10800184.3	6924896.4	975.1311	1015.8825	1346.2679	8997.4456	1
124	2026-03-24 20:04:42.060529+00	10800184.3	6924896.4	975.0671	1015.8825	1346.2679	8997.3816	1
125	2026-03-24 21:09:45.776738+00	10800184.3	6924896.4	975.1462	1015.8825	1346.2679	8997.4607	1
126	2026-03-26 00:36:10.459909+00	10667097.3	6924896.4	987.4455	1015.8825	1376.1364	8738.9279	1
127	2026-03-26 00:51:11.608868+00	10667097.3	6924896.4	987.4455	1015.8825	1377.0669	8733.6902	1
128	2026-03-26 02:36:45.206433+00	10667097.3	6924896.4	987.4455	1015.8825	1377.0669	8733.6902	1
129	2026-03-26 02:56:42.558798+00	10667097.3	6924896.4	987.4455	1015.8825	1377.0669	8733.6902	1
130	2026-03-26 03:11:44.063599+00	10667097.3	6924896.4	987.4455	1015.8825	1377.0669	8733.6902	1
131	2026-03-26 03:31:43.808264+00	10667097.3	6924896.4	987.4455	1015.8825	1377.0669	8733.6902	1
132	2026-03-26 03:51:42.124382+00	10667097.3	6924896.4	987.4455	1015.8825	1377.0669	8733.6902	1
133	2026-03-26 04:26:44.678434+00	10667097.3	6924896.4	987.4455	1015.8825	1377.0669	8733.6902	1
134	2026-03-26 05:29:03.54408+00	10667097.3	6924896.4	987.4455	1015.8825	1377.0669	8733.6902	1
135	2026-03-26 14:57:41.436274+00	10650920.3	6924896.4	968.173	1015.8825	1377.0669	8702.6703	1
136	2026-03-26 15:14:58.578425+00	10650920.3	6924896.4	969.1653	1015.8825	1377.0669	8703.6626	1
137	2026-03-26 15:34:01.517133+00	10650920.3	6924896.4	966.2875	1015.8825	1377.0669	8700.7848	1
138	2026-03-26 15:54:41.465604+00	10650920.3	6924896.4	968.9562	1015.8825	1377.0669	8703.4535	1
139	2026-03-26 16:18:50.729445+00	10650920.3	6924896.4	966.4163	1015.8825	1377.0669	8700.9136	1
140	2026-03-26 16:35:16.76558+00	10650920.3	6924896.4	963.7892	1015.8825	1377.0669	8698.2865	1
141	2026-03-26 16:50:19.202276+00	10650920.3	6924896.4	962.8423	1015.8825	1377.0669	8697.3396	1
142	2026-03-26 17:05:40.567611+00	10650920.3	6924896.4	962.8371	1015.8825	1377.0669	8697.3344	1
\.


--
-- Data for Name: price_history; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.price_history (id, snapshot_id, ticker, market, price, change_pct) FROM stdin;
1	1	ARADEL	ngx	1340	\N
2	1	BETAGLAS	ngx	498.5	\N
3	1	BUACEMENT	ngx	225	\N
4	1	CUSTODIAN	ngx	81.9	\N
5	1	DANGCEM	ngx	815	\N
6	1	FIDSON	ngx	93.9	\N
7	1	GTCO	ngx	118	\N
8	1	MTNN	ngx	790	\N
9	1	NNFM	ngx	79.4	\N
10	1	OANDO	ngx	54.65	\N
11	1	OKOMUOIL	ngx	1765	\N
12	1	PRESCO	ngx	2315.4	\N
13	1	SEPLAT	ngx	9099.9	\N
14	1	UBA	ngx	47	\N
15	1	AMZN	us	213.49	0.1736
16	1	LLY	us	1008.39	1.8236
17	1	MSFT	us	409.41	0.11
18	1	NFLX	us	98.32	-0.7069
19	1	NVDA	us	182.65	2.6787
20	1	TSM	us	348.7	2.8947
21	2	ARADEL	ngx	1340	\N
22	2	BETAGLAS	ngx	498.5	\N
23	2	BUACEMENT	ngx	225	\N
24	2	CUSTODIAN	ngx	81.9	\N
25	2	DANGCEM	ngx	815	\N
26	2	FIDSON	ngx	93.9	\N
27	2	GTCO	ngx	118	\N
28	2	MTNN	ngx	790	\N
29	2	NNFM	ngx	79.4	\N
30	2	OANDO	ngx	54.65	\N
31	2	OKOMUOIL	ngx	1765	\N
32	2	PRESCO	ngx	2315.4	\N
33	2	SEPLAT	ngx	9099.9	\N
34	2	UBA	ngx	47	\N
35	2	AMZN	us	213.49	0.1736
36	2	LLY	us	1008.39	1.8236
37	2	MSFT	us	409.41	0.11
38	2	NFLX	us	98.32	-0.7069
39	2	NVDA	us	182.65	2.6787
40	2	TSM	us	348.7	2.8947
41	3	ARADEL	ngx	1340	\N
42	3	BETAGLAS	ngx	498.5	\N
43	3	BUACEMENT	ngx	225	\N
44	3	CUSTODIAN	ngx	81.9	\N
45	3	DANGCEM	ngx	815	\N
46	3	FIDSON	ngx	93.9	\N
47	3	GTCO	ngx	118	\N
48	3	MTNN	ngx	790	\N
49	3	NNFM	ngx	79.4	\N
50	3	OANDO	ngx	54.65	\N
51	3	OKOMUOIL	ngx	1765	\N
52	3	PRESCO	ngx	2315.4	\N
53	3	SEPLAT	ngx	9099.9	\N
54	3	UBA	ngx	47	\N
55	3	AMZN	us	213.49	0.1736
56	3	LLY	us	1008.39	1.8236
57	3	MSFT	us	409.41	0.11
58	3	NFLX	us	98.32	-0.7069
59	3	NVDA	us	182.65	2.6787
60	3	TSM	us	348.7	2.8947
61	4	ARADEL	ngx	1340	\N
62	4	BETAGLAS	ngx	498.5	\N
63	4	BUACEMENT	ngx	225	\N
64	4	CUSTODIAN	ngx	81.9	\N
65	4	DANGCEM	ngx	815	\N
66	4	FIDSON	ngx	93.9	\N
67	4	GTCO	ngx	118	\N
68	4	MTNN	ngx	790	\N
69	4	NNFM	ngx	79.4	\N
70	4	OANDO	ngx	54.65	\N
71	4	OKOMUOIL	ngx	1765	\N
72	4	PRESCO	ngx	2315.4	\N
73	4	SEPLAT	ngx	9099.9	\N
74	4	UBA	ngx	47	\N
75	4	AMZN	us	213.49	0.1736
76	4	LLY	us	1008.39	1.8236
77	4	MSFT	us	409.41	0.11
78	4	NFLX	us	98.32	-0.7069
79	4	NVDA	us	182.65	2.6787
80	4	TSM	us	348.7	2.8947
81	5	ARADEL	ngx	1340	\N
82	5	BETAGLAS	ngx	498.5	\N
83	5	BUACEMENT	ngx	225	\N
84	5	CUSTODIAN	ngx	81.9	\N
85	5	DANGCEM	ngx	815	\N
86	5	FIDSON	ngx	93.9	\N
87	5	GTCO	ngx	118	\N
88	5	MTNN	ngx	790	\N
89	5	NNFM	ngx	79.4	\N
90	5	OANDO	ngx	54.65	\N
91	5	OKOMUOIL	ngx	1765	\N
92	5	PRESCO	ngx	2315.4	\N
93	5	SEPLAT	ngx	9099.9	\N
94	5	UBA	ngx	47	\N
95	5	AMZN	us	213.49	0.1736
96	5	LLY	us	1008.39	1.8236
97	5	MSFT	us	409.41	0.11
98	5	NFLX	us	98.32	-0.7069
99	5	NVDA	us	182.65	2.6787
100	5	TSM	us	348.7	2.8947
101	6	ARADEL	ngx	1340	\N
102	6	BETAGLAS	ngx	498.5	\N
103	6	BUACEMENT	ngx	225	\N
104	6	CUSTODIAN	ngx	81.9	\N
105	6	DANGCEM	ngx	815	\N
106	6	FIDSON	ngx	93.9	\N
107	6	GTCO	ngx	118	\N
108	6	MTNN	ngx	790	\N
109	6	NNFM	ngx	79.4	\N
110	6	OANDO	ngx	54.65	\N
111	6	OKOMUOIL	ngx	1765	\N
112	6	PRESCO	ngx	2315.4	\N
113	6	SEPLAT	ngx	9099.9	\N
114	6	UBA	ngx	47	\N
115	6	AMZN	us	213.49	0.1736
116	6	LLY	us	1008.39	1.8236
117	6	MSFT	us	409.41	0.11
118	6	NFLX	us	98.32	-0.7069
119	6	NVDA	us	182.65	2.6787
120	6	TSM	us	348.7	2.8947
121	7	ARADEL	ngx	1340	\N
122	7	BETAGLAS	ngx	498.5	\N
123	7	BUACEMENT	ngx	225	\N
124	7	CUSTODIAN	ngx	81.9	\N
125	7	DANGCEM	ngx	815	\N
126	7	FIDSON	ngx	93.9	\N
127	7	GTCO	ngx	118	\N
128	7	MTNN	ngx	790	\N
129	7	NNFM	ngx	79.4	\N
130	7	OANDO	ngx	54.65	\N
131	7	OKOMUOIL	ngx	1765	\N
132	7	PRESCO	ngx	2315.4	\N
133	7	SEPLAT	ngx	9099.9	\N
134	7	UBA	ngx	47	\N
135	7	AMZN	us	213.49	0.1736
136	7	LLY	us	1008.39	1.8236
137	7	MSFT	us	409.41	0.11
138	7	NFLX	us	98.32	-0.7069
139	7	NVDA	us	182.65	2.6787
140	7	TSM	us	348.7	2.8947
141	8	ARADEL	ngx	1340	\N
142	8	BETAGLAS	ngx	498.5	\N
143	8	BUACEMENT	ngx	225	\N
144	8	CUSTODIAN	ngx	81.9	\N
145	8	DANGCEM	ngx	815	\N
146	8	FIDSON	ngx	93.9	\N
147	8	GTCO	ngx	118	\N
148	8	MTNN	ngx	790	\N
149	8	NNFM	ngx	79.4	\N
150	8	OANDO	ngx	54.65	\N
151	8	OKOMUOIL	ngx	1765	\N
152	8	PRESCO	ngx	2315.4	\N
153	8	SEPLAT	ngx	9099.9	\N
154	8	UBA	ngx	47	\N
155	8	AMZN	us	213.49	0.1736
156	8	LLY	us	1008.39	1.8236
157	8	MSFT	us	409.41	0.11
158	8	NFLX	us	98.32	-0.7069
159	8	NVDA	us	182.65	2.6787
160	8	TSM	us	348.7	2.8947
161	9	ARADEL	ngx	1340	\N
162	9	BETAGLAS	ngx	498.5	\N
163	9	BUACEMENT	ngx	225	\N
164	9	CUSTODIAN	ngx	81.9	\N
165	9	DANGCEM	ngx	815	\N
166	9	FIDSON	ngx	93.9	\N
167	9	GTCO	ngx	118	\N
168	9	MTNN	ngx	790	\N
169	9	NNFM	ngx	79.4	\N
170	9	OANDO	ngx	54.65	\N
171	9	OKOMUOIL	ngx	1765	\N
172	9	PRESCO	ngx	2315.4	\N
173	9	SEPLAT	ngx	9099.9	\N
174	9	UBA	ngx	47	\N
175	9	AMZN	us	213.49	0.1736
176	9	LLY	us	1008.39	1.8236
177	9	MSFT	us	409.41	0.11
178	9	NFLX	us	98.32	-0.7069
179	9	NVDA	us	182.65	2.6787
180	9	TSM	us	348.7	2.8947
181	10	ARADEL	ngx	1340	\N
182	10	BETAGLAS	ngx	498.5	\N
183	10	BUACEMENT	ngx	225	\N
184	10	CUSTODIAN	ngx	79	\N
185	10	DANGCEM	ngx	815	\N
186	10	FIDSON	ngx	93.9	\N
187	10	GTCO	ngx	117	\N
188	10	MTNN	ngx	773	\N
189	10	NNFM	ngx	79.4	\N
190	10	OANDO	ngx	50.5	\N
191	10	OKOMUOIL	ngx	1765	\N
192	10	PRESCO	ngx	2315.4	\N
193	10	SEPLAT	ngx	9099.9	\N
194	10	UBA	ngx	46.45	\N
195	10	AMZN	us	214.33	0.3935
196	10	LLY	us	1001.35	-0.6981
197	10	MSFT	us	405.76	-0.8915
198	10	NFLX	us	96.94	-1.4036
199	10	NVDA	us	184.77	1.1607
200	10	TSM	us	347.09	-0.4617
201	11	ARADEL	ngx	1340	\N
202	11	BETAGLAS	ngx	498.5	\N
203	11	BUACEMENT	ngx	225	\N
204	11	CUSTODIAN	ngx	79	\N
205	11	DANGCEM	ngx	815	\N
206	11	FIDSON	ngx	93.9	\N
207	11	GTCO	ngx	117	\N
208	11	MTNN	ngx	773	\N
209	11	NNFM	ngx	79.4	\N
210	11	OANDO	ngx	50.5	\N
211	11	OKOMUOIL	ngx	1765	\N
212	11	PRESCO	ngx	2315.4	\N
213	11	SEPLAT	ngx	9099.9	\N
214	11	UBA	ngx	46.45	\N
215	11	AMZN	us	214.33	0.3935
216	11	LLY	us	1001.35	-0.6981
217	11	MSFT	us	405.76	-0.8915
218	11	NFLX	us	96.94	-1.4036
219	11	NVDA	us	184.77	1.1607
220	11	TSM	us	347.09	-0.4617
221	12	ARADEL	ngx	1340	\N
222	12	BETAGLAS	ngx	498.5	\N
223	12	BUACEMENT	ngx	225	\N
224	12	CUSTODIAN	ngx	79	\N
225	12	DANGCEM	ngx	815	\N
226	12	FIDSON	ngx	93.9	\N
227	12	GTCO	ngx	117	\N
228	12	MTNN	ngx	773	\N
229	12	NNFM	ngx	79.4	\N
230	12	OANDO	ngx	50.5	\N
231	12	OKOMUOIL	ngx	1765	\N
232	12	PRESCO	ngx	2315.4	\N
233	12	SEPLAT	ngx	9099.9	\N
234	12	UBA	ngx	46.45	\N
235	12	AMZN	us	214.33	0.3935
236	12	LLY	us	1001.35	-0.6981
237	12	MSFT	us	405.76	-0.8915
238	12	NFLX	us	96.94	-1.4036
239	12	NVDA	us	184.77	1.1607
240	12	TSM	us	347.09	-0.4617
241	13	ARADEL	ngx	1340	\N
242	13	BETAGLAS	ngx	498.5	\N
243	13	BUACEMENT	ngx	225	\N
244	13	CUSTODIAN	ngx	79	\N
245	13	DANGCEM	ngx	815	\N
246	13	FIDSON	ngx	93.9	\N
247	13	GTCO	ngx	117	\N
248	13	MTNN	ngx	773	\N
249	13	NNFM	ngx	79.4	\N
250	13	OANDO	ngx	50.5	\N
251	13	OKOMUOIL	ngx	1765	\N
252	13	PRESCO	ngx	2315.4	\N
253	13	SEPLAT	ngx	9099.9	\N
254	13	UBA	ngx	46.45	\N
255	13	AMZN	us	214.33	0.3935
256	13	LLY	us	1001.35	-0.6981
257	13	MSFT	us	405.76	-0.8915
258	13	NFLX	us	96.94	-1.4036
259	13	NVDA	us	184.77	1.1607
260	13	TSM	us	347.09	-0.4617
261	14	ARADEL	ngx	1340	\N
262	14	BETAGLAS	ngx	498.5	\N
263	14	BUACEMENT	ngx	225	\N
264	14	CUSTODIAN	ngx	79	\N
265	14	DANGCEM	ngx	815	\N
266	14	FIDSON	ngx	93.9	\N
267	14	GTCO	ngx	117	\N
268	14	MTNN	ngx	773	\N
269	14	NNFM	ngx	79.4	\N
270	14	OANDO	ngx	50.5	\N
271	14	OKOMUOIL	ngx	1765	\N
272	14	PRESCO	ngx	2315.4	\N
273	14	SEPLAT	ngx	9099.9	\N
274	14	UBA	ngx	46.45	\N
275	14	AMZN	us	214.33	0.3935
276	14	LLY	us	1001.35	-0.6981
277	14	MSFT	us	405.76	-0.8915
278	14	NFLX	us	96.94	-1.4036
279	14	NVDA	us	184.77	1.1607
280	14	TSM	us	347.09	-0.4617
281	15	ARADEL	ngx	1340	\N
282	15	BETAGLAS	ngx	498.5	\N
283	15	BUACEMENT	ngx	225	\N
284	15	CUSTODIAN	ngx	79	\N
285	15	DANGCEM	ngx	815	\N
286	15	FIDSON	ngx	93.9	\N
287	15	GTCO	ngx	117	\N
288	15	MTNN	ngx	773	\N
289	15	NNFM	ngx	79.4	\N
290	15	OANDO	ngx	50.5	\N
291	15	OKOMUOIL	ngx	1765	\N
292	15	PRESCO	ngx	2315.4	\N
293	15	SEPLAT	ngx	9099.9	\N
294	15	UBA	ngx	46.45	\N
295	15	AMZN	us	214.33	0.3935
296	15	LLY	us	1001.35	-0.6981
297	15	MSFT	us	405.76	-0.8915
298	15	NFLX	us	96.94	-1.4036
299	15	NVDA	us	184.77	1.1607
300	15	TSM	us	347.09	-0.4617
301	16	ARADEL	ngx	1340	\N
302	16	BETAGLAS	ngx	498.5	\N
303	16	BUACEMENT	ngx	225	\N
304	16	CUSTODIAN	ngx	79	\N
305	16	DANGCEM	ngx	815	\N
306	16	FIDSON	ngx	93.9	\N
307	16	GTCO	ngx	117	\N
308	16	MTNN	ngx	773	\N
309	16	NNFM	ngx	79.4	\N
310	16	OANDO	ngx	50.5	\N
311	16	OKOMUOIL	ngx	1765	\N
312	16	PRESCO	ngx	2315.4	\N
313	16	SEPLAT	ngx	9099.9	\N
314	16	UBA	ngx	46.45	\N
315	16	AMZN	us	214.33	0.3935
316	16	LLY	us	1001.35	-0.6981
317	16	MSFT	us	405.76	-0.8915
318	16	NFLX	us	96.94	-1.4036
319	16	NVDA	us	184.77	1.1607
320	16	TSM	us	347.09	-0.4617
321	17	ARADEL	ngx	1340	\N
322	17	BETAGLAS	ngx	498.5	\N
323	17	BUACEMENT	ngx	225	\N
324	17	CUSTODIAN	ngx	79	\N
325	17	DANGCEM	ngx	815	\N
326	17	FIDSON	ngx	93.9	\N
327	17	GTCO	ngx	117	\N
328	17	MTNN	ngx	773	\N
329	17	NNFM	ngx	79.4	\N
330	17	OANDO	ngx	50.5	\N
331	17	OKOMUOIL	ngx	1765	\N
332	17	PRESCO	ngx	2315.4	\N
333	17	SEPLAT	ngx	9099.9	\N
334	17	UBA	ngx	46.45	\N
335	17	AMZN	us	214.33	0.3935
336	17	LLY	us	1001.35	-0.6981
337	17	MSFT	us	405.76	-0.8915
338	17	NFLX	us	96.94	-1.4036
339	17	NVDA	us	184.77	1.1607
340	17	TSM	us	347.09	-0.4617
341	18	ARADEL	ngx	1340	\N
342	18	BETAGLAS	ngx	498.5	\N
343	18	BUACEMENT	ngx	225	\N
344	18	CUSTODIAN	ngx	79	\N
345	18	DANGCEM	ngx	815	\N
346	18	FIDSON	ngx	93.9	\N
347	18	GTCO	ngx	117	\N
348	18	MTNN	ngx	773	\N
349	18	NNFM	ngx	79.4	\N
350	18	OANDO	ngx	50.5	\N
351	18	OKOMUOIL	ngx	1765	\N
352	18	PRESCO	ngx	2315.4	\N
353	18	SEPLAT	ngx	9099.9	\N
354	18	UBA	ngx	46.45	\N
355	18	AMZN	us	214.33	0.3935
356	18	LLY	us	1001.35	-0.6981
357	18	MSFT	us	405.76	-0.8915
358	18	NFLX	us	96.94	-1.4036
359	18	NVDA	us	184.77	1.1607
360	18	TSM	us	347.09	-0.4617
361	19	ARADEL	ngx	1340	\N
362	19	BETAGLAS	ngx	498.5	\N
363	19	BUACEMENT	ngx	225	\N
364	19	CUSTODIAN	ngx	79	\N
365	19	DANGCEM	ngx	815	\N
366	19	FIDSON	ngx	93.9	\N
367	19	GTCO	ngx	117	\N
368	19	MTNN	ngx	773	\N
369	19	NNFM	ngx	79.4	\N
370	19	OANDO	ngx	50.5	\N
371	19	OKOMUOIL	ngx	1765	\N
372	19	PRESCO	ngx	2315.4	\N
373	19	SEPLAT	ngx	9099.9	\N
374	19	UBA	ngx	46.45	\N
375	19	AMZN	us	214.33	0.3935
376	19	LLY	us	1001.35	-0.6981
377	19	MSFT	us	405.76	-0.8915
378	19	NFLX	us	96.94	-1.4036
379	19	NVDA	us	184.77	1.1607
380	19	TSM	us	347.09	-0.4617
381	20	ARADEL	ngx	1340	\N
382	20	BETAGLAS	ngx	498.5	\N
383	20	BUACEMENT	ngx	225	\N
384	20	CUSTODIAN	ngx	79	\N
385	20	DANGCEM	ngx	815	\N
386	20	FIDSON	ngx	93.9	\N
387	20	GTCO	ngx	117	\N
388	20	MTNN	ngx	773	\N
389	20	NNFM	ngx	79.4	\N
390	20	OANDO	ngx	50.5	\N
391	20	OKOMUOIL	ngx	1765	\N
392	20	PRESCO	ngx	2315.4	\N
393	20	SEPLAT	ngx	9099.9	\N
394	20	UBA	ngx	46.45	\N
395	20	AMZN	us	214.33	0.3935
396	20	LLY	us	1001.35	-0.6981
397	20	MSFT	us	405.76	-0.8915
398	20	NFLX	us	96.94	-1.4036
399	20	NVDA	us	184.77	1.1607
400	20	TSM	us	347.09	-0.4617
401	21	ARADEL	ngx	1340	\N
402	21	BETAGLAS	ngx	498.5	\N
403	21	BUACEMENT	ngx	225	\N
404	21	CUSTODIAN	ngx	79	\N
405	21	DANGCEM	ngx	815	\N
406	21	FIDSON	ngx	93.9	\N
407	21	GTCO	ngx	117	\N
408	21	MTNN	ngx	773	\N
409	21	NNFM	ngx	79.4	\N
410	21	OANDO	ngx	50.5	\N
411	21	OKOMUOIL	ngx	1765	\N
412	21	PRESCO	ngx	2315.4	\N
413	21	SEPLAT	ngx	9099.9	\N
414	21	UBA	ngx	46.45	\N
415	21	AMZN	us	214.33	0.3935
416	21	LLY	us	1001.35	-0.6981
417	21	MSFT	us	405.76	-0.8915
418	21	NFLX	us	96.94	-1.4036
419	21	NVDA	us	184.77	1.1607
420	21	TSM	us	347.09	-0.4617
421	22	ARADEL	ngx	1340	\N
422	22	BETAGLAS	ngx	498.5	\N
423	22	BUACEMENT	ngx	225	\N
424	22	CUSTODIAN	ngx	79	\N
425	22	DANGCEM	ngx	815	\N
426	22	FIDSON	ngx	93.9	\N
427	22	GTCO	ngx	117	\N
428	22	MTNN	ngx	773	\N
429	22	NNFM	ngx	79.4	\N
430	22	OANDO	ngx	50.5	\N
431	22	OKOMUOIL	ngx	1765	\N
432	22	PRESCO	ngx	2315.4	\N
433	22	SEPLAT	ngx	9099.9	\N
434	22	UBA	ngx	46.45	\N
435	22	AMZN	us	214.33	0.3935
436	22	LLY	us	1001.35	-0.6981
437	22	MSFT	us	405.76	-0.8915
438	22	NFLX	us	96.94	-1.4036
439	22	NVDA	us	184.77	1.1607
440	22	TSM	us	347.09	-0.4617
441	23	ARADEL	ngx	1340	\N
442	23	BETAGLAS	ngx	498.5	\N
443	23	BUACEMENT	ngx	225	\N
444	23	CUSTODIAN	ngx	79	\N
445	23	DANGCEM	ngx	815	\N
446	23	FIDSON	ngx	93.9	\N
447	23	GTCO	ngx	117	\N
448	23	MTNN	ngx	773	\N
449	23	NNFM	ngx	79.4	\N
450	23	OANDO	ngx	50.5	\N
451	23	OKOMUOIL	ngx	1765	\N
452	23	PRESCO	ngx	2315.4	\N
453	23	SEPLAT	ngx	9099.9	\N
454	23	UBA	ngx	46.45	\N
455	23	AMZN	us	214.33	0.3935
456	23	LLY	us	1001.35	-0.6981
457	23	MSFT	us	405.76	-0.8915
458	23	NFLX	us	96.94	-1.4036
459	23	NVDA	us	184.77	1.1607
460	23	TSM	us	347.09	-0.4617
461	24	ARADEL	ngx	1340	\N
462	24	BETAGLAS	ngx	498.5	\N
463	24	BUACEMENT	ngx	225	\N
464	24	CUSTODIAN	ngx	79	\N
465	24	DANGCEM	ngx	815	\N
466	24	FIDSON	ngx	93.9	\N
467	24	GTCO	ngx	117	\N
468	24	MTNN	ngx	773	\N
469	24	NNFM	ngx	79.4	\N
470	24	OANDO	ngx	50.5	\N
471	24	OKOMUOIL	ngx	1765	\N
472	24	PRESCO	ngx	2315.4	\N
473	24	SEPLAT	ngx	9099.9	\N
474	24	UBA	ngx	46.45	\N
475	24	AMZN	us	214.33	0.3935
476	24	LLY	us	1001.35	-0.6981
477	24	MSFT	us	405.76	-0.8915
478	24	NFLX	us	96.94	-1.4036
479	24	NVDA	us	184.77	1.1607
480	24	TSM	us	347.09	-0.4617
481	25	ARADEL	ngx	1340	\N
482	25	BETAGLAS	ngx	498.5	\N
483	25	BUACEMENT	ngx	225	\N
484	25	CUSTODIAN	ngx	79	\N
485	25	DANGCEM	ngx	815	\N
486	25	FIDSON	ngx	93.9	\N
487	25	GTCO	ngx	117	\N
488	25	MTNN	ngx	773	\N
489	25	NNFM	ngx	79.4	\N
490	25	OANDO	ngx	50.5	\N
491	25	OKOMUOIL	ngx	1765	\N
492	25	PRESCO	ngx	2315.4	\N
493	25	SEPLAT	ngx	9099.9	\N
494	25	UBA	ngx	46.45	\N
495	25	AMZN	us	214.33	0.3935
496	25	LLY	us	1001.35	-0.6981
497	25	MSFT	us	405.76	-0.8915
498	25	NFLX	us	96.94	-1.4036
499	25	NVDA	us	184.77	1.1607
500	25	TSM	us	347.09	-0.4617
501	26	ARADEL	ngx	\N	\N
502	26	BETAGLAS	ngx	\N	\N
503	26	BUACEMENT	ngx	\N	\N
504	26	CUSTODIAN	ngx	\N	\N
505	26	DANGCEM	ngx	\N	\N
506	26	FIDSON	ngx	\N	\N
507	26	GTCO	ngx	\N	\N
508	26	MTNN	ngx	\N	\N
509	26	NNFM	ngx	\N	\N
510	26	OANDO	ngx	\N	\N
511	26	OKOMUOIL	ngx	\N	\N
512	26	PRESCO	ngx	\N	\N
513	26	SEPLAT	ngx	\N	\N
514	26	UBA	ngx	\N	\N
515	26	AMZN	us	214.33	0.3935
516	26	LLY	us	1001.35	-0.6981
517	26	MSFT	us	405.76	-0.8915
518	26	NFLX	us	96.94	-1.4036
519	26	NVDA	us	184.77	1.1607
520	26	TSM	us	347.09	-0.4617
521	27	ARADEL	ngx	1340	\N
522	27	BETAGLAS	ngx	498.5	\N
523	27	BUACEMENT	ngx	225	\N
524	27	CUSTODIAN	ngx	79	\N
525	27	DANGCEM	ngx	815	\N
526	27	FIDSON	ngx	93.9	\N
527	27	GTCO	ngx	117	\N
528	27	MTNN	ngx	773	\N
529	27	NNFM	ngx	79.4	\N
530	27	OANDO	ngx	50.5	\N
531	27	OKOMUOIL	ngx	1765	\N
532	27	PRESCO	ngx	2315.4	\N
533	27	SEPLAT	ngx	9099.9	\N
534	27	UBA	ngx	46.45	\N
535	27	AMZN	us	214.33	0.3935
536	27	LLY	us	1001.35	-0.6981
537	27	MSFT	us	405.76	-0.8915
538	27	NFLX	us	96.94	-1.4036
539	27	NVDA	us	184.77	1.1607
540	27	TSM	us	347.09	-0.4617
541	28	ARADEL	ngx	1340	\N
542	28	BETAGLAS	ngx	498.5	\N
543	28	BUACEMENT	ngx	225	\N
544	28	CUSTODIAN	ngx	79	-3.54
545	28	DANGCEM	ngx	815	\N
546	28	FIDSON	ngx	93.9	\N
547	28	GTCO	ngx	117	-0.85
548	28	MTNN	ngx	773	-2.15
549	28	NNFM	ngx	79.4	\N
550	28	OANDO	ngx	50.5	-7.59
551	28	OKOMUOIL	ngx	1765	\N
552	28	PRESCO	ngx	2315.4	\N
553	28	SEPLAT	ngx	9099.9	\N
554	28	UBA	ngx	46.45	-1.17
555	28	AMZN	us	214.33	0.3935
556	28	LLY	us	1001.35	-0.6981
557	28	MSFT	us	405.76	-0.8915
558	28	NFLX	us	96.94	-1.4036
559	28	NVDA	us	184.77	1.1607
560	28	TSM	us	347.09	-0.4617
561	29	ARADEL	ngx	1340	\N
562	29	BETAGLAS	ngx	498.5	\N
563	29	BUACEMENT	ngx	225	\N
564	29	CUSTODIAN	ngx	79	-3.54
565	29	DANGCEM	ngx	815	\N
566	29	FIDSON	ngx	93.9	\N
567	29	GTCO	ngx	117	-0.85
568	29	MTNN	ngx	773	-2.15
569	29	NNFM	ngx	79.4	\N
570	29	OANDO	ngx	50.5	-7.59
571	29	OKOMUOIL	ngx	1765	\N
572	29	PRESCO	ngx	2315.4	\N
573	29	SEPLAT	ngx	9099.9	\N
574	29	UBA	ngx	46.45	-1.17
575	29	AMZN	us	214.33	0.3935
576	29	LLY	us	1001.35	-0.6981
577	29	MSFT	us	405.76	-0.8915
578	29	NFLX	us	96.94	-1.4036
579	29	NVDA	us	184.77	1.1607
580	29	TSM	us	347.09	-0.4617
581	30	ARADEL	ngx	1340	\N
582	30	BETAGLAS	ngx	498.5	\N
583	30	BUACEMENT	ngx	225	\N
584	30	CUSTODIAN	ngx	79	-3.54
585	30	DANGCEM	ngx	815	\N
586	30	FIDSON	ngx	93.9	\N
587	30	GTCO	ngx	117	-0.85
588	30	MTNN	ngx	773	-2.15
589	30	NNFM	ngx	79.4	\N
590	30	OANDO	ngx	50.5	-7.59
591	30	OKOMUOIL	ngx	1765	\N
592	30	PRESCO	ngx	2315.4	\N
593	30	SEPLAT	ngx	9099.9	\N
594	30	UBA	ngx	46.45	-1.17
595	30	AMZN	us	214.33	0.3935
596	30	LLY	us	1001.35	-0.6981
597	30	MSFT	us	405.76	-0.8915
598	30	NFLX	us	96.94	-1.4036
599	30	NVDA	us	184.77	1.1607
600	30	TSM	us	347.09	-0.4617
601	31	ARADEL	ngx	1340	\N
602	31	BETAGLAS	ngx	498.5	\N
603	31	BUACEMENT	ngx	225	\N
604	31	CUSTODIAN	ngx	79	-3.54
605	31	DANGCEM	ngx	815	\N
606	31	FIDSON	ngx	93.9	\N
607	31	GTCO	ngx	117	-0.85
608	31	MTNN	ngx	773	-2.15
609	31	NNFM	ngx	79.4	\N
610	31	OANDO	ngx	50.5	-7.59
611	31	OKOMUOIL	ngx	1765	\N
612	31	PRESCO	ngx	2315.4	\N
613	31	SEPLAT	ngx	9099.9	\N
614	31	UBA	ngx	46.45	-1.17
615	31	AMZN	us	214.33	0.3935
616	31	LLY	us	1001.35	-0.6981
617	31	MSFT	us	405.76	-0.8915
618	31	NFLX	us	96.94	-1.4036
619	31	NVDA	us	184.77	1.1607
620	31	TSM	us	347.09	-0.4617
621	32	ARADEL	ngx	1340	\N
622	32	BETAGLAS	ngx	498.5	\N
623	32	BUACEMENT	ngx	235	4.44
624	32	CUSTODIAN	ngx	79	\N
625	32	DANGCEM	ngx	810	-0.61
626	32	FIDSON	ngx	95.8	2.02
627	32	GTCO	ngx	118	0.86
628	32	MTNN	ngx	773	-2.15
629	32	NNFM	ngx	79.4	\N
630	32	OANDO	ngx	50.2	-0.59
631	32	OKOMUOIL	ngx	1765	\N
632	32	PRESCO	ngx	2083.9	-10
633	32	SEPLAT	ngx	9099.9	\N
634	32	UBA	ngx	46.1	-0.75
635	32	AMZN	us	212.815	-0.7069
636	32	LLY	us	996.54	-0.4804
637	32	MSFT	us	403.56	-0.5422
638	32	NFLX	us	95.575	-1.4081
639	32	NVDA	us	185.825	0.571
640	32	TSM	us	353.598	1.875
641	33	ARADEL	ngx	1340	\N
642	33	BETAGLAS	ngx	498.5	\N
643	33	BUACEMENT	ngx	235	4.44
644	33	CUSTODIAN	ngx	79	\N
645	33	DANGCEM	ngx	810	-0.61
646	33	FIDSON	ngx	95.8	2.02
647	33	GTCO	ngx	118	0.86
648	33	MTNN	ngx	773	-2.15
649	33	NNFM	ngx	79.4	\N
650	33	OANDO	ngx	50.2	-0.59
651	33	OKOMUOIL	ngx	1765	\N
652	33	PRESCO	ngx	2083.9	-10
653	33	SEPLAT	ngx	9099.9	\N
654	33	UBA	ngx	46.1	-0.75
655	33	AMZN	us	212.95	-0.6439
656	33	LLY	us	997.86	-0.3485
657	33	MSFT	us	403.59	-0.5348
658	33	NFLX	us	95.545	-1.439
659	33	NVDA	us	185.76	0.5358
660	33	TSM	us	353.57	1.867
661	34	ARADEL	ngx	1340	\N
662	34	BETAGLAS	ngx	498.5	\N
663	34	BUACEMENT	ngx	235	4.44
664	34	CUSTODIAN	ngx	79	\N
665	34	DANGCEM	ngx	810	-0.61
666	34	FIDSON	ngx	95.8	2.02
667	34	GTCO	ngx	118	0.86
668	34	MTNN	ngx	773	-2.15
669	34	NNFM	ngx	79.4	\N
670	34	OANDO	ngx	50.2	-0.59
671	34	OKOMUOIL	ngx	1765	\N
672	34	PRESCO	ngx	2083.9	-10
673	34	SEPLAT	ngx	9099.9	\N
674	34	UBA	ngx	46.1	-0.75
675	34	AMZN	us	213.01	-0.6159
676	34	LLY	us	998.34	-0.3006
677	34	MSFT	us	403.935	-0.4498
678	34	NFLX	us	95.735	-1.243
679	34	NVDA	us	185.765	0.5385
680	34	TSM	us	354.16	2.0369
681	35	ARADEL	ngx	1340	\N
682	35	BETAGLAS	ngx	498.5	\N
683	35	BUACEMENT	ngx	235	4.44
684	35	CUSTODIAN	ngx	79	\N
685	35	DANGCEM	ngx	810	-0.61
686	35	FIDSON	ngx	95.8	2.02
687	35	GTCO	ngx	118	0.86
688	35	MTNN	ngx	773	-2.15
689	35	NNFM	ngx	79.4	\N
690	35	OANDO	ngx	50.2	-0.59
691	35	OKOMUOIL	ngx	1765	\N
692	35	PRESCO	ngx	2083.9	-10
693	35	SEPLAT	ngx	9099.9	\N
694	35	UBA	ngx	46.1	-0.75
695	35	AMZN	us	212.795	-0.7162
696	35	LLY	us	1001.345	-0.0005
697	35	MSFT	us	403.94	-0.4485
698	35	NFLX	us	95.54	-1.4442
699	35	NVDA	us	185.415	0.3491
700	35	TSM	us	354.48	2.1291
701	36	ARADEL	ngx	1340	\N
702	36	BETAGLAS	ngx	498.5	\N
703	36	BUACEMENT	ngx	235	4.44
704	36	CUSTODIAN	ngx	79	\N
705	36	DANGCEM	ngx	810	-0.61
706	36	FIDSON	ngx	95.8	2.02
707	36	GTCO	ngx	118	0.86
708	36	MTNN	ngx	773	-2.15
709	36	NNFM	ngx	79.4	\N
710	36	OANDO	ngx	50.2	-0.59
711	36	OKOMUOIL	ngx	1765	\N
712	36	PRESCO	ngx	2083.9	-10
713	36	SEPLAT	ngx	9099.9	\N
714	36	UBA	ngx	46.1	-0.75
715	36	AMZN	us	212.035	-1.0708
716	36	LLY	us	997.675	-0.367
717	36	MSFT	us	402.72	-0.7492
718	36	NFLX	us	95.34	-1.6505
719	36	NVDA	us	184.85	0.0433
720	36	TSM	us	352.9	1.6739
721	37	ARADEL	ngx	1340	\N
722	37	BETAGLAS	ngx	498.5	\N
723	37	BUACEMENT	ngx	235	4.44
724	37	CUSTODIAN	ngx	79	\N
725	37	DANGCEM	ngx	810	-0.61
726	37	FIDSON	ngx	95.8	2.02
727	37	GTCO	ngx	118	0.86
728	37	MTNN	ngx	773	\N
729	37	NNFM	ngx	79.4	\N
730	37	OANDO	ngx	50.2	-0.59
731	37	OKOMUOIL	ngx	1765	\N
732	37	PRESCO	ngx	2083.9	-10
733	37	SEPLAT	ngx	9099.9	\N
734	37	UBA	ngx	46.1	-0.75
735	37	AMZN	us	212.22	-0.9845
736	37	LLY	us	997.595	-0.375
737	37	MSFT	us	403.59	-0.5348
738	37	NFLX	us	95.165	-1.831
739	37	NVDA	us	185.16	0.2111
740	37	TSM	us	353.52	1.8525
741	38	ARADEL	ngx	1340	\N
742	38	BETAGLAS	ngx	498.5	\N
743	38	BUACEMENT	ngx	235	4.44
744	38	CUSTODIAN	ngx	79	\N
745	38	DANGCEM	ngx	810	-0.61
746	38	FIDSON	ngx	95.8	2.02
747	38	GTCO	ngx	118	0.86
748	38	MTNN	ngx	773	\N
749	38	NNFM	ngx	79.4	\N
750	38	OANDO	ngx	50.2	-0.59
751	38	OKOMUOIL	ngx	1765	\N
752	38	PRESCO	ngx	2083.9	-10
753	38	SEPLAT	ngx	9099.9	\N
754	38	UBA	ngx	46.1	-0.75
755	38	AMZN	us	212	-1.0871
756	38	LLY	us	998.84	-0.2507
757	38	MSFT	us	403.54	-0.5471
758	38	NFLX	us	94.985	-2.0167
759	38	NVDA	us	185.035	0.1434
760	38	TSM	us	353.325	1.7964
761	39	ARADEL	ngx	1340	\N
762	39	BETAGLAS	ngx	498.5	\N
763	39	BUACEMENT	ngx	235	4.44
764	39	CUSTODIAN	ngx	79	\N
765	39	DANGCEM	ngx	810	-0.61
766	39	FIDSON	ngx	95.8	2.02
767	39	GTCO	ngx	118	0.86
768	39	MTNN	ngx	773	\N
769	39	NNFM	ngx	79.4	\N
770	39	OANDO	ngx	50.2	-0.59
771	39	OKOMUOIL	ngx	1765	\N
772	39	PRESCO	ngx	2083.9	-10
773	39	SEPLAT	ngx	9099.9	\N
774	39	UBA	ngx	46.1	-0.75
775	39	AMZN	us	212.845	-0.6929
776	39	LLY	us	998.13	-0.3216
777	39	MSFT	us	403.75	-0.4954
778	39	NFLX	us	95.045	-1.9548
779	39	NVDA	us	185.22	0.2435
780	39	TSM	us	354.254	2.064
781	40	ARADEL	ngx	1340	\N
782	40	BETAGLAS	ngx	498.5	\N
783	40	BUACEMENT	ngx	235	4.44
784	40	CUSTODIAN	ngx	79	\N
785	40	DANGCEM	ngx	810	-0.61
786	40	FIDSON	ngx	95.8	2.02
787	40	GTCO	ngx	118	0.86
788	40	MTNN	ngx	773	\N
789	40	NNFM	ngx	79.4	\N
790	40	OANDO	ngx	50.2	-0.59
791	40	OKOMUOIL	ngx	1765	\N
792	40	PRESCO	ngx	2083.9	-10
793	40	SEPLAT	ngx	9099.9	\N
794	40	UBA	ngx	46.1	-0.75
795	40	AMZN	us	213.05	-0.5972
796	40	LLY	us	997.08	-0.4264
797	40	MSFT	us	404.28	-0.3647
798	40	NFLX	us	95.075	-1.9239
799	40	NVDA	us	185.7	0.5033
800	40	TSM	us	353.82	1.939
801	41	ARADEL	ngx	1340	\N
802	41	BETAGLAS	ngx	498.5	\N
803	41	BUACEMENT	ngx	235	4.44
804	41	CUSTODIAN	ngx	79	\N
805	41	DANGCEM	ngx	810	-0.61
806	41	FIDSON	ngx	95.8	2.02
807	41	GTCO	ngx	118	0.86
808	41	MTNN	ngx	773	\N
809	41	NNFM	ngx	79.4	\N
810	41	OANDO	ngx	50.2	-0.59
811	41	OKOMUOIL	ngx	1765	\N
812	41	PRESCO	ngx	2083.9	-10
813	41	SEPLAT	ngx	9099.9	\N
814	41	UBA	ngx	46.1	-0.75
815	41	AMZN	us	212.605	-0.8048
816	41	LLY	us	995.45	-0.5892
817	41	MSFT	us	403.75	-0.4954
818	41	NFLX	us	94.935	-2.0683
819	41	NVDA	us	185.39	0.3356
820	41	TSM	us	353.27	1.7805
821	42	ARADEL	ngx	1340	\N
822	42	BETAGLAS	ngx	498.5	\N
823	42	BUACEMENT	ngx	235	4.44
824	42	CUSTODIAN	ngx	79	\N
825	42	DANGCEM	ngx	810	-0.61
826	42	FIDSON	ngx	95.8	2.02
827	42	GTCO	ngx	118	0.86
828	42	MTNN	ngx	773	\N
829	42	NNFM	ngx	79.4	\N
830	42	OANDO	ngx	50.2	-0.59
831	42	OKOMUOIL	ngx	1765	\N
832	42	PRESCO	ngx	2083.9	-10
833	42	SEPLAT	ngx	9099.9	\N
834	42	UBA	ngx	46.1	-0.75
835	42	AMZN	us	212.76	-0.7325
836	42	LLY	us	995.79	-0.5553
837	42	MSFT	us	403.8	-0.483
838	42	NFLX	us	94.845	-2.1611
839	42	NVDA	us	185.55	0.4221
840	42	TSM	us	353.55	1.8612
841	43	ARADEL	ngx	1340	\N
842	43	BETAGLAS	ngx	498.5	\N
843	43	BUACEMENT	ngx	235	4.44
844	43	CUSTODIAN	ngx	79	\N
845	43	DANGCEM	ngx	810	-0.61
846	43	FIDSON	ngx	95.8	2.02
847	43	GTCO	ngx	118	0.86
848	43	MTNN	ngx	773	\N
849	43	NNFM	ngx	79.4	\N
850	43	OANDO	ngx	50.2	-0.59
851	43	OKOMUOIL	ngx	1765	\N
852	43	PRESCO	ngx	2083.9	-10
853	43	SEPLAT	ngx	9099.9	\N
854	43	UBA	ngx	46.1	-0.75
855	43	AMZN	us	213.01	-0.6159
856	43	LLY	us	997.175	-0.4169
857	43	MSFT	us	404.27	-0.3672
858	43	NFLX	us	94.9	-2.1044
859	43	NVDA	us	185.465	0.3761
860	43	TSM	us	354.07	2.011
861	44	ARADEL	ngx	1340	\N
862	44	BETAGLAS	ngx	498.5	\N
863	44	BUACEMENT	ngx	235	4.44
864	44	CUSTODIAN	ngx	79	\N
865	44	DANGCEM	ngx	810	-0.61
866	44	FIDSON	ngx	95.8	2.02
867	44	GTCO	ngx	118	0.86
868	44	MTNN	ngx	773	\N
869	44	NNFM	ngx	79.4	\N
870	44	OANDO	ngx	50.2	-0.59
871	44	OKOMUOIL	ngx	1765	\N
872	44	PRESCO	ngx	2083.9	-10
873	44	SEPLAT	ngx	9099.9	\N
874	44	UBA	ngx	46.1	-0.75
875	44	AMZN	us	212.71	-0.7558
876	44	LLY	us	998.965	-0.2382
877	44	MSFT	us	404.79	-0.2391
878	44	NFLX	us	94.955	-2.0477
879	44	NVDA	us	185.955	0.6413
880	44	TSM	us	353.88	1.9563
881	45	ARADEL	ngx	1340	\N
882	45	BETAGLAS	ngx	498.5	\N
883	45	BUACEMENT	ngx	235	4.44
884	45	CUSTODIAN	ngx	79	\N
885	45	DANGCEM	ngx	810	-0.61
886	45	FIDSON	ngx	95.8	2.02
887	45	GTCO	ngx	118	0.86
888	45	MTNN	ngx	773	\N
889	45	NNFM	ngx	79.4	\N
890	45	OANDO	ngx	50.2	-0.59
891	45	OKOMUOIL	ngx	1765	\N
892	45	PRESCO	ngx	2083.9	-10
893	45	SEPLAT	ngx	9099.9	\N
894	45	UBA	ngx	46.1	-0.75
895	45	AMZN	us	212.65	-0.7838
896	45	LLY	us	999.84	-0.1508
897	45	MSFT	us	404.88	-0.2169
898	45	NFLX	us	94.89	-2.1147
899	45	NVDA	us	186.03	0.6819
900	45	TSM	us	354.56	2.1522
901	46	ARADEL	ngx	1340	\N
902	46	BETAGLAS	ngx	498.5	\N
903	46	BUACEMENT	ngx	235	4.44
904	46	CUSTODIAN	ngx	79	\N
905	46	DANGCEM	ngx	810	-0.61
906	46	FIDSON	ngx	95.8	2.02
907	46	GTCO	ngx	118	0.86
908	46	MTNN	ngx	773	\N
909	46	NNFM	ngx	79.4	\N
910	46	OANDO	ngx	50.2	-0.59
911	46	OKOMUOIL	ngx	1765	\N
912	46	PRESCO	ngx	2083.9	-10
913	46	SEPLAT	ngx	9099.9	\N
914	46	UBA	ngx	46.1	-0.75
915	46	AMZN	us	212.65	-0.7838
916	46	LLY	us	999.84	-0.1508
917	46	MSFT	us	404.88	-0.2169
918	46	NFLX	us	94.89	-2.1147
919	46	NVDA	us	186.03	0.6819
920	46	TSM	us	354.56	2.1522
921	47	ARADEL	ngx	1340	\N
922	47	BETAGLAS	ngx	498.5	\N
923	47	BUACEMENT	ngx	235	4.44
924	47	CUSTODIAN	ngx	79	\N
925	47	DANGCEM	ngx	810	-0.61
926	47	FIDSON	ngx	95.8	2.02
927	47	GTCO	ngx	118	0.86
928	47	MTNN	ngx	773	\N
929	47	NNFM	ngx	79.4	\N
930	47	OANDO	ngx	50.2	-0.59
931	47	OKOMUOIL	ngx	1765	\N
932	47	PRESCO	ngx	2083.9	-10
933	47	SEPLAT	ngx	9099.9	\N
934	47	UBA	ngx	46.1	-0.75
935	47	AMZN	us	212.65	-0.7838
936	47	LLY	us	999.84	-0.1508
937	47	MSFT	us	404.88	-0.2169
938	47	NFLX	us	94.89	-2.1147
939	47	NVDA	us	186.03	0.6819
940	47	TSM	us	354.56	2.1522
941	48	ARADEL	ngx	1340	\N
942	48	BETAGLAS	ngx	498.5	\N
943	48	BUACEMENT	ngx	235	4.44
944	48	CUSTODIAN	ngx	79	\N
945	48	DANGCEM	ngx	810	-0.61
946	48	FIDSON	ngx	95.8	2.02
947	48	GTCO	ngx	118	0.86
948	48	MTNN	ngx	773	\N
949	48	NNFM	ngx	79.4	\N
950	48	OANDO	ngx	50.2	-0.59
951	48	OKOMUOIL	ngx	1765	\N
952	48	PRESCO	ngx	2083.9	-10
953	48	SEPLAT	ngx	9099.9	\N
954	48	UBA	ngx	46.1	-0.75
955	48	AMZN	us	212.65	-0.7838
956	48	LLY	us	999.84	-0.1508
957	48	MSFT	us	404.88	-0.2169
958	48	NFLX	us	94.89	-2.1147
959	48	NVDA	us	186.03	0.6819
960	48	TSM	us	354.56	2.1522
961	49	ARADEL	ngx	1340	\N
962	49	BETAGLAS	ngx	498.5	\N
963	49	BUACEMENT	ngx	235	4.44
964	49	CUSTODIAN	ngx	79	\N
965	49	DANGCEM	ngx	810	-0.61
966	49	FIDSON	ngx	95.8	2.02
967	49	GTCO	ngx	118	0.86
968	49	MTNN	ngx	773	\N
969	49	NNFM	ngx	79.4	\N
970	49	OANDO	ngx	50.2	-0.59
971	49	OKOMUOIL	ngx	1765	\N
972	49	PRESCO	ngx	2083.9	-10
973	49	SEPLAT	ngx	9099.9	\N
974	49	UBA	ngx	46.1	-0.75
975	49	AMZN	us	212.65	-0.7838
976	49	LLY	us	999.84	-0.1508
977	49	MSFT	us	404.88	-0.2169
978	49	NFLX	us	94.89	-2.1147
979	49	NVDA	us	186.03	0.6819
980	49	TSM	us	354.56	2.1522
981	50	ARADEL	ngx	1340	\N
982	50	BETAGLAS	ngx	498.5	\N
983	50	BUACEMENT	ngx	235	4.44
984	50	CUSTODIAN	ngx	79	\N
985	50	DANGCEM	ngx	810	-0.61
986	50	FIDSON	ngx	95.8	2.02
987	50	GTCO	ngx	118	0.86
988	50	MTNN	ngx	773	\N
989	50	NNFM	ngx	79.4	\N
990	50	OANDO	ngx	50.2	-0.59
991	50	OKOMUOIL	ngx	1765	\N
992	50	PRESCO	ngx	2083.9	-10
993	50	SEPLAT	ngx	9099.9	\N
994	50	UBA	ngx	46.1	-0.75
995	50	AMZN	us	212.65	-0.7838
996	50	LLY	us	999.84	-0.1508
997	50	MSFT	us	404.88	-0.2169
998	50	NFLX	us	94.89	-2.1147
999	50	NVDA	us	186.03	0.6819
1000	50	TSM	us	354.56	2.1522
1001	51	ARADEL	ngx	1340	\N
1002	51	BETAGLAS	ngx	498.5	\N
1003	51	BUACEMENT	ngx	235	4.44
1004	51	CUSTODIAN	ngx	79	\N
1005	51	DANGCEM	ngx	810	-0.61
1006	51	FIDSON	ngx	95.8	2.02
1007	51	GTCO	ngx	118	0.86
1008	51	MTNN	ngx	773	\N
1009	51	NNFM	ngx	79.4	\N
1010	51	OANDO	ngx	50.2	-0.59
1011	51	OKOMUOIL	ngx	1765	\N
1012	51	PRESCO	ngx	2083.9	-10
1013	51	SEPLAT	ngx	9099.9	\N
1014	51	UBA	ngx	46.1	-0.75
1015	51	AMZN	us	212.65	-0.7838
1016	51	LLY	us	999.84	-0.1508
1017	51	MSFT	us	404.88	-0.2169
1018	51	NFLX	us	94.89	-2.1147
1019	51	NVDA	us	186.03	0.6819
1020	51	TSM	us	354.56	2.1522
1021	52	ARADEL	ngx	1340	\N
1022	52	BETAGLAS	ngx	498.5	\N
1023	52	BUACEMENT	ngx	235	4.44
1024	52	CUSTODIAN	ngx	79	\N
1025	52	DANGCEM	ngx	810	-0.61
1026	52	FIDSON	ngx	95.8	2.02
1027	52	GTCO	ngx	118	0.86
1028	52	MTNN	ngx	773	\N
1029	52	NNFM	ngx	79.4	\N
1030	52	OANDO	ngx	50.2	-0.59
1031	52	OKOMUOIL	ngx	1765	\N
1032	52	PRESCO	ngx	2083.9	-10
1033	52	SEPLAT	ngx	9099.9	\N
1034	52	UBA	ngx	46.1	-0.75
1035	52	AMZN	us	212.65	-0.7838
1036	52	LLY	us	999.84	-0.1508
1037	52	MSFT	us	404.88	-0.2169
1038	52	NFLX	us	94.89	-2.1147
1039	52	NVDA	us	186.03	0.6819
1040	52	TSM	us	354.56	2.1522
1041	53	ARADEL	ngx	1340	\N
1042	53	BETAGLAS	ngx	498.5	\N
1043	53	BUACEMENT	ngx	235	4.44
1044	53	CUSTODIAN	ngx	79	\N
1045	53	DANGCEM	ngx	810	-0.61
1046	53	FIDSON	ngx	95.8	2.02
1047	53	GTCO	ngx	118	0.86
1048	53	MTNN	ngx	773	\N
1049	53	NNFM	ngx	79.4	\N
1050	53	OANDO	ngx	50.2	-0.59
1051	53	OKOMUOIL	ngx	1765	\N
1052	53	PRESCO	ngx	2083.9	-10
1053	53	SEPLAT	ngx	9099.9	\N
1054	53	UBA	ngx	46.1	-0.75
1055	53	AMZN	us	212.65	-0.7838
1056	53	LLY	us	999.84	-0.1508
1057	53	MSFT	us	404.88	-0.2169
1058	53	NFLX	us	94.89	-2.1147
1059	53	NVDA	us	186.03	0.6819
1060	53	TSM	us	354.56	2.1522
1061	54	ARADEL	ngx	1340	\N
1062	54	BETAGLAS	ngx	498.5	\N
1063	54	BUACEMENT	ngx	235	4.44
1064	54	CUSTODIAN	ngx	79	\N
1065	54	DANGCEM	ngx	810	-0.61
1066	54	FIDSON	ngx	95.8	2.02
1067	54	GTCO	ngx	118	0.86
1068	54	MTNN	ngx	773	\N
1069	54	NNFM	ngx	79.4	\N
1070	54	OANDO	ngx	50.2	-0.59
1071	54	OKOMUOIL	ngx	1765	\N
1072	54	PRESCO	ngx	2083.9	-10
1073	54	SEPLAT	ngx	9099.9	\N
1074	54	UBA	ngx	46.1	-0.75
1075	54	AMZN	us	212.65	-0.7838
1076	54	LLY	us	999.84	-0.1508
1077	54	MSFT	us	404.88	-0.2169
1078	54	NFLX	us	94.89	-2.1147
1079	54	NVDA	us	186.03	0.6819
1080	54	TSM	us	354.56	2.1522
1081	55	ARADEL	ngx	1340	\N
1082	55	BETAGLAS	ngx	498.5	\N
1083	55	BUACEMENT	ngx	235	4.44
1084	55	CUSTODIAN	ngx	79	\N
1085	55	DANGCEM	ngx	810	-0.61
1086	55	FIDSON	ngx	95.8	2.02
1087	55	GTCO	ngx	118	0.86
1088	55	MTNN	ngx	773	\N
1089	55	NNFM	ngx	79.4	\N
1090	55	OANDO	ngx	50.2	-0.59
1091	55	OKOMUOIL	ngx	1765	\N
1092	55	PRESCO	ngx	2083.9	-10
1093	55	SEPLAT	ngx	9099.9	\N
1094	55	UBA	ngx	46.1	-0.75
1095	55	AMZN	us	212.65	-0.7838
1096	55	LLY	us	999.84	-0.1508
1097	55	MSFT	us	404.88	-0.2169
1098	55	NFLX	us	94.89	-2.1147
1099	55	NVDA	us	186.03	0.6819
1100	55	TSM	us	354.56	2.1522
1101	56	ARADEL	ngx	1340	\N
1102	56	BETAGLAS	ngx	498.5	\N
1103	56	BUACEMENT	ngx	235	4.44
1104	56	CUSTODIAN	ngx	79	\N
1105	56	DANGCEM	ngx	810	-0.61
1106	56	FIDSON	ngx	95.8	2.02
1107	56	GTCO	ngx	118	0.86
1108	56	MTNN	ngx	773	\N
1109	56	NNFM	ngx	79.4	\N
1110	56	OANDO	ngx	50.2	-0.59
1111	56	OKOMUOIL	ngx	1765	\N
1112	56	PRESCO	ngx	2083.9	-10
1113	56	SEPLAT	ngx	9099.9	\N
1114	56	UBA	ngx	46.1	-0.75
1115	56	AMZN	us	212.65	-0.7838
1116	56	LLY	us	999.84	-0.1508
1117	56	MSFT	us	404.88	-0.2169
1118	56	NFLX	us	94.89	-2.1147
1119	56	NVDA	us	186.03	0.6819
1120	56	TSM	us	354.56	2.1522
1121	57	ARADEL	ngx	1340	\N
1122	57	BETAGLAS	ngx	498.5	\N
1123	57	BUACEMENT	ngx	235	4.44
1124	57	CUSTODIAN	ngx	79	\N
1125	57	DANGCEM	ngx	810	-0.61
1126	57	FIDSON	ngx	95.8	2.02
1127	57	GTCO	ngx	118	0.86
1128	57	MTNN	ngx	773	\N
1129	57	NNFM	ngx	79.4	\N
1130	57	OANDO	ngx	50.2	-0.59
1131	57	OKOMUOIL	ngx	1765	\N
1132	57	PRESCO	ngx	2083.9	-10
1133	57	SEPLAT	ngx	9099.9	\N
1134	57	UBA	ngx	46.1	-0.75
1135	57	AMZN	us	212.65	-0.7838
1136	57	LLY	us	999.84	-0.1508
1137	57	MSFT	us	404.88	-0.2169
1138	57	NFLX	us	94.89	-2.1147
1139	57	NVDA	us	186.03	0.6819
1140	57	TSM	us	354.56	2.1522
1141	58	ARADEL	ngx	1340	\N
1142	58	BETAGLAS	ngx	498.5	\N
1143	58	BUACEMENT	ngx	235	4.44
1144	58	CUSTODIAN	ngx	79	\N
1145	58	DANGCEM	ngx	810	-0.61
1146	58	FIDSON	ngx	95.8	2.02
1147	58	GTCO	ngx	118	0.86
1148	58	MTNN	ngx	773	\N
1149	58	NNFM	ngx	79.4	\N
1150	58	OANDO	ngx	50.2	-0.59
1151	58	OKOMUOIL	ngx	1765	\N
1152	58	PRESCO	ngx	2083.9	-10
1153	58	SEPLAT	ngx	9099.9	\N
1154	58	UBA	ngx	46.1	-0.75
1155	58	AMZN	us	212.65	-0.7838
1156	58	LLY	us	999.84	-0.1508
1157	58	MSFT	us	404.88	-0.2169
1158	58	NFLX	us	94.89	-2.1147
1159	58	NVDA	us	186.03	0.6819
1160	58	TSM	us	354.56	2.1522
1161	59	ARADEL	ngx	1340	\N
1162	59	BETAGLAS	ngx	498.5	\N
1163	59	BUACEMENT	ngx	270	9.18
1164	59	CUSTODIAN	ngx	77	\N
1165	59	DANGCEM	ngx	794.9	-1.86
1166	59	FIDSON	ngx	105.35	\N
1167	59	GTCO	ngx	117.5	0.04
1168	59	MTNN	ngx	779.1	0.15
1169	59	NNFM	ngx	79.4	\N
1170	59	OANDO	ngx	48.85	1.67
1171	59	OKOMUOIL	ngx	1765	\N
1172	59	PRESCO	ngx	2083.9	\N
1173	59	SEPLAT	ngx	9099.9	\N
1174	59	UBA	ngx	45.5	-0.87
1175	59	AMZN	us	207.67	-0.8877
1176	59	LLY	us	985.08	0.8012
1177	59	MSFT	us	395.55	-1.5812
1178	59	NFLX	us	95.31	1.0603
1179	59	NVDA	us	180.25	-1.5888
1180	59	TSM	us	338.31	0.4752
1181	60	ARADEL	ngx	1340	\N
1182	60	BETAGLAS	ngx	498.5	\N
1183	60	BUACEMENT	ngx	270	9.18
1184	60	CUSTODIAN	ngx	77	\N
1185	60	DANGCEM	ngx	794.9	-1.86
1186	60	FIDSON	ngx	105.35	\N
1187	60	GTCO	ngx	117.5	0.04
1188	60	MTNN	ngx	779.1	0.15
1189	60	NNFM	ngx	79.4	\N
1190	60	OANDO	ngx	48.85	1.67
1191	60	OKOMUOIL	ngx	1765	\N
1192	60	PRESCO	ngx	2083.9	\N
1193	60	SEPLAT	ngx	9099.9	\N
1194	60	UBA	ngx	45.5	-0.87
1195	60	AMZN	us	207.67	-0.8877
1196	60	LLY	us	985.08	0.8012
1197	60	MSFT	us	395.55	-1.5812
1198	60	NFLX	us	95.31	1.0603
1199	60	NVDA	us	180.25	-1.5888
1200	60	TSM	us	338.31	0.4752
1201	61	ARADEL	ngx	1340	\N
1202	61	BETAGLAS	ngx	498.5	\N
1203	61	BUACEMENT	ngx	270	9.18
1204	61	CUSTODIAN	ngx	77	\N
1205	61	DANGCEM	ngx	794.9	-1.86
1206	61	FIDSON	ngx	105.35	\N
1207	61	GTCO	ngx	117.5	0.04
1208	61	MTNN	ngx	779.1	0.15
1209	61	NNFM	ngx	79.4	\N
1210	61	OANDO	ngx	48.85	1.67
1211	61	OKOMUOIL	ngx	1765	\N
1212	61	PRESCO	ngx	2083.9	\N
1213	61	SEPLAT	ngx	9099.9	\N
1214	61	UBA	ngx	45.5	-0.87
1215	61	AMZN	us	207.67	-0.8877
1216	61	LLY	us	985.08	0.8012
1217	61	MSFT	us	395.55	-1.5812
1218	61	NFLX	us	95.31	1.0603
1219	61	NVDA	us	180.25	-1.5888
1220	61	TSM	us	338.31	0.4752
1221	62	ARADEL	ngx	1340	\N
1222	62	BETAGLAS	ngx	498.5	\N
1223	62	BUACEMENT	ngx	270	9.18
1224	62	CUSTODIAN	ngx	77	\N
1225	62	DANGCEM	ngx	794.9	-1.86
1226	62	FIDSON	ngx	105.35	\N
1227	62	GTCO	ngx	117.5	0.04
1228	62	MTNN	ngx	779.1	0.15
1229	62	NNFM	ngx	79.4	\N
1230	62	OANDO	ngx	48.85	1.67
1231	62	OKOMUOIL	ngx	1765	\N
1232	62	PRESCO	ngx	2083.9	\N
1233	62	SEPLAT	ngx	9099.9	\N
1234	62	UBA	ngx	45.5	-0.87
1235	62	AMZN	us	207.67	-0.8877
1236	62	LLY	us	985.08	0.8012
1237	62	MSFT	us	395.55	-1.5812
1238	62	NFLX	us	95.31	1.0603
1239	62	NVDA	us	180.25	-1.5888
1240	62	TSM	us	338.31	0.4752
1241	63	ARADEL	ngx	1340	\N
1242	63	BETAGLAS	ngx	498.5	\N
1243	63	BUACEMENT	ngx	270	9.18
1244	63	CUSTODIAN	ngx	77	\N
1245	63	DANGCEM	ngx	794.9	-1.86
1246	63	FIDSON	ngx	105.35	\N
1247	63	GTCO	ngx	117.5	0.04
1248	63	MTNN	ngx	779.1	0.15
1249	63	NNFM	ngx	79.4	\N
1250	63	OANDO	ngx	48.85	1.67
1251	63	OKOMUOIL	ngx	1765	\N
1252	63	PRESCO	ngx	2083.9	\N
1253	63	SEPLAT	ngx	9099.9	\N
1254	63	UBA	ngx	45.5	-0.87
1255	63	AMZN	us	207.67	-0.8877
1256	63	LLY	us	985.08	0.8012
1257	63	MSFT	us	395.55	-1.5812
1258	63	NFLX	us	95.31	1.0603
1259	63	NVDA	us	180.25	-1.5888
1260	63	TSM	us	338.31	0.4752
1261	64	ARADEL	ngx	1340	\N
1262	64	BETAGLAS	ngx	498.5	\N
1263	64	BUACEMENT	ngx	270	9.18
1264	64	CUSTODIAN	ngx	77	\N
1265	64	DANGCEM	ngx	794.9	-1.86
1266	64	FIDSON	ngx	105.35	\N
1267	64	GTCO	ngx	117.5	0.04
1268	64	MTNN	ngx	779.1	0.15
1269	64	NNFM	ngx	79.4	\N
1270	64	OANDO	ngx	48.85	1.67
1271	64	OKOMUOIL	ngx	1765	\N
1272	64	PRESCO	ngx	2083.9	\N
1273	64	SEPLAT	ngx	9099.9	\N
1274	64	UBA	ngx	45.5	-0.87
1275	64	AMZN	us	207.67	-0.8877
1276	64	LLY	us	985.08	0.8012
1277	64	MSFT	us	395.55	-1.5812
1278	64	NFLX	us	95.31	1.0603
1279	64	NVDA	us	180.25	-1.5888
1280	64	TSM	us	338.31	0.4752
1281	65	ARADEL	ngx	1340	\N
1282	65	BETAGLAS	ngx	498.5	\N
1283	65	BUACEMENT	ngx	270	9.18
1284	65	CUSTODIAN	ngx	77	\N
1285	65	DANGCEM	ngx	794.9	-1.86
1286	65	FIDSON	ngx	105.35	\N
1287	65	GTCO	ngx	117.5	0.04
1288	65	MTNN	ngx	779.1	0.15
1289	65	NNFM	ngx	79.4	\N
1290	65	OANDO	ngx	48.85	1.67
1291	65	OKOMUOIL	ngx	1765	\N
1292	65	PRESCO	ngx	2083.9	\N
1293	65	SEPLAT	ngx	9099.9	\N
1294	65	UBA	ngx	45.5	-0.87
1295	65	AMZN	us	207.67	-0.8877
1296	65	LLY	us	985.08	0.8012
1297	65	MSFT	us	395.55	-1.5812
1298	65	NFLX	us	95.31	1.0603
1299	65	NVDA	us	180.25	-1.5888
1300	65	TSM	us	338.31	0.4752
1301	66	ARADEL	ngx	1340	\N
1302	66	BETAGLAS	ngx	498.5	\N
1303	66	BUACEMENT	ngx	270	9.18
1304	66	CUSTODIAN	ngx	77	\N
1305	66	DANGCEM	ngx	794.9	-1.86
1306	66	FIDSON	ngx	105.35	\N
1307	66	GTCO	ngx	117.5	0.04
1308	66	MTNN	ngx	779.1	0.15
1309	66	NNFM	ngx	79.4	\N
1310	66	OANDO	ngx	48.85	1.67
1311	66	OKOMUOIL	ngx	1765	\N
1312	66	PRESCO	ngx	2083.9	\N
1313	66	SEPLAT	ngx	9099.9	\N
1314	66	UBA	ngx	45.5	-0.87
1315	66	AMZN	us	207.67	-0.8877
1316	66	LLY	us	985.08	0.8012
1317	66	MSFT	us	395.55	-1.5812
1318	66	NFLX	us	95.31	1.0603
1319	66	NVDA	us	180.25	-1.5888
1320	66	TSM	us	338.31	0.4752
1321	67	ARADEL	ngx	1340	\N
1322	67	BETAGLAS	ngx	498.5	\N
1323	67	BUACEMENT	ngx	270	9.18
1324	67	CUSTODIAN	ngx	77	\N
1325	67	DANGCEM	ngx	794.9	-1.86
1326	67	FIDSON	ngx	105.35	\N
1327	67	GTCO	ngx	117.5	0.04
1328	67	MTNN	ngx	779.1	0.15
1329	67	NNFM	ngx	79.4	\N
1330	67	OANDO	ngx	48.85	1.67
1331	67	OKOMUOIL	ngx	1765	\N
1332	67	PRESCO	ngx	2083.9	\N
1333	67	SEPLAT	ngx	9099.9	\N
1334	67	UBA	ngx	45.5	-0.87
1335	67	AMZN	us	207.67	-0.8877
1336	67	LLY	us	985.08	0.8012
1337	67	MSFT	us	395.55	-1.5812
1338	67	NFLX	us	95.31	1.0603
1339	67	NVDA	us	180.25	-1.5888
1340	67	TSM	us	338.31	0.4752
1341	68	ARADEL	ngx	1340	\N
1342	68	BETAGLAS	ngx	498.5	\N
1343	68	BUACEMENT	ngx	270	9.18
1344	68	CUSTODIAN	ngx	77	\N
1345	68	DANGCEM	ngx	794.9	-1.86
1346	68	FIDSON	ngx	105.35	\N
1347	68	GTCO	ngx	117.5	0.04
1348	68	MTNN	ngx	779.1	0.15
1349	68	NNFM	ngx	79.4	\N
1350	68	OANDO	ngx	48.85	1.67
1351	68	OKOMUOIL	ngx	1765	\N
1352	68	PRESCO	ngx	2083.9	\N
1353	68	SEPLAT	ngx	9099.9	\N
1354	68	UBA	ngx	45.5	-0.87
1355	68	AMZN	us	207.67	-0.8877
1356	68	LLY	us	985.08	0.8012
1357	68	MSFT	us	395.55	-1.5812
1358	68	NFLX	us	95.31	1.0603
1359	68	NVDA	us	180.25	-1.5888
1360	68	TSM	us	338.31	0.4752
1361	69	ARADEL	ngx	1340	\N
1362	69	BETAGLAS	ngx	498.5	\N
1363	69	BUACEMENT	ngx	270	9.18
1364	69	CUSTODIAN	ngx	77	\N
1365	69	DANGCEM	ngx	794.9	-1.86
1366	69	FIDSON	ngx	105.35	\N
1367	69	GTCO	ngx	117.5	0.04
1368	69	MTNN	ngx	779.1	0.15
1369	69	NNFM	ngx	79.4	\N
1370	69	OANDO	ngx	48.85	1.67
1371	69	OKOMUOIL	ngx	1765	\N
1372	69	PRESCO	ngx	2083.9	\N
1373	69	SEPLAT	ngx	9099.9	\N
1374	69	UBA	ngx	45.5	-0.87
1375	69	AMZN	us	207.67	-0.8877
1376	69	LLY	us	985.08	0.8012
1377	69	MSFT	us	395.55	-1.5812
1378	69	NFLX	us	95.31	1.0603
1379	69	NVDA	us	180.25	-1.5888
1380	69	TSM	us	338.31	0.4752
1381	70	ARADEL	ngx	1340	\N
1382	70	BETAGLAS	ngx	498.5	\N
1383	70	BUACEMENT	ngx	270	9.18
1384	70	CUSTODIAN	ngx	77	\N
1385	70	DANGCEM	ngx	794.9	-1.86
1386	70	FIDSON	ngx	105.35	\N
1387	70	GTCO	ngx	117.5	0.04
1388	70	MTNN	ngx	779.1	0.15
1389	70	NNFM	ngx	79.4	\N
1390	70	OANDO	ngx	48.85	1.67
1391	70	OKOMUOIL	ngx	1765	\N
1392	70	PRESCO	ngx	2083.9	\N
1393	70	SEPLAT	ngx	9099.9	\N
1394	70	UBA	ngx	45.5	-0.87
1395	70	AMZN	us	207.67	-0.8877
1396	70	LLY	us	985.08	0.8012
1397	70	MSFT	us	395.55	-1.5812
1398	70	NFLX	us	95.31	1.0603
1399	70	NVDA	us	180.25	-1.5888
1400	70	TSM	us	338.31	0.4752
1401	71	ARADEL	ngx	1340	\N
1402	71	BETAGLAS	ngx	498.5	\N
1403	71	BUACEMENT	ngx	270	9.18
1404	71	CUSTODIAN	ngx	77	\N
1405	71	DANGCEM	ngx	794.9	-1.86
1406	71	FIDSON	ngx	105.35	\N
1407	71	GTCO	ngx	117.5	0.04
1408	71	MTNN	ngx	779.1	0.15
1409	71	NNFM	ngx	79.4	\N
1410	71	OANDO	ngx	48.85	1.67
1411	71	OKOMUOIL	ngx	1765	\N
1412	71	PRESCO	ngx	2083.9	\N
1413	71	SEPLAT	ngx	9099.9	\N
1414	71	UBA	ngx	45.5	-0.87
1415	71	AMZN	us	207.67	-0.8877
1416	71	LLY	us	985.08	0.8012
1417	71	MSFT	us	395.55	-1.5812
1418	71	NFLX	us	95.31	1.0603
1419	71	NVDA	us	180.25	-1.5888
1420	71	TSM	us	338.31	0.4752
1421	73	ARADEL	ngx	1340	\N
1422	73	BETAGLAS	ngx	498.5	\N
1423	73	BUACEMENT	ngx	270	9.18
1424	73	CUSTODIAN	ngx	77	\N
1425	73	DANGCEM	ngx	794.9	-1.86
1426	73	FIDSON	ngx	105.35	\N
1427	73	GTCO	ngx	117.5	0.04
1428	73	MTNN	ngx	779.1	0.15
1429	73	NNFM	ngx	79.4	\N
1430	73	OANDO	ngx	48.85	1.67
1431	73	OKOMUOIL	ngx	1765	\N
1432	73	PRESCO	ngx	2083.9	\N
1433	73	SEPLAT	ngx	9099.9	\N
1434	73	UBA	ngx	45.5	-0.87
1435	73	AMZN	us	207.67	-0.8877
1436	73	LLY	us	985.08	0.8012
1437	73	MSFT	us	395.55	-1.5812
1438	73	NFLX	us	95.31	1.0603
1439	73	NVDA	us	180.25	-1.5888
1440	73	TSM	us	338.31	0.4752
1441	74	GTCO	ngx	117.5	0.04
1442	74	MTNN	ngx	779.1	0.15
1443	75	GTCO	ngx	117.5	0.04
1444	75	MTNN	ngx	779.1	0.15
1445	76	GTCO	ngx	117.5	0.04
1446	76	MTNN	ngx	779.1	0.15
1447	77	GTCO	ngx	117.5	0.04
1448	77	MTNN	ngx	779.1	0.15
1449	78	ARADEL	ngx	1340	\N
1450	78	BETAGLAS	ngx	498.5	\N
1451	78	BUACEMENT	ngx	270	9.18
1452	78	CUSTODIAN	ngx	77	\N
1453	78	DANGCEM	ngx	794.9	-1.86
1454	78	FIDSON	ngx	105.35	\N
1455	78	GTCO	ngx	117.5	0.04
1456	78	MTNN	ngx	779.1	0.15
1457	78	NNFM	ngx	79.4	\N
1458	78	OANDO	ngx	48.85	1.67
1459	78	OKOMUOIL	ngx	1765	\N
1460	78	PRESCO	ngx	2083.9	\N
1461	78	SEPLAT	ngx	9099.9	\N
1462	78	UBA	ngx	45.5	-0.87
1463	78	AMZN	us	207.67	-0.8877
1464	78	LLY	us	985.08	0.8012
1465	78	MSFT	us	395.55	-1.5812
1466	78	NFLX	us	95.31	1.0603
1467	78	NVDA	us	180.25	-1.5888
1468	78	TSM	us	338.31	0.4752
1469	79	ARADEL	ngx	1340	\N
1470	79	BETAGLAS	ngx	498.5	\N
1471	79	BUACEMENT	ngx	270	9.18
1472	79	CUSTODIAN	ngx	77	\N
1473	79	DANGCEM	ngx	794.9	-1.86
1474	79	FIDSON	ngx	105.35	\N
1475	79	GTCO	ngx	117.5	0.04
1476	79	MTNN	ngx	779.1	0.15
1477	79	NNFM	ngx	79.4	\N
1478	79	OANDO	ngx	48.85	1.67
1479	79	OKOMUOIL	ngx	1765	\N
1480	79	PRESCO	ngx	2083.9	\N
1481	79	SEPLAT	ngx	9099.9	\N
1482	79	UBA	ngx	45.5	-0.87
1483	79	AMZN	us	207.67	-0.8877
1484	79	LLY	us	985.08	0.8012
1485	79	MSFT	us	395.55	-1.5812
1486	79	NFLX	us	95.31	1.0603
1487	79	NVDA	us	180.25	-1.5888
1488	79	TSM	us	338.31	0.4752
1489	80	ARADEL	ngx	1340	\N
1490	80	BETAGLAS	ngx	498.5	\N
1491	80	BUACEMENT	ngx	270	9.18
1492	80	CUSTODIAN	ngx	77	\N
1493	80	DANGCEM	ngx	794.9	-1.86
1494	80	FIDSON	ngx	105.35	\N
1495	80	GTCO	ngx	117.5	0.04
1496	80	MTNN	ngx	779.1	0.15
1497	80	NNFM	ngx	79.4	\N
1498	80	OANDO	ngx	48.85	1.67
1499	80	OKOMUOIL	ngx	1765	\N
1500	80	PRESCO	ngx	2083.9	\N
1501	80	SEPLAT	ngx	9099.9	\N
1502	80	UBA	ngx	45.5	-0.87
1503	80	AMZN	us	207.67	-0.8877
1504	80	LLY	us	985.08	0.8012
1505	80	MSFT	us	395.55	-1.5812
1506	80	NFLX	us	95.31	1.0603
1507	80	NVDA	us	180.25	-1.5888
1508	80	TSM	us	338.31	0.4752
1509	81	ARADEL	ngx	1340	\N
1510	81	BETAGLAS	ngx	498.5	\N
1511	81	BUACEMENT	ngx	326.7	10
1512	81	CUSTODIAN	ngx	77	-2.53
1513	81	DANGCEM	ngx	810	0.88
1514	81	FIDSON	ngx	105.35	\N
1515	81	GTCO	ngx	123.5	4.53
1516	81	MTNN	ngx	760	-4.76
1517	81	NNFM	ngx	79.4	\N
1518	81	OANDO	ngx	47	-2.29
1519	81	OKOMUOIL	ngx	1765	\N
1520	81	PRESCO	ngx	1875.6	-10
1521	81	SEPLAT	ngx	9099.9	\N
1522	81	UBA	ngx	50.9	6.04
1523	81	AMZN	us	215.2	1.6341
1524	81	LLY	us	930.35	-5.9416
1525	81	MSFT	us	399.41	-0.135
1526	81	NFLX	us	94.36	-0.8824
1527	81	NVDA	us	181.93	-0.6861
1528	81	TSM	us	345.98	1.9766
1529	82	ARADEL	ngx	1340	\N
1530	82	BETAGLAS	ngx	498.5	\N
1531	82	BUACEMENT	ngx	326.7	10
1532	82	CUSTODIAN	ngx	77	-2.53
1533	82	DANGCEM	ngx	810	0.88
1534	82	FIDSON	ngx	105.35	\N
1535	82	GTCO	ngx	123.5	4.53
1536	82	MTNN	ngx	760	-4.76
1537	82	NNFM	ngx	79.4	\N
1538	82	OANDO	ngx	47	-2.29
1539	82	OKOMUOIL	ngx	1765	\N
1540	82	PRESCO	ngx	1875.6	-10
1541	82	SEPLAT	ngx	9099.9	\N
1542	82	UBA	ngx	50.9	6.04
1543	82	AMZN	us	215.2	1.6341
1544	82	LLY	us	930.35	-5.9416
1545	82	MSFT	us	399.41	-0.135
1546	82	NFLX	us	94.36	-0.8824
1547	82	NVDA	us	181.93	-0.6861
1548	82	TSM	us	345.98	1.9766
1549	83	ARADEL	ngx	1340	\N
1550	83	BETAGLAS	ngx	498.5	\N
1551	83	BUACEMENT	ngx	326.7	10
1552	83	CUSTODIAN	ngx	77	-2.53
1553	83	DANGCEM	ngx	810	0.88
1554	83	FIDSON	ngx	105.35	\N
1555	83	GTCO	ngx	123.5	4.53
1556	83	MTNN	ngx	760	-4.76
1557	83	NNFM	ngx	79.4	\N
1558	83	OANDO	ngx	47	-2.29
1559	83	OKOMUOIL	ngx	1765	\N
1560	83	PRESCO	ngx	1875.6	-10
1561	83	SEPLAT	ngx	9099.9	\N
1562	83	UBA	ngx	50.9	6.04
1563	83	AMZN	us	215.2	1.6341
1564	83	LLY	us	930.35	-5.9416
1565	83	MSFT	us	399.41	-0.135
1566	83	NFLX	us	94.36	-0.8824
1567	83	NVDA	us	181.93	-0.6861
1568	83	TSM	us	345.98	1.9766
1569	84	ARADEL	ngx	1340	\N
1570	84	BETAGLAS	ngx	498.5	\N
1571	84	BUACEMENT	ngx	326.7	10
1572	84	CUSTODIAN	ngx	77	-2.53
1573	84	DANGCEM	ngx	810	0.88
1574	84	FIDSON	ngx	105.35	\N
1575	84	GTCO	ngx	123.5	4.53
1576	84	MTNN	ngx	760	-4.76
1577	84	NNFM	ngx	79.4	\N
1578	84	OANDO	ngx	47	-2.29
1579	84	OKOMUOIL	ngx	1765	\N
1580	84	PRESCO	ngx	1875.6	-10
1581	84	SEPLAT	ngx	9099.9	\N
1582	84	UBA	ngx	50.9	6.04
1583	84	AMZN	us	215.2	1.6341
1584	84	LLY	us	930.35	-5.9416
1585	84	MSFT	us	399.41	-0.135
1586	84	NFLX	us	94.36	-0.8824
1587	84	NVDA	us	181.93	-0.6861
1588	84	TSM	us	345.98	1.9766
1589	85	ARADEL	ngx	1340	\N
1590	85	BETAGLAS	ngx	498.5	\N
1591	85	BUACEMENT	ngx	326.7	10
1592	85	CUSTODIAN	ngx	77	-2.53
1593	85	DANGCEM	ngx	810	0.88
1594	85	FIDSON	ngx	105.35	\N
1595	85	GTCO	ngx	123.5	4.53
1596	85	MTNN	ngx	760	-4.76
1597	85	NNFM	ngx	79.4	\N
1598	85	OANDO	ngx	47	-2.29
1599	85	OKOMUOIL	ngx	1765	\N
1600	85	PRESCO	ngx	1875.6	-10
1601	85	SEPLAT	ngx	9099.9	\N
1602	85	UBA	ngx	50.9	6.04
1603	85	AMZN	us	215.2	1.6341
1604	85	LLY	us	930.35	-5.9416
1605	85	MSFT	us	399.41	-0.135
1606	85	NFLX	us	94.36	-0.8824
1607	85	NVDA	us	181.93	-0.6861
1608	85	TSM	us	345.98	1.9766
1609	86	ARADEL	ngx	1340	\N
1610	86	BETAGLAS	ngx	498.5	\N
1611	86	BUACEMENT	ngx	326.7	10
1612	86	CUSTODIAN	ngx	77	-2.53
1613	86	DANGCEM	ngx	810	0.88
1614	86	FIDSON	ngx	105.35	\N
1615	86	GTCO	ngx	123.5	4.53
1616	86	MTNN	ngx	760	-4.76
1617	86	NNFM	ngx	79.4	\N
1618	86	OANDO	ngx	47	-2.29
1619	86	OKOMUOIL	ngx	1765	\N
1620	86	PRESCO	ngx	1875.6	-10
1621	86	SEPLAT	ngx	9099.9	\N
1622	86	UBA	ngx	50.9	6.04
1623	86	AMZN	us	215.2	1.6341
1624	86	LLY	us	930.35	-5.9416
1625	86	MSFT	us	399.41	-0.135
1626	86	NFLX	us	94.36	-0.8824
1627	86	NVDA	us	181.93	-0.6861
1628	86	TSM	us	345.98	1.9766
1629	87	ARADEL	ngx	1340	\N
1630	87	BETAGLAS	ngx	498.5	\N
1631	87	BUACEMENT	ngx	326.7	10
1632	87	CUSTODIAN	ngx	77	-2.53
1633	87	DANGCEM	ngx	810	0.88
1634	87	FIDSON	ngx	105.35	\N
1635	87	GTCO	ngx	123.5	4.53
1636	87	MTNN	ngx	760	-4.76
1637	87	NNFM	ngx	79.4	\N
1638	87	OANDO	ngx	47	-2.29
1639	87	OKOMUOIL	ngx	1765	\N
1640	87	PRESCO	ngx	1875.6	-10
1641	87	SEPLAT	ngx	9099.9	\N
1642	87	UBA	ngx	50.9	6.04
1643	87	AMZN	us	215.2	1.6341
1644	87	LLY	us	930.35	-5.9416
1645	87	MSFT	us	399.41	-0.135
1646	87	NFLX	us	94.36	-0.8824
1647	87	NVDA	us	181.93	-0.6861
1648	87	TSM	us	345.98	1.9766
1649	88	ARADEL	ngx	1210.3	-9.68
1650	88	BETAGLAS	ngx	498.5	\N
1651	88	BUACEMENT	ngx	326.7	10
1652	88	CUSTODIAN	ngx	78.5	1.95
1653	88	DANGCEM	ngx	810	0.88
1654	88	FIDSON	ngx	105.35	\N
1655	88	GTCO	ngx	114.35	-7.41
1656	88	MTNN	ngx	758	-0.26
1657	88	NNFM	ngx	79.4	\N
1658	88	OANDO	ngx	47.15	0.32
1659	88	OKOMUOIL	ngx	1765	\N
1660	88	PRESCO	ngx	1701.1	-9.3
1661	88	SEPLAT	ngx	9099.9	\N
1662	88	UBA	ngx	48.75	-4.22
1663	88	AMZN	us	210.805	-2.0423
1664	88	LLY	us	919.57	-1.1587
1665	88	MSFT	us	392.98	-1.6099
1666	88	NFLX	us	94.715	0.3762
1667	88	NVDA	us	182.115	0.1017
1668	88	TSM	us	342.74	-0.9365
1669	89	ARADEL	ngx	1210.3	-9.68
1670	89	BETAGLAS	ngx	498.5	\N
1671	89	BUACEMENT	ngx	326.7	\N
1672	89	CUSTODIAN	ngx	78.5	1.95
1673	89	DANGCEM	ngx	810	\N
1674	89	FIDSON	ngx	105.35	\N
1675	89	GTCO	ngx	114.35	-7.41
1676	89	MTNN	ngx	758	-0.26
1677	89	NNFM	ngx	79.4	\N
1678	89	OANDO	ngx	47.15	0.32
1679	89	OKOMUOIL	ngx	1765	\N
1680	89	PRESCO	ngx	1701.1	-9.3
1681	89	SEPLAT	ngx	9099.9	\N
1682	89	UBA	ngx	48.75	-4.22
1683	89	AMZN	us	209.87	-2.4768
1684	89	LLY	us	918.05	-1.3221
1685	89	MSFT	us	391.79	-1.9078
1686	89	NFLX	us	94.7	0.3603
1687	89	NVDA	us	180.4	-0.841
1688	89	TSM	us	339.57	-1.8527
1689	90	ARADEL	ngx	1210.3	-9.68
1690	90	BETAGLAS	ngx	498.5	\N
1691	90	BUACEMENT	ngx	326.7	\N
1692	90	CUSTODIAN	ngx	78.5	1.95
1693	90	DANGCEM	ngx	810	\N
1694	90	FIDSON	ngx	105.35	\N
1695	90	GTCO	ngx	114.35	-7.41
1696	90	MTNN	ngx	758	-0.26
1697	90	NNFM	ngx	79.4	\N
1698	90	OANDO	ngx	47.15	0.32
1699	90	OKOMUOIL	ngx	1765	\N
1700	90	PRESCO	ngx	1701.1	-9.3
1701	90	SEPLAT	ngx	9099.9	\N
1702	90	UBA	ngx	48.75	-4.22
1703	90	AMZN	us	209.87	-2.4768
1704	90	LLY	us	918.05	-1.3221
1705	90	MSFT	us	391.79	-1.9078
1706	90	NFLX	us	94.7	0.3603
1707	90	NVDA	us	180.4	-0.841
1708	90	TSM	us	339.57	-1.8527
1709	91	ARADEL	ngx	1210.3	-9.68
1710	91	BETAGLAS	ngx	498.5	\N
1711	91	BUACEMENT	ngx	326.7	\N
1712	91	CUSTODIAN	ngx	78.5	1.95
1713	91	DANGCEM	ngx	810	\N
1714	91	FIDSON	ngx	105.35	\N
1715	91	GTCO	ngx	114.35	-7.41
1716	91	MTNN	ngx	758	-0.26
1717	91	NNFM	ngx	79.4	\N
1718	91	OANDO	ngx	47.15	0.32
1719	91	OKOMUOIL	ngx	1765	\N
1720	91	PRESCO	ngx	1701.1	-9.3
1721	91	SEPLAT	ngx	9099.9	\N
1722	91	UBA	ngx	48.75	-4.22
1723	91	AMZN	us	209.87	-2.4768
1724	91	LLY	us	918.05	-1.3221
1725	91	MSFT	us	391.79	-1.9078
1726	91	NFLX	us	94.7	0.3603
1727	91	NVDA	us	180.4	-0.841
1728	91	TSM	us	339.57	-1.8527
1729	92	ARADEL	ngx	1210.3	-9.68
1730	92	BETAGLAS	ngx	498.5	\N
1731	92	BUACEMENT	ngx	326.7	\N
1732	92	CUSTODIAN	ngx	78.5	1.95
1733	92	DANGCEM	ngx	810	\N
1734	92	FIDSON	ngx	105.35	\N
1735	92	GTCO	ngx	114.35	-7.41
1736	92	MTNN	ngx	758	-0.26
1737	92	NNFM	ngx	79.4	\N
1738	92	OANDO	ngx	47.15	0.32
1739	92	OKOMUOIL	ngx	1765	\N
1740	92	PRESCO	ngx	1701.1	-9.3
1741	92	SEPLAT	ngx	9099.9	\N
1742	92	UBA	ngx	48.75	-4.22
1743	92	AMZN	us	209.87	-2.4768
1744	92	LLY	us	918.05	-1.3221
1745	92	MSFT	us	391.79	-1.9078
1746	92	NFLX	us	94.7	0.3603
1747	92	NVDA	us	180.4	-0.841
1748	92	TSM	us	339.57	-1.8527
1749	93	ARADEL	ngx	1210.3	-9.68
1750	93	BETAGLAS	ngx	498.5	\N
1751	93	BUACEMENT	ngx	326.7	\N
1752	93	CUSTODIAN	ngx	78.5	1.95
1753	93	DANGCEM	ngx	810	\N
1754	93	FIDSON	ngx	105.35	\N
1755	93	GTCO	ngx	114.35	-7.41
1756	93	MTNN	ngx	758	-0.26
1757	93	NNFM	ngx	79.4	\N
1758	93	OANDO	ngx	47.15	0.32
1759	93	OKOMUOIL	ngx	1765	\N
1760	93	PRESCO	ngx	1701.1	-9.3
1761	93	SEPLAT	ngx	9099.9	\N
1762	93	UBA	ngx	48.75	-4.22
1763	93	AMZN	us	209.87	-2.4768
1764	93	LLY	us	918.05	-1.3221
1765	93	MSFT	us	391.79	-1.9078
1766	93	NFLX	us	94.7	0.3603
1767	93	NVDA	us	180.4	-0.841
1768	93	TSM	us	339.57	-1.8527
1769	94	ARADEL	ngx	1210.3	-9.68
1770	94	BETAGLAS	ngx	498.5	\N
1771	94	BUACEMENT	ngx	326.7	\N
1772	94	CUSTODIAN	ngx	78.5	1.95
1773	94	DANGCEM	ngx	810	\N
1774	94	FIDSON	ngx	105.35	\N
1775	94	GTCO	ngx	114.35	-7.41
1776	94	MTNN	ngx	758	-0.26
1777	94	NNFM	ngx	79.4	\N
1778	94	OANDO	ngx	47.15	0.32
1779	94	OKOMUOIL	ngx	1765	\N
1780	94	PRESCO	ngx	1701.1	-9.3
1781	94	SEPLAT	ngx	9099.9	\N
1782	94	UBA	ngx	48.75	-4.22
1783	94	AMZN	us	209.87	-2.4768
1784	94	LLY	us	918.05	-1.3221
1785	94	MSFT	us	391.79	-1.9078
1786	94	NFLX	us	94.7	0.3603
1787	94	NVDA	us	180.4	-0.841
1788	94	TSM	us	339.57	-1.8527
1789	95	ARADEL	ngx	1210.3	-9.68
1790	95	BETAGLAS	ngx	498.5	\N
1791	95	BUACEMENT	ngx	326.7	\N
1792	95	CUSTODIAN	ngx	78.5	1.95
1793	95	DANGCEM	ngx	810	\N
1794	95	FIDSON	ngx	105.35	\N
1795	95	GTCO	ngx	114.35	-7.41
1796	95	MTNN	ngx	758	-0.26
1797	95	NNFM	ngx	79.4	\N
1798	95	OANDO	ngx	47.15	0.32
1799	95	OKOMUOIL	ngx	1765	\N
1800	95	PRESCO	ngx	1701.1	-9.3
1801	95	SEPLAT	ngx	9099.9	\N
1802	95	UBA	ngx	48.75	-4.22
1803	95	AMZN	us	209.87	-2.4768
1804	95	LLY	us	918.05	-1.3221
1805	95	MSFT	us	391.79	-1.9078
1806	95	NFLX	us	94.7	0.3603
1807	95	NVDA	us	180.4	-0.841
1808	95	TSM	us	339.57	-1.8527
1809	96	ARADEL	ngx	1210.3	-9.68
1810	96	BETAGLAS	ngx	498.5	\N
1811	96	BUACEMENT	ngx	326.7	\N
1812	96	CUSTODIAN	ngx	78.5	1.95
1813	96	DANGCEM	ngx	810	\N
1814	96	FIDSON	ngx	105.35	\N
1815	96	GTCO	ngx	114.35	-7.41
1816	96	MTNN	ngx	758	-0.26
1817	96	NNFM	ngx	79.4	\N
1818	96	OANDO	ngx	47.15	0.32
1819	96	OKOMUOIL	ngx	1765	\N
1820	96	PRESCO	ngx	1701.1	-9.3
1821	96	SEPLAT	ngx	9099.9	\N
1822	96	UBA	ngx	48.75	-4.22
1823	96	AMZN	us	209.87	-2.4768
1824	96	LLY	us	918.05	-1.3221
1825	96	MSFT	us	391.79	-1.9078
1826	96	NFLX	us	94.7	0.3603
1827	96	NVDA	us	180.4	-0.841
1828	96	TSM	us	339.57	-1.8527
1829	97	ARADEL	ngx	1210.3	-9.68
1830	97	BETAGLAS	ngx	498.5	\N
1831	97	BUACEMENT	ngx	326.7	\N
1832	97	CUSTODIAN	ngx	78.5	1.95
1833	97	DANGCEM	ngx	810	\N
1834	97	FIDSON	ngx	105.35	\N
1835	97	GTCO	ngx	114.35	-7.41
1836	97	MTNN	ngx	758	-0.26
1837	97	NNFM	ngx	79.4	\N
1838	97	OANDO	ngx	47.15	0.32
1839	97	OKOMUOIL	ngx	1765	\N
1840	97	PRESCO	ngx	1701.1	-9.3
1841	97	SEPLAT	ngx	9099.9	\N
1842	97	UBA	ngx	48.75	-4.22
1843	97	AMZN	us	209.87	-2.4768
1844	97	LLY	us	918.05	-1.3221
1845	97	MSFT	us	391.79	-1.9078
1846	97	NFLX	us	94.7	0.3603
1847	97	NVDA	us	180.4	-0.841
1848	97	TSM	us	339.57	-1.8527
1849	98	ARADEL	ngx	1210.3	-9.68
1850	98	BETAGLAS	ngx	498.5	\N
1851	98	BUACEMENT	ngx	326.7	\N
1852	98	CUSTODIAN	ngx	78.5	1.95
1853	98	DANGCEM	ngx	810	\N
1854	98	FIDSON	ngx	105.35	\N
1855	98	GTCO	ngx	114.35	-7.41
1856	98	MTNN	ngx	758	-0.26
1857	98	NNFM	ngx	79.4	\N
1858	98	OANDO	ngx	47.15	0.32
1859	98	OKOMUOIL	ngx	1765	\N
1860	98	PRESCO	ngx	1701.1	-9.3
1861	98	SEPLAT	ngx	9099.9	\N
1862	98	UBA	ngx	48.75	-4.22
1863	98	AMZN	us	209.87	-2.4768
1864	98	LLY	us	918.05	-1.3221
1865	98	MSFT	us	391.79	-1.9078
1866	98	NFLX	us	94.7	0.3603
1867	98	NVDA	us	180.4	-0.841
1868	98	TSM	us	339.57	-1.8527
1869	99	ARADEL	ngx	1210.3	-9.68
1870	99	BETAGLAS	ngx	498.5	\N
1871	99	BUACEMENT	ngx	326.7	\N
1872	99	CUSTODIAN	ngx	78.5	1.95
1873	99	DANGCEM	ngx	810	\N
1874	99	FIDSON	ngx	105.35	\N
1875	99	GTCO	ngx	114.35	-7.41
1876	99	MTNN	ngx	758	-0.26
1877	99	NNFM	ngx	79.4	\N
1878	99	OANDO	ngx	47.15	0.32
1879	99	OKOMUOIL	ngx	1765	\N
1880	99	PRESCO	ngx	1701.1	-9.3
1881	99	SEPLAT	ngx	9099.9	\N
1882	99	UBA	ngx	48.75	-4.22
1883	99	AMZN	us	208.491	-0.6571
1884	99	LLY	us	919.095	0.1138
1885	99	MSFT	us	390.54	-0.319
1886	99	NFLX	us	92.87	-1.9324
1887	99	NVDA	us	178.68	-0.9534
1888	99	TSM	us	335.465	-1.2089
1889	100	ARADEL	ngx	1210.3	-9.68
1890	100	BETAGLAS	ngx	498.5	\N
1891	100	BUACEMENT	ngx	326.7	\N
1892	100	CUSTODIAN	ngx	78.5	1.95
1893	100	DANGCEM	ngx	810	\N
1894	100	FIDSON	ngx	105.35	\N
1895	100	GTCO	ngx	114.35	-7.41
1896	100	MTNN	ngx	758	-0.26
1897	100	NNFM	ngx	79.4	\N
1898	100	OANDO	ngx	47.15	0.32
1899	100	OKOMUOIL	ngx	1765	\N
1900	100	PRESCO	ngx	1701.1	-9.3
1901	100	SEPLAT	ngx	9099.9	\N
1902	100	UBA	ngx	48.75	-4.22
1903	100	AMZN	us	206.81	-1.458
1904	100	LLY	us	919.27	0.1329
1905	100	MSFT	us	387.891	-0.9952
1906	100	NFLX	us	91.005	-3.9018
1907	100	NVDA	us	177.875	-1.3997
1908	100	TSM	us	332.25	-2.1557
1909	101	ARADEL	ngx	1210.3	-9.68
1910	101	BETAGLAS	ngx	498.5	\N
1911	101	BUACEMENT	ngx	326.7	\N
1912	101	CUSTODIAN	ngx	78.5	1.95
1913	101	DANGCEM	ngx	810	\N
1914	101	FIDSON	ngx	105.35	\N
1915	101	GTCO	ngx	114.35	-7.41
1916	101	MTNN	ngx	758	-0.26
1917	101	NNFM	ngx	79.4	\N
1918	101	OANDO	ngx	47.15	0.32
1919	101	OKOMUOIL	ngx	1765	\N
1920	101	PRESCO	ngx	1701.1	-9.3
1921	101	SEPLAT	ngx	9099.9	\N
1922	101	UBA	ngx	48.75	-4.22
1923	101	AMZN	us	208.76	-0.5289
1924	101	LLY	us	917.5	-0.0599
1925	101	MSFT	us	389.02	-0.707
1926	101	NFLX	us	91.74	-3.1257
1927	101	NVDA	us	178.56	-1.02
1928	101	TSM	us	338.79	-0.2297
1929	102	ARADEL	ngx	1210.3	-9.68
1930	102	BETAGLAS	ngx	498.5	\N
1931	102	BUACEMENT	ngx	326.7	\N
1932	102	CUSTODIAN	ngx	78.5	1.95
1933	102	DANGCEM	ngx	810	\N
1934	102	FIDSON	ngx	105.35	\N
1935	102	GTCO	ngx	114.35	-7.41
1936	102	MTNN	ngx	758	-0.26
1937	102	NNFM	ngx	79.4	\N
1938	102	OANDO	ngx	47.15	0.32
1939	102	OKOMUOIL	ngx	1765	\N
1940	102	PRESCO	ngx	1701.1	-9.3
1941	102	SEPLAT	ngx	9099.9	\N
1942	102	UBA	ngx	48.75	-4.22
1943	102	AMZN	us	208.76	-0.5289
1944	102	LLY	us	917.5	-0.0599
1945	102	MSFT	us	389.02	-0.707
1946	102	NFLX	us	91.74	-3.1257
1947	102	NVDA	us	178.56	-1.02
1948	102	TSM	us	338.79	-0.2297
1949	103	ARADEL	ngx	1210.3	-9.68
1950	103	BETAGLAS	ngx	498.5	\N
1951	103	BUACEMENT	ngx	326.7	\N
1952	103	CUSTODIAN	ngx	78.5	1.95
1953	103	DANGCEM	ngx	810	\N
1954	103	FIDSON	ngx	105.35	\N
1955	103	GTCO	ngx	114.35	-7.41
1956	103	MTNN	ngx	758	-0.26
1957	103	NNFM	ngx	79.4	\N
1958	103	OANDO	ngx	47.15	0.32
1959	103	OKOMUOIL	ngx	1765	\N
1960	103	PRESCO	ngx	1701.1	-9.3
1961	103	SEPLAT	ngx	9099.9	\N
1962	103	UBA	ngx	48.75	-4.22
1963	103	AMZN	us	208.76	-0.5289
1964	103	LLY	us	917.5	-0.0599
1965	103	MSFT	us	389.02	-0.707
1966	103	NFLX	us	91.74	-3.1257
1967	103	NVDA	us	178.56	-1.02
1968	103	TSM	us	338.79	-0.2297
1969	104	ARADEL	ngx	1210.3	-9.68
1970	104	BETAGLAS	ngx	498.5	\N
1971	104	BUACEMENT	ngx	326.7	\N
1972	104	CUSTODIAN	ngx	78.5	1.95
1973	104	DANGCEM	ngx	810	\N
1974	104	FIDSON	ngx	105.35	\N
1975	104	GTCO	ngx	114.35	-7.41
1976	104	MTNN	ngx	758	-0.26
1977	104	NNFM	ngx	79.4	\N
1978	104	OANDO	ngx	47.15	0.32
1979	104	OKOMUOIL	ngx	1765	\N
1980	104	PRESCO	ngx	1701.1	-9.3
1981	104	SEPLAT	ngx	9099.9	\N
1982	104	UBA	ngx	48.75	-4.22
1983	104	AMZN	us	208.76	-0.5289
1984	104	LLY	us	917.5	-0.0599
1985	104	MSFT	us	389.02	-0.707
1986	104	NFLX	us	91.74	-3.1257
1987	104	NVDA	us	178.56	-1.02
1988	104	TSM	us	338.79	-0.2297
1989	105	ARADEL	ngx	1210.3	-9.68
1990	105	BETAGLAS	ngx	498.5	\N
1991	105	BUACEMENT	ngx	326.7	\N
1992	105	CUSTODIAN	ngx	78.5	1.95
1993	105	DANGCEM	ngx	810	\N
1994	105	FIDSON	ngx	105.35	\N
1995	105	GTCO	ngx	114.35	-7.41
1996	105	MTNN	ngx	758	-0.26
1997	105	NNFM	ngx	79.4	\N
1998	105	OANDO	ngx	47.15	0.32
1999	105	OKOMUOIL	ngx	1765	\N
2000	105	PRESCO	ngx	1701.1	-9.3
2001	105	SEPLAT	ngx	9099.9	\N
2002	105	UBA	ngx	48.75	-4.22
2003	105	AMZN	us	208.76	-0.5289
2004	105	LLY	us	917.5	-0.0599
2005	105	MSFT	us	389.02	-0.707
2006	105	NFLX	us	91.74	-3.1257
2007	105	NVDA	us	178.56	-1.02
2008	105	TSM	us	338.79	-0.2297
2009	106	ARADEL	ngx	1210.3	-9.68
2010	106	BETAGLAS	ngx	498.5	\N
2011	106	BUACEMENT	ngx	326.7	\N
2012	106	CUSTODIAN	ngx	78.5	1.95
2013	106	DANGCEM	ngx	810	\N
2014	106	FIDSON	ngx	105.35	\N
2015	106	GTCO	ngx	114.35	-7.41
2016	106	MTNN	ngx	758	-0.26
2017	106	NNFM	ngx	79.4	\N
2018	106	OANDO	ngx	47.15	0.32
2019	106	OKOMUOIL	ngx	1765	\N
2020	106	PRESCO	ngx	1701.1	-9.3
2021	106	SEPLAT	ngx	9099.9	\N
2022	106	UBA	ngx	48.75	-4.22
2023	106	AMZN	us	208.76	-0.5289
2024	106	LLY	us	917.5	-0.0599
2025	106	MSFT	us	389.02	-0.707
2026	106	NFLX	us	91.74	-3.1257
2027	106	NVDA	us	178.56	-1.02
2028	106	TSM	us	338.79	-0.2297
2029	107	ARADEL	ngx	1210.3	-9.68
2030	107	BETAGLAS	ngx	498.5	\N
2031	107	BUACEMENT	ngx	326.7	\N
2032	107	CUSTODIAN	ngx	78.5	1.95
2033	107	DANGCEM	ngx	810	\N
2034	107	FIDSON	ngx	105.35	\N
2035	107	GTCO	ngx	114.35	-7.41
2036	107	MTNN	ngx	758	-0.26
2037	107	NNFM	ngx	79.4	\N
2038	107	OANDO	ngx	47.15	0.32
2039	107	OKOMUOIL	ngx	1765	\N
2040	107	PRESCO	ngx	1701.1	-9.3
2041	107	SEPLAT	ngx	9099.9	\N
2042	107	UBA	ngx	48.75	-4.22
2043	107	AMZN	us	208.76	-0.5289
2044	107	LLY	us	917.5	-0.0599
2045	107	MSFT	us	389.02	-0.707
2046	107	NFLX	us	91.74	-3.1257
2047	107	NVDA	us	178.56	-1.02
2048	107	TSM	us	338.79	-0.2297
2049	108	ARADEL	ngx	1210.3	-9.68
2050	108	BETAGLAS	ngx	498.5	\N
2051	108	BUACEMENT	ngx	326.7	\N
2052	108	CUSTODIAN	ngx	78.5	1.95
2053	108	DANGCEM	ngx	810	\N
2054	108	FIDSON	ngx	105.35	\N
2055	108	GTCO	ngx	114.35	-7.41
2056	108	MTNN	ngx	758	-0.26
2057	108	NNFM	ngx	79.4	\N
2058	108	OANDO	ngx	47.15	0.32
2059	108	OKOMUOIL	ngx	1765	\N
2060	108	PRESCO	ngx	1701.1	-9.3
2061	108	SEPLAT	ngx	9099.9	\N
2062	108	UBA	ngx	48.75	-4.22
2063	108	AMZN	us	208.76	-0.5289
2064	108	LLY	us	917.5	-0.0599
2065	108	MSFT	us	389.02	-0.707
2066	108	NFLX	us	91.74	-3.1257
2067	108	NVDA	us	178.56	-1.02
2068	108	TSM	us	338.79	-0.2297
2069	109	ARADEL	ngx	1210.3	-9.68
2070	109	BETAGLAS	ngx	498.5	\N
2071	109	BUACEMENT	ngx	326.7	\N
2072	109	CUSTODIAN	ngx	78.5	1.95
2073	109	DANGCEM	ngx	810	\N
2074	109	FIDSON	ngx	105.35	\N
2075	109	GTCO	ngx	114.35	-7.41
2076	109	MTNN	ngx	758	-0.26
2077	109	NNFM	ngx	79.4	\N
2078	109	OANDO	ngx	47.15	0.32
2079	109	OKOMUOIL	ngx	1765	\N
2080	109	PRESCO	ngx	1701.1	-9.3
2081	109	SEPLAT	ngx	9099.9	\N
2082	109	UBA	ngx	48.75	-4.22
2083	109	AMZN	us	208.76	-0.5289
2084	109	LLY	us	917.5	-0.0599
2085	109	MSFT	us	389.02	-0.707
2086	109	NFLX	us	91.74	-3.1257
2087	109	NVDA	us	178.56	-1.02
2088	109	TSM	us	338.79	-0.2297
2089	110	ARADEL	ngx	1210.3	-9.68
2090	110	BETAGLAS	ngx	498.5	\N
2091	110	BUACEMENT	ngx	326.7	\N
2092	110	CUSTODIAN	ngx	78.5	1.95
2093	110	DANGCEM	ngx	810	\N
2094	110	FIDSON	ngx	105.35	\N
2095	110	GTCO	ngx	114.35	-7.41
2096	110	MTNN	ngx	758	-0.26
2097	110	NNFM	ngx	79.4	\N
2098	110	OANDO	ngx	47.15	0.32
2099	110	OKOMUOIL	ngx	1765	\N
2100	110	PRESCO	ngx	1701.1	-9.3
2101	110	SEPLAT	ngx	9099.9	\N
2102	110	UBA	ngx	48.75	-4.22
2103	110	AMZN	us	208.76	-0.5289
2104	110	LLY	us	917.5	-0.0599
2105	110	MSFT	us	389.02	-0.707
2106	110	NFLX	us	91.74	-3.1257
2107	110	NVDA	us	178.56	-1.02
2108	110	TSM	us	338.79	-0.2297
2109	111	ARADEL	ngx	1210.3	-9.68
2110	111	BETAGLAS	ngx	498.5	\N
2111	111	BUACEMENT	ngx	326.7	\N
2112	111	CUSTODIAN	ngx	78.5	1.95
2113	111	DANGCEM	ngx	810	\N
2114	111	FIDSON	ngx	105.35	\N
2115	111	GTCO	ngx	114.35	-7.41
2116	111	MTNN	ngx	758	-0.26
2117	111	NNFM	ngx	79.4	\N
2118	111	OANDO	ngx	47.15	0.32
2119	111	OKOMUOIL	ngx	1765	\N
2120	111	PRESCO	ngx	1701.1	-9.3
2121	111	SEPLAT	ngx	9099.9	\N
2122	111	UBA	ngx	48.75	-4.22
2123	111	AMZN	us	208.76	-0.5289
2124	111	LLY	us	917.5	-0.0599
2125	111	MSFT	us	389.02	-0.707
2126	111	NFLX	us	91.74	-3.1257
2127	111	NVDA	us	178.56	-1.02
2128	111	TSM	us	338.79	-0.2297
2129	112	ARADEL	ngx	1210.3	-9.68
2130	112	BETAGLAS	ngx	498.5	\N
2131	112	BUACEMENT	ngx	326.7	\N
2132	112	CUSTODIAN	ngx	78.5	1.95
2133	112	DANGCEM	ngx	810	\N
2134	112	FIDSON	ngx	105.35	\N
2135	112	GTCO	ngx	114.35	-7.41
2136	112	MTNN	ngx	758	-0.26
2137	112	NNFM	ngx	79.4	\N
2138	112	OANDO	ngx	47.15	0.32
2139	112	OKOMUOIL	ngx	1765	\N
2140	112	PRESCO	ngx	1701.1	-9.3
2141	112	SEPLAT	ngx	9099.9	\N
2142	112	UBA	ngx	48.75	-4.22
2143	112	AMZN	us	208.76	-0.5289
2144	112	LLY	us	917.5	-0.0599
2145	112	MSFT	us	389.02	-0.707
2146	112	NFLX	us	91.74	-3.1257
2147	112	NVDA	us	178.56	-1.02
2148	112	TSM	us	338.79	-0.2297
2149	113	ARADEL	ngx	1210.3	-9.68
2150	113	BETAGLAS	ngx	498.5	\N
2151	113	BUACEMENT	ngx	326.7	\N
2152	113	CUSTODIAN	ngx	78.5	1.95
2153	113	DANGCEM	ngx	810	\N
2154	113	FIDSON	ngx	105.35	\N
2155	113	GTCO	ngx	114.35	-7.41
2156	113	MTNN	ngx	758	-0.26
2157	113	NNFM	ngx	79.4	\N
2158	113	OANDO	ngx	47.15	0.32
2159	113	OKOMUOIL	ngx	1765	\N
2160	113	PRESCO	ngx	1701.1	-9.3
2161	113	SEPLAT	ngx	9099.9	\N
2162	113	UBA	ngx	48.75	-4.22
2163	113	AMZN	us	208.76	-0.5289
2164	113	LLY	us	917.5	-0.0599
2165	113	MSFT	us	389.02	-0.707
2166	113	NFLX	us	91.74	-3.1257
2167	113	NVDA	us	178.56	-1.02
2168	113	TSM	us	338.79	-0.2297
2169	114	ARADEL	ngx	1210.3	-9.68
2170	114	BETAGLAS	ngx	498.5	\N
2171	114	BUACEMENT	ngx	326.7	\N
2172	114	CUSTODIAN	ngx	78.5	1.95
2173	114	DANGCEM	ngx	810	\N
2174	114	FIDSON	ngx	105.35	\N
2175	114	GTCO	ngx	114.35	-7.41
2176	114	MTNN	ngx	758	-0.26
2177	114	NNFM	ngx	79.4	\N
2178	114	OANDO	ngx	47.15	0.32
2179	114	OKOMUOIL	ngx	1765	\N
2180	114	PRESCO	ngx	1701.1	-9.3
2181	114	SEPLAT	ngx	9099.9	\N
2182	114	UBA	ngx	48.75	-4.22
2183	114	AMZN	us	208.76	-0.5289
2184	114	LLY	us	917.5	-0.0599
2185	114	MSFT	us	389.02	-0.707
2186	114	NFLX	us	91.74	-3.1257
2187	114	NVDA	us	178.56	-1.02
2188	114	TSM	us	338.79	-0.2297
2189	115	ARADEL	ngx	1210.3	-9.68
2190	115	BETAGLAS	ngx	498.5	\N
2191	115	BUACEMENT	ngx	326.7	\N
2192	115	CUSTODIAN	ngx	78.5	1.95
2193	115	DANGCEM	ngx	810	\N
2194	115	FIDSON	ngx	105.35	\N
2195	115	GTCO	ngx	114.35	-7.41
2196	115	MTNN	ngx	758	-0.26
2197	115	NNFM	ngx	79.4	\N
2198	115	OANDO	ngx	47.15	0.32
2199	115	OKOMUOIL	ngx	1765	\N
2200	115	PRESCO	ngx	1701.1	-9.3
2201	115	SEPLAT	ngx	9099.9	\N
2202	115	UBA	ngx	48.75	-4.22
2203	115	AMZN	us	208.76	-0.5289
2204	115	LLY	us	917.5	-0.0599
2205	115	MSFT	us	389.02	-0.707
2206	115	NFLX	us	91.74	-3.1257
2207	115	NVDA	us	178.56	-1.02
2208	115	TSM	us	338.79	-0.2297
2209	116	ARADEL	ngx	1210.3	-9.68
2210	116	BETAGLAS	ngx	498.5	\N
2211	116	BUACEMENT	ngx	326.7	\N
2212	116	CUSTODIAN	ngx	78.5	1.95
2213	116	DANGCEM	ngx	810	\N
2214	116	FIDSON	ngx	105.35	\N
2215	116	GTCO	ngx	114.35	-7.41
2216	116	MTNN	ngx	758	-0.26
2217	116	NNFM	ngx	79.4	\N
2218	116	OANDO	ngx	47.15	0.32
2219	116	OKOMUOIL	ngx	1765	\N
2220	116	PRESCO	ngx	1701.1	-9.3
2221	116	SEPLAT	ngx	9099.9	\N
2222	116	UBA	ngx	48.75	-4.22
2223	116	AMZN	us	208.76	-0.5289
2224	116	LLY	us	917.5	-0.0599
2225	116	MSFT	us	389.02	-0.707
2226	116	NFLX	us	91.74	-3.1257
2227	116	NVDA	us	178.56	-1.02
2228	116	TSM	us	338.79	-0.2297
2229	117	ARADEL	ngx	1210.3	-9.68
2230	117	BETAGLAS	ngx	498.5	\N
2231	117	BUACEMENT	ngx	326.7	\N
2232	117	CUSTODIAN	ngx	78.5	1.95
2233	117	DANGCEM	ngx	810	\N
2234	117	FIDSON	ngx	105.35	\N
2235	117	GTCO	ngx	114.35	-7.41
2236	117	MTNN	ngx	758	-0.26
2237	117	NNFM	ngx	79.4	\N
2238	117	OANDO	ngx	47.15	0.32
2239	117	OKOMUOIL	ngx	1765	\N
2240	117	PRESCO	ngx	1701.1	-9.3
2241	117	SEPLAT	ngx	9099.9	\N
2242	117	UBA	ngx	48.75	-4.22
2243	117	AMZN	us	206.345	-1.1616
2244	117	LLY	us	919.605	0.2294
2245	117	MSFT	us	383.09	-1.5243
2246	117	NFLX	us	91.093	-0.7053
2247	117	NVDA	us	175.57	-1.6745
2248	117	TSM	us	328.65	-2.993
2249	118	ARADEL	ngx	1210.3	-9.68
2250	118	BETAGLAS	ngx	498.5	\N
2251	118	BUACEMENT	ngx	326.7	\N
2252	118	CUSTODIAN	ngx	78.5	1.95
2253	118	DANGCEM	ngx	810	\N
2254	118	FIDSON	ngx	105.35	\N
2255	118	GTCO	ngx	114.35	-7.41
2256	118	MTNN	ngx	758	-0.26
2257	118	NNFM	ngx	79.4	\N
2258	118	OANDO	ngx	47.15	0.32
2259	118	OKOMUOIL	ngx	1765	\N
2260	118	PRESCO	ngx	1701.1	-9.3
2261	118	SEPLAT	ngx	9099.9	\N
2262	118	UBA	ngx	48.75	-4.22
2263	118	AMZN	us	205.37	-1.6286
2264	118	LLY	us	906.7	-1.1771
2265	118	MSFT	us	381.85	-1.8481
2266	118	NFLX	us	91.82	0.0872
2267	118	NVDA	us	172.93	-3.0281
2268	118	TSM	us	329.24	-2.8189
2269	119	ARADEL	ngx	1210.3	\N
2270	119	BETAGLAS	ngx	498.5	\N
2271	119	BUACEMENT	ngx	326.7	\N
2272	119	CUSTODIAN	ngx	78.5	\N
2273	119	DANGCEM	ngx	810	\N
2274	119	FIDSON	ngx	105.35	\N
2275	119	GTCO	ngx	105	-8.18
2276	119	MTNN	ngx	709	-6.46
2277	119	NNFM	ngx	79.4	\N
2278	119	OANDO	ngx	50	6.05
2279	119	OKOMUOIL	ngx	1765	\N
2280	119	PRESCO	ngx	1871.2	10
2281	119	SEPLAT	ngx	9099.9	\N
2282	119	UBA	ngx	48.4	-0.72
2283	119	AMZN	us	211.62	3.0433
2284	119	LLY	us	917.885	1.2336
2285	119	MSFT	us	385.75	1.0213
2286	119	NFLX	us	92.885	1.1599
2287	119	NVDA	us	177.558	2.6762
2288	119	TSM	us	341.325	3.6706
2289	120	ARADEL	ngx	1210.3	\N
2290	120	BETAGLAS	ngx	498.5	\N
2291	120	BUACEMENT	ngx	326.7	\N
2292	120	CUSTODIAN	ngx	78.5	\N
2293	120	DANGCEM	ngx	810	\N
2294	120	FIDSON	ngx	105.35	\N
2295	120	GTCO	ngx	105	-8.18
2296	120	MTNN	ngx	709	-6.46
2297	120	NNFM	ngx	79.4	\N
2298	120	OANDO	ngx	50	6.05
2299	120	OKOMUOIL	ngx	1765	\N
2300	120	PRESCO	ngx	1871.2	10
2301	120	SEPLAT	ngx	9099.9	\N
2302	120	UBA	ngx	48.4	-0.72
2303	120	AMZN	us	210.14	2.3226
2304	120	LLY	us	910.55	0.4246
2305	120	MSFT	us	383	0.3012
2306	120	NFLX	us	93.38	1.699
2307	120	NVDA	us	175.64	1.5671
2308	120	TSM	us	338.45	2.7974
2309	121	ARADEL	ngx	1210.3	\N
2310	121	BETAGLAS	ngx	498.5	\N
2311	121	BUACEMENT	ngx	326.7	\N
2312	121	CUSTODIAN	ngx	78.5	\N
2313	121	DANGCEM	ngx	810	\N
2314	121	FIDSON	ngx	105.35	\N
2315	121	GTCO	ngx	111	5.71
2316	121	MTNN	ngx	701.1	-1.11
2317	121	NNFM	ngx	79.4	\N
2318	121	OANDO	ngx	49.95	-0.1
2319	121	OKOMUOIL	ngx	1765	\N
2320	121	PRESCO	ngx	1980	5.81
2321	121	SEPLAT	ngx	9099.9	\N
2322	121	UBA	ngx	47.9	-1.03
2323	121	AMZN	us	207.565	-1.2771
2324	121	LLY	us	905.545	-0.5497
2325	121	MSFT	us	374.11	-2.3747
2326	121	NFLX	us	91.55	-1.9597
2327	121	NVDA	us	175.655	-0.0142
2328	121	TSM	us	344.65	1.8319
2329	122	ARADEL	ngx	1210.3	\N
2330	122	BETAGLAS	ngx	498.5	\N
2331	122	BUACEMENT	ngx	326.7	\N
2332	122	CUSTODIAN	ngx	78.5	\N
2333	122	DANGCEM	ngx	810	\N
2334	122	FIDSON	ngx	105.35	\N
2335	122	GTCO	ngx	111	5.71
2336	122	MTNN	ngx	701.1	-1.11
2337	122	NNFM	ngx	79.4	\N
2338	122	OANDO	ngx	49.95	-0.1
2339	122	OKOMUOIL	ngx	1765	\N
2340	122	PRESCO	ngx	1980	5.81
2341	122	SEPLAT	ngx	9099.9	\N
2342	122	UBA	ngx	47.9	-1.03
2343	122	AMZN	us	207.33	-1.3888
2344	122	LLY	us	903.1	-0.8182
2345	122	MSFT	us	373.805	-2.4543
2346	122	NFLX	us	91.445	-2.0722
2347	122	NVDA	us	175.33	-0.1992
2348	122	TSM	us	343.89	1.6073
2349	123	ARADEL	ngx	1210.3	\N
2350	123	BETAGLAS	ngx	498.5	\N
2351	123	BUACEMENT	ngx	326.7	\N
2352	123	CUSTODIAN	ngx	78.5	\N
2353	123	DANGCEM	ngx	810	\N
2354	123	FIDSON	ngx	105.35	\N
2355	123	GTCO	ngx	111	5.71
2356	123	MTNN	ngx	701.1	-1.11
2357	123	NNFM	ngx	79.4	\N
2358	123	OANDO	ngx	49.95	-0.1
2359	123	OKOMUOIL	ngx	1765	\N
2360	123	PRESCO	ngx	1980	5.81
2361	123	SEPLAT	ngx	9099.9	\N
2362	123	UBA	ngx	47.9	-1.03
2363	123	AMZN	us	207.155	-1.4721
2364	123	LLY	us	902.475	-0.8868
2365	123	MSFT	us	373.15	-2.6252
2366	123	NFLX	us	91.215	-2.3185
2367	123	NVDA	us	175.025	-0.3728
2368	123	TSM	us	343.335	1.4433
2369	124	ARADEL	ngx	1210.3	\N
2370	124	BETAGLAS	ngx	498.5	\N
2371	124	BUACEMENT	ngx	326.7	\N
2372	124	CUSTODIAN	ngx	78.5	\N
2373	124	DANGCEM	ngx	810	\N
2374	124	FIDSON	ngx	105.35	\N
2375	124	GTCO	ngx	111	5.71
2376	124	MTNN	ngx	701.1	-1.11
2377	124	NNFM	ngx	79.4	\N
2378	124	OANDO	ngx	49.95	-0.1
2379	124	OKOMUOIL	ngx	1765	\N
2380	124	PRESCO	ngx	1980	5.81
2381	124	SEPLAT	ngx	9099.9	\N
2382	124	UBA	ngx	47.9	-1.03
2383	124	AMZN	us	207.24	-1.4316
2384	124	LLY	us	902.53	-0.8808
2385	124	MSFT	us	372.74	-2.7322
2386	124	NFLX	us	90.92	-2.6344
2387	124	NVDA	us	175.2	-0.2732
2388	124	TSM	us	343.24	1.4153
2389	125	ARADEL	ngx	1210.3	\N
2390	125	BETAGLAS	ngx	498.5	\N
2391	125	BUACEMENT	ngx	326.7	\N
2392	125	CUSTODIAN	ngx	78.5	\N
2393	125	DANGCEM	ngx	810	\N
2394	125	FIDSON	ngx	105.35	\N
2395	125	GTCO	ngx	111	5.71
2396	125	MTNN	ngx	701.1	-1.11
2397	125	NNFM	ngx	79.4	\N
2398	125	OANDO	ngx	49.95	-0.1
2399	125	OKOMUOIL	ngx	1765	\N
2400	125	PRESCO	ngx	1980	5.81
2401	125	SEPLAT	ngx	9099.9	\N
2402	125	UBA	ngx	47.9	-1.03
2403	125	AMZN	us	207.24	-1.4316
2404	125	LLY	us	903.02	-0.827
2405	125	MSFT	us	372.74	-2.7322
2406	125	NFLX	us	90.92	-2.6344
2407	125	NVDA	us	175.2	-0.2732
2408	125	TSM	us	343.25	1.4182
2409	126	ARADEL	ngx	1210.3	\N
2410	126	BETAGLAS	ngx	498.5	\N
2411	126	BUACEMENT	ngx	326.7	\N
2412	126	CUSTODIAN	ngx	77	-1.91
2413	126	DANGCEM	ngx	810	\N
2414	126	FIDSON	ngx	94.85	-9.97
2415	126	GTCO	ngx	114.55	3.2
2416	126	MTNN	ngx	718	2.41
2417	126	NNFM	ngx	79.4	\N
2418	126	OANDO	ngx	49.95	\N
2419	126	OKOMUOIL	ngx	1765	\N
2420	126	PRESCO	ngx	1980	\N
2421	126	SEPLAT	ngx	9099.9	\N
2422	126	UBA	ngx	47.2	-1.46
2423	126	AMZN	us	211.71	2.1569
2424	126	LLY	us	916.31	1.4717
2425	126	MSFT	us	371.04	-0.4561
2426	126	NFLX	us	92.28	1.4958
2427	126	NVDA	us	178.68	1.9863
2428	126	TSM	us	347.75	1.311
2429	127	ARADEL	ngx	1210.3	\N
2430	127	BETAGLAS	ngx	498.5	\N
2431	127	BUACEMENT	ngx	326.7	\N
2432	127	CUSTODIAN	ngx	77	-1.91
2433	127	DANGCEM	ngx	810	\N
2434	127	FIDSON	ngx	94.85	-9.97
2435	127	GTCO	ngx	114.55	3.2
2436	127	MTNN	ngx	718	2.41
2437	127	NNFM	ngx	79.4	\N
2438	127	OANDO	ngx	49.95	\N
2439	127	OKOMUOIL	ngx	1765	\N
2440	127	PRESCO	ngx	1980	\N
2441	127	SEPLAT	ngx	9099.9	\N
2442	127	UBA	ngx	47.2	-1.46
2443	127	AMZN	us	211.71	2.1569
2444	127	LLY	us	916.31	1.4717
2445	127	MSFT	us	371.04	-0.4561
2446	127	NFLX	us	92.28	1.4958
2447	127	NVDA	us	178.68	1.9863
2448	127	TSM	us	347.75	1.311
2449	128	ARADEL	ngx	1210.3	\N
2450	128	BETAGLAS	ngx	498.5	\N
2451	128	BUACEMENT	ngx	326.7	\N
2452	128	CUSTODIAN	ngx	77	-1.91
2453	128	DANGCEM	ngx	810	\N
2454	128	FIDSON	ngx	94.85	-9.97
2455	128	GTCO	ngx	114.55	3.2
2456	128	MTNN	ngx	718	2.41
2457	128	NNFM	ngx	79.4	\N
2458	128	OANDO	ngx	49.95	\N
2459	128	OKOMUOIL	ngx	1765	\N
2460	128	PRESCO	ngx	1980	\N
2461	128	SEPLAT	ngx	9099.9	\N
2462	128	UBA	ngx	47.2	-1.46
2463	128	AMZN	us	211.71	2.1569
2464	128	LLY	us	916.31	1.4717
2465	128	MSFT	us	371.04	-0.4561
2466	128	NFLX	us	92.28	1.4958
2467	128	NVDA	us	178.68	1.9863
2468	128	TSM	us	347.75	1.311
2469	129	ARADEL	ngx	1210.3	\N
2470	129	BETAGLAS	ngx	498.5	\N
2471	129	BUACEMENT	ngx	326.7	\N
2472	129	CUSTODIAN	ngx	77	-1.91
2473	129	DANGCEM	ngx	810	\N
2474	129	FIDSON	ngx	94.85	-9.97
2475	129	GTCO	ngx	114.55	3.2
2476	129	MTNN	ngx	718	2.41
2477	129	NNFM	ngx	79.4	\N
2478	129	OANDO	ngx	49.95	\N
2479	129	OKOMUOIL	ngx	1765	\N
2480	129	PRESCO	ngx	1980	\N
2481	129	SEPLAT	ngx	9099.9	\N
2482	129	UBA	ngx	47.2	-1.46
2483	129	AMZN	us	211.71	2.1569
2484	129	LLY	us	916.31	1.4717
2485	129	MSFT	us	371.04	-0.4561
2486	129	NFLX	us	92.28	1.4958
2487	129	NVDA	us	178.68	1.9863
2488	129	TSM	us	347.75	1.311
2489	130	ARADEL	ngx	1210.3	\N
2490	130	BETAGLAS	ngx	498.5	\N
2491	130	BUACEMENT	ngx	326.7	\N
2492	130	CUSTODIAN	ngx	77	-1.91
2493	130	DANGCEM	ngx	810	\N
2494	130	FIDSON	ngx	94.85	-9.97
2495	130	GTCO	ngx	114.55	3.2
2496	130	MTNN	ngx	718	2.41
2497	130	NNFM	ngx	79.4	\N
2498	130	OANDO	ngx	49.95	\N
2499	130	OKOMUOIL	ngx	1765	\N
2500	130	PRESCO	ngx	1980	\N
2501	130	SEPLAT	ngx	9099.9	\N
2502	130	UBA	ngx	47.2	-1.46
2503	130	AMZN	us	211.71	2.1569
2504	130	LLY	us	916.31	1.4717
2505	130	MSFT	us	371.04	-0.4561
2506	130	NFLX	us	92.28	1.4958
2507	130	NVDA	us	178.68	1.9863
2508	130	TSM	us	347.75	1.311
2509	131	ARADEL	ngx	1210.3	\N
2510	131	BETAGLAS	ngx	498.5	\N
2511	131	BUACEMENT	ngx	326.7	\N
2512	131	CUSTODIAN	ngx	77	-1.91
2513	131	DANGCEM	ngx	810	\N
2514	131	FIDSON	ngx	94.85	-9.97
2515	131	GTCO	ngx	114.55	3.2
2516	131	MTNN	ngx	718	2.41
2517	131	NNFM	ngx	79.4	\N
2518	131	OANDO	ngx	49.95	\N
2519	131	OKOMUOIL	ngx	1765	\N
2520	131	PRESCO	ngx	1980	\N
2521	131	SEPLAT	ngx	9099.9	\N
2522	131	UBA	ngx	47.2	-1.46
2523	131	AMZN	us	211.71	2.1569
2524	131	LLY	us	916.31	1.4717
2525	131	MSFT	us	371.04	-0.4561
2526	131	NFLX	us	92.28	1.4958
2527	131	NVDA	us	178.68	1.9863
2528	131	TSM	us	347.75	1.311
2529	132	ARADEL	ngx	1210.3	\N
2530	132	BETAGLAS	ngx	498.5	\N
2531	132	BUACEMENT	ngx	326.7	\N
2532	132	CUSTODIAN	ngx	77	-1.91
2533	132	DANGCEM	ngx	810	\N
2534	132	FIDSON	ngx	94.85	-9.97
2535	132	GTCO	ngx	114.55	3.2
2536	132	MTNN	ngx	718	2.41
2537	132	NNFM	ngx	79.4	\N
2538	132	OANDO	ngx	49.95	\N
2539	132	OKOMUOIL	ngx	1765	\N
2540	132	PRESCO	ngx	1980	\N
2541	132	SEPLAT	ngx	9099.9	\N
2542	132	UBA	ngx	47.2	-1.46
2543	132	AMZN	us	211.71	2.1569
2544	132	LLY	us	916.31	1.4717
2545	132	MSFT	us	371.04	-0.4561
2546	132	NFLX	us	92.28	1.4958
2547	132	NVDA	us	178.68	1.9863
2548	132	TSM	us	347.75	1.311
2549	133	ARADEL	ngx	1210.3	\N
2550	133	BETAGLAS	ngx	498.5	\N
2551	133	BUACEMENT	ngx	326.7	\N
2552	133	CUSTODIAN	ngx	77	-1.91
2553	133	DANGCEM	ngx	810	\N
2554	133	FIDSON	ngx	94.85	-9.97
2555	133	GTCO	ngx	114.55	3.2
2556	133	MTNN	ngx	718	2.41
2557	133	NNFM	ngx	79.4	\N
2558	133	OANDO	ngx	49.95	\N
2559	133	OKOMUOIL	ngx	1765	\N
2560	133	PRESCO	ngx	1980	\N
2561	133	SEPLAT	ngx	9099.9	\N
2562	133	UBA	ngx	47.2	-1.46
2563	133	AMZN	us	211.71	2.1569
2564	133	LLY	us	916.31	1.4717
2565	133	MSFT	us	371.04	-0.4561
2566	133	NFLX	us	92.28	1.4958
2567	133	NVDA	us	178.68	1.9863
2568	133	TSM	us	347.75	1.311
2569	134	ARADEL	ngx	1210.3	\N
2570	134	BETAGLAS	ngx	498.5	\N
2571	134	BUACEMENT	ngx	326.7	\N
2572	134	CUSTODIAN	ngx	77	-1.91
2573	134	DANGCEM	ngx	810	\N
2574	134	FIDSON	ngx	94.85	-9.97
2575	134	GTCO	ngx	114.55	3.2
2576	134	MTNN	ngx	718	2.41
2577	134	NNFM	ngx	79.4	\N
2578	134	OANDO	ngx	49.95	\N
2579	134	OKOMUOIL	ngx	1765	\N
2580	134	PRESCO	ngx	1980	\N
2581	134	SEPLAT	ngx	9099.9	\N
2582	134	UBA	ngx	47.2	-1.46
2583	134	AMZN	us	211.71	2.1569
2584	134	LLY	us	916.31	1.4717
2585	134	MSFT	us	371.04	-0.4561
2586	134	NFLX	us	92.28	1.4958
2587	134	NVDA	us	178.68	1.9863
2588	134	TSM	us	347.75	1.311
2589	135	ARADEL	ngx	1210.3	\N
2590	135	BETAGLAS	ngx	498.5	\N
2591	135	BUACEMENT	ngx	326.7	\N
2592	135	CUSTODIAN	ngx	77	-1.91
2593	135	DANGCEM	ngx	810	\N
2594	135	FIDSON	ngx	94.85	-9.97
2595	135	GTCO	ngx	115.4	0.74
2596	135	MTNN	ngx	719.1	0.15
2597	135	NNFM	ngx	79.4	\N
2598	135	OANDO	ngx	48.5	-2.9
2599	135	OKOMUOIL	ngx	1765	\N
2600	135	PRESCO	ngx	1980	\N
2601	135	SEPLAT	ngx	9099.9	\N
2602	135	UBA	ngx	46.75	-0.95
2603	135	AMZN	us	212.27	0.2645
2604	135	LLY	us	905.72	-1.1557
2605	135	MSFT	us	371.33	0.0782
2606	135	NFLX	us	93.045	0.829
2607	135	NVDA	us	173.65	-2.8151
2608	135	TSM	us	333.21	-4.1812
2609	136	ARADEL	ngx	1210.3	\N
2610	136	BETAGLAS	ngx	498.5	\N
2611	136	BUACEMENT	ngx	326.7	\N
2612	136	CUSTODIAN	ngx	77	-1.91
2613	136	DANGCEM	ngx	810	\N
2614	136	FIDSON	ngx	94.85	-9.97
2615	136	GTCO	ngx	115.4	0.74
2616	136	MTNN	ngx	719.1	0.15
2617	136	NNFM	ngx	79.4	\N
2618	136	OANDO	ngx	48.5	-2.9
2619	136	OKOMUOIL	ngx	1765	\N
2620	136	PRESCO	ngx	1980	\N
2621	136	SEPLAT	ngx	9099.9	\N
2622	136	UBA	ngx	46.75	-0.95
2623	136	AMZN	us	212.34	0.2976
2624	136	LLY	us	905.98	-1.1273
2625	136	MSFT	us	370.26	-0.2102
2626	136	NFLX	us	92.8	0.5635
2627	136	NVDA	us	173.971	-2.6354
2628	136	TSM	us	334.461	-3.8214
2629	137	ARADEL	ngx	1210.3	\N
2630	137	BETAGLAS	ngx	498.5	\N
2631	137	BUACEMENT	ngx	326.7	\N
2632	137	CUSTODIAN	ngx	77	-1.91
2633	137	DANGCEM	ngx	810	\N
2634	137	FIDSON	ngx	94.85	-9.97
2635	137	GTCO	ngx	115.4	0.74
2636	137	MTNN	ngx	719.1	0.15
2637	137	NNFM	ngx	79.4	\N
2638	137	OANDO	ngx	48.5	-2.9
2639	137	OKOMUOIL	ngx	1765	\N
2640	137	PRESCO	ngx	1980	\N
2641	137	SEPLAT	ngx	9099.9	\N
2642	137	UBA	ngx	46.75	-0.95
2643	137	AMZN	us	211.465	-0.1157
2644	137	LLY	us	902.64	-1.4919
2645	137	MSFT	us	368.9	-0.5768
2646	137	NFLX	us	92.59	0.3359
2647	137	NVDA	us	173.725	-2.7731
2648	137	TSM	us	333.59	-4.0719
2649	138	ARADEL	ngx	1210.3	\N
2650	138	BETAGLAS	ngx	498.5	\N
2651	138	BUACEMENT	ngx	326.7	\N
2652	138	CUSTODIAN	ngx	77	-1.91
2653	138	DANGCEM	ngx	810	\N
2654	138	FIDSON	ngx	94.85	-9.97
2655	138	GTCO	ngx	115.4	0.74
2656	138	MTNN	ngx	719.1	0.15
2657	138	NNFM	ngx	79.4	\N
2658	138	OANDO	ngx	48.5	-2.9
2659	138	OKOMUOIL	ngx	1765	\N
2660	138	PRESCO	ngx	1980	\N
2661	138	SEPLAT	ngx	9099.9	\N
2662	138	UBA	ngx	46.75	-0.95
2663	138	AMZN	us	212.26	0.2598
2664	138	LLY	us	901.63	-1.6021
2665	138	MSFT	us	368.325	-0.7317
2666	138	NFLX	us	92.88	0.6502
2667	138	NVDA	us	174.65	-2.2554
2668	138	TSM	us	335.248	-3.5951
2669	139	ARADEL	ngx	1210.3	\N
2670	139	BETAGLAS	ngx	498.5	\N
2671	139	BUACEMENT	ngx	326.7	\N
2672	139	CUSTODIAN	ngx	77	-1.91
2673	139	DANGCEM	ngx	810	\N
2674	139	FIDSON	ngx	94.85	-9.97
2675	139	GTCO	ngx	115.4	0.74
2676	139	MTNN	ngx	719.1	0.15
2677	139	NNFM	ngx	79.4	\N
2678	139	OANDO	ngx	48.5	-2.9
2679	139	OKOMUOIL	ngx	1765	\N
2680	139	PRESCO	ngx	1980	\N
2681	139	SEPLAT	ngx	9099.9	\N
2682	139	UBA	ngx	46.75	-0.95
2683	139	AMZN	us	210.73	-0.4629
2684	139	LLY	us	902.4	-1.518
2685	139	MSFT	us	367.615	-0.9231
2686	139	NFLX	us	92.77	0.531
2687	139	NVDA	us	174.31	-2.4457
2688	139	TSM	us	334.38	-3.8447
2689	140	ARADEL	ngx	1210.3	\N
2690	140	BETAGLAS	ngx	498.5	\N
2691	140	BUACEMENT	ngx	326.7	\N
2692	140	CUSTODIAN	ngx	77	-1.91
2693	140	DANGCEM	ngx	810	\N
2694	140	FIDSON	ngx	94.85	-9.97
2695	140	GTCO	ngx	115.4	0.74
2696	140	MTNN	ngx	719.1	0.15
2697	140	NNFM	ngx	79.4	\N
2698	140	OANDO	ngx	48.5	-2.9
2699	140	OKOMUOIL	ngx	1765	\N
2700	140	PRESCO	ngx	1980	\N
2701	140	SEPLAT	ngx	9099.9	\N
2702	140	UBA	ngx	46.75	-0.95
2703	140	AMZN	us	210.405	-0.6164
2704	140	LLY	us	902.81	-1.4733
2705	140	MSFT	us	367.35	-0.9945
2706	140	NFLX	us	92.31	0.0325
2707	140	NVDA	us	173.868	-2.6931
2708	140	TSM	us	332.385	-4.4184
2709	141	ARADEL	ngx	1210.3	\N
2710	141	BETAGLAS	ngx	498.5	\N
2711	141	BUACEMENT	ngx	326.7	\N
2712	141	CUSTODIAN	ngx	77	-1.91
2713	141	DANGCEM	ngx	810	\N
2714	141	FIDSON	ngx	94.85	-9.97
2715	141	GTCO	ngx	115.4	0.74
2716	141	MTNN	ngx	719.1	0.15
2717	141	NNFM	ngx	79.4	\N
2718	141	OANDO	ngx	48.5	-2.9
2719	141	OKOMUOIL	ngx	1765	\N
2720	141	PRESCO	ngx	1980	\N
2721	141	SEPLAT	ngx	9099.9	\N
2722	141	UBA	ngx	46.75	-0.95
2723	141	AMZN	us	210.17	-0.7274
2724	141	LLY	us	903.052	-1.4469
2725	141	MSFT	us	368.348	-0.7255
2726	141	NFLX	us	92.33	0.0542
2727	141	NVDA	us	173.61	-2.8375
2728	141	TSM	us	331.235	-4.7491
2729	142	ARADEL	ngx	1210.3	\N
2730	142	BETAGLAS	ngx	498.5	\N
2731	142	BUACEMENT	ngx	326.7	\N
2732	142	CUSTODIAN	ngx	77	-1.91
2733	142	DANGCEM	ngx	810	\N
2734	142	FIDSON	ngx	94.85	-9.97
2735	142	GTCO	ngx	115.4	0.74
2736	142	MTNN	ngx	719.1	0.15
2737	142	NNFM	ngx	79.4	\N
2738	142	OANDO	ngx	48.5	-2.9
2739	142	OKOMUOIL	ngx	1765	\N
2740	142	PRESCO	ngx	1980	\N
2741	142	SEPLAT	ngx	9099.9	\N
2742	142	UBA	ngx	46.75	-0.95
2743	142	AMZN	us	209.88	-0.8644
2744	142	LLY	us	905.6	-1.1688
2745	142	MSFT	us	368.023	-0.8131
2746	142	NFLX	us	92.46	0.1951
2747	142	NVDA	us	173.65	-2.8151
2748	142	TSM	us	331.18	-4.7649
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
1	1	25b5406f-4dbe-4448-8b74-1977ac7f6817	2026-04-14 04:47:01.525333+00	2026-03-15 04:47:01.526324+00
3	1	a0b07cd6-72ed-43fd-b495-b2410e12cc65	2026-04-14 05:19:52.133712+00	2026-03-15 05:19:52.13397+00
4	1	163a51d3-08eb-4bf5-9db1-99fd980a268f	2026-04-14 05:22:25.150091+00	2026-03-15 05:22:25.150533+00
6	1	c9bfa912-68ae-47f8-959b-d74756dcb365	2026-04-14 05:25:25.396927+00	2026-03-15 05:25:25.397185+00
7	2	edf9cddd-32e6-42ea-95d2-7642447a3901	2026-04-14 06:06:18.520501+00	2026-03-15 06:06:18.521418+00
8	1	782c8fd0-6ca1-4f44-a0f4-95b2cabd603b	2026-04-14 07:07:38.933974+00	2026-03-15 07:07:38.93425+00
9	1	e112c01b-9356-4145-9772-c1f58d45c348	2026-04-14 07:08:09.213875+00	2026-03-15 07:08:09.214138+00
10	1	d820ebde-b3a7-495a-9490-dcf6b3f4041f	2026-04-15 03:15:16.049746+00	2026-03-16 03:15:16.050809+00
11	1	287caa04-5c65-4f15-9d41-52cc74fd9ea8	2026-04-15 03:15:19.037763+00	2026-03-16 03:15:19.038222+00
12	1	1e130f0a-2e90-472e-9432-d38376576c29	2026-04-17 02:12:43.823912+00	2026-03-18 02:12:43.824901+00
13	1	e0ce740a-47fe-4992-94b8-041bd3aca6c6	2026-04-17 02:12:46.485395+00	2026-03-18 02:12:46.485827+00
14	1	de7ce5b9-b969-4284-9d12-7b09f08db07a	2026-04-17 02:43:52.294062+00	2026-03-18 02:43:52.295154+00
15	1	3ba288bf-db55-4656-a797-b8dca567c0d8	2026-04-17 03:44:32.158614+00	2026-03-18 03:44:32.159924+00
16	1	c21d9f71-356d-498f-94ef-2a4ddfc3236e	2026-04-17 03:49:23.940485+00	2026-03-18 03:49:23.942995+00
17	1	79b217f6-2fad-484a-bfbf-76e6c43e1beb	2026-04-17 03:55:28.073401+00	2026-03-18 03:55:28.073918+00
18	1	c3a5b1bc-1dab-49f5-a6fc-ea01fb43f46d	2026-04-17 06:05:08.216387+00	2026-03-18 06:05:08.218475+00
19	1	57641d16-7b8d-4a0b-bb66-08e2034bef0b	2026-04-17 13:19:05.633165+00	2026-03-18 13:19:05.635572+00
20	1	af9a0550-36ca-483d-a6fc-6eb2510fede4	2026-04-17 17:01:36.823326+00	2026-03-18 17:01:36.826233+00
21	1	7d6115b6-ad62-4e94-a171-7ac4087c8d83	2026-04-17 21:58:28.376997+00	2026-03-18 21:58:28.379252+00
22	1	573e0ce0-85dd-4be8-8ccc-586aceec226e	2026-04-18 15:17:53.319742+00	2026-03-19 15:17:53.324736+00
23	1	ff6e1b9d-15cc-402b-a57f-b7aeef84c1a3	2026-04-18 17:17:03.11485+00	2026-03-19 17:17:03.117256+00
24	1	72ff1bad-3134-45b5-a50b-ecf54deff7b1	2026-04-18 22:34:43.384251+00	2026-03-19 22:34:43.456107+00
25	1	76480c44-c6c1-4326-9db7-5babe15dbb81	2026-04-18 22:50:31.355748+00	2026-03-19 22:50:31.356849+00
26	1	284e08d1-c1aa-4ec7-af26-4325411f9a27	2026-04-18 23:22:39.696255+00	2026-03-19 23:22:39.697342+00
27	1	4cd96d05-3978-4328-9bbb-a824cc3e79bf	2026-04-18 23:55:19.827245+00	2026-03-19 23:55:19.827991+00
28	1	81d5ea77-0c8b-49ea-bebc-d529a1f30802	2026-04-19 00:29:02.710579+00	2026-03-20 00:29:02.711676+00
29	1	08bf3059-847e-40d0-95c8-935d1293a6bf	2026-04-19 01:43:25.269601+00	2026-03-20 01:43:25.270701+00
30	1	eaaff783-c9a8-4cad-aae8-92df70655458	2026-04-19 03:43:38.469747+00	2026-03-20 03:43:38.471793+00
31	1	405d3869-021a-44fb-975b-8652df585794	2026-04-19 04:20:37.621194+00	2026-03-20 04:20:37.623707+00
32	1	cc6c1715-fca9-4038-8f4f-b5c89ea440d0	2026-04-19 05:23:31.534321+00	2026-03-20 05:23:31.53625+00
33	1	acf72d93-f7cc-4e36-88ed-98a17b2d31e1	2026-04-19 05:32:57.956717+00	2026-03-20 05:32:57.957832+00
34	1	94dd9651-5e8a-4574-9ebc-7a37a31727d1	2026-04-19 06:24:34.972139+00	2026-03-20 06:24:34.973948+00
35	1	16d2f3c8-e79f-4b13-818a-de701b7c262b	2026-04-19 15:27:26.685087+00	2026-03-20 15:27:26.687198+00
36	1	95c9b25b-7281-41ef-906c-7670dcda7213	2026-04-21 22:29:05.376541+00	2026-03-22 22:29:05.378476+00
37	1	56d80b48-3a49-4b3b-b0f9-f660a8892718	2026-04-22 14:43:51.295804+00	2026-03-23 14:43:51.376821+00
38	1	e56c1f08-7497-4838-95e3-f12580a9f9c9	2026-04-22 23:57:23.223229+00	2026-03-23 23:57:23.224959+00
39	1	77eb579c-4733-4d61-83a7-84e56bb409ee	2026-04-23 19:13:46.711915+00	2026-03-24 19:13:46.713643+00
40	1	4e1cb491-b9ce-4658-8653-3b5e1e106229	2026-04-25 00:36:02.598812+00	2026-03-26 00:36:02.601266+00
41	1	d2ee3fe9-c357-4752-b721-aac480ec2b5b	2026-04-25 05:28:54.768421+00	2026-03-26 05:28:54.770174+00
42	1	20fb6474-c70f-4ef1-b4bb-ca6587e9c9d6	2026-04-25 14:57:31.821195+00	2026-03-26 14:57:31.823558+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.users (id, email, username, hashed_pw, is_admin, is_active, created_at) FROM stdin;
1	admin@portfolioanalyzer.com	admin	$5$rounds=535000$3v3XPwK5Y3QjFK9O$0HL/HC0mlFt6CPsnN.BNUOCShAWotU7P60X6JUVoDh2	t	t	2026-03-15 04:46:41.17032+00
2	user1@portfolioanalyzer.com	user1	$5$rounds=535000$5A1OvBxMiy.7sA4o$CJcXFX61GsCoo21cB49fy9qbvh/wC3MiUxAJSty7Ay6	f	t	2026-03-15 05:09:27.481909+00
\.


--
-- Data for Name: watchlist; Type: TABLE DATA; Schema: public; Owner: equitee_user
--

COPY public.watchlist (id, user_id, ticker, market, added_at) FROM stdin;
1	1	ACCESSCORP	NGX	2026-03-20 03:55:50.546377+00
2	1	FIDELITYBK	NGX	2026-03-26 05:31:45.603994+00
3	1	WAPCO	NGX	2026-03-26 15:20:03.08509+00
\.


--
-- Name: closed_positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.closed_positions_id_seq', 3, true);


--
-- Name: daily_price_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.daily_price_history_id_seq', 7609, true);


--
-- Name: dividend_cache_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.dividend_cache_id_seq', 17, true);


--
-- Name: financials_cache_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.financials_cache_id_seq', 68, true);


--
-- Name: holdings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.holdings_id_seq', 22, true);


--
-- Name: invite_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.invite_codes_id_seq', 2, true);


--
-- Name: portfolio_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.portfolio_snapshots_id_seq', 142, true);


--
-- Name: price_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.price_history_id_seq', 2748, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 42, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: watchlist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: equitee_user
--

SELECT pg_catalog.setval('public.watchlist_id_seq', 3, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: closed_positions closed_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.closed_positions
    ADD CONSTRAINT closed_positions_pkey PRIMARY KEY (id);


--
-- Name: daily_price_history daily_price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.daily_price_history
    ADD CONSTRAINT daily_price_history_pkey PRIMARY KEY (id);


--
-- Name: dividend_cache dividend_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.dividend_cache
    ADD CONSTRAINT dividend_cache_pkey PRIMARY KEY (id);


--
-- Name: dividend_cache dividend_cache_ticker_key; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.dividend_cache
    ADD CONSTRAINT dividend_cache_ticker_key UNIQUE (ticker);


--
-- Name: financials_cache financials_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.financials_cache
    ADD CONSTRAINT financials_cache_pkey PRIMARY KEY (id);


--
-- Name: holdings holdings_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.holdings
    ADD CONSTRAINT holdings_pkey PRIMARY KEY (id);


--
-- Name: invite_codes invite_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_code_key UNIQUE (code);


--
-- Name: invite_codes invite_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_pkey PRIMARY KEY (id);


--
-- Name: portfolio_snapshots portfolio_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.portfolio_snapshots
    ADD CONSTRAINT portfolio_snapshots_pkey PRIMARY KEY (id);


--
-- Name: price_history price_history_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: daily_price_history uq_daily_price_history_ticker_date; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.daily_price_history
    ADD CONSTRAINT uq_daily_price_history_ticker_date UNIQUE (ticker, date);


--
-- Name: financials_cache uq_financials_cache_ticker_type; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.financials_cache
    ADD CONSTRAINT uq_financials_cache_ticker_type UNIQUE (ticker, cache_type);


--
-- Name: users uq_users_email; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_email UNIQUE (email);


--
-- Name: users uq_users_username; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_username UNIQUE (username);


--
-- Name: watchlist uq_watchlist_user_ticker; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.watchlist
    ADD CONSTRAINT uq_watchlist_user_ticker UNIQUE (user_id, ticker);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: watchlist watchlist_pkey; Type: CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.watchlist
    ADD CONSTRAINT watchlist_pkey PRIMARY KEY (id);


--
-- Name: ix_closed_market; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_closed_market ON public.closed_positions USING btree (market);


--
-- Name: ix_closed_user_market; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_closed_user_market ON public.closed_positions USING btree (user_id, market);


--
-- Name: ix_daily_price_history_ticker_date; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_daily_price_history_ticker_date ON public.daily_price_history USING btree (ticker, date);


--
-- Name: ix_dividend_cache_ticker; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_dividend_cache_ticker ON public.dividend_cache USING btree (ticker);


--
-- Name: ix_financials_cache_ticker_type; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_financials_cache_ticker_type ON public.financials_cache USING btree (ticker, cache_type);


--
-- Name: ix_holdings_market_active; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_holdings_market_active ON public.holdings USING btree (market, is_active);


--
-- Name: ix_holdings_ticker; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_holdings_ticker ON public.holdings USING btree (ticker);


--
-- Name: ix_holdings_user_market_active; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_holdings_user_market_active ON public.holdings USING btree (user_id, market, is_active);


--
-- Name: ix_invite_codes_code; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_invite_codes_code ON public.invite_codes USING btree (code);


--
-- Name: ix_price_history_ticker_snapshot; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_price_history_ticker_snapshot ON public.price_history USING btree (ticker, snapshot_id);


--
-- Name: ix_refresh_tokens_token; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_refresh_tokens_token ON public.refresh_tokens USING btree (token);


--
-- Name: ix_snapshots_ts; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_snapshots_ts ON public.portfolio_snapshots USING btree (ts);


--
-- Name: ix_snapshots_user_ts; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_snapshots_user_ts ON public.portfolio_snapshots USING btree (user_id, ts);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: ix_watchlist_user_id; Type: INDEX; Schema: public; Owner: equitee_user
--

CREATE INDEX ix_watchlist_user_id ON public.watchlist USING btree (user_id);


--
-- Name: invite_codes invite_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: invite_codes invite_codes_used_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.invite_codes
    ADD CONSTRAINT invite_codes_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.users(id);


--
-- Name: price_history price_history_snapshot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_snapshot_id_fkey FOREIGN KEY (snapshot_id) REFERENCES public.portfolio_snapshots(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: watchlist watchlist_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: equitee_user
--

ALTER TABLE ONLY public.watchlist
    ADD CONSTRAINT watchlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO equitee_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO equitee_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO equitee_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO equitee_user;


--
-- PostgreSQL database dump complete
--

\unrestrict gx8wzWfWJASVN4l4e7RoM1YyEZUEJFmfR2kt9hrZMxoWsRbZEjFEeDzk4QlFbNn

