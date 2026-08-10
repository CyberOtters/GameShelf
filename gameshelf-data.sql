--
-- PostgreSQL database dump
--


-- Dumped from database version 17.5
-- Dumped by pg_dump version 18.4

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
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."User" (id, name, email, "emailVerified", image, "createdAt", "updatedAt") VALUES ('ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 'Demo Player', 'demo@gameshelf.dev', false, NULL, '2026-08-10 20:53:35.459', '2026-08-10 20:53:35.46');


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Account" (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") VALUES ('8C63Sv5vwFtJR9ewkbzZlfy32Y6S1mAg', 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 'credential', 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', NULL, NULL, NULL, NULL, NULL, NULL, '6a1b580528c35a13bc4912494bacf731:b78e356d2b7d82a7d11408e094eb6951bb84b3e3c444fb3b811d27b40559d4dca77c92b2468efa7be6fd0b698bbefe71df42afa43b13919eab47ed4d69d825e1', '2026-08-10 20:53:35.467', '2026-08-10 20:53:35.467');


--
-- Data for Name: Game; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (178, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 'Metroid Prime 4: Beyond', 'Nintendo Switch', 'HIGH', 'WISHLIST', NULL, NULL, '2026-08-10 20:53:35.484', 'Day-one pickup when it lands.', false);
INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (179, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 'Balatro', 'PC', 'MEDIUM', 'BACKLOG', NULL, NULL, '2026-08-10 20:53:35.484', 'Everyone keeps recommending this one.', false);
INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (180, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 'Hollow Knight', 'Nintendo Switch', 'HIGH', 'PLAYING', 9, NULL, '2026-08-10 20:53:35.484', 'Deep in Crystal Peak.', false);
INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (181, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 'Super Mario Odyssey', 'Nintendo Switch', 'LOW', 'COMPLETED', 10, NULL, '2026-08-10 20:53:35.484', '100% moons collected.', false);
INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (182, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 'Cyberpunk 2077', 'PC', 'LOW', 'DROPPED', NULL, NULL, '2026-08-10 20:53:35.484', 'Might revisit after Phantom Liberty.', false);
INSERT INTO public."Game" (id, "userId", title, platform, priority, status, rating, "coverUrl", "addedAt", notes, archived) VALUES (183, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 'The Legend of Zelda: Tears of the Kingdom', 'Nintendo Switch', 'MEDIUM', 'PLAYING', 9, NULL, '2026-08-10 20:53:35.484', NULL, false);


--
-- Data for Name: PlaySession; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (116, 180, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 2.5, '2026-07-18', 'Mantis Lords finally down.');
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (117, 180, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 1.5, '2026-07-25', 'Crystal Peak exploration.');
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (118, 180, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 3.0, '2026-08-02', NULL);
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (119, 181, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 12.0, '2026-05-10', 'Finished main story.');
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (120, 181, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 8.5, '2026-05-18', 'Moon cleanup sprint.');
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (121, 183, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 4.0, '2026-08-05', 'Sky islands and one shrine.');
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (122, 183, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 5.5, '2026-08-09', NULL);
INSERT INTO public."PlaySession" (id, "gameId", "userId", hours, "sessionDate", notes) VALUES (123, 179, 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin', 0.5, '2026-08-01', 'Quick run before bed.');


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Session" (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId") VALUES ('7dx0FzKWmiOYgUh49zq7cDsuAsBrE595', '2026-08-17 20:53:35.471', 'fQkOb2q5oGunsQCZn3XrQqHVdO8SXlMZ', '2026-08-10 20:53:35.472', '2026-08-10 20:53:35.472', '', '', 'ezWYL2q7NkhcPEFLgwCEGEPQFXfSXAin');


--
-- Data for Name: Verification; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('3d76d940-7382-45eb-90c5-dc05012351b4', 'dc3b15a4882c7466b42f2d1fde6b5608a417095dee6ee7ae39dd4c246d928fa9', '2026-08-10 16:53:24.978942+00', '20260726182943_init', NULL, NULL, '2026-08-10 16:53:24.769903+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('93b7fcf8-5614-4be3-9778-96a0d00435fd', 'd98cf4cdfb7342f52740def30fde4878bf78bd222aafb03efa17b94547bc424c', '2026-08-10 16:53:25.02203+00', '20260730003838_update_gamestatus_enum', NULL, NULL, '2026-08-10 16:53:24.98528+00', 1);


--
-- Name: Game_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Game_id_seq"', 183, true);


--
-- Name: PlaySession_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PlaySession_id_seq"', 123, true);


--
-- PostgreSQL database dump complete
--


