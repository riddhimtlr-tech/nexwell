--
-- PostgreSQL database dump
--

\restrict 5BGH6Cu2VzA0T0tuK0eA0M0oWnet7eQXJrblDnN8hBxJQvfxLhhskZ5KvtY2oW4

-- Dumped from database version 16.15 (Homebrew)
-- Dumped by pg_dump version 16.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: experiments; Type: TABLE; Schema: public; Owner: riddhi
--

CREATE TABLE public.experiments (
    id integer NOT NULL,
    user_id integer,
    goal_field character varying(50),
    target_change numeric(6,2),
    start_date date,
    end_date date,
    status character varying(20) DEFAULT 'active'::character varying
);


ALTER TABLE public.experiments OWNER TO riddhi;

--
-- Name: experiments_id_seq; Type: SEQUENCE; Schema: public; Owner: riddhi
--

CREATE SEQUENCE public.experiments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experiments_id_seq OWNER TO riddhi;

--
-- Name: experiments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riddhi
--

ALTER SEQUENCE public.experiments_id_seq OWNED BY public.experiments.id;


--
-- Name: lifestyle_data; Type: TABLE; Schema: public; Owner: riddhi
--

CREATE TABLE public.lifestyle_data (
    id integer NOT NULL,
    user_id integer,
    date date NOT NULL,
    sleep numeric(4,2),
    steps integer,
    screen_time numeric(4,2),
    activity numeric(6,2),
    heart_rate numeric(5,2),
    energy integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lifestyle_data_energy_check CHECK (((energy >= 1) AND (energy <= 10)))
);


ALTER TABLE public.lifestyle_data OWNER TO riddhi;

--
-- Name: lifestyle_data_id_seq; Type: SEQUENCE; Schema: public; Owner: riddhi
--

CREATE SEQUENCE public.lifestyle_data_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lifestyle_data_id_seq OWNER TO riddhi;

--
-- Name: lifestyle_data_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riddhi
--

ALTER SEQUENCE public.lifestyle_data_id_seq OWNED BY public.lifestyle_data.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: riddhi
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO riddhi;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: riddhi
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO riddhi;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riddhi
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: experiments id; Type: DEFAULT; Schema: public; Owner: riddhi
--

ALTER TABLE ONLY public.experiments ALTER COLUMN id SET DEFAULT nextval('public.experiments_id_seq'::regclass);


--
-- Name: lifestyle_data id; Type: DEFAULT; Schema: public; Owner: riddhi
--

ALTER TABLE ONLY public.lifestyle_data ALTER COLUMN id SET DEFAULT nextval('public.lifestyle_data_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: riddhi
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: experiments; Type: TABLE DATA; Schema: public; Owner: riddhi
--

COPY public.experiments (id, user_id, goal_field, target_change, start_date, end_date, status) FROM stdin;
1	1	screenTime	-2.00	2026-09-25	2026-10-02	active
2	1	screenTime	-2.00	2026-09-26	2026-10-03	active
3	1	screenTime	-2.00	2026-09-26	2026-10-03	active
4	1	screenTime	-2.00	2026-09-27	2026-10-04	active
\.


--
-- Data for Name: lifestyle_data; Type: TABLE DATA; Schema: public; Owner: riddhi
--

COPY public.lifestyle_data (id, user_id, date, sleep, steps, screen_time, activity, heart_rate, energy, created_at) FROM stdin;
2	1	2026-09-19	5.40	3100	8.20	28.00	82.00	3	2026-09-25 15:44:10.621648
3	1	2026-09-20	5.80	3600	7.80	32.00	80.00	4	2026-09-25 15:44:10.621648
4	1	2026-09-21	6.10	4500	7.10	38.00	78.00	5	2026-09-25 15:44:10.621648
5	1	2026-09-22	6.40	5200	6.60	43.00	76.00	6	2026-09-25 15:44:10.621648
6	1	2026-09-23	6.70	5800	6.10	47.00	74.00	7	2026-09-25 15:44:10.621648
7	1	2026-09-24	7.00	6500	5.50	52.00	72.00	8	2026-09-25 15:44:10.621648
10	1	2026-09-28	7.10	7000	5.90	48.00	73.00	6	2026-09-25 19:19:13.345503
11	1	2026-09-29	7.20	7200	5.60	50.00	72.00	7	2026-09-25 19:19:13.345503
12	1	2026-09-30	7.30	7500	5.30	52.00	71.00	7	2026-09-25 19:19:13.345503
13	1	2026-10-01	7.40	7800	5.00	55.00	70.00	8	2026-09-25 19:19:13.345503
1	1	2026-09-25	7.50	7500	7.20	42.00	72.00	8	2026-09-25 15:35:15.947096
8	1	2026-09-26	6.50	10641	3.50	46.00	64.00	6	2026-09-25 19:19:13.345503
9	1	2026-09-27	7.00	6408	6.20	46.00	74.00	6	2026-09-25 19:19:13.345503
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: riddhi
--

COPY public.users (id, name, created_at) FROM stdin;
1	Test User	2026-09-25 15:30:52.988064
\.


--
-- Name: experiments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riddhi
--

SELECT pg_catalog.setval('public.experiments_id_seq', 4, true);


--
-- Name: lifestyle_data_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riddhi
--

SELECT pg_catalog.setval('public.lifestyle_data_id_seq', 13, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riddhi
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: experiments experiments_pkey; Type: CONSTRAINT; Schema: public; Owner: riddhi
--

ALTER TABLE ONLY public.experiments
    ADD CONSTRAINT experiments_pkey PRIMARY KEY (id);


--
-- Name: lifestyle_data lifestyle_data_pkey; Type: CONSTRAINT; Schema: public; Owner: riddhi
--

ALTER TABLE ONLY public.lifestyle_data
    ADD CONSTRAINT lifestyle_data_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: riddhi
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: experiments experiments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riddhi
--

ALTER TABLE ONLY public.experiments
    ADD CONSTRAINT experiments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lifestyle_data lifestyle_data_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riddhi
--

ALTER TABLE ONLY public.lifestyle_data
    ADD CONSTRAINT lifestyle_data_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 5BGH6Cu2VzA0T0tuK0eA0M0oWnet7eQXJrblDnN8hBxJQvfxLhhskZ5KvtY2oW4

