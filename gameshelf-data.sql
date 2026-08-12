--
-- PostgreSQL database dump
--


-- Dumped from database version 18.1 (Postgres.app)
-- Dumped by pg_dump version 18.1 (Postgres.app)

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

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: tmshkr
--

INSERT INTO public."User" (id, name, email, "emailVerified", image, "createdAt", "updatedAt") VALUES ('SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 'Demo Player', 'demo@gameshelf.dev', false, NULL, '2026-08-12 01:09:42.394', '2026-08-12 01:09:42.394');


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: tmshkr
--

INSERT INTO public."Account" (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") VALUES ('qmiVXN37zUUqm4CZoBooKkN2crYZWxN6', 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 'credential', 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', NULL, NULL, NULL, NULL, NULL, NULL, '6e177626c3e6d36ccf92d43e37213a27:6d2ffc6e477de7e216197deaf81b941eb9e6ad064b070c05bb4040f0f424e8c6b42f97df01b88975489e10578c1e412e70e7ec6e50a4ca8a4363a95bae4acc21', '2026-08-12 01:09:42.4', '2026-08-12 01:09:42.4');


--
-- Data for Name: Game; Type: TABLE DATA; Schema: public; Owner: tmshkr
--

INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (1, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 'Metroid Prime 4: Beyond', 'Nintendo Switch', 'HIGH', 'WISHLIST', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob9xh.jpg', '2026-08-12 01:09:43.17', 'Day-one pickup when it lands.', false);
INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (2, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 'Balatro', 'PC', 'MEDIUM', 'BACKLOG', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co9f4g.jpg', '2026-08-12 01:09:43.17', 'Everyone keeps recommending this one.', false);
INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (3, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 'Hollow Knight', 'Nintendo Switch', 'HIGH', 'PLAYING', 9, 'https://images.igdb.com/igdb/image/upload/t_cover_big/coaes9.jpg', '2026-08-12 01:09:43.17', 'Deep in Crystal Peak.', false);
INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (4, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 'Super Mario Odyssey', 'Nintendo Switch', 'LOW', 'COMPLETED', 10, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co63jd.jpg', '2026-08-12 01:09:43.17', '100% moons collected.', false);
INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (5, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 'Cyberpunk 2077', 'PC', 'LOW', 'DROPPED', NULL, 'https://images.igdb.com/igdb/image/upload/t_cover_big/coaih8.jpg', '2026-08-12 01:09:43.17', 'Might revisit after Phantom Liberty.', false);
INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (6, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 'The Legend of Zelda: Tears of the Kingdom', 'Nintendo Switch', 'MEDIUM', 'PLAYING', 9, 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.jpg', '2026-08-12 01:09:43.17', NULL, false);


--
-- Data for Name: PlaySession; Type: TABLE DATA; Schema: public; Owner: tmshkr
--

INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (1, 3, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 2.5, '2026-07-18', 'Mantis Lords finally down.');
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (2, 3, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 1.5, '2026-07-25', 'Crystal Peak exploration.');
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (3, 3, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 3.0, '2026-08-02', NULL);
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (4, 4, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 12.0, '2026-05-10', 'Finished main story.');
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (5, 4, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 8.5, '2026-05-18', 'Moon cleanup sprint.');
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (6, 6, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 4.0, '2026-08-05', 'Sky islands and one shrine.');
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (7, 6, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 5.5, '2026-08-09', NULL);
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (8, 2, 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6', 0.5, '2026-08-01', 'Quick run before bed.');


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: tmshkr
--

INSERT INTO public."Session" (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId") VALUES ('U7ybDgKdm2Or3b8Gwp2G9RJxO3mueyZ7', '2026-08-19 01:09:42.403', 'mJVZ0G6WFOUYJ7c7fpXpYKI4lVi5SdlV', '2026-08-12 01:09:42.403', '2026-08-12 01:09:42.403', '', '', 'SjpAbJfpmO7mIvZ6BlH6Owwaru8noZw6');


--
-- Data for Name: Verification; Type: TABLE DATA; Schema: public; Owner: tmshkr
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: tmshkr
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('8cb7a805-c0d8-464e-92ed-49b158448602', '1b950030efd07afd6cc89b9ee40f0f84da28fceefbea76709f3ea05856097820', '2026-08-11 18:09:40.54482-07', '20260726182943_init', NULL, NULL, '2026-08-11 18:09:40.530454-07', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('014f6641-4d31-428b-b421-fb377920eddd', 'da1b3dcba4c671d0347a351cf797be94921ecd0ca3840c97821262b2cda74473', '2026-08-11 18:09:40.546-07', '20260730003838_update_gamestatus_enum', NULL, NULL, '2026-08-11 18:09:40.545062-07', 1);


--
-- Name: Game_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tmshkr
--

SELECT pg_catalog.setval('public."Game_id_seq"', 6, true);


--
-- Name: PlaySession_id_seq; Type: SEQUENCE SET; Schema: public; Owner: tmshkr
--

SELECT pg_catalog.setval('public."PlaySession_id_seq"', 8, true);


--
-- PostgreSQL database dump complete
--


