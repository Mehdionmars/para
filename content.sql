-- Para d'Hiver content export, 2026-10-04T21:26:06Z
BEGIN;
SET session_replication_role = replica;
DELETE FROM "brands";
DELETE FROM "catalogue_page";
DELETE FROM "catalogue_page_editorial_tiles";
DELETE FROM "catalogue_page_needs";
DELETE FROM "catalogue_page_quick_filters";
DELETE FROM "catalogue_page_rels";
DELETE FROM "catalogue_page_seo_intro_paragraphs";
DELETE FROM "catalogue_page_tag_to_category";
DELETE FROM "categories";
DELETE FROM "collections_page";
DELETE FROM "collections_page_cards";
DELETE FROM "collections_page_rels";
DELETE FROM "home";
DELETE FROM "home_brands_featured";
DELETE FROM "home_coffrets";
DELETE FROM "home_cta_pair1";
DELETE FROM "home_cta_pair2";
DELETE FROM "home_dermo_picks";
DELETE FROM "home_hero_slides";
DELETE FROM "home_marketing_banners";
DELETE FROM "home_rails";
DELETE FROM "home_rels";
DELETE FROM "home_review_bars";
DELETE FROM "home_sample_reviews";
DELETE FROM "home_sections";
DELETE FROM "home_services_teaser";
DELETE FROM "home_summer_edit_acts";
DELETE FROM "home_summer_edit_copy_highlights";
DELETE FROM "home_trust_badges";
DELETE FROM "instagram_posts";
DELETE FROM "media";
DELETE FROM "navigation";
DELETE FROM "navigation_cat_strip_items";
DELETE FROM "navigation_items";
DELETE FROM "navigation_items_mega_menu_columns";
DELETE FROM "navigation_items_mega_menu_columns_links";
DELETE FROM "products";
DELETE FROM "products_badges";
DELETE FROM "products_gallery";
DELETE FROM "products_rels";
DELETE FROM "products_variants";
DELETE FROM "services";
DELETE FROM "services_benefits";
DELETE FROM "services_steps";
DELETE FROM "site_chrome";
DELETE FROM "site_chrome_footer_columns";
DELETE FROM "site_chrome_footer_columns_links";
DELETE FROM "site_chrome_header_actions";
DELETE FROM "site_chrome_promo_modal_conditions";
DELETE FROM "site_chrome_top_bar_messages";
DELETE FROM "stores";
DELETE FROM "stores_hours";
DELETE FROM "theme";
--
-- PostgreSQL database dump
--

\restrict NwYX7wa6YeT1XI035xX2brflHnhLHjIW7cO6Ps6sm9M9dWgtZgwHnX6b3WRmboT

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET check_function_bodies = false;

--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.media (id, alt, folder_id, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y) FROM stdin;
14	arbre	\N	2026-09-04 01:38:23.736+00	2026-09-04 01:38:23.736+00	/api/media/file/arbre-marques.png	\N	arbre-marques.png	image/png	1873955	1024	1024	50	50
15	arbre2	\N	2026-09-04 01:38:23.751+00	2026-09-04 01:38:23.751+00	/api/media/file/arbre-hiver.png	\N	arbre-hiver.png	image/png	1847463	1024	1024	50	50
16	baby	\N	2026-09-04 01:38:23.765+00	2026-09-04 01:38:23.765+00	/api/media/file/baby.png	\N	baby.png	image/png	1666481	1408	768	50	50
17	cheveux	\N	2026-09-04 01:38:23.778+00	2026-09-04 01:38:23.778+00	/api/media/file/cheveux.png	\N	cheveux.png	image/png	1743253	1408	768	50	50
18	coffret	\N	2026-09-04 01:38:23.79+00	2026-09-04 01:38:23.79+00	/api/media/file/coffrets.png	\N	coffrets.png	image/png	1761661	1408	768	50	50
19	coffret2	\N	2026-09-04 01:38:23.803+00	2026-09-04 01:38:23.803+00	/api/media/file/coffret-hall.png	\N	coffret-hall.png	image/png	1954753	1408	768	50	50
20	complements	\N	2026-09-04 01:38:23.815+00	2026-09-04 01:38:23.815+00	/api/media/file/complements.png	\N	complements.png	image/png	1633135	1408	768	50	50
21	corps	\N	2026-09-04 01:38:23.826+00	2026-09-04 01:38:23.826+00	/api/media/file/nuxe-solaire.jpg	\N	nuxe-solaire.jpg	image/jpeg	338535	1500	1500	50	50
22	dermo	\N	2026-09-04 01:38:23.838+00	2026-09-04 01:38:23.838+00	/api/media/file/dermo.png	\N	dermo.png	image/png	1699228	1376	768	50	50
23	maquillage	\N	2026-09-04 01:38:23.849+00	2026-09-04 01:38:23.849+00	/api/media/file/maquillage.png	\N	maquillage.png	image/png	1701723	1408	768	50	50
24	solaire	\N	2026-09-04 01:38:23.86+00	2026-09-04 01:38:23.86+00	/api/media/file/solaire.png	\N	solaire.png	image/png	1893346	1408	768	50	50
25	solaire2	\N	2026-09-04 01:38:23.88+00	2026-09-04 01:38:23.88+00	/api/media/file/solaire-elite.png	\N	solaire-elite.png	image/png	1829983	1408	768	50	50
26	visage	\N	2026-09-04 01:38:23.898+00	2026-09-04 01:38:23.898+00	/api/media/file/visage.png	\N	visage.png	image/png	1599820	1408	768	50	50
27	SUNSCREEN HYDRO	\N	2026-09-07 12:01:52.465+00	2026-09-07 12:01:52.465+00	/api/media/file/DCP-SUNSCREEN-HYDRO.jpg	\N	DCP-SUNSCREEN-HYDRO.jpg	image/jpeg	84520	800	800	50	50
28	SUNSCREEN INVISIBLE	\N	2026-09-07 12:01:52.677+00	2026-09-07 12:01:52.677+00	/api/media/file/DCP-INVISIBLE.jpg	\N	DCP-INVISIBLE.jpg	image/jpeg	87196	800	800	50	50
29	MOIST INTENSE	\N	2026-09-07 12:01:52.884+00	2026-09-07 12:01:52.884+00	/api/media/file/DCP-MOIST-INTENSE.jpg	\N	DCP-MOIST-INTENSE.jpg	image/jpeg	75987	800	800	50	50
30	TRIO-ACNE GEL	\N	2026-09-07 12:01:53.082+00	2026-09-07 12:01:53.082+00	/api/media/file/DCP-TRIO-ACNE.jpg	\N	DCP-TRIO-ACNE.jpg	image/jpeg	94937	800	800	50	50
31	TRIO ACNE SOIN SKI	\N	2026-09-07 12:01:53.277+00	2026-09-07 12:01:53.277+00	/api/media/file/DCP-TRIO-ACNE-SKI.jpg	\N	DCP-TRIO-ACNE-SKI.jpg	image/jpeg	69189	800	800	50	50
32	TRIO ACNE LOTION	\N	2026-09-07 12:01:53.484+00	2026-09-07 12:01:53.484+00	/api/media/file/DCP-TRIO-ACNE-LOTION.jpg	\N	DCP-TRIO-ACNE-LOTION.jpg	image/jpeg	54570	800	800	50	50
33	NC 10 SERUM	\N	2026-09-07 12:01:54.093+00	2026-09-07 12:01:54.092+00	/api/media/file/DCP-NC10.jpg	\N	DCP-NC10.jpg	image/jpeg	71058	800	800	50	50
34	LOTION BHA	\N	2026-09-07 12:01:54.292+00	2026-09-07 12:01:54.292+00	/api/media/file/DCP-LOTION-BHA.jpg	\N	DCP-LOTION-BHA.jpg	image/jpeg	68953	800	800	50	50
35	DÉPI CRÈME	\N	2026-09-07 12:01:54.494+00	2026-09-07 12:01:54.494+00	/api/media/file/DCP-DEPI-CREME.jpg	\N	DCP-DEPI-CREME.jpg	image/jpeg	47744	800	800	50	50
36	DÉPI GEL	\N	2026-09-07 12:01:54.686+00	2026-09-07 12:01:54.686+00	/api/media/file/DCP-DEPI-GEL.jpg	\N	DCP-DEPI-GEL.jpg	image/jpeg	67481	800	800	50	50
37	SYNDET LIPIDIK	\N	2026-09-07 12:01:54.879+00	2026-09-07 12:01:54.879+00	/api/media/file/DCP-SYNDET-LIPIDIK.jpg	\N	DCP-SYNDET-LIPIDIK.jpg	image/jpeg	82936	800	800	50	50
38	SOIN LIPIDIK	\N	2026-09-07 12:01:55.075+00	2026-09-07 12:01:55.075+00	/api/media/file/DCP-SOIN-LIPIDIK.jpg	\N	DCP-SOIN-LIPIDIK.jpg	image/jpeg	75317	800	800	50	50
39	KPP SOIN	\N	2026-09-07 12:01:55.272+00	2026-09-07 12:01:55.272+00	/api/media/file/DCP-KPP-SOIN.jpg	\N	DCP-KPP-SOIN.jpg	image/jpeg	121229	800	800	50	50
40	BAUME ESSENTIEL	\N	2026-09-07 12:01:55.467+00	2026-09-07 12:01:55.467+00	/api/media/file/DCP-BAUM-ESSENTIEL.jpg	\N	DCP-BAUM-ESSENTIEL.jpg	image/jpeg	115240	800	800	50	50
41	SEPTIPLUS PH 5.5	\N	2026-09-07 12:01:55.658+00	2026-09-07 12:01:55.658+00	/api/media/file/DCP-SEPTIPLUS-PH5.jpg	\N	DCP-SEPTIPLUS-PH5.jpg	image/jpeg	81853	800	800	50	50
42	SEPTIPLUS PH 8	\N	2026-09-07 12:01:55.853+00	2026-09-07 12:01:55.853+00	/api/media/file/DCP-SEPTIPLUS-PH8.jpg	\N	DCP-SEPTIPLUS-PH8.jpg	image/jpeg	81920	800	800	50	50
43	DÉPI-PLUS INTIMATE	\N	2026-09-07 12:01:56.045+00	2026-09-07 12:01:56.045+00	/api/media/file/DCP-DEPI-PLUS.jpg	\N	DCP-DEPI-PLUS.jpg	image/jpeg	66396	800	800	50	50
44	DS+ BASE LAVANTE	\N	2026-09-07 12:01:56.239+00	2026-09-07 12:01:56.239+00	/api/media/file/DCP-BASE-LAVANTE-DS%2B.jpg	\N	DCP-BASE-LAVANTE-DS+.jpg	image/jpeg	91777	800	800	50	50
45	DS+ LOTION	\N	2026-09-07 12:01:56.431+00	2026-09-07 12:01:56.431+00	/api/media/file/DCP-LOTION-DS%2B.jpg	\N	DCP-LOTION-DS+.jpg	image/jpeg	57834	800	800	50	50
46	DS+ EMULSION	\N	2026-09-07 12:01:56.632+00	2026-09-07 12:01:56.632+00	/api/media/file/DCP-EMULSION-DS%2B.jpg	\N	DCP-EMULSION-DS+.jpg	image/jpeg	84397	800	800	50	50
47	SEPTISCARS SPRAY	\N	2026-09-07 12:01:56.824+00	2026-09-07 12:01:56.824+00	/api/media/file/DCP-SEPTISCARS.jpg	\N	DCP-SEPTISCARS.jpg	image/jpeg	62620	800	800	50	50
48	CICASEPT	\N	2026-09-07 12:01:57.018+00	2026-09-07 12:01:57.018+00	/api/media/file/DCP-CICASEPT.jpg	\N	DCP-CICASEPT.jpg	image/jpeg	53749	800	800	50	50
49	CICAPLUS ZONES LARGES	\N	2026-09-07 12:01:57.332+00	2026-09-07 12:01:57.332+00	/api/media/file/DCP-CICAPLUS-Z.jpg	\N	DCP-CICAPLUS-Z.jpg	image/jpeg	81944	800	800	50	50
50	PRURITUS-CONTROL LOTION	\N	2026-09-07 12:01:57.53+00	2026-09-07 12:01:57.53+00	/api/media/file/DCP-PRURITUS-CONTROL.jpg	\N	DCP-PRURITUS-CONTROL.jpg	image/jpeg	68733	800	800	50	50
51	HAIRLOSS SHAMPOING HOMMES	\N	2026-09-07 12:01:57.724+00	2026-09-07 12:01:57.724+00	/api/media/file/DCP-HAIRLOSS-SH-HOMMES.jpg	\N	DCP-HAIRLOSS-SH-HOMMES.jpg	image/jpeg	91522	800	800	50	50
52	HAIRLOSS SHAMPOING FEMMES	\N	2026-09-07 12:01:57.936+00	2026-09-07 12:01:57.936+00	/api/media/file/DCP-HAIRLOSS-SH-FEMMES.jpg	\N	DCP-HAIRLOSS-SH-FEMMES.jpg	image/jpeg	91565	800	800	50	50
53	HAIRLOSS LOTION CAPILLAIRE HOMMES	\N	2026-09-07 12:01:58.131+00	2026-09-07 12:01:58.131+00	/api/media/file/DCP-HAIRLOSS-LOTION-HOMMES.jpg	\N	DCP-HAIRLOSS-LOTION-HOMMES.jpg	image/jpeg	73084	800	800	50	50
54	HAIRLOSS LOTION CAPILLAIRE FEMMES	\N	2026-09-07 12:01:58.329+00	2026-09-07 12:01:58.329+00	/api/media/file/DCP-HAIRLOSS-LOTION-FEMMES.jpg	\N	DCP-HAIRLOSS-LOTION-FEMMES.jpg	image/jpeg	77546	800	800	50	50
55	HAIRLOSS SERUM CAPILLAIRE	\N	2026-09-07 12:01:58.522+00	2026-09-07 12:01:58.522+00	/api/media/file/DCP-HAIRLOSS-SERUM.jpg	\N	DCP-HAIRLOSS-SERUM.jpg	image/jpeg	73701	800	800	50	50
56	HAIRLOSS MASQUE CAPILLAIRE	\N	2026-09-07 12:01:58.717+00	2026-09-07 12:01:58.717+00	/api/media/file/DCP-HAIRLOSS-MASQUE.jpg	\N	DCP-HAIRLOSS-MASQUE.jpg	image/jpeg	133980	800	800	50	50
57	KOPROZ MOUSSE NETTOYANTE	\N	2026-09-07 12:01:59.075+00	2026-09-07 12:01:59.075+00	/api/media/file/DCP-KOPROZ-Mousse-Nettoyante-150ml.jpg	\N	DCP-KOPROZ-Mousse-Nettoyante-150ml.jpg	image/jpeg	227280	2000	2000	50	50
58	KOPROZ CREME SOLAIRE 50+	\N	2026-09-07 12:01:59.434+00	2026-09-07 12:01:59.434+00	/api/media/file/DCP-KOPROZ-50%2B-Creme-solaire-50ml.jpg	\N	DCP-KOPROZ-50+-Creme-solaire-50ml.jpg	image/jpeg	203223	2000	2000	50	50
59	KOPROZ A.Z CREME CONCENTREE INTENSE	\N	2026-09-07 12:01:59.798+00	2026-09-07 12:01:59.798+00	/api/media/file/DCP-KOPROZ-AZ-50ml.jpg	\N	DCP-KOPROZ-AZ-50ml.jpg	image/jpeg	287434	2000	2000	50	50
60	KOPROZ R.P CREME REPARATRICE	\N	2026-09-07 12:02:00.16+00	2026-09-07 12:02:00.16+00	/api/media/file/DCP-KOPROZ-RP-70ml.jpg	\N	DCP-KOPROZ-RP-70ml.jpg	image/jpeg	307636	2000	2000	50	50
61	TRIO-ACNÉ SUN SPF50+ CREME SOLAIRE MATIFIANTE	\N	2026-09-07 12:02:04.118+00	2026-09-07 12:02:04.118+00	/api/media/file/DCP-TRIO-ACNE-SUN-SPF50%2B-50ml.jpg	\N	DCP-TRIO-ACNE-SUN-SPF50+-50ml.jpg	image/jpeg	249781	2000	2000	50	50
62	D-BIOTIC Gel surgras 240 ml	\N	2026-09-07 12:02:05.526+00	2026-09-07 12:02:05.526+00	/api/media/file/D-biotic-Gel-Surgras-240ml.jpg	\N	D-biotic-Gel-Surgras-240ml.jpg	image/jpeg	596235	2000	2000	50	50
68	D-BIOTIC Crème émolliente pédiatrique 200 ml	\N	2026-09-07 12:02:06.755+00	2026-09-07 12:02:06.755+00	/api/media/file/D-biotic-Creme-Emolliente-Pediatrique-200ml.jpg	\N	D-biotic-Creme-Emolliente-Pediatrique-200ml.jpg	image/jpeg	373989	2000	2000	50	50
70	D-BIOTIC Spray solaire Pédiatrique 100 ml	\N	2026-09-07 12:02:07.166+00	2026-09-07 12:02:07.166+00	/api/media/file/D-biotic-Spray-Solaire-Pediatrique-SPF50%2B-100ml.jpg	\N	D-biotic-Spray-Solaire-Pediatrique-SPF50+-100ml.jpg	image/jpeg	240705	2000	2000	50	50
73	D-BIOTIC ROSABIOTIC CREME PEAUX A ROUGEURS INSTALLEES 75 ML	\N	2026-09-07 12:02:07.756+00	2026-09-07 12:02:07.756+00	/api/media/file/D-biotic-Rosabiotic-Creme-75ml.jpg	\N	D-biotic-Rosabiotic-Creme-75ml.jpg	image/jpeg	382337	2000	2000	50	50
78	D-BIOTIC PULVOBIOTIC  PH 5,5	\N	2026-09-07 12:02:08.974+00	2026-09-07 12:02:08.974+00	/api/media/file/D-biotic-Pulvobiotic-pH-5-5-500ml.jpg	\N	D-biotic-Pulvobiotic-pH-5-5-500ml.jpg	image/jpeg	394456	2000	2000	50	50
84	Baume à lèvres Très réparateur	\N	2026-09-07 12:02:10.155+00	2026-09-07 12:02:10.155+00	/api/media/file/D-biotic-Baume-a-levres-Tres-reparateur-15ml.jpg	\N	D-biotic-Baume-a-levres-Tres-reparateur-15ml.jpg	image/jpeg	206103	2000	2000	50	50
87	ECLABIOTIC SOLAIRE INVISIBLE SPF50+	\N	2026-09-07 12:02:10.772+00	2026-09-07 12:02:10.772+00	/api/media/file/ECLABIOTIC-Solaire-Invisible-SPF-50%2B-50ml.jpg	\N	ECLABIOTIC-Solaire-Invisible-SPF-50+-50ml.jpg	image/jpeg	493979	2000	2000	50	50
89	ECLABIOTIC INTENSE	\N	2026-09-07 12:02:11.251+00	2026-09-07 12:02:11.251+00	/api/media/file/ECLABIOTIC-Intense-50ml.jpg	\N	ECLABIOTIC-Intense-50ml.jpg	image/jpeg	433892	2000	2000	50	50
63	D-BIOTIC Crème hydratante régénérante 75 ml	\N	2026-09-07 12:02:05.73+00	2026-09-07 12:02:05.73+00	/api/media/file/D-biotic-Creme-Hydratante-Regenerante-75ml.jpg	\N	D-biotic-Creme-Hydratante-Regenerante-75ml.jpg	image/jpeg	391653	2000	2000	50	50
66	D-BIOTIC Crème rugosités 150 ml	\N	2026-09-07 12:02:06.349+00	2026-09-07 12:02:06.349+00	/api/media/file/D-biotic-Creme-Rugosites-150ml.jpg	\N	D-biotic-Creme-Rugosites-150ml.jpg	image/jpeg	475202	2000	2000	50	50
71	D-BIOTIC Velvet 50 ml	\N	2026-09-07 12:02:07.364+00	2026-09-07 12:02:07.364+00	/api/media/file/D-biotic-Velvet-Sunscreen-50ml.jpg	\N	D-biotic-Velvet-Sunscreen-50ml.jpg	image/jpeg	362795	2000	2000	50	50
75	D-BIOTIC ROSABIOTIC LOTION SOIN INTENSE 100 ML	\N	2026-09-07 12:02:08.377+00	2026-09-07 12:02:08.377+00	/api/media/file/D-biotic-Rosabiotic-Lotion-100ml.jpg	\N	D-biotic-Rosabiotic-Lotion-100ml.jpg	image/jpeg	282160	2000	2000	50	50
80	SEBIOTIC Soin réparateur intense	\N	2026-09-07 12:02:09.36+00	2026-09-07 12:02:09.36+00	/api/media/file/D-biotic-Sebiotic-Soin-reparateur-intense-75ml.jpg	\N	D-biotic-Sebiotic-Soin-reparateur-intense-75ml.jpg	image/jpeg	324181	2000	2000	50	50
83	SEBIOTIC SERUM AI	\N	2026-09-07 12:02:09.952+00	2026-09-07 12:02:09.952+00	/api/media/file/D-biotic-Sebiotic-Serum-AI-50ml.jpg	\N	D-biotic-Sebiotic-Serum-AI-50ml.jpg	image/jpeg	278019	2000	2000	50	50
86	ECLABIOTIC RADIANCE	\N	2026-09-07 12:02:10.574+00	2026-09-07 12:02:10.574+00	/api/media/file/ECLABIOTIC-Radiance-SPF-30%2B-50ml.jpg	\N	ECLABIOTIC-Radiance-SPF-30+-50ml.jpg	image/jpeg	442674	2000	2000	50	50
90	ECLABIOTIC  GEL ÉCLAIRCISSANT EXFOLIANT	\N	2026-09-07 12:02:11.455+00	2026-09-07 12:02:11.455+00	/api/media/file/ECLABIOTIC-Gel-200ml.jpg	\N	ECLABIOTIC-Gel-200ml.jpg	image/jpeg	632619	2000	2000	50	50
91	LCP gel nettoyant	\N	2026-09-07 12:02:12.754+00	2026-09-07 12:02:12.754+00	/api/media/file/LCP-Gel-Nettoyant-350ml.jpg	\N	LCP-Gel-Nettoyant-350ml.jpg	image/jpeg	418196	2000	2000	50	50
64	D-BIOTIC Baume hydratant régénérant 150 ml	\N	2026-09-07 12:02:05.925+00	2026-09-07 12:02:05.925+00	/api/media/file/D-biotic-Baume-Hydratant-Regenerant-150ml.jpg	\N	D-biotic-Baume-Hydratant-Regenerant-150ml.jpg	image/jpeg	407759	2000	2000	50	50
67	D-BIOTIC Crème solaire 75 ml	\N	2026-09-07 12:02:06.547+00	2026-09-07 12:02:06.547+00	/api/media/file/D-biotic-Creme-Solaire-SPF50%2B-75ml.jpg	\N	D-biotic-Creme-Solaire-SPF50+-75ml.jpg	image/jpeg	348281	2000	2000	50	50
77	D-BIOTIC PULVOBIOTIC  PH 8	\N	2026-09-07 12:02:08.777+00	2026-09-07 12:02:08.777+00	/api/media/file/D-biotic-Pulvobiotic-pH-8-500ml.jpg	\N	D-biotic-Pulvobiotic-pH-8-500ml.jpg	image/jpeg	404563	2000	2000	50	50
81	SEBIOTIC Soin protecteur gelée	\N	2026-09-07 12:02:09.565+00	2026-09-07 12:02:09.565+00	/api/media/file/D-biotic-Sebiotic-Soin-protecteur-gelee-50ml.jpg	\N	D-biotic-Sebiotic-Soin-protecteur-gelee-50ml.jpg	image/jpeg	300194	2000	2000	50	50
85	Baume à lèvres Eclaircissant	\N	2026-09-07 12:02:10.376+00	2026-09-07 12:02:10.376+00	/api/media/file/D-biotic-Baume-a-levres-Eclaircissant-15ml.jpg	\N	D-biotic-Baume-a-levres-Eclaircissant-15ml.jpg	image/jpeg	185476	2000	2000	50	50
65	D-BIOTIC Gel rugosités 240 ml	\N	2026-09-07 12:02:06.15+00	2026-09-07 12:02:06.15+00	/api/media/file/D-biotic-Gel-Rugosites-240ml.jpg	\N	D-biotic-Gel-Rugosites-240ml.jpg	image/jpeg	562656	2000	2000	50	50
69	D-BIOTIC Gel surgras Pédiatrique 200 ml	\N	2026-09-07 12:02:06.957+00	2026-09-07 12:02:06.957+00	/api/media/file/D-biotic-Gel-Surgras-Pediatrique-200ml.jpg	\N	D-biotic-Gel-Surgras-Pediatrique-200ml.jpg	image/jpeg	434049	2000	2000	50	50
72	D-BIOTIC ROSABIOTIC CREME SOLAIRE SPF50+ TEINTE CLAIRE 75 ML	\N	2026-09-07 12:02:07.559+00	2026-09-07 12:02:07.559+00	/api/media/file/D-biotic-Rosabiotic-SPF-50%2B-75ml.jpg	\N	D-biotic-Rosabiotic-SPF-50+-75ml.jpg	image/jpeg	392792	2000	2000	50	50
74	D-BIOTIC ROSABIOTIC TRI-PHASIQUE NETTOYANT 200 ML	\N	2026-09-07 12:02:07.964+00	2026-09-07 12:02:07.964+00	/api/media/file/D-biotic-Rosabiotic-Tri-phasique-200ml.jpg	\N	D-biotic-Rosabiotic-Tri-phasique-200ml.jpg	image/jpeg	351955	2000	2000	50	50
76	D-BIOTIC CICABIOTIC 75 ML	\N	2026-09-07 12:02:08.576+00	2026-09-07 12:02:08.576+00	/api/media/file/D-biotic-Cicabiotic-75ml.jpg	\N	D-biotic-Cicabiotic-75ml.jpg	image/jpeg	351821	2000	2000	50	50
79	SEBIOTIC Mousse purifiante	\N	2026-09-07 12:02:09.166+00	2026-09-07 12:02:09.166+00	/api/media/file/D-biotic-Sebiotic-Mousse-purifiante-150ml.jpg	\N	D-biotic-Sebiotic-Mousse-purifiante-150ml.jpg	image/jpeg	271429	2000	2000	50	50
82	SEBIOTIC SPF 50+	\N	2026-09-07 12:02:09.759+00	2026-09-07 12:02:09.759+00	/api/media/file/D-biotic-Sebiotic-Ecran-solaire-SPF-50%2B-50ml.jpg	\N	D-biotic-Sebiotic-Ecran-solaire-SPF-50+-50ml.jpg	image/jpeg	272954	2000	2000	50	50
88	ECLABIOTIC SOLAIRE TEINTÉ SPF50+	\N	2026-09-07 12:02:10.971+00	2026-09-07 12:02:10.971+00	/api/media/file/ECLABIOTIC-Solaire-SPF-50%2B-50ml.jpg	\N	ECLABIOTIC-Solaire-SPF-50+-50ml.jpg	image/jpeg	478973	2000	2000	50	50
92	LCP crème hydratante matifiante	\N	2026-09-07 12:02:12.958+00	2026-09-07 12:02:12.958+00	/api/media/file/LCP-Creme-Matifiante-75ml.jpg	\N	LCP-Creme-Matifiante-75ml.jpg	image/jpeg	390685	2000	2000	50	50
93	LCP soin global	\N	2026-09-07 12:02:13.158+00	2026-09-07 12:02:13.158+00	/api/media/file/LCP-Soin-Global-75ml.jpg	\N	LCP-Soin-Global-75ml.jpg	image/jpeg	386800	2000	2000	50	50
94	LCP crème solaire matifiante	\N	2026-09-07 12:02:13.357+00	2026-09-07 12:02:13.357+00	/api/media/file/LCP-Creme-Solaire-Matifiante-SPF50%2B-75ml.jpg	\N	LCP-Creme-Solaire-Matifiante-SPF50+-75ml.jpg	image/jpeg	391290	2000	2000	50	50
95	LCP syndet relipidant atopique gel lavant	\N	2026-09-07 12:02:13.557+00	2026-09-07 12:02:13.557+00	/api/media/file/LCP-Syndet-Lavant-Relipidant-240ml.jpg	\N	LCP-Syndet-Lavant-Relipidant-240ml.jpg	image/jpeg	463486	2000	2000	50	50
96	LCP baume relipidant atopique crème émolliente	\N	2026-09-07 12:02:13.757+00	2026-09-07 12:02:13.757+00	/api/media/file/LCP-Baume-Relipidant-240ml.jpg	\N	LCP-Baume-Relipidant-240ml.jpg	image/jpeg	462103	2000	2000	50	50
97	LCP Soin Intense Pied Diabétique	\N	2026-09-07 12:02:13.954+00	2026-09-07 12:02:13.954+00	/api/media/file/LCP-Soin-Intense-PIEDS-DIABETIQUES-75ml.jpg	\N	LCP-Soin-Intense-PIEDS-DIABETIQUES-75ml.jpg	image/jpeg	234294	2000	2000	50	50
98	LCP Baume\nChauffant\nPieds Secs	\N	2026-09-07 12:02:14.149+00	2026-09-07 12:02:14.149+00	/api/media/file/LCP-Baume-Chauffant-PIEDS-SECS-100ml.jpg	\N	LCP-Baume-Chauffant-PIEDS-SECS-100ml.jpg	image/jpeg	268755	2000	2000	50	50
99	LCP Crème Anti-callosités	\N	2026-09-07 12:02:14.365+00	2026-09-07 12:02:14.365+00	/api/media/file/LCP-Creme-ANTI-CALLOSITES-75ml.jpg	\N	LCP-Creme-ANTI-CALLOSITES-75ml.jpg	image/jpeg	229958	2000	2000	50	50
100	LCP Gommage Nourissant Pieds	\N	2026-09-07 12:02:14.557+00	2026-09-07 12:02:14.557+00	/api/media/file/LCP-Gommage-NOURRISSANT-100ml.jpg	\N	LCP-Gommage-NOURRISSANT-100ml.jpg	image/jpeg	269220	2000	2000	50	50
101	LCP Baume Chauffant Mains Engelure	\N	2026-09-07 12:02:14.748+00	2026-09-07 12:02:14.748+00	/api/media/file/LCP-Mains-Baume-Chauffant-Mains-Engelures-75ml.jpg	\N	LCP-Mains-Baume-Chauffant-Mains-Engelures-75ml.jpg	image/jpeg	248148	2000	2000	50	50
102	LCP Baume Eclat Anti-Âge Mains	\N	2026-09-07 12:02:14.942+00	2026-09-07 12:02:14.942+00	/api/media/file/LCP-Mains-Baume-Eclat-Anti-age-SPF-30%2B-75ml.jpg	\N	LCP-Mains-Baume-Eclat-Anti-age-SPF-30+-75ml.jpg	image/jpeg	240581	2000	2000	50	50
103	LCP Soin Réparateur Apaisant	\N	2026-09-07 12:02:15.134+00	2026-09-07 12:02:15.134+00	/api/media/file/LCP-Mains-Soin-Reparateur-Apaisant-75ml.jpg	\N	LCP-Mains-Soin-Reparateur-Apaisant-75ml.jpg	image/jpeg	252323	2000	2000	50	50
104	LCP Shampoing anti-chute	\N	2026-09-07 12:02:15.333+00	2026-09-07 12:02:15.333+00	/api/media/file/LCPHAIR-Shampoing-Anti-Chute-300ml.jpg	\N	LCPHAIR-Shampoing-Anti-Chute-300ml.jpg	image/jpeg	697386	2000	2000	50	50
105	LCP masque anti-chute	\N	2026-09-07 12:02:15.533+00	2026-09-07 12:02:15.533+00	/api/media/file/LCPHAIR-Masque-Anti-Chute-200ml.jpg	\N	LCPHAIR-Masque-Anti-Chute-200ml.jpg	image/jpeg	685070	2000	2000	50	50
106	LCP lotion anti-chute	\N	2026-09-07 12:02:15.732+00	2026-09-07 12:02:15.732+00	/api/media/file/LCPHAIR-Lotion-Anti-Chute-200ml.jpg	\N	LCPHAIR-Lotion-Anti-Chute-200ml.jpg	image/jpeg	622383	2000	2000	50	50
107	MOUSSE NETTOYANTE	\N	2026-09-07 12:02:16.679+00	2026-09-07 12:02:16.679+00	/api/media/file/HTCEUTIC-MOUSSE.jpg	\N	HTCEUTIC-MOUSSE.jpg	image/jpeg	67472	800	800	50	50
108	CRÉME LAVANTE	\N	2026-09-07 12:02:16.876+00	2026-09-07 12:02:16.876+00	/api/media/file/HTCEUTIC-CREME-LAVANTE.jpg	\N	HTCEUTIC-CREME-LAVANTE.jpg	image/jpeg	75245	800	800	50	50
109	C30 SERUM	\N	2026-09-07 12:02:17.073+00	2026-09-07 12:02:17.073+00	/api/media/file/HTCEUTIC-C30-SERUM.jpg	\N	HTCEUTIC-C30-SERUM.jpg	image/jpeg	83105	800	800	50	50
110	CRÉME BOOSTER	\N	2026-09-07 12:02:17.265+00	2026-09-07 12:02:17.265+00	/api/media/file/HTCEUTIC-CREME-BOOSTER.jpg	\N	HTCEUTIC-CREME-BOOSTER.jpg	image/jpeg	80747	800	800	50	50
111	PROTEK SPF 50+	\N	2026-09-07 12:02:17.46+00	2026-09-07 12:02:17.46+00	/api/media/file/HTCEUTIC-PROTEK-SPF50.jpg	\N	HTCEUTIC-PROTEK-SPF50.jpg	image/jpeg	56253	800	800	50	50
112	RETINOL SERUM 0.5%	\N	2026-09-07 12:02:17.649+00	2026-09-07 12:02:17.649+00	/api/media/file/HTCEUTIC-RETINOL-SERUM-05.jpg	\N	HTCEUTIC-RETINOL-SERUM-05.jpg	image/jpeg	84334	800	800	50	50
113	RETINOL SERUM 2%	\N	2026-09-07 12:02:17.838+00	2026-09-07 12:02:17.838+00	/api/media/file/HTCEUTIC-RETINOL-SERUM-2.jpg	\N	HTCEUTIC-RETINOL-SERUM-2.jpg	image/jpeg	78749	800	800	50	50
114	CRÉME RÉGÉNÉRANTE SPF 15	\N	2026-09-07 12:02:18.032+00	2026-09-07 12:02:18.032+00	/api/media/file/HTCEUTIC-CREME-REGENERANTE.jpg	\N	HTCEUTIC-CREME-REGENERANTE.jpg	image/jpeg	142981	800	800	50	50
115	AHA GEL PRE-PEELING	\N	2026-09-07 12:02:18.223+00	2026-09-07 12:02:18.223+00	/api/media/file/HTCEUTIC-AHA-PRE-PEELING.jpg	\N	HTCEUTIC-AHA-PRE-PEELING.jpg	image/jpeg	80840	800	800	50	50
116	AHA CRÉME PEELING 15%	\N	2026-09-07 12:02:18.413+00	2026-09-07 12:02:18.413+00	/api/media/file/HTCEUTIC-AHA-15-CREME.jpg	\N	HTCEUTIC-AHA-15-CREME.jpg	image/jpeg	68485	800	800	50	50
117	AHA GEL PEELING 15%	\N	2026-09-07 12:02:18.604+00	2026-09-07 12:02:18.604+00	/api/media/file/HTCEUTIC-AHA-15-GEL.jpg	\N	HTCEUTIC-AHA-15-GEL.jpg	image/jpeg	67649	800	800	50	50
118	AHA CRÉME PEELING 20%	\N	2026-09-07 12:02:18.796+00	2026-09-07 12:02:18.796+00	/api/media/file/HTCEUTIC-AHA-20-CREME.jpg	\N	HTCEUTIC-AHA-20-CREME.jpg	image/jpeg	70111	800	800	50	50
119	AHA GEL PEELING 20%	\N	2026-09-07 12:02:18.987+00	2026-09-07 12:02:18.987+00	/api/media/file/HTCEUTIC-AHA-20-GEL.jpg	\N	HTCEUTIC-AHA-20-GEL.jpg	image/jpeg	73220	800	800	50	50
120	AHA CRÉME POST-PEELING	\N	2026-09-07 12:02:19.177+00	2026-09-07 12:02:19.177+00	/api/media/file/HTCEUTIC-AHA-POST-PEELING.jpg	\N	HTCEUTIC-AHA-POST-PEELING.jpg	image/jpeg	83059	800	800	50	50
121	WHITE GEL	\N	2026-09-07 12:02:19.374+00	2026-09-07 12:02:19.374+00	/api/media/file/HTCEUTIC-DEPIGMENTANT-WHITE-GEL.png	\N	HTCEUTIC-DEPIGMENTANT-WHITE-GEL.png	image/png	140565	2000	2000	50	50
122	WHITE CREAM	\N	2026-09-07 12:02:19.574+00	2026-09-07 12:02:19.574+00	/api/media/file/HTCEUTIC-DEPIGMENTANT-WHITE-CREAM.png	\N	HTCEUTIC-DEPIGMENTANT-WHITE-CREAM.png	image/png	280500	2000	2000	50	50
128	HA SOIN HYDRATANT MATIFIANT	\N	2026-09-07 12:02:22.277+00	2026-09-07 12:02:22.277+00	/api/media/file/HELIABRINE-HA-Soin-Hydratant-Matifiant.jpg	\N	HELIABRINE-HA-Soin-Hydratant-Matifiant.jpg	image/jpeg	33356	800	800	50	50
134	MASQUE REPULPANT COLLAGENE	\N	2026-09-07 12:02:23.474+00	2026-09-07 12:02:23.474+00	/api/media/file/HELIABRINE-Masque-Repulpant-Collagene.jpg	\N	HELIABRINE-Masque-Repulpant-Collagene.jpg	image/jpeg	67766	800	800	50	50
137	HELIABRINE SOLAR DEFENSE 50	\N	2026-09-07 12:02:24.042+00	2026-09-07 12:02:24.042+00	/api/media/file/HELIABRINE-Creme-Solaire.jpg	\N	HELIABRINE-Creme-Solaire.jpg	image/jpeg	61480	800	800	50	50
139	SOIN DE NUIT	\N	2026-09-07 12:02:24.416+00	2026-09-07 12:02:24.416+00	/api/media/file/HELIABRINE-Soin-de-Nuit.jpg	\N	HELIABRINE-Soin-de-Nuit.jpg	image/jpeg	49400	800	800	50	50
142	CREME HYDRA-PERLEE A L'ACIDE HYALURONIQUE	\N	2026-09-07 12:02:24.983+00	2026-09-07 12:02:24.983+00	/api/media/file/HELIABRINE-Hydra-Perlee.jpg	\N	HELIABRINE-Hydra-Perlee.jpg	image/jpeg	45123	800	800	50	50
146	GINKGOMASK MASQUE ECLAT	\N	2026-09-07 12:02:25.908+00	2026-09-07 12:02:25.908+00	/api/media/file/HELIABRINE-Ginkgomask-Masque-Eclat.jpg	\N	HELIABRINE-Ginkgomask-Masque-Eclat.jpg	image/jpeg	90530	800	800	50	50
156	SHAMP FEMME 200 ml	\N	2026-09-07 12:02:28.176+00	2026-09-07 12:02:28.176+00	/api/media/file/ECRINAL-Shampooing-Fortifiant-Femme-200ml.jpg	\N	ECRINAL-Shampooing-Fortifiant-Femme-200ml.jpg	image/jpeg	52478	800	800	50	50
159	SHAMP ULTRA DOUX	\N	2026-09-07 12:02:28.789+00	2026-09-07 12:02:28.789+00	/api/media/file/ECRINAL-Family-Shampooing-Ultra-Doux.jpg	\N	ECRINAL-Family-Shampooing-Ultra-Doux.jpg	image/jpeg	33646	800	800	50	50
123	SUN PROTECT SPF 50+	\N	2026-09-07 12:02:19.769+00	2026-09-07 12:02:19.769+00	/api/media/file/HTCEUTIC-DEPIGMENTANT-SUN-PROTECT.png	\N	HTCEUTIC-DEPIGMENTANT-SUN-PROTECT.png	image/png	288519	2000	2000	50	50
125	SOIN ANTI-TACHES ANTI-AGE	\N	2026-09-07 12:02:21.367+00	2026-09-07 12:02:21.367+00	/api/media/file/HELIXIENCE-White-Resolution.jpg	\N	HELIXIENCE-White-Resolution.jpg	image/jpeg	43899	800	800	50	50
127	HA PURIPHYL SOLUTION	\N	2026-09-07 12:02:22.084+00	2026-09-07 12:02:22.084+00	/api/media/file/HELIABRINE-Puriphyl-Solution.jpg	\N	HELIABRINE-Puriphyl-Solution.jpg	image/jpeg	39970	800	800	50	50
131	SOIN MULTI CORRECTION ( CAPITAL DEFENSE)	\N	2026-09-07 12:02:22.903+00	2026-09-07 12:02:22.903+00	/api/media/file/HELIABRINE-Soin-Multi-Correction.jpg	\N	HELIABRINE-Soin-Multi-Correction.jpg	image/jpeg	38862	800	800	50	50
141	CREME HYDRA-SATINEE AU COLLAGENE MARIN	\N	2026-09-07 12:02:24.792+00	2026-09-07 12:02:24.792+00	/api/media/file/HELIABRINE-Hydra-Satinee.jpg	\N	HELIABRINE-Hydra-Satinee.jpg	image/jpeg	41601	800	800	50	50
145	MASQUE REEQUILIBRANT AU MELILOT BIO	\N	2026-09-07 12:02:25.718+00	2026-09-07 12:02:25.718+00	/api/media/file/HELIABRINE-Masque-Reequilibrant-au-Melilot-Bio.jpg	\N	HELIABRINE-Masque-Reequilibrant-au-Melilot-Bio.jpg	image/jpeg	107003	800	800	50	50
148	SOIN EXFOLIANT VISAGE 75 ML	\N	2026-09-07 12:02:26.484+00	2026-09-07 12:02:26.484+00	/api/media/file/202-cv-1-H%25C3%25A9liabrine%2520soin%2520exfoliant%2520caviar.png	\N	202-cv-1-H%C3%A9liabrine%20soin%20exfoliant%20caviar.png	image/png	403129	1000	1000	50	50
150	O-REGEN CREME EXFOLIANTE VISAGE 75ml	\N	2026-09-07 12:02:26.86+00	2026-09-07 12:02:26.86+00	/api/media/file/249-cv-1-6.png	\N	249-cv-1-6.png	image/png	304188	1000	1000	50	50
151	AMPOULES cheveux	\N	2026-09-07 12:02:27.215+00	2026-09-07 12:02:27.215+00	/api/media/file/ECRINAL-Ampoules-Anti-Chute-Cheveux.jpg	\N	ECRINAL-Ampoules-Anti-Chute-Cheveux.jpg	image/jpeg	80478	800	800	50	50
154	LOTION FEMME	\N	2026-09-07 12:02:27.787+00	2026-09-07 12:02:27.787+00	/api/media/file/ECRINAL-Lotion-Fortifiant-Femme.jpg	\N	ECRINAL-Lotion-Fortifiant-Femme.jpg	image/jpeg	56014	800	800	50	50
157	SHAMP HOMME 400 ml	\N	2026-09-07 12:02:28.368+00	2026-09-07 12:02:28.368+00	/api/media/file/ECRINAL-Shampooing-Fortifiant-Homme-400ml.jpg	\N	ECRINAL-Shampooing-Fortifiant-Homme-400ml.jpg	image/jpeg	35697	800	800	50	50
160	APRES SHAMP	\N	2026-09-07 12:02:29.018+00	2026-09-07 12:02:29.018+00	/api/media/file/ECRINAL-Baume-Apres-Shampooing.jpg	\N	ECRINAL-Baume-Apres-Shampooing.jpg	image/jpeg	32873	800	800	50	50
124	LAIT CORPS	\N	2026-09-07 12:02:21.178+00	2026-09-07 12:02:21.178+00	/api/media/file/HELIXIENCE-Lait-Corps.jpg	\N	HELIXIENCE-Lait-Corps.jpg	image/jpeg	60680	800	800	50	50
129	MASQUE REEQUILIBRANT	\N	2026-09-07 12:02:22.521+00	2026-09-07 12:02:22.521+00	/api/media/file/39-cv-1-Masque%2520m%25C3%25A9lilot%2520web%25202.png	\N	39-cv-1-Masque%20m%C3%A9lilot%20web%202.png	image/png	363000	1000	1000	50	50
132	HELIABRINE BAUME 54	\N	2026-09-07 12:02:23.093+00	2026-09-07 12:02:23.093+00	/api/media/file/HELIABRINE-Baume-54.jpg	\N	HELIABRINE-Baume-54.jpg	image/jpeg	59327	800	800	50	50
135	HELIABRINE HUILE DEMAQUILANTE VELOURS	\N	2026-09-07 12:02:23.664+00	2026-09-07 12:02:23.664+00	/api/media/file/HELIABRINE-Huile-Demaquilante-Velours.jpg	\N	HELIABRINE-Huile-Demaquilante-Velours.jpg	image/jpeg	30554	800	800	50	50
138	SOIN DE JOUR	\N	2026-09-07 12:02:24.229+00	2026-09-07 12:02:24.229+00	/api/media/file/HELIABRINE-Soin-de-Jour.jpg	\N	HELIABRINE-Soin-de-Jour.jpg	image/jpeg	42771	800	800	50	50
143	SERUM EXPERT FERMETE	\N	2026-09-07 12:02:25.331+00	2026-09-07 12:02:25.331+00	/api/media/file/HELIABRINE-Serum-Expert-Fermete.jpg	\N	HELIABRINE-Serum-Expert-Fermete.jpg	image/jpeg	150494	800	800	50	50
147	BB CREAM SOIN TEINTE SPF 30	\N	2026-09-07 12:02:26.178+00	2026-09-07 12:02:26.178+00	/api/media/file/HELIABRINE-BB-Cream-Soin-Teinte-SPF-30.jpg	\N	HELIABRINE-BB-Cream-Soin-Teinte-SPF-30.jpg	image/jpeg	83262	800	800	50	50
153	LOTION HOMME	\N	2026-09-07 12:02:27.597+00	2026-09-07 12:02:27.597+00	/api/media/file/ECRINAL-Lotion-Fortifiant-Homme.jpg	\N	ECRINAL-Lotion-Fortifiant-Homme.jpg	image/jpeg	55843	800	800	50	50
158	SHAMP FEMME 400 ml	\N	2026-09-07 12:02:28.566+00	2026-09-07 12:02:28.566+00	/api/media/file/ECRINAL-Shampooing-Fortifiant-Femme-400ml.jpg	\N	ECRINAL-Shampooing-Fortifiant-Femme-400ml.jpg	image/jpeg	36070	800	800	50	50
161	MASQUE CAPILLAIRE	\N	2026-09-07 12:02:29.205+00	2026-09-07 12:02:29.205+00	/api/media/file/ECRINAL-Masque-Capillaire-Nutritif.jpg	\N	ECRINAL-Masque-Capillaire-Nutritif.jpg	image/jpeg	34113	800	800	50	50
126	HA GEL NETTOYANT MOUSSANT	\N	2026-09-07 12:02:21.895+00	2026-09-07 12:02:21.895+00	/api/media/file/HELIABRINE-Gel-Nettoyant-Moussant.jpg	\N	HELIABRINE-Gel-Nettoyant-Moussant.jpg	image/jpeg	22134	800	800	50	50
130	CREME CONFORT 32	\N	2026-09-07 12:02:22.711+00	2026-09-07 12:02:22.711+00	/api/media/file/HELIABRINE-Creme-Confort-32.jpg	\N	HELIABRINE-Creme-Confort-32.jpg	image/jpeg	39861	800	800	50	50
133	AMPOULES AU COLLAGENE MARIN	\N	2026-09-07 12:02:23.284+00	2026-09-07 12:02:23.283+00	/api/media/file/HELIABRINE-Ampoules-au-Collagene-Marin.jpg	\N	HELIABRINE-Ampoules-au-Collagene-Marin.jpg	image/jpeg	49768	800	800	50	50
136	SOIN LISSANT ET REPULPANT LEVRES	\N	2026-09-07 12:02:23.855+00	2026-09-07 12:02:23.855+00	/api/media/file/HELIABRINE-Soin-Lissant-Levres.jpg	\N	HELIABRINE-Soin-Lissant-Levres.jpg	image/jpeg	23954	800	800	50	50
140	GEL POST EPILATION	\N	2026-09-07 12:02:24.604+00	2026-09-07 12:02:24.604+00	/api/media/file/HELIABRINE-Gel-Post-Epilation.jpg	\N	HELIABRINE-Gel-Post-Epilation.jpg	image/jpeg	38116	800	800	50	50
144	SERUM NUTRIVITAMINE AU CALENDULA	\N	2026-09-07 12:02:25.526+00	2026-09-07 12:02:25.526+00	/api/media/file/HELIABRINE-Serum-Nutrivitamine-au-Calendula.jpg	\N	HELIABRINE-Serum-Nutrivitamine-au-Calendula.jpg	image/jpeg	133865	800	800	50	50
149	O-REGEN CREME REQUILBRANTE 50ml	\N	2026-09-07 12:02:26.792+00	2026-09-07 12:02:26.792+00	/api/media/file/49-cv-1-soin%2520hydratant%2520(2).png	\N	49-cv-1-soin%20hydratant%20(2).png	image/png	525644	1000	1000	50	50
152	CAPSULE CHEVEUX	\N	2026-09-07 12:02:27.407+00	2026-09-07 12:02:27.407+00	/api/media/file/ECRINAL-Complements-Alimentaires-Cheveux.jpg	\N	ECRINAL-Complements-Alimentaires-Cheveux.jpg	image/jpeg	37268	800	800	50	50
155	SHAMP HOMME 200 ml	\N	2026-09-07 12:02:27.986+00	2026-09-07 12:02:27.986+00	/api/media/file/ECRINAL-Shampooing-Fortifiant-Homme-200ml.jpg	\N	ECRINAL-Shampooing-Fortifiant-Homme-200ml.jpg	image/jpeg	52433	800	800	50	50
162	SERUM APAISANT CAPPILAIRE	\N	2026-09-07 12:02:29.393+00	2026-09-07 12:02:29.392+00	/api/media/file/ECRINAL-Serum-Apaisant-Cappilaire.jpg	\N	ECRINAL-Serum-Apaisant-Cappilaire.jpg	image/jpeg	54724	800	800	50	50
163	Produit Para d'Hiver	\N	2026-09-07 12:08:53.025+00	2026-09-07 12:08:53.025+00	/api/media/file/ChatGPT%20Image%2017%20ao%C3%BBt%202026%2C%2013_44_36.png	\N	ChatGPT Image 17 août 2026, 13_44_36.png	image/png	1890658	1536	1024	50	50
164	Produit Para d'Hiver	\N	2026-09-07 12:09:17.899+00	2026-09-07 12:09:17.899+00	/api/media/file/ShinSpa2-780x675.png	\N	ShinSpa2-780x675.png	image/png	550260	780	675	50	50
165	Produit Para d'Hiver	\N	2026-09-07 12:09:57.715+00	2026-09-07 12:09:57.715+00	/api/media/file/386329-media_swatch-0.avif	\N	386329-media_swatch-0.avif	image/avif	7236	750	750	50	50
166	Produit Para d'Hiver	\N	2026-09-07 12:10:03.841+00	2026-09-07 12:10:03.841+00	/api/media/file/images.jpg	\N	images.jpg	image/jpeg	7518	447	447	50	50
167	Produit Para d'Hiver	\N	2026-09-07 12:14:11.846+00	2026-09-07 12:14:11.846+00	/api/media/file/ShinSpa2-780x675-1.png	\N	ShinSpa2-780x675-1.png	image/png	550260	780	675	50	50
168	Produit Para d'Hiver	\N	2026-09-07 12:14:17.75+00	2026-09-07 12:14:17.75+00	/api/media/file/386329-media_swatch-1.avif	\N	386329-media_swatch-1.avif	image/avif	7236	750	750	50	50
169	Produit Para d'Hiver	\N	2026-09-07 17:52:43.961+00	2026-09-07 17:52:43.961+00	/api/media/file/imgi_185_cat-19-800x800.jpg	\N	imgi_185_cat-19-800x800.jpg	image/jpeg	63311	800	800	50	50
170	Produit Para d'Hiver	\N	2026-09-09 13:51:26.244+00	2026-09-09 13:51:26.244+00	/api/media/file/imgi_165_cat-2.jpg	\N	imgi_165_cat-2.jpg	image/jpeg	108242	1000	1000	50	50
171	Produit Para d'Hiver	\N	2026-09-09 13:52:12.456+00	2026-09-09 13:52:12.456+00	/api/media/file/imgi_200_cat-42.jpg	\N	imgi_200_cat-42.jpg	image/jpeg	100962	1000	1000	50	50
172	Produit Para d'Hiver	\N	2026-09-09 13:52:21.232+00	2026-09-09 13:52:21.232+00	/api/media/file/imgi_186_cat-19.jpg	\N	imgi_186_cat-19.jpg	image/jpeg	102689	1000	1000	50	50
173	Produit Para d'Hiver	\N	2026-09-09 13:52:43.425+00	2026-09-09 13:52:43.425+00	/api/media/file/imgi_179_cat-13.jpg	\N	imgi_179_cat-13.jpg	image/jpeg	89025	1000	1000	50	50
174	Produit Para d'Hiver	\N	2026-09-09 13:53:31.311+00	2026-09-09 13:53:31.311+00	/api/media/file/imgi_242_cat-41.jpg	\N	imgi_242_cat-41.jpg	image/jpeg	48687	1000	1000	50	50
175	Produit Para d'Hiver	\N	2026-09-09 13:59:27.539+00	2026-09-09 13:59:27.539+00	/api/media/file/logo.png	\N	logo.png	image/png	4817862	7465	7501	50	50
176	Pack duo Mousse Nettoyante Flash Éclat Novexpert, deux flacons 150 ml	\N	2026-09-15 22:20:15.83+00	2026-09-15 22:20:14.672+00	/api/media/file/novexpert-pack-duo-mousse-flash-eclat-1.jpg	\N	novexpert-pack-duo-mousse-flash-eclat-1.jpg	image/jpeg	58746	1000	1000	50	50
177	Pack Duo Mousse Novexpert : éclat et peau neuve en 20 secondes	\N	2026-09-15 22:20:16.649+00	2026-09-15 22:20:15.86+00	/api/media/file/novexpert-pack-duo-mousse-flash-eclat-2.jpg	\N	novexpert-pack-duo-mousse-flash-eclat-2.jpg	image/jpeg	61700	750	1095	50	50
178	Mousse Nettoyante Flash Éclat Novexpert : nettoie en profondeur	\N	2026-09-15 22:20:17.345+00	2026-09-15 22:20:16.68+00	/api/media/file/novexpert-pack-duo-mousse-flash-eclat-3.jpg	\N	novexpert-pack-duo-mousse-flash-eclat-3.jpg	image/jpeg	68287	750	1095	50	50
179	Mousse Flash Éclat Novexpert : exfolie en douceur, effet peau neuve	\N	2026-09-15 22:20:18.02+00	2026-09-15 22:20:17.388+00	/api/media/file/novexpert-pack-duo-mousse-flash-eclat-4.jpg	\N	novexpert-pack-duo-mousse-flash-eclat-4.jpg	image/jpeg	76449	750	1095	50	50
180	Mousse Flash Éclat Novexpert : illumine instantanément le teint	\N	2026-09-15 22:20:18.783+00	2026-09-15 22:20:18.05+00	/api/media/file/novexpert-pack-duo-mousse-flash-eclat-5.jpg	\N	novexpert-pack-duo-mousse-flash-eclat-5.jpg	image/jpeg	159104	750	1095	50	50
181	Flacon Mousse Nettoyante Flash Éclat Novexpert à la vitamine C	\N	2026-09-15 22:20:19.464+00	2026-09-15 22:20:18.817+00	/api/media/file/novexpert-pack-duo-mousse-flash-eclat-6.jpg	\N	novexpert-pack-duo-mousse-flash-eclat-6.jpg	image/jpeg	129715	750	1095	50	50
182	Logo Avène	\N	2026-09-16 11:25:36.642+00	2026-09-16 11:25:36.642+00	/api/media/file/logo-avene.png	\N	logo-avene.png	image/png	46211	573	240	50	50
183	Logo Bioderma	\N	2026-09-16 11:25:36.757+00	2026-09-16 11:25:36.757+00	/api/media/file/logo-bioderma.png	\N	logo-bioderma.png	image/png	35970	600	122	50	50
184	Logo CeraVe	\N	2026-09-16 11:25:36.862+00	2026-09-16 11:25:36.862+00	/api/media/file/logo-cerave.png	\N	logo-cerave.png	image/png	51182	600	221	50	50
185	Logo La Roche-Posay	\N	2026-09-16 11:25:36.968+00	2026-09-16 11:25:36.968+00	/api/media/file/logo-la-roche-posay.png	\N	logo-la-roche-posay.png	image/png	39536	559	240	50	50
186	Logo Nuxe	\N	2026-09-16 11:25:37.065+00	2026-09-16 11:25:37.065+00	/api/media/file/logo-nuxe.png	\N	logo-nuxe.png	image/png	7032	186	89	50	50
187	Logo Vichy	\N	2026-09-16 11:25:37.157+00	2026-09-16 11:25:37.157+00	/api/media/file/logo-vichy.png	\N	logo-vichy.png	image/png	41704	600	182	50	50
188	Produit Para d'Hiver	\N	2026-09-16 12:01:44.74+00	2026-09-16 12:01:44.739+00	/api/media/file/para-dhiver.png	\N	para-dhiver.png	image/png	1460812	1254	1254	50	50
190	Pack Repair Björn Axén : Repair Shampoo et Repair Conditioner, 250 ml chacun	\N	2026-09-16 17:31:48.729+00	2026-09-16 17:31:48.729+00	/api/media/file/bjorn-axen-pack-repair-1.png	\N	bjorn-axen-pack-repair-1.png	image/png	722044	1000	1000	50	50
191	Pack Repair Björn Axén, cheveux réparés dès la première utilisation	\N	2026-09-16 17:31:48.747+00	2026-09-16 17:31:48.747+00	/api/media/file/bjorn-axen-pack-repair-2.png	\N	bjorn-axen-pack-repair-2.png	image/png	1533043	750	1095	50	50
192	Pack Repair Björn Axén, soin des cheveux abîmés	\N	2026-09-16 17:31:48.76+00	2026-09-16 17:31:48.76+00	/api/media/file/bjorn-axen-pack-repair-3.png	\N	bjorn-axen-pack-repair-3.png	image/png	873259	750	1095	50	50
193	Pack Repair Björn Axén, shampooing et après-shampooing réparateurs	\N	2026-09-16 17:31:48.777+00	2026-09-16 17:31:48.777+00	/api/media/file/bjorn-axen-pack-repair-4.png	\N	bjorn-axen-pack-repair-4.png	image/png	809327	750	1095	50	50
194	Pack Repair Björn Axén, routine en 2 étapes	\N	2026-09-16 17:31:48.798+00	2026-09-16 17:31:48.797+00	/api/media/file/bjorn-axen-pack-repair-5.png	\N	bjorn-axen-pack-repair-5.png	image/png	1665291	750	1095	50	50
195	Pack Repair Björn Axén, cheveux plus forts	\N	2026-09-16 17:31:48.812+00	2026-09-16 17:31:48.812+00	/api/media/file/bjorn-axen-pack-repair-6.png	\N	bjorn-axen-pack-repair-6.png	image/png	608826	750	1095	50	50
196	Pack Herôme Durcisseur Fort pour ongles et Dissolvant soignant	\N	2026-09-16 17:31:48.886+00	2026-09-16 17:31:48.886+00	/api/media/file/herome-pack-durcisseur-fort-dissolvant-1.webp	\N	herome-pack-durcisseur-fort-dissolvant-1.webp	image/png	405977	823	823	50	50
197	Dissolvant soignant sans acétone Herôme	\N	2026-09-16 17:31:48.901+00	2026-09-16 17:31:48.901+00	/api/media/file/herome-pack-durcisseur-fort-dissolvant-2.png	\N	herome-pack-durcisseur-fort-dissolvant-2.png	image/png	519226	750	1095	50	50
198	Durcisseur Fort Herôme pour ongles fragiles	\N	2026-09-16 17:31:48.913+00	2026-09-16 17:31:48.913+00	/api/media/file/herome-pack-durcisseur-fort-dissolvant-3.png	\N	herome-pack-durcisseur-fort-dissolvant-3.png	image/png	718945	750	1095	50	50
199	Pack Herôme Durcisseur Extra Fort pour ongles et Dissolvant soignant	\N	2026-09-16 17:31:48.972+00	2026-09-16 17:31:48.972+00	/api/media/file/herome-pack-durcisseur-extra-fort-dissolvant-1.webp	\N	herome-pack-durcisseur-extra-fort-dissolvant-1.webp	image/png	427745	823	823	50	50
200	Dissolvant soignant sans acétone Herôme	\N	2026-09-16 17:31:48.983+00	2026-09-16 17:31:48.983+00	/api/media/file/herome-pack-durcisseur-extra-fort-dissolvant-2.png	\N	herome-pack-durcisseur-extra-fort-dissolvant-2.png	image/png	519226	750	1095	50	50
201	Durcisseur Extra Fort Herôme pour ongles très fragiles	\N	2026-09-16 17:31:48.994+00	2026-09-16 17:31:48.994+00	/api/media/file/herome-pack-durcisseur-extra-fort-dissolvant-3.png	\N	herome-pack-durcisseur-extra-fort-dissolvant-3.png	image/png	780849	750	1095	50	50
202	Produit Para d'Hiver	\N	2026-09-16 19:48:31.081+00	2026-09-16 19:48:31.081+00	/api/media/file/bjorn-axen-pack-repair-1.webp	\N	bjorn-axen-pack-repair-1.webp	image/webp	11310	640	640	50	50
203	Produit Para d'Hiver	\N	2026-09-16 19:49:34.466+00	2026-09-16 19:49:34.466+00	/api/media/file/WhatsApp%20Image%202026-09-15%20at%2016.52.51.jpeg	\N	WhatsApp Image 2026-09-15 at 16.52.51.jpeg	image/jpeg	810683	3328	4160	50	50
204	Produit Para d'Hiver	\N	2026-09-16 20:26:23.198+00	2026-09-16 20:26:23.198+00	/api/media/file/imgi_165_cat-3.jpg	\N	imgi_165_cat-3.jpg	image/jpeg	108242	1000	1000	50	50
205	Produit Para d'Hiver	\N	2026-09-16 20:26:35.864+00	2026-09-16 20:26:35.864+00	/api/media/file/imgi_276_cat-70-800x800.jpg	\N	imgi_276_cat-70-800x800.jpg	image/jpeg	71524	800	800	50	50
206	Produit Para d'Hiver	\N	2026-09-17 00:44:01.071+00	2026-09-17 00:44:01.071+00	/api/media/file/imgi_165_cat-4.jpg	\N	imgi_165_cat-4.jpg	image/jpeg	108242	1000	1000	50	50
207	Produit Para d'Hiver	\N	2026-09-17 00:44:09.564+00	2026-09-17 00:44:09.564+00	/api/media/file/imgi_255_cat-61-800x800.jpg	\N	imgi_255_cat-61-800x800.jpg	image/jpeg	93247	800	800	50	50
208	Produit Para d'Hiver	\N	2026-09-17 00:44:17.936+00	2026-09-17 00:44:17.936+00	/api/media/file/imgi_185_cat-19-800x800-1.jpg	\N	imgi_185_cat-19-800x800-1.jpg	image/jpeg	63311	800	800	50	50
209	Produit Para d'Hiver	\N	2026-09-17 00:44:29.585+00	2026-09-17 00:44:29.585+00	/api/media/file/imgi_283_cat-85-800x800.jpg	\N	imgi_283_cat-85-800x800.jpg	image/jpeg	59381	800	800	50	50
210	Produit Para d'Hiver	\N	2026-09-17 00:44:48.708+00	2026-09-17 00:44:48.708+00	/api/media/file/imgi_283_cat-85-800x800-1.jpg	\N	imgi_283_cat-85-800x800-1.jpg	image/jpeg	59381	800	800	50	50
211	Produit Para d'Hiver	\N	2026-09-17 14:40:15.806+00	2026-09-17 14:40:15.806+00	/api/media/file/imgi_242_cat-42.jpg	\N	imgi_242_cat-42.jpg	image/jpeg	48687	1000	1000	50	50
212	Produit Para d'Hiver	\N	2026-09-17 14:43:37.786+00	2026-09-17 14:43:37.786+00	/api/media/file/imgi_238_126417-media_1-0.jpg	\N	imgi_238_126417-media_1-0.jpg	image/jpeg	570990	1500	1500	50	50
213	Produit Para d'Hiver	\N	2026-09-17 14:45:32.12+00	2026-09-17 14:45:32.12+00	/api/media/file/ChatGPT%20Image%2017%20ao%C3%BBt%202026%2C%2013_44_36-1.png	\N	ChatGPT Image 17 août 2026, 13_44_36-1.png	image/png	1890658	1536	1024	50	50
214	Produit Para d'Hiver	\N	2026-09-17 14:45:37.642+00	2026-09-17 14:45:37.642+00	/api/media/file/ChatGPT%20Image%2017%20ao%C3%BBt%202026%2C%2013_46_14.png	\N	ChatGPT Image 17 août 2026, 13_46_14.png	image/png	1715068	941	1672	50	50
215	Produit Para d'Hiver	\N	2026-09-17 14:46:57.143+00	2026-09-17 14:46:57.143+00	/api/media/file/imgi_255_cat-61-800x800-1.jpg	\N	imgi_255_cat-61-800x800-1.jpg	image/jpeg	93247	800	800	50	50
189	Para d'Hiver	\N	2026-09-17 14:51:57.299+00	2026-09-16 12:01:56.873+00	/api/media/file/logo.webp	\N	logo.webp	image/webp	4518	64	64	50	50
216	Produit Para d'Hiver	\N	2026-09-17 22:09:16.185+00	2026-09-17 22:09:16.185+00	/api/media/file/ChatGPT%20Image%2013%20ao%C3%BBt%202026%2C%2021_49_53.png	\N	ChatGPT Image 13 août 2026, 21_49_53.png	image/png	1889526	1448	1086	50	50
\.


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.brands (id, name, slug, updated_at, created_at, logo_id) FROM stdin;
18	Uriage	uriage	2026-09-04 01:38:23.921+00	2026-09-04 01:38:23.921+00	\N
20	Klorane	klorane	2026-09-04 01:38:23.927+00	2026-09-04 01:38:23.927+00	\N
21	Ducray	ducray	2026-09-04 01:38:23.931+00	2026-09-04 01:38:23.931+00	\N
22	Mustela	mustela	2026-09-04 01:38:23.935+00	2026-09-04 01:38:23.935+00	\N
23	Lierac	lierac	2026-09-04 01:38:23.938+00	2026-09-04 01:38:23.938+00	\N
24	SVR	svr	2026-09-04 01:38:23.942+00	2026-09-04 01:38:23.942+00	\N
25	Isdin	isdin	2026-09-07 11:57:22.967+00	2026-09-07 11:57:22.967+00	\N
26	DCP	dcp	2026-09-07 12:01:51.542+00	2026-09-07 12:01:51.542+00	\N
27	D-Biotic	d-biotic	2026-09-07 12:02:04.148+00	2026-09-07 12:02:04.148+00	\N
28	LCP	lcp	2026-09-07 12:02:11.482+00	2026-09-07 12:02:11.482+00	\N
29	HTCeutic	htceutic	2026-09-07 12:02:15.754+00	2026-09-07 12:02:15.754+00	\N
30	Héliabrine	heliabrine	2026-09-07 12:02:20.276+00	2026-09-07 12:02:20.276+00	\N
31	Ecrinal	ecrinal	2026-09-07 12:02:26.879+00	2026-09-07 12:02:26.879+00	\N
32	Novexpert	novexpert	2026-09-15 22:20:14.625+00	2026-09-15 22:20:14.624+00	\N
14	Avène	avene	2026-09-16 11:25:36.701+00	2026-09-04 01:38:23.908+00	182
15	Bioderma	bioderma	2026-09-16 11:25:36.808+00	2026-09-04 01:38:23.911+00	183
17	CeraVe	cerave	2026-09-16 11:25:36.91+00	2026-09-04 01:38:23.918+00	184
13	La Roche-Posay	la-roche-posay	2026-09-16 11:25:37.014+00	2026-09-04 01:38:23.902+00	185
19	Nuxe	nuxe	2026-09-16 11:25:37.108+00	2026-09-04 01:38:23.924+00	186
16	Vichy	vichy	2026-09-16 11:25:37.197+00	2026-09-04 01:38:23.915+00	187
33	Björn Axén	bjorn-axen	2026-09-16 17:31:48.823+00	2026-09-16 17:31:48.823+00	\N
34	Herôme	herome	2026-09-16 17:31:48.927+00	2026-09-16 17:31:48.927+00	\N
\.


--
-- Data for Name: catalogue_page; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogue_page (id, featured_tile_title, featured_tile_sub, featured_tile_image_id, guide_eyebrow, guide_title, guide_body, guide_cta, guide_image_id, seo_intro_eyebrow, seo_intro_title, updated_at, created_at) FROM stdin;
1	Le rayon dermocosmétique	Les marques prescrites en pharmacie, à prix parapharmacie.	22	Guide d'achat	Comment choisir sa crème hydratante ?	Peau sèche, mixte ou réactive : nos pharmaciens décryptent les textures, les actifs à privilégier en hiver et les associations à éviter avec un traitement dermatologique.	Lire le guide	26	Le conseil Para d'Hiver	Bien choisir sa parapharmacie en ligne	2026-09-04 01:38:25.224+00	2026-09-04 01:03:02.608+00
\.


--
-- Data for Name: catalogue_page_editorial_tiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogue_page_editorial_tiles (_order, _parent_id, id, title, sub, image_id) FROM stdin;
1	1	6a9a211160d34b0024ec2abb	Nouveautés	Les dernières références en rayon	26
2	1	6a9a211160d34b0024ec2abc	Peaux sensibles	Formules sans parfum	14
3	1	6a9a211160d34b0024ec2abd	Coffrets	Prêts à offrir	18
\.


--
-- Data for Name: catalogue_page_needs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogue_page_needs (_order, _parent_id, id, title, sub, icon) FROM stdin;
1	1	6a9a211160d34b0024ec2abe	Peau sèche & tiraillements	Baumes riches, céramides et huiles nourrissantes.	Droplets
2	1	6a9a211160d34b0024ec2abf	Imperfections	Zinc, acide salicylique et nettoyants purifiants.	Sparkles
3	1	6a9a211160d34b0024ec2ac0	Anti-âge & fermeté	Rétinol, vitamine C et peptides, progressivement.	Star
4	1	6a9a211160d34b0024ec2ac1	Routine complète	Trois gestes validés par nos pharmaciens.	ListChecks
\.


--
-- Data for Name: catalogue_page_quick_filters; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogue_page_quick_filters (_order, _parent_id, id, label) FROM stdin;
1	1	6a9a211160d34b0024ec2a9d	−25% sélection soin
2	1	6a9a211160d34b0024ec2a9e	Nouveautés
3	1	6a9a211160d34b0024ec2a9f	Meilleures ventes
4	1	6a9a211160d34b0024ec2aa0	Exclusivités pharmacie
5	1	6a9a211160d34b0024ec2aa1	Minis & formats voyage
6	1	6a9a211160d34b0024ec2aa2	Coffrets
7	1	6a9a211160d34b0024ec2aa3	Peaux sensibles
8	1	6a9a211160d34b0024ec2aa4	Anti-âge
9	1	6a9a211160d34b0024ec2aa5	Hydratation
10	1	6a9a211160d34b0024ec2aa6	Bio & naturel
11	1	6a9a211160d34b0024ec2aa7	Sans parfum
12	1	6a9a211160d34b0024ec2aa8	Solaire SPF 50+
\.


--
-- Data for Name: catalogue_page_rels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogue_page_rels (id, "order", parent_id, path, brands_id) FROM stdin;
11	1	1	brands	13
12	2	1	brands	14
13	3	1	brands	15
14	4	1	brands	17
15	5	1	brands	16
16	6	1	brands	18
17	7	1	brands	19
18	8	1	brands	20
19	9	1	brands	21
20	10	1	brands	22
\.


--
-- Data for Name: catalogue_page_seo_intro_paragraphs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogue_page_seo_intro_paragraphs (_order, _parent_id, id, text) FROM stdin;
1	1	6a9a211160d34b0024ec2ac2	Une routine efficace tient en trois gestes : un nettoyant adapté à votre type de peau, un soin hydratant riche en céramides ou en acide hyaluronique, et une protection solaire portée toute l'année. En hiver, le froid et le vent fragilisent la barrière cutanée : privilégiez les textures baume et les formules sans parfum.
2	1	6a9a211160d34b0024ec2ac3	Tous les produits vendus sur Para d'Hiver proviennent du circuit pharmaceutique officiel et sont contrôlés par notre équipe de pharmaciens. Un doute sur une association d'actifs, une grossesse en cours ou un traitement dermatologique ? Nos pharmaciens répondent gratuitement, 7j/7.
\.


--
-- Data for Name: catalogue_page_tag_to_category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogue_page_tag_to_category (_order, _parent_id, id, tag, category) FROM stdin;
1	1	6a9a211160d34b0024ec2aa9	Nettoyants visage	Visage
2	1	6a9a211160d34b0024ec2aaa	Sérums	Visage
3	1	6a9a211160d34b0024ec2aab	Crèmes de jour	Visage
4	1	6a9a211160d34b0024ec2aac	Contour des yeux	Visage
5	1	6a9a211160d34b0024ec2aad	Baumes corps	Corps
6	1	6a9a211160d34b0024ec2aae	Shampooings traitants	Cheveux
7	1	6a9a211160d34b0024ec2aaf	Écrans solaires	Solaire
8	1	6a9a211160d34b0024ec2ab0	Compléments	Corps
9	1	6a9a211160d34b0024ec2ab1	Peaux sensibles	Visage
10	1	6a9a211160d34b0024ec2ab2	Peaux sèches	Corps
11	1	6a9a211160d34b0024ec2ab3	Imperfections	Visage
12	1	6a9a211160d34b0024ec2ab4	Anti-âge	Visage
13	1	6a9a211160d34b0024ec2ab5	Rougeurs	Visage
14	1	6a9a211160d34b0024ec2ab6	Chute de cheveux	Cheveux
15	1	6a9a211160d34b0024ec2ab7	Grossesse	Baby & Mom
16	1	6a9a211160d34b0024ec2ab8	Bébé	Baby & Mom
17	1	6a9a211160d34b0024ec2ab9	Peau sèche & tiraillements	Corps
18	1	6a9a211160d34b0024ec2aba	Routine complète	\N
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, slug, parent_id, "order", is_active, icon, updated_at, created_at, image_id, banner_id) FROM stdin;
122	Soldes	soldes	\N	0	t	\N	2026-09-04 01:38:23.946+00	2026-09-04 01:38:23.946+00	\N	\N
123	Promotions	promotions	122	0	t	\N	2026-09-04 01:38:23.95+00	2026-09-04 01:38:23.95+00	\N	\N
124	Ventes flash	ventes-flash	123	0	t	\N	2026-09-04 01:38:23.955+00	2026-09-04 01:38:23.955+00	\N	\N
125	Jusqu'à -50%	jusqu-a-50	123	1	t	\N	2026-09-04 01:38:23.962+00	2026-09-04 01:38:23.962+00	\N	\N
126	Fins de série	fins-de-serie	123	2	t	\N	2026-09-04 01:38:23.969+00	2026-09-04 01:38:23.969+00	\N	\N
127	Derniers coups de cœur	derniers-coups-de-c-ur	123	3	t	\N	2026-09-04 01:38:23.977+00	2026-09-04 01:38:23.977+00	\N	\N
128	Marques	marques	\N	1	t	\N	2026-09-04 01:38:23.984+00	2026-09-04 01:38:23.984+00	\N	\N
129	Dermocosmétique	dermocosmetique	128	0	t	\N	2026-09-04 01:38:23.988+00	2026-09-04 01:38:23.988+00	\N	\N
130	La Roche-Posay	la-roche-posay	129	0	t	\N	2026-09-04 01:38:23.993+00	2026-09-04 01:38:23.993+00	\N	\N
131	Avène	avene	129	1	t	\N	2026-09-04 01:38:24+00	2026-09-04 01:38:24+00	\N	\N
132	Bioderma	bioderma	129	2	t	\N	2026-09-04 01:38:24.007+00	2026-09-04 01:38:24.007+00	\N	\N
133	CeraVe	cerave	129	3	t	\N	2026-09-04 01:38:24.014+00	2026-09-04 01:38:24.014+00	\N	\N
134	Vichy	vichy	129	4	t	\N	2026-09-04 01:38:24.022+00	2026-09-04 01:38:24.022+00	\N	\N
135	Uriage	uriage	129	5	t	\N	2026-09-04 01:38:24.031+00	2026-09-04 01:38:24.031+00	\N	\N
136	Autres marques	autres-marques	128	1	t	\N	2026-09-04 01:38:24.038+00	2026-09-04 01:38:24.038+00	\N	\N
137	Nuxe	nuxe	136	0	t	\N	2026-09-04 01:38:24.044+00	2026-09-04 01:38:24.044+00	\N	\N
138	Klorane	klorane	136	1	t	\N	2026-09-04 01:38:24.051+00	2026-09-04 01:38:24.051+00	\N	\N
139	Ducray	ducray	136	2	t	\N	2026-09-04 01:38:24.058+00	2026-09-04 01:38:24.058+00	\N	\N
140	Mustela	mustela	136	3	t	\N	2026-09-04 01:38:24.066+00	2026-09-04 01:38:24.066+00	\N	\N
141	Lierac	lierac	136	4	t	\N	2026-09-04 01:38:24.073+00	2026-09-04 01:38:24.073+00	\N	\N
142	SVR	svr	136	5	t	\N	2026-09-04 01:38:24.086+00	2026-09-04 01:38:24.086+00	\N	\N
143	Visage	visage	\N	2	t	\N	2026-09-04 01:38:24.094+00	2026-09-04 01:38:24.094+00	\N	\N
144	Nettoyants	nettoyants	143	0	t	\N	2026-09-04 01:38:24.099+00	2026-09-04 01:38:24.099+00	\N	\N
145	Eaux micellaires	eaux-micellaires	144	0	t	\N	2026-09-04 01:38:24.106+00	2026-09-04 01:38:24.106+00	\N	\N
146	Gels moussants	gels-moussants	144	1	t	\N	2026-09-04 01:38:24.112+00	2026-09-04 01:38:24.112+00	\N	\N
147	Démaquillants	demaquillants	144	2	t	\N	2026-09-04 01:38:24.119+00	2026-09-04 01:38:24.119+00	\N	\N
148	Lotions toniques	lotions-toniques	144	3	t	\N	2026-09-04 01:38:24.126+00	2026-09-04 01:38:24.126+00	\N	\N
149	Sérums	serums	143	1	t	\N	2026-09-04 01:38:24.134+00	2026-09-04 01:38:24.134+00	\N	\N
150	Anti-taches	anti-taches	149	0	t	\N	2026-09-04 01:38:24.14+00	2026-09-04 01:38:24.14+00	\N	\N
151	Anti-âge	anti-age	149	1	t	\N	2026-09-04 01:38:24.146+00	2026-09-04 01:38:24.146+00	\N	\N
152	Hydratants	hydratants	149	2	t	\N	2026-09-04 01:38:24.154+00	2026-09-04 01:38:24.154+00	\N	\N
153	Vitamine C	vitamine-c	149	3	t	\N	2026-09-04 01:38:24.168+00	2026-09-04 01:38:24.168+00	\N	\N
154	Crèmes	cremes	143	2	t	\N	2026-09-04 01:38:24.176+00	2026-09-04 01:38:24.176+00	\N	\N
155	Peaux sèches	peaux-seches	154	0	t	\N	2026-09-04 01:38:24.185+00	2026-09-04 01:38:24.185+00	\N	\N
156	Peaux sensibles	peaux-sensibles	154	1	t	\N	2026-09-04 01:38:24.196+00	2026-09-04 01:38:24.196+00	\N	\N
157	Contour des yeux	contour-des-yeux	154	2	t	\N	2026-09-04 01:38:24.203+00	2026-09-04 01:38:24.203+00	\N	\N
158	Nuit	nuit	154	3	t	\N	2026-09-04 01:38:24.209+00	2026-09-04 01:38:24.209+00	\N	\N
159	Masques	masques	143	3	t	\N	2026-09-04 01:38:24.216+00	2026-09-04 01:38:24.216+00	\N	\N
160	Purifiants	purifiants	159	0	t	\N	2026-09-04 01:38:24.221+00	2026-09-04 01:38:24.221+00	\N	\N
161	Hydratants	hydratants	159	1	t	\N	2026-09-04 01:38:24.228+00	2026-09-04 01:38:24.228+00	\N	\N
162	Peelings doux	peelings-doux	159	2	t	\N	2026-09-04 01:38:24.235+00	2026-09-04 01:38:24.235+00	\N	\N
163	Patchs	patchs	159	3	t	\N	2026-09-04 01:38:24.242+00	2026-09-04 01:38:24.242+00	\N	\N
164	Cheveux	cheveux	\N	3	t	\N	2026-09-04 01:38:24.249+00	2026-09-04 01:38:24.249+00	\N	\N
165	Shampoings & soins	shampoings-soins	164	0	t	\N	2026-09-04 01:38:24.253+00	2026-09-04 01:38:24.253+00	\N	\N
166	Shampoings traitants	shampoings-traitants	165	0	t	\N	2026-09-04 01:38:24.259+00	2026-09-04 01:38:24.259+00	\N	\N
167	Après-shampoings	apres-shampoings	165	1	t	\N	2026-09-04 01:38:24.266+00	2026-09-04 01:38:24.266+00	\N	\N
168	Masques capillaires	masques-capillaires	165	2	t	\N	2026-09-04 01:38:24.273+00	2026-09-04 01:38:24.273+00	\N	\N
169	Sérums cheveux	serums-cheveux	165	3	t	\N	2026-09-04 01:38:24.28+00	2026-09-04 01:38:24.28+00	\N	\N
170	Besoins	besoins	164	1	t	\N	2026-09-04 01:38:24.287+00	2026-09-04 01:38:24.287+00	\N	\N
171	Chute de cheveux	chute-de-cheveux	170	0	t	\N	2026-09-04 01:38:24.294+00	2026-09-04 01:38:24.294+00	\N	\N
172	Pellicules	pellicules	170	1	t	\N	2026-09-04 01:38:24.3+00	2026-09-04 01:38:24.3+00	\N	\N
173	Cheveux secs	cheveux-secs	170	2	t	\N	2026-09-04 01:38:24.307+00	2026-09-04 01:38:24.307+00	\N	\N
174	Cuir chevelu sensible	cuir-chevelu-sensible	170	3	t	\N	2026-09-04 01:38:24.314+00	2026-09-04 01:38:24.314+00	\N	\N
175	Corps	corps	\N	4	t	\N	2026-09-04 01:38:24.321+00	2026-09-04 01:38:24.321+00	\N	\N
176	Hygiène	hygiene	175	0	t	\N	2026-09-04 01:38:24.328+00	2026-09-04 01:38:24.328+00	\N	\N
177	Gels et huiles lavants	gels-et-huiles-lavants	176	0	t	\N	2026-09-04 01:38:24.335+00	2026-09-04 01:38:24.335+00	\N	\N
178	Savon dermatologique	savon-dermatologique	176	1	t	\N	2026-09-04 01:38:24.344+00	2026-09-04 01:38:24.344+00	\N	\N
179	Déodorants	deodorants	176	2	t	\N	2026-09-04 01:38:24.354+00	2026-09-04 01:38:24.354+00	\N	\N
180	Anti-transpirants	anti-transpirants	176	3	t	\N	2026-09-04 01:38:24.362+00	2026-09-04 01:38:24.362+00	\N	\N
181	Hygiène intime	hygiene-intime	176	4	t	\N	2026-09-04 01:38:24.369+00	2026-09-04 01:38:24.369+00	\N	\N
182	Soins ciblés	soins-cibles	175	1	t	\N	2026-09-04 01:38:24.378+00	2026-09-04 01:38:24.378+00	\N	\N
183	Crèmes cicatrisantes	cremes-cicatrisantes	182	0	t	\N	2026-09-04 01:38:24.386+00	2026-09-04 01:38:24.386+00	\N	\N
184	Cellulite & vergetures	cellulite-vergetures	182	1	t	\N	2026-09-04 01:38:24.394+00	2026-09-04 01:38:24.394+00	\N	\N
185	Huiles & crèmes minceur	huiles-cremes-minceur	182	2	t	\N	2026-09-04 01:38:24.401+00	2026-09-04 01:38:24.401+00	\N	\N
186	Soins mains & pieds	soins-mains-pieds	182	3	t	\N	2026-09-04 01:38:24.408+00	2026-09-04 01:38:24.408+00	\N	\N
187	Hydratation	hydratation	175	2	t	\N	2026-09-04 01:38:24.417+00	2026-09-04 01:38:24.417+00	\N	\N
188	Laits corps	laits-corps	187	0	t	\N	2026-09-04 01:38:24.424+00	2026-09-04 01:38:24.424+00	\N	\N
189	Baumes réparateurs	baumes-reparateurs	187	1	t	\N	2026-09-04 01:38:24.429+00	2026-09-04 01:38:24.429+00	\N	\N
190	Gommages & exfoliants	gommages-exfoliants	187	2	t	\N	2026-09-04 01:38:24.435+00	2026-09-04 01:38:24.435+00	\N	\N
191	Huiles sèches	huiles-seches	187	3	t	\N	2026-09-04 01:38:24.442+00	2026-09-04 01:38:24.442+00	\N	\N
192	Épilation	epilation	175	3	t	\N	2026-09-04 01:38:24.451+00	2026-09-04 01:38:24.451+00	\N	\N
193	Crèmes dépilatoires	cremes-depilatoires	192	0	t	\N	2026-09-04 01:38:24.465+00	2026-09-04 01:38:24.465+00	\N	\N
194	Épilateurs	epilateurs	192	1	t	\N	2026-09-04 01:38:24.471+00	2026-09-04 01:38:24.471+00	\N	\N
195	Après-épilation	apres-epilation	192	2	t	\N	2026-09-04 01:38:24.48+00	2026-09-04 01:38:24.48+00	\N	\N
196	Accessoires	accessoires	192	3	t	\N	2026-09-04 01:38:24.488+00	2026-09-04 01:38:24.488+00	\N	\N
197	K Beauty	k-beauty	\N	5	t	\N	2026-09-04 01:38:24.496+00	2026-09-04 01:38:24.496+00	\N	\N
198	Rituel coréen	rituel-coreen	197	0	t	\N	2026-09-04 01:38:24.5+00	2026-09-04 01:38:24.5+00	\N	\N
199	Nettoyants	nettoyants	198	0	t	\N	2026-09-04 01:38:24.505+00	2026-09-04 01:38:24.505+00	\N	\N
200	Essences & sérums	essences-serums	198	1	t	\N	2026-09-04 01:38:24.511+00	2026-09-04 01:38:24.511+00	\N	\N
201	Masques tissu	masques-tissu	198	2	t	\N	2026-09-04 01:38:24.518+00	2026-09-04 01:38:24.518+00	\N	\N
202	Crèmes hydratantes	cremes-hydratantes	198	3	t	\N	2026-09-04 01:38:24.525+00	2026-09-04 01:38:24.525+00	\N	\N
203	Maquillage	maquillage	\N	6	t	\N	2026-09-04 01:38:24.532+00	2026-09-04 01:38:24.532+00	\N	\N
204	Teint	teint	203	0	t	\N	2026-09-04 01:38:24.536+00	2026-09-04 01:38:24.536+00	\N	\N
205	Fond de teint	fond-de-teint	204	0	t	\N	2026-09-04 01:38:24.541+00	2026-09-04 01:38:24.541+00	\N	\N
206	Correcteurs	correcteurs	204	1	t	\N	2026-09-04 01:38:24.548+00	2026-09-04 01:38:24.548+00	\N	\N
207	Poudres	poudres	204	2	t	\N	2026-09-04 01:38:24.555+00	2026-09-04 01:38:24.555+00	\N	\N
208	Yeux & sourcils	yeux-sourcils	203	1	t	\N	2026-09-04 01:38:24.563+00	2026-09-04 01:38:24.563+00	\N	\N
209	Mascaras	mascaras	208	0	t	\N	2026-09-04 01:38:24.569+00	2026-09-04 01:38:24.569+00	\N	\N
210	Eyeliners	eyeliners	208	1	t	\N	2026-09-04 01:38:24.575+00	2026-09-04 01:38:24.575+00	\N	\N
211	Sourcils	sourcils	208	2	t	\N	2026-09-04 01:38:24.582+00	2026-09-04 01:38:24.582+00	\N	\N
212	Lèvres	levres	203	2	t	\N	2026-09-04 01:38:24.589+00	2026-09-04 01:38:24.589+00	\N	\N
213	Rouges à lèvres	rouges-a-levres	212	0	t	\N	2026-09-04 01:38:24.596+00	2026-09-04 01:38:24.595+00	\N	\N
214	Baumes teintés	baumes-teintes	212	1	t	\N	2026-09-04 01:38:24.603+00	2026-09-04 01:38:24.603+00	\N	\N
215	Gloss	gloss	212	2	t	\N	2026-09-04 01:38:24.613+00	2026-09-04 01:38:24.613+00	\N	\N
216	Bébé & Maman	bebe-maman	\N	7	t	\N	2026-09-04 01:38:24.621+00	2026-09-04 01:38:24.621+00	\N	\N
217	Bébé	bebe	216	0	t	\N	2026-09-04 01:38:24.626+00	2026-09-04 01:38:24.626+00	\N	\N
218	Soins du change	soins-du-change	217	0	t	\N	2026-09-04 01:38:24.631+00	2026-09-04 01:38:24.631+00	\N	\N
219	Toilette douce	toilette-douce	217	1	t	\N	2026-09-04 01:38:24.638+00	2026-09-04 01:38:24.638+00	\N	\N
220	Crèmes hydratantes	cremes-hydratantes	217	2	t	\N	2026-09-04 01:38:24.645+00	2026-09-04 01:38:24.645+00	\N	\N
221	Solaire bébé	solaire-bebe	217	3	t	\N	2026-09-04 01:38:24.652+00	2026-09-04 01:38:24.652+00	\N	\N
222	Maman	maman	216	1	t	\N	2026-09-04 01:38:24.659+00	2026-09-04 01:38:24.659+00	\N	\N
223	Grossesse	grossesse	222	0	t	\N	2026-09-04 01:38:24.665+00	2026-09-04 01:38:24.665+00	\N	\N
224	Allaitement	allaitement	222	1	t	\N	2026-09-04 01:38:24.673+00	2026-09-04 01:38:24.673+00	\N	\N
225	Vergetures	vergetures	222	2	t	\N	2026-09-04 01:38:24.685+00	2026-09-04 01:38:24.685+00	\N	\N
226	Bucco-dentaire	bucco-dentaire	\N	8	t	\N	2026-09-04 01:38:24.691+00	2026-09-04 01:38:24.691+00	\N	\N
227	Hygiène bucco-dentaire	hygiene-bucco-dentaire	226	0	t	\N	2026-09-04 01:38:24.696+00	2026-09-04 01:38:24.696+00	\N	\N
228	Dentifrices	dentifrices	227	0	t	\N	2026-09-04 01:38:24.703+00	2026-09-04 01:38:24.703+00	\N	\N
229	Brosses à dents	brosses-a-dents	227	1	t	\N	2026-09-04 01:38:24.712+00	2026-09-04 01:38:24.712+00	\N	\N
230	Bains de bouche	bains-de-bouche	227	2	t	\N	2026-09-04 01:38:24.719+00	2026-09-04 01:38:24.719+00	\N	\N
231	Fil dentaire	fil-dentaire	227	3	t	\N	2026-09-04 01:38:24.725+00	2026-09-04 01:38:24.725+00	\N	\N
232	Compléments alimentaires	complements-alimentaires	\N	9	t	\N	2026-09-04 01:38:24.732+00	2026-09-04 01:38:24.732+00	\N	\N
233	Compléments	complements	232	0	t	\N	2026-09-04 01:38:24.736+00	2026-09-04 01:38:24.736+00	\N	\N
234	Vitalité & immunité	vitalite-immunite	233	0	t	\N	2026-09-04 01:38:24.74+00	2026-09-04 01:38:24.74+00	\N	\N
235	Cheveux & ongles	cheveux-ongles	233	1	t	\N	2026-09-04 01:38:24.746+00	2026-09-04 01:38:24.746+00	\N	\N
236	Sommeil & stress	sommeil-stress	233	2	t	\N	2026-09-04 01:38:24.752+00	2026-09-04 01:38:24.752+00	\N	\N
237	Digestion	digestion	233	3	t	\N	2026-09-04 01:38:24.758+00	2026-09-04 01:38:24.758+00	\N	\N
238	Nouveautés	nouveautes	\N	10	t	\N	2026-09-04 01:38:24.764+00	2026-09-04 01:38:24.764+00	\N	\N
239	Dernières arrivées	dernieres-arrivees	238	0	t	\N	2026-09-04 01:38:24.769+00	2026-09-04 01:38:24.769+00	\N	\N
240	Nouveaux soins visage	nouveaux-soins-visage	239	0	t	\N	2026-09-04 01:38:24.773+00	2026-09-04 01:38:24.773+00	\N	\N
241	Nouveaux soins corps	nouveaux-soins-corps	239	1	t	\N	2026-09-04 01:38:24.779+00	2026-09-04 01:38:24.779+00	\N	\N
242	Nouvelles marques	nouvelles-marques	239	2	t	\N	2026-09-04 01:38:24.785+00	2026-09-04 01:38:24.785+00	\N	\N
\.


--
-- Data for Name: collections_page; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.collections_page (id, updated_at, created_at) FROM stdin;
1	2026-09-04 01:03:02.592+00	2026-09-04 01:03:02.592+00
\.


--
-- Data for Name: collections_page_cards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.collections_page_cards (_order, _parent_id, id, title, sub, count, image_id, slug) FROM stdin;
1	1	6a9a211160d34b0024ec2a97	Rituel d'hiver	Nettoyer, réparer, protéger : la routine froid et vent.	24 produits	26	\N
2	1	6a9a211160d34b0024ec2a98	Peaux sensibles	Formules minimalistes, sans parfum, testées sous contrôle dermatologique.	38 produits	22	\N
3	1	6a9a211160d34b0024ec2a99	Cheveux & cuir chevelu	Chute, pellicules, longueurs abîmées : protocoles ciblés.	31 produits	17	\N
4	1	6a9a211160d34b0024ec2a9a	Solaire toute l'année	SPF 50+ visage et corps, y compris en altitude.	18 produits	24	\N
5	1	6a9a211160d34b0024ec2a9b	Bébé & maman	Grossesse, post-partum et peau des tout-petits.	27 produits	16	\N
6	1	6a9a211160d34b0024ec2a9c	Coffrets & cadeaux	Rituels prêts à offrir, emballés à la main.	12 coffrets	18	\N
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, slug, brand_id, category, size, price, old_price, badge, rating, reviews, tint, description, image_id, sku, barcode, stock, reserved_stock, low_stock_threshold, is_published, featured, discontinued, updated_at, created_at, has_variants, variant_option_type, variant_pricing_mode, is_low_stock, sub_category) FROM stdin;
247	PACK DUO MOUSSE FLASH ÉCLAT	pack-duo-mousse-flash-eclat	32	Visage	2 × 150 ml	396	528	\N	5	0	#F2F2F2	Deux Mousses Nettoyantes Flash Éclat Novexpert à la vitamine C, réunies dans un pack. En un seul geste, la mousse nettoie, démaquille et exfolie en douceur : enzymes de papaye et PHAs affinent le grain de peau et ravivent l'éclat en 20 secondes, sans dessécher.\n\nLes plus :\n3 actions en 1 : nettoie, démaquille et exfolie.\nDouble exfoliation douce : enzymes de papaye et PHAs.\nPeau lissée et matifiée, sans tiraillement.\nCoup d'éclat grâce à la vitamine C.\nFormule 100 % d'origine naturelle et vegan, certifiée cosmétique biologique Ecocert.\n\nConseils d'utilisation :\nAppliquer sur peau humide, laisser agir 20 secondes, masser 10 secondes, puis rincer.\nMatin et soir pour les peaux mixtes à grasses ; le soir uniquement pour les peaux normales.	176	NOV-PACK-DUO-MOUSSE-FLASH-ECLAT	\N	10	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-15 22:20:19.498+00	f	contenance	same-price	f	nettoyants
179	LCP Baume Chauffant Mains Engelure	lcp-baume-chauffant-mains-engelure	28	Corps	\N	87	\N	\N	5	0	#F2F2F2	LCP Baume Chauffant Mains Engelures permet de procurer une\nsensation de chaleur grâce à une synergie d’huiles\nessentiels tonifiants et d’agents relipidant. LCP Baume\nChauffant stimule la circulation et réchauffe les mains\nfroides, idéal en hiver.\nAction 3 en 1: Exfolie, Nourrit, Adoucit\n0% alcool, 0% paraben, 0% sulfate	101	LCP-6111275500158	6111275500158	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:14.754+00	f	contenance	same-price	f	soins-mains-pieds
180	LCP Baume Eclat Anti-Âge Mains	lcp-baume-eclat-anti-age-mains	28	Corps	\N	113	\N	\N	5	0	#F2F2F2	LCP Baume Eclat Anti-Âge Mains est formulé à base des actifs éclaircissants et du maquiGlow, LCP Baume éclat anti-âge favorise à éclaircir la peau de la main, à atténuer les taches brunes installées\net à prévenir l’apparition de nouvelles taches.\nQuotidiennement, le jour et le soir, appliquer LCP Baume éclat anti-âge après chaque lavage des mains ou sensation de mains déshydratées.                                                                        Action 3 en 1: Eclaircit, Hydrate, Atténue\n0% alcool, 0% paraben, 0% sulfate	102	LCP-6111275500172	6111275500172	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:14.948+00	f	contenance	same-price	f	soins-mains-pieds
181	LCP Soin Réparateur Apaisant	lcp-soin-reparateur-apaisant	28	Corps	\N	80	\N	\N	5	0	#F2F2F2	À base d’une synergie des huiles végétales et d’autres\nactifs réparateurs, LCP Soin Réparateur Apaisant répare\nintensément les mains gercées, abîmées et fragilisées et\napaise les irritations de la main causées par les\ntiraillements et les rougeurs.\nUtilisation : Appliquer LCP Soin réparateur apaisant\ndeux à trois fois par jour en insistant sur les zones\ngercées et fragilisées.                                                                           Action 3 en 1: Repare, Réconforte, Apaise\n0% alcool, 0% paraben, 0% sulfate	103	LCP-6111275500189	6111275500189	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:15.139+00	f	contenance	same-price	f	cremes-cicatrisantes
182	LCP Shampoing anti-chute	lcp-shampoing-anti-chute	28	Cheveux	\N	193	\N	\N	5	0	#F2F2F2	LCP shampoing anti-chute est un soin lavant expert formulé pour freiner la chute de cheveux et renforcer durablement la fibre capillaire. Grâce à l’association de plusieurs complexes anti-chute ciblés, il agit dès la racine pour stimuler le cuir chevelu, améliorer l’ancrage du cheveu et favoriser une croissance plus forte et plus résistante.\nSa formule nettoie en douceur tout en apportant les nutriments essentiels aux cheveux fragilisés, sans les alourdir. Le shampoing anti-chute LCP nettoie en douceur, protège le cuir chevelu, nourrit et aide à renforcer les cheveux sujets à la chute ou à la casse.                                                                         Action 3 en 1: Nettoie, Nourrit, Revitalise\n0% alcool, 0% paraben	104	LCP-6111275500110	6111275500110	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:15.339+00	f	contenance	same-price	f	chute-de-cheveux
183	LCP masque anti-chute	lcp-masque-anti-chute	28	Cheveux	\N	193	\N	\N	5	0	#F2F2F2	LCP Masque Anti-chute est un soin capillaire intensif spécialement formulé pour renforcer les cheveux fragilisés et lutter efficacement contre la chute. Enrichi en actifs fortifiants et stimulants, il nourrit en profondeur le cuir chevelu, améliore la résistance de la fibre capillaire et favorise une chevelure plus dense et plus vigoureuse.\nSa texture onctueuse pénètre rapidement sans alourdir, laissant les cheveux doux, brillants et faciles à coiffer. Utilisé régulièrement, il aide à réduire la casse et la chute, stimuler la pousse et restaurer la vitalité et la brillance des cheveux.\nIdéal pour les cheveux affaiblis ou en période de chute.                                                                      Action 3 en 1: Renforce, Nourrit, Lisse\n0% alcool, 0% paraben	105	LCP-6111275500127	6111275500127	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:15.538+00	f	contenance	same-price	f	chute-de-cheveux
197	AHA GEL PEELING 20%	aha-gel-peeling-20	29	Visage	\N	150	\N	\N	5	0	#F2F2F2	Propriétés\nHTCEUTIC AHA 20% gel est un gel peeling conçu spécialement pour peaux grasses à base de 20% d’acide glycolique.\nIndications\nÀ base de 20% d’acide glycolique.	119	HTC-6111267180146	6111267180146	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:18.992+00	f	contenance	same-price	f	peelings-doux
203	SOIN ANTI-TACHES ANTI-AGE	soin-anti-taches-anti-age	30	Visage	\N	650	\N	\N	5	0	#F2F2F2	Une formule ultra-active pour lutter contre les marques du temps sur le visage (taches brunes) et les taches de grossesses. Un soin complet anti-âge qui redonne éclat et fermeté à l’épiderme.\nPrincipaux ingrédients :\nIparzine 4-A\nComplexe éclaircissant\nWHITESPHERE TM PREMIUM\nHuile de son de riz\nGlycérine végétale\nSANS PARABEN	125	HEL-3401396960782	3401396960782	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:21.372+00	f	contenance	same-price	f	anti-taches
169	LCP gel nettoyant	lcp-gel-nettoyant	28	Corps	\N	66	\N	\N	5	0	#F2F2F2	Gel nettoyant LCP est un nettoyant visage et corps pour les peaux grasses à tendances\nacneïque. Il nettoie efficacement, purifie la peau, régule l’excès de sébum sans dessécher la peau, calme les irritations, et aide à rééquilibrer la flore cutanée.\nGel en triple action: Nettoie, Purifie et Assainit.                                                                                                                                                                                      0% Alcool, 0% Paraben, 0% sulfate	91	27429	6111275500011	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:12.764+00	f	contenance	same-price	f	nettoyants
170	LCP crème hydratante matifiante	lcp-creme-hydratante-matifiante	28	Corps	\N	66	\N	\N	5	0	#F2F2F2	Soin global LCP est un soin complet visage et corps pour les peaux grasses à tendances\nacneïque. Il corrige les imperfections, purifie la peau, régule l’excès de sébum sans dessécher la peau, et réduit les rougeurs liées à l’acné. Il agit à chaque étape de la fromation de l’imperfection avec une action kératolytique, séborégulatrice et apaisante.                                                                              Crème en triple action: Matifie, Régule, Purifie.                                                          0% Alcool, 0% Paraben, 0% sulfate	92	27431	6111275500028	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:12.963+00	f	contenance	same-price	f	purifiants
171	LCP soin global	lcp-soin-global	28	Corps	\N	66	\N	\N	5	0	#F2F2F2	Soin global LCP est un soin complet visage et corps pour les peaux grasses à tendances\nacneïque. Il corrige les imperfections, purifie la peau, régule l’excès de sébum sans dessécher la peau, et réduit les rougeurs liées à l’acné. Il agit à chaque étape de la fromation de l’imperfection avec une action kératolytique, séborégulatrice et apaisante.                                                                              Soin en triple action: Traite, Assainit, Purifie.                                                          0% Alcool, 0% Paraben, 0% sulfate	93	LCP-6111275500004	6111275500004	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:13.164+00	f	contenance	same-price	f	laits-corps
227	SOIN EXFOLIANT VISAGE 75 ML	soin-exfoliant-visage-75-ml	30	Visage	\N	370	\N	\N	5	0	#F2F2F2	Ce soin exfoliant doux au caviar et extrait de raisin rouge, naturellement riches en vitamines A,B, D et polyphénols, élimine efficacement les cellules mortes et les impuretés. Il laisse la peau douce, éclatante et plus réceptive aux produits de soin. Sa texture fondante et dorée délecte les sens.	148	HEL-SOIN-EXFOLIANT-VISAGE-75-CF20B3	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:26.489+00	f	contenance	same-price	f	peelings-doux
25	Micellar Solution Nettoyant visage hydratant	micellar-solution-nettoyant-visage-hydratant	25	Visage	\N	175	\N	\N	5	0	#F2F2F2	Nettoyant visage hydratant pour tous les types de peau.    \nQuatre actions en un seul geste: nettoie, démaquille, tonifie et hydrate.\nNettoie le visage en douceur sans endommager la barrière cutanée.\n\nEnlève le maquillage, y compris le maquillage résistant à l'eau et de longue durée.\n\nEn un seul geste, il laisse la peau du visage, des yeux et des lèvres hydratée et prête pour vos soins du visage quotidiens.                                                         Appliquer matin et soir, faire tremper un coton et frotter doucement la peau du visage et du cou. Ne pas rincer.	\N	ISD-8429420163577	8429420163577	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:23.514+00	f	contenance	same-price	f	\N
26	Essential Cleansing Huile Nettoyante visage	essential-cleansing-huile-nettoyante-visage	25	Visage	\N	320	\N	\N	5	0	#F2F2F2	Huile nettoyante visage à la texture légère et douce qui nettoie le visage en profondeur.\nEssential Cleansing est une huile nettoyante et démaquillante pour le visage douce et légère avec une texture oil-to-milk qui utilise la puissance de l'huile pour nettoyer la peau en profondeur. Au contact de l'eau, il se transforme en une émulsion agréable qui laisse la peau douce et hydratée.                                                    Nettoie et élimine efficacement l'excès de sébum, ainsi que le maquillage, même waterproof et la crème solaire.\n\nHydrate et respecte la barrière lipidique de la peau.\n\nFavorise un aspect lumineux et éclatant de la peau.                                                                   Appliquer 2 ou 3 pressions de notre huile démaquillante sur les mains sèches et répartir l'huile en mouvements circulaires sur l'ensemble du visage sec. \n\nPour démaquiller les paupières et les cils, utilisez le bout des doigts et frottez doucement, toujours les yeux fermés, de haut en bas. \n\nHumidifiez la peau avec de l'eau tiède et massez l'huile jusqu'à ce qu'elle se transforme en une émulsion légère. \n\nRincer le visage à l'eau tiède et sécher la peau avec une serviette propre.	\N	ISD-8429420223783	8429420223783	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:23.73+00	f	contenance	same-price	f	\N
27	Isdinceutics Salicylic Renewal\nSérum à double action : anti-imperfections et anti-rides	isdinceutics-salicylic-renewal-s-rum-double-action-anti-imperfections-et-anti-rides	25	Cheveux	\N	495	\N	\N	5	0	#F2F2F2	Réduisez les imperfections et les rides en deux semaines¹ grâce à Salicylic Renewal, le sérum pour peaux mixtes ou grasses contenant 12 % d'Acid Renewal Complex² et offrant une double action anti-imperfections et anti-âge. Il exfolie, minimise l'apparence des pores et matifie la peau, pour un visage visiblement rajeuni.                                                                                                Spécialement formulé pour les peaux mixtes ou grasses.\n\nImperfections et rides.\n\nAbsorption rapide, texture légère, non comédogène, contrôle du sébum.	\N	ISD-8429420243385	8429420243385	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:23.915+00	f	contenance	same-price	f	\N
28	Isdinceutics Melaclear\nSérum anti-taches à base d’acide tranexamique	isdinceutics-melaclear-s-rum-anti-taches-base-d-acide-tranexamique	25	Cheveux	\N	720	\N	\N	5	0	#F2F2F2	Profitez d’une peau uniforme et radieuse avec le sérum visage anti-taches Melaclear. Avec sa combinaison d’ingrédients dépigmentants, il réduit de 71% les taches, avec des résultats visibles dès 14 jours².	\N	ISD-8429420268180	8429420268180	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:24.095+00	f	contenance	same-price	f	\N
29	Isdinceutics Retinal Intense\nSérum de nuit à base de rétinaldéhyde	isdinceutics-retinal-intense-s-rum-de-nuit-base-de-r-tinald-hyde	25	Cheveux	\N	720	\N	\N	5	0	#F2F2F2	Sérum de nuit à base de rétinaldéhyde qui réduit les rides jusqu'à -43% après 4 semaines d’utilisation .\nRetrouvez une peau visiblement plus jeune avec Retinal Intense, le sérum biphasique de nuit à base de rétinaldéhyde qui aide à accélérer le renouvellement cutané. Après 1 mois d'utilisation, il réduit les rides et lignes d'expression jusqu'à -43% pour une peau plus lisse et uniforme et à l'aspect rajeuni.	\N	ISD-8429420237018	8429420237018	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:24.268+00	f	contenance	same-price	f	\N
60	Fotoprotector ISDIN Invisible Stick SPF 50\nCrème solaire invisible en stick	fotoprotector-isdin-invisible-stick-spf-50-cr-me-solaire-invisible-en-stick	25	Solaire	\N	240	\N	\N	5	0	#F2F2F2	Crème solaire invisible en stick pour les zones sensibles au soleil, à l’application facile et pratique.\nProtégez les zones les plus sensibles et les plus exposées de votre peau avec Invisible Stick SPF 50, la protection solaire invisible en stick à l’application facile et pratique. Il est résistant à l’eau et à la sueur, laisse un fini mat et ne laisse pas un fini collant sur la peau.	\N	ISD-8429420280885	8429420280885	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:31.005+00	f	contenance	same-price	f	\N
155	D-BIOTIC PULVOBIOTIC  PH 8	d-biotic-pulvobiotic-ph-8	27	Corps	\N	95	\N	\N	5	0	#F2F2F2	D-biotic Pulvobiotic pH 8 nettoie en douceur les zones à gênes intimes. Soulage les démangeaisons et les irritations intimes.	77	DBI-6111270660314	6111270660314	50	0	5	t	f	f	2026-09-16 12:14:24.491+00	2026-09-07 12:02:08.783+00	f	contenance	same-price	f	hygiene-intime
216	HELIABRINE SOLAR DEFENSE 50	heliabrine-solar-defense-50	30	Solaire	\N	370	\N	\N	5	0	#F2F2F2	Protège efficacement la peau des rayons UVA + UVB et du vieillissement cutané prématuré grâce à l’action combinée de filtres organiques à large spectre d’absorption et d’un extrait de fleur de Tournesol.\n\nTexture légère et invisible qui pénètre rapidement.\n\nFormule recommandée pour les peaux très claires ou dans des conditions d’ensoleillement intense (tropiques, montagne).	137	HEL-3323030280004	3323030280004	50	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:24.047+00	f	contenance	same-price	f	solaire
211	HELIABRINE BAUME 54	heliabrine-baume-54	30	Corps	\N	300	\N	\N	5	0	#F2F2F2	Ce baume réconfortant, nourrit intensément les peaux sèches à très sèches.\nIl contient un puissant cocktail de plantes pour affronter les conditions climatiques difficiles (froid, humidité).\nIl prévient les engelures et gerçures et renforce la barrière hydro-lipidique de la peau.	132	HEL-3323033401505	3323033401505	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:23.099+00	f	contenance	same-price	f	laits-corps
223	SERUM NUTRIVITAMINE AU CALENDULA	serum-nutrivitamine-au-calendula	30	Visage	\N	400	\N	\N	5	0	#F2F2F2	Sérum Nutrivitaminé au Calendula d’Heliabrine, un soin révolutionnaire conçu pour apaiser, réparer et protéger les peaux sensibles et réactives. Sa texture onctueuse et légère en fait un véritable plaisir à appliquer, offrant un confort immédiat dès la première utilisation. Ce sérum est idéal pour les peaux sujettes aux rougeurs et aux irritations, particulièrement en période de stress climatique intense.	144	HEL-SERUM-NUTRIVITAMINE-AU-C-3A1ABD	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:25.532+00	f	contenance	same-price	f	peaux-seches
30	Isdinceutics Flavo-C\nPuissant sérum antioxydant	isdinceutics-flavo-c-puissant-s-rum-antioxydant	25	Cheveux	\N	445	\N	\N	5	0	#F2F2F2	Puissant sérum antioxydant formulé pour que sa vitamine C reste sur votre peau jusqu'à 8 heures\nSérum visage anti-âge. Puissante combinaison d'antioxydants qui combattent le photovieillissement.                                                Puissante combinaison d'antioxydants qui luttent contre le photovieillissement grâce l'action de la vitamine C et de l'extrait des feuilles de Ginkgo biloba. \n\nIl favorise également la récupération de l'élasticité de votre peau, l'hydrate et lui donne un aspect visiblement rajeuni et lumineux. \n\nNeutralise les radicaux libres et régénère la vitamine E.                                 Appliquer le matin et/ou le soir. Appliquer 5 gouttes dans la paume de la main et masser délicatement le visage, le coup et le décolleté, en évitant le contour des yeux. \n\nUsage externe uniquement. Tenir hors de portée des enfants.	\N	ISD-8429420156616	8429420156616	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:24.464+00	f	contenance	same-price	f	\N
215	SOIN LISSANT ET REPULPANT LEVRES	soin-lissant-et-repulpant-levres	30	Corps	\N	273	\N	\N	5	0	#F2F2F2	Ultra concentré en agents nutritifs (karité, huiles de pépins de raisins et son de riz), lissants et repulpants (acide hyaluronique, collagène marin), ce soin comble les ridules et préserve l’hydratation et l’élasticité des lèvres et de leurs contours.\nDès la première application, les lèvres sont visiblement redessinées. Plus souples et plus douces, elles paraissent naturellement plus volumineuses et plus jeunes.\n\nTexture légère et fondante qui pénètre rapidement et facilite la tenue du maquillage pour retrouver le sourire à tout moment de la journée.	136	HEL-3323031099001	3323031099001	50	0	5	t	f	f	2026-09-07 12:04:36.438+00	2026-09-07 12:02:23.86+00	f	contenance	same-price	f	anti-age
141	D-BIOTIC Crème hydratante régénérante 75 ml	d-biotic-creme-hydratante-regenerante-75-ml	27	Visage	\N	180	\N	\N	5	0	#F2F2F2	D-biotic crème hydratante est formulé à base d’un \ncomplexe de sept (07) Céramides, d’actifs pré-pro et \npost biotiques et d’autres actifs ultra hydratants	63	22556	6111270660147	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:05.735+00	f	contenance	same-price	f	peaux-seches
31	Isdinceutics Hyaluronic Concentrate\nSérum léger ultra-hydratant	isdinceutics-hyaluronic-concentrate-s-rum-l-ger-ultra-hydratant	25	Cheveux	\N	415	\N	\N	5	0	#F2F2F2	Hyaluronic Concentrate est un sérum pour le visage à base d’acide hyaluronique pur à faible et moyen poids moléculaire et à la texture aqua-gel qui assure une hydratation profonde des couches superficielles. Il contribue à repulper la peau, à prévenir les premières rides et lignes d’expression, et à réduire la taille des pores pour une peau lumineuse et radieuse.              Fournit une hydratation intense et aide à maintenir la fonction barrière de la peau.\n\nApporte un effet repulpant, aide à redensifier la peau de l’intérieur en comblant les rides.\n\nFavorise une peau plus lisse et plus ferme en améliorant le teint et l’élasticité de la peau.\n\nRéduit la taille des pores, pour un teint plus uniforme et radieux.                                                                                                                            Appliquez Hyaluronic Concentrate matin et soir directement sur la peau propre et sèche du visage, du cou et du décolleté. Massez le gel avec des mouvements circulaires jusqu'à absorption complète.	\N	ISD-8429420202955	8429420202955	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:24.655+00	f	contenance	same-price	f	\N
42	Isdinceutics Instant Flash\nSérum visage effet lifting immédiat	isdinceutics-instant-flash-s-rum-visage-effet-lifting-imm-diat	25	Cheveux	\N	215	\N	\N	5	0	#F2F2F2	Solution pour le visage sous forme d’ampoules avec un ensemble de principes actifs avancés qui favorisent un effet lifting immédiat et prolongé jusqu’à 8 heures qui rajeunit l’apparence du visage.                                                                                               Sa composition à base de LiftFirm favorise un effet lifting immédiat et prolongé. \nIl aide à atténuer les rides et les lignes d’expression de façon instantanée. \nÉnergise la peau grâce au Pepdtide Q10 qui réduit les signes de fatigue et de stress, et rend la peau plus lisse.\n\nAction anti-âge grâce au LineBoost qui atténue les signes de vieillissement, et améliore visiblement l’apparence du visage.\n\nAppliquer Instant Flash sur peau propre et sèche avant toute occasion spéciale. \nAppliquer ½ ampoule sur le visage et le cou en effectuant un léger massage jusqu’à absorption complète du produit. \nAprès son application, utiliser directement le maquillage. \n\nUsage topique pour tous les types de peaux.	\N	ISD-8429420165472	8429420165472	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:27.058+00	f	contenance	same-price	f	\N
32	Isdinceutics Flavo-C Forte\nSérum anti-âge intense avec 15% de vitamine C pure et fraîche	isdinceutics-flavo-c-forte-s-rum-anti-ge-intense-avec-15-de-vitamine-c-pure-et-fra-che	25	Cheveux	\N	345	\N	\N	5	0	#F2F2F2	Flavo-C Forte est un puissant sérum pour le visage contenant 15 % de vitamine C pure et fraîche qui revitalise, illumine et aide à réduire les signes de fatigue cutanée. \n\nDe plus, il augmente la production de collagène, apporte de la fermeté et aide à réduire les rides en seulement 10 jours, protégeant ainsi la peau du stress oxydatif et de la pollution. \n\nSon format innovant avec de la poudre de vitamine C maintient la vitamine C fraîche et stable jusqu'au premier moment d'utilisation, lorsqu'elle est mélangée à une solution liquide avec des ingrédients anti-âge, antioxydants, hydratants et anti-pollution.                                                                                                                         Apporte une luminosité immédiate et son utilisation continue donne un teint plus homogène.\n\nAide à maintenir le collagène de la peau, à atténuer les rides en 10 jours, et à améliorer la fermeté de la peau.\n\nAide à protéger la peau contre les dommages oxydatifs causés par les radicaux libres et la pollution.\n\nApporte de l'hydratation, de l'élasticité et renforce la barrière cutanée.                                                                                                                   Posologie : 3 étapes : préparer, activer et appliquer !\n\n1. Remplacez le bouchon d'origine par celui contenant de la vitamine C.\n\n2. Pour activer le sérum, appuyez sur le capuchon et agitez vigoureusement pendant 30 secondes.\n\n3. Remplacez le capuchon par le compte-gouttes et appliquez 3 à 4 gouttes sur l'ensemble du visage, du cou et du décolleté.	\N	ISD-8429420220799	8429420220799	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:24.827+00	f	contenance	same-price	f	\N
33	Isdinceutics Flavo-C Forte 3 flacons\nSérum anti-âge intense avec 15% de vitamine C pure et fraîche	isdinceutics-flavo-c-forte-3-flacons-s-rum-anti-ge-intense-avec-15-de-vitamine-c-pure-et-fra-che	25	Cheveux	\N	680	\N	\N	5	0	#F2F2F2	Flavo-C Forte est un puissant sérum pour le visage contenant 15 % de vitamine C pure et fraîche qui revitalise, illumine et aide à réduire les signes de fatigue cutanée. \n\nDe plus, il augmente la production de collagène, apporte de la fermeté et aide à réduire les rides en seulement 10 jours, protégeant ainsi la peau du stress oxydatif et de la pollution. \n\nSon format innovant avec de la poudre de vitamine C maintient la vitamine C fraîche et stable jusqu'au premier moment d'utilisation, lorsqu'elle est mélangée à une solution liquide avec des ingrédients anti-âge, antioxydants, hydratants et anti-pollution.                                                                                                                         Apporte une luminosité immédiate et son utilisation continue donne un teint plus homogène.\n\nAide à maintenir le collagène de la peau, à atténuer les rides en 10 jours, et à améliorer la fermeté de la peau.\n\nAide à protéger la peau contre les dommages oxydatifs causés par les radicaux libres et la pollution.\n\nApporte de l'hydratation, de l'élasticité et renforce la barrière cutanée.                                                                                                                   Posologie : 3 étapes : préparer, activer et appliquer !\n\n1. Remplacez le bouchon d'origine par celui contenant de la vitamine C.\n\n2. Pour activer le sérum, appuyez sur le capuchon et agitez vigoureusement pendant 30 secondes.\n\n3. Remplacez le capuchon par le compte-gouttes et appliquez 3 à 4 gouttes sur l'ensemble du visage, du cou et du décolleté.	\N	ISD-8429420225114	8429420225114	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:25.059+00	f	contenance	same-price	f	\N
200	WHITE CREAM	white-cream	29	Visage	\N	250	\N	\N	5	0	#F2F2F2	HTCEUTIC White Cream agit grâce à une action\nenzymatique associée à une synergie d’actifs\ndépigmentants. Elle lisse le grain de peau et stimule\nen douceur le renouvellement cellulaire, révélant\nun teint visiblement plus uniforme et éclatant.	122	HTC-6111267180191	6111267180191	50	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:19.58+00	f	contenance	same-price	f	anti-taches
55	Fotoultra 100 Active Unify COLOR SPF 50+\nÉcran solaire à l'effet dépigmentant	fotoultra-100-active-unify-color-spf-50-cran-solaire-l-effet-d-pigmentant	25	Solaire	\N	330	\N	\N	5	0	#F2F2F2	Écran solaire à l'effet dépigmentant qui éclaircit et unifie le teint. Dissimule les imperfections et donne un effet bonne mine aux peaux claires à medium.\nCrème solaire visage haute protection SPF50+ qui éclaircit et unifie le teint de votre peau. Aide à réduire les troubles pigmentaires et taches causés par le soleil. Unifie le teint et dissimule les imperfections des peaux claires à medium. \n\nAide à réguler la production de mélanine grâce au DP3-Unify Complex qui agit sur les principales phases de la mélanogenèse. Unifie le teint grâce à sa formule teintée. Offre une protection contre les rayons UVA qui stimulent la pigmentation, 2 fois supérieure au minimum requis dans un protecteur solaire SPF 50+. Sa texture Fusion Fluid fond sur votre peau.	\N	ISD-8429420160644	8429420160644	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:29.845+00	f	contenance	same-price	f	\N
63	Fotoprotector ISDIN Hydro Oil SPF 30\nLotion-huile solaire pour le corps biphasique	fotoprotector-isdin-hydro-oil-spf-30-lotion-huile-solaire-pour-le-corps-biphasique	25	Solaire	\N	285	\N	\N	5	0	#F2F2F2	Protection solaire à l'effet bronzant et rafraîchissant qui hydrate la peau. \nProtégez et faites bronzer vore peau avec HydroOil SOF30, le solaire corps biphasique à la haute protection UVB/UVA.\n\nLotion à base d’huile et d’eau biphase à double action: \n\nPROTÈGE. Haute protection UVB et UVA SPF 30. \n\nBRONZE. Sa formule à base de Natural Tan Booster stimule le bronzage jusqu'à +63%. \n\nIl apporte une action hydratante et un effet rafraichissant, et sèche immédiatement sans laisser de résidu gras. \nIl donne un aspect plus flexible et élastique à la peau. \nRésistant à l’eau. \nConvient à tous les types de peaux. \nTesté dermatologiquement.	\N	ISD-8429420184176	8429420184176	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:31.702+00	f	contenance	same-price	f	\N
34	Isdinceutics Glicoisdin 8 Soft\nCrème effet peeling pour le visage	isdinceutics-glicoisdin-8-soft-cr-me-effet-peeling-pour-le-visage	25	Visage	\N	290	\N	\N	5	0	#F2F2F2	La crème Glicoisdin, à effet peeling et aux propriétés exfoliantes, est formulée à base de 8% d'acide glycolique. \nCe gommage visage aide à réduire les rides, les fines lignes d’expression et les taches. \nIl améliore l’élasticité et l’éclat de la peau et contribue à stimuler la formation de collagène. \nIl unifie le teint et favorise le processus de renouvellement de la peau. \nEn plus de l'acide glycolique qui la retexturise, l'Aloe Vera présent dans sa formulation hydrate la peau.\n\nAppliquer sur peau propre par le biais d’un léger massage jusqu’à absorption complète. \nCommencer toujours par de faibles concentrations d’acide glycolique et augmenter en fonction de la tolérance. \nAppliquer de préférence le soir. \n\nSon utilisation quotidienne nécessite l’utilisation simultanée d’un photoprotecteur pour le visage.	\N	ISD-8429420175341	8429420175341	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:25.233+00	f	contenance	same-price	f	\N
35	Isdinceutics Glicoisdin 25 Intense\nGel effet peeling pour le visage	isdinceutics-glicoisdin-25-intense-gel-effet-peeling-pour-le-visage	25	Cheveux	\N	385	\N	\N	5	0	#F2F2F2	Le gel crème Glicoisdin, à effet peeling et aux propriétés exfoliantes, est formulé à bese de 25% d'acide glycolique. \nCe gommage visage aide à réduire les rides, les fines lignes d’expression et les taches. \nIl améliore l’élasticité et l’éclat de la peau et contribue à stimuler la formation de collagène. \nIl unifie le teint et favorise le processus de renouvellement de la peau. \nEn plus de l'acide glycolique qui la retexturise, l'Aloe Vera présent dans sa formulation hydrate la peau. \n\nAppliquer sur peau propre par le biais d’un léger massage jusqu’à absorption complète. \nCommencer toujours par de faibles concentrations d’acide glycolique et augmenter en fonction de la tolérance. \nAppliquer de préférence le soir. \n\nSon utilisation quotidienne nécessite l’utilisation simultanée d’un photoprotecteur pour le visage.	\N	ISD-8429420175327	8429420175327	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:25.464+00	f	contenance	same-price	f	\N
36	Isdinceutics Glicoisdin 15 Moderate\nGel effet peeling pour le visage	isdinceutics-glicoisdin-15-moderate-gel-effet-peeling-pour-le-visage	25	Cheveux	\N	345	\N	\N	5	0	#F2F2F2	Le gel crème Glicoisdin, à effet peeling et aux propriétés exfoliantes, est formulé à bese de 15% d'acide glycolique. \nCe gommage visage aide à réduire les rides, les fines lignes d’expression et les taches. \nIl améliore l’élasticité et l’éclat de la peau et contribue à stimuler la formation de collagène. \nIl unifie le teint et favorise le processus de renouvellement de la peau. \nEn plus de l'acide glycolique qui la retexturise, l'Aloe Vera présent dans sa formulation hydrate la peau. \n\nAppliquer sur peau propre par le biais d’un léger massage jusqu’à absorption complète. \nCommencer toujours par de faibles concentrations d’acide glycolique et augmenter en fonction de la tolérance. \nAppliquer de préférence le soir. \nSon utilisation quotidienne nécessite l’utilisation simultanée d’un photoprotecteur pour le visage.	\N	ISD-8429420175310	8429420175310	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:25.636+00	f	contenance	same-price	f	\N
37	Isdinceutics A.G.E. Reverse Day\nCrème de jour remodelante à la triple action anti-âge	isdinceutics-a-g-e-reverse-day-cr-me-de-jour-remodelante-la-triple-action-anti-ge	25	Visage	\N	740	\N	\N	5	0	#F2F2F2	Crème de jour visage anti-pollution, remodelante et anti-glycation. \nA.G.E Reverse Day protège la peau contre les radicaux libres produits par la pollution grâce au Complexe Exo-p. \nCette crème de jour hydratante remodèle l'ovale du visage. Grâce à sa composition à base d'acide hyaluronique, elle procure une hydratation profonde et durable. Le Syn-hycan stimule la production de collagène.\nElle apporte également un puissant effet anti-âge et anti-rides car elle retarde la formation des dégâts de la glycation avancée (A.G.E) grâce à l'action de la carnosine. \nConvient à tous les types de peaux. Sans huile. Non comédogène. Testée sous contrôle dermatologique. \n\nAppliquer chaque matin sur peau propre et sèche, sur le visage et le cou, en effectuant des mouvements ascendants jusqu'à absorption complète. \n\nUsage externe. Tenir hors de portée des enfants. Éviter tout contact avec les yeux et les muqueuses. Ne pas utiliser sur une peau irritée.	\N	ISD-8470001812353	8470001812353	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:25.883+00	f	contenance	same-price	f	\N
38	Isdinceutics A.G.E. Reverse Night\nCrème de nuit anti-âge à base de mélatonine.	isdinceutics-a-g-e-reverse-night-cr-me-de-nuit-anti-ge-base-de-m-latonine	25	Visage	\N	740	\N	\N	5	0	#F2F2F2	Crème de nuit hydratante et réparatrice, formulée à la mélatonine qui lutte contre les dommages oxydants accumulés pendant la journée et stimule les défenses antioxydantes naturelles de la peau pendant votre sommeil. \nAvec son concentré d'actifs anti-âge, A.G.E Reverse Night vous permettra non seulement de réparer votre peau pendant la nuit, mais également de remodeler l'ovale de votre visage. \nDécouvrez son pouvoir anti-rides et constatez l'atténuation de vos rides et lignes d'expression.\nLa Carnosine retarde le phénomène de glycation avancée et l'Helichrysum Italicum stimule la libération de molécules calmantes pour une sensation agréable de bien-être.\n\nAppliquer tous les soirs sur une peau propre et sèche, sur le visage et le cou, en effectuant des mouvements ascendants jusqu'à absorption complète. \n\nUsage externe.Tenir hors de portée des enfants. Éviter tout contact avec les yeux et les muqueuses. Ne pas utiliser sur une peau irritée.	\N	ISD-8429420180635	8429420180635	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:26.121+00	f	contenance	same-price	f	\N
39	Isdinceutics Hyaluronic Moisture Peaux Grasses à Mixtes	isdinceutics-hyaluronic-moisture-peaux-grasses-mixtes	25	Visage	\N	300	\N	\N	5	0	#F2F2F2	Crème visage hydratante et matifiante à base d'acide hyaluronique pour les peaux grasses et mixtes\nHydratez votre visage avec Hyaluronic Moisture Peaux Grasses et Mixtes, la crème à base d'acide hyaluronique pur1 et à la texture légère, idéale pour les peaux grasses ou mixtes. Aide à réduire l'excès de sébum,minimise l'apparence des pores et réduit la brillance de la peau. \n\n¹Obtenu par un processus biotechnologique et sans autre ingrédient associé d'origine animale (pure).	\N	ISD-8429420223707	8429420223707	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:26.343+00	f	contenance	same-price	f	\N
40	Isdinceutics Hyaluronic Moisture Peaux Sensibles	isdinceutics-hyaluronic-moisture-peaux-sensibles	25	Visage	\N	300	\N	\N	5	0	#F2F2F2	Crème visage légère à base d’acide hyaluronique pour les peaux sensibles et sujettes aux rougeurs.\nHydratez intensément votre peau avec Hyaluronic Moisture, notre crème hydratante à la texture légère et qui pénètre rapidement la peau, idéale pour les peaux sensibles. Grâce à sa formule riche en acide hyaluronique et en Redness Relief Complex, elle aide à prévenir et à réduire les signes de l’âge et l’apparition de rougeurs, restaurant l’aspect naturel de votre peau.	\N	ISD-8429420223585	8429420223585	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:26.568+00	f	contenance	same-price	f	\N
224	MASQUE REEQUILIBRANT AU MELILOT BIO	masque-reequilibrant-au-melilot-bio	30	Visage	\N	320	\N	\N	5	0	#F2F2F2	Ultra réconfortant, ce masque crème aide à rétablir l’équilibre nécessaire au confort et à l’éclat des peaux fragiles grâce à un cocktail d’ingrédients apaisants, hydratants et réparateurs. La peau paraît revitalisées, plus souple, douce et lumineuse.	145	HEL-MASQUE-REEQUILIBRANT-AU--1D1EBE	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:25.724+00	f	contenance	same-price	f	purifiants
41	Isdinceutics Hyaluronic Moisture Peaux Normales à Sèches	isdinceutics-hyaluronic-moisture-peaux-normales-s-ches	25	Visage	\N	300	\N	\N	5	0	#F2F2F2	Crème visage hydratante légère à base d’acide hyaluronique pour les peaux normales à sèches.\nHydratez intensément votre peau avec Hyaluronic Moisture, notre crème hydratante à la texture légère et qui pénètre rapidement la peau, idéale pour les peaux normales à sèches. Grâce à sa formule riche en acide hyaluronique et en antioxydants, elle aide à prévenir et à réduire les signes de l’âge, pour une peau douce et radieuse.	\N	ISD-8429420223554	8429420223554	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:26.811+00	f	contenance	same-price	f	\N
43	Isdinceutics Auriderm\nCrème de soin à base de vitamine K Oxyde	isdinceutics-auriderm-cr-me-de-soin-base-de-vitamine-k-oxyde	25	Compléments alimentaires	\N	220	\N	\N	5	0	#F2F2F2	Crème d’action localisée avec une formule brevetée à base de Vitamine K Oxyde qui aide à diminuer les bleus et rougeurs après traitements esthétiques comme des injections de comblement (acide hyaluronique), mésothérapie, interventions au lasers ou interventions chirurgicales.           Évite les dépôts pigmentaires post-inflammatoires et post-chirurgicaux grâce à l’action combinée des Vitamines C et E et de la Vitamine K Oxyde qui accélère la disparition des dépôts pigmentaires et des taches d’origine vasculaire.                              Appliquer matin et soir sur la zone concernée. Masser jusqu’à l'absorption complète du produit. Appliquer Auriderm 10-15 jours avant et après l'intervention ou le traitement esthétique.	\N	ISD-8429420155299	8429420155299	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:27.289+00	f	contenance	same-price	f	\N
44	Fotoprotector Fusion Water MAGIC GLOW SPF 50\nProtection solaire visage	fotoprotector-fusion-water-magic-glow-spf-50-protection-solaire-visage	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	Protection solaire visage à usage quotidien et à la texture ultra-légère effet glow immédiat\nDonnez à votre peau un effet glow instantané avec Fusion Water MAGIC Glow SPF 50, la protection solaire visage protection Full Spectrum qui protège face aux rayons UVB/UVA, à la lumière bleue, aux IR-A et à la pollution. Sa texture ultra-fluide facilite l’application et est absorbée de façon immédiate, apportant hydratation et luminosité à la peau.                                                                                                                                      Absorption immédiate, ne laisse pas de résidus gras, non comédogène, mineral Oil Free, Oil Control, testé dermatologiquement, non teinté : il s’adapte à tous les phototypes ; hypoallergénique : formulé pour minimiser le risque d’allergies	\N	ISD-8429420307247	8429420307247	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:27.514+00	f	contenance	same-price	f	\N
45	Fotoprotector Fusion Water MAGIC SPF 50\nCrème solaire visage	fotoprotector-fusion-water-magic-spf-50-cr-me-solaire-visage	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	Protégez votre peau avec Fusion Water MAGIC SPF50. Il se fond dans la peau et offre une haute protection face aux rayons du soleil. Il hydrate et apporte un effet antioxydant à la peau.                                                                                                                       Crème solaire visage à la texture ultra légère et au fini soyeux.       Absorption immédiate. Ne laisse pas de résidu gras sur la peau. N’irrite pas les yeux. Non comédogène, minéral, oil-free.	\N	ISD-8429420107526	8429420107526	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:27.738+00	f	contenance	same-price	f	\N
46	Fotoprotector Fusion Water MAGIC Urban SPF 30\nCrème solaire visage	fotoprotector-fusion-water-magic-urban-spf-30-cr-me-solaire-visage	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	Crème solaire visage à la texture ultra-légère, idéale pour un usage quotidien en milieu urbain. \nProtection parfaite pour combattre le photovieillissement et les effets de la pollution sur la peau. \nRéduit les signes de fatigue, et améliore l’éclat du teint et l’aspect de la peau. \nContient de l’extrait de gingembre, riche en shogaol et en gingérol qui réduisent le stress oxydatif induit par la lumière bleue. \nNon comédogène. Mineral Oil free. Hypoallergénique, formulé pour minimiser le risque d'allergie.	\N	ISD-8429420200647	8429420200647	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:27.78+00	f	contenance	same-price	f	\N
225	GINKGOMASK MASQUE ECLAT	ginkgomask-masque-eclat	30	Visage	\N	280	\N	\N	5	0	#F2F2F2	HELIABRINE Ginkgomask Masque Éclat: Formule exceptionnelle en ingrédients hydratant et raffermissant des peaux sèches. Le teint parait éclatant, la peau semble plus lisse, douce et revitalisée.	146	HEL-GINKGOMASK-MASQUE-ECLAT-9D3CBA	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:25.915+00	f	contenance	same-price	f	anti-taches
78	Acniben® On the Go\nDes lingettes pour le visage qui minimisent les imperfections de la peau	acniben-on-the-go-des-lingettes-pour-le-visage-qui-minimisent-les-imperfections-de-la-peau	25	Visage	\N	145	\N	\N	5	0	#F2F2F2	Minimisez les imperfections du visage où que vous soyez grâce aux lingettes Acniben® On the Go. Leur triple action permet de désobstruer les pores, d'extraire l'excès de sébum et de nettoyer en profondeur, contribuant ainsi à éliminer les boutons, les points noirs et les imperfections.	\N	ISD-8470001509833	8470001509833	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:35.285+00	f	contenance	same-price	f	\N
80	Acniben® Corps\nSpray pour le corps	acniben-corps-spray-pour-le-corps	25	Corps	\N	230	\N	\N	5	0	#F2F2F2	Spray pour le corps pour aider à réduire les boutons et les imperfections\nCombattez les boutons et les imperfections avec le spray corporel à séchage rapide Acniben® Corps. Sa formule à base d'acide salicylique et d'acide glycolique exfolie et renouvelle la surface de la peau pour une peau plus lisse et plus confortable.	\N	ISD-8470001806475	8470001806475	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:35.75+00	f	contenance	same-price	f	\N
82	Protector Labial Baume à lèvres SPF 30\nBaume à lèvres à usage quotidien	protector-labial-baume-l-vres-spf-30-baume-l-vres-usage-quotidien	25	Solaire	\N	85	\N	\N	5	0	#F2F2F2	Offre une protection élevée contre les UVB/UVA avec un SPF30.\n\nContient de la vitamine E et de l’acétate de tocophéryle ayant un effet antioxydant et une action régénératrice des lèvres.\n\nSa formule hydrate, nourrit et aide à réparer les lèvres sèches, procurant une sensation de confort.\n\nTesté dermatologiquement.	\N	ISD-8429420135444	8429420135444	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:36.205+00	f	contenance	same-price	f	\N
87	ISDIN WOMAN Hygiène intime\nGel intime qui aide à neutraliser les odeurs et à soulager les démangeaisons.	isdin-woman-hygi-ne-intime-gel-intime-qui-aide-neutraliser-les-odeurs-et-soulager-les-d-mangeaisons	25	Hygiène	\N	145	\N	\N	5	0	#F2F2F2	Soignez et protégez votre zone intime tous les jours avec ISDIN Woman Hygiène Intime, le gel sans savon qui hydrate, rafraîchit, désodorise et aide à soulager les démangeaisons. Sa formule à base d'acide lactique et de Bioecolia® aide à renforcer la flore bénéfique.	\N	ISD-847000156745	847000156745	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:37.401+00	f	contenance	same-price	f	\N
96	Ureadin Ultra 30 Crème émolliente\nRéduit les zones épaissies, rétablissant la douceur de la peau.	ureadin-ultra-30-cr-me-molliente-r-duit-les-zones-paissies-r-tablissant-la-douceur-de-la-peau	25	Corps	\N	210	\N	\N	5	0	#F2F2F2	Hydratation réparatrice spécifiquement indiquée pour la peau épaissie et les durillons.\n\nExfolie et réduit les épaississements. Hydrate intensément restaurant la barrière cutanée grâce à l’Urée ISDIN.\n\nTexture non grasse à absorption rapide.	\N	ISD-8429420104570	8429420104570	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:38.935+00	f	contenance	same-price	f	\N
47	Fotoprotector Fusion Water MAGIC Light SPF 50\nCrème solaire visage teintée ultra-légère	fotoprotector-fusion-water-magic-light-spf-50-cr-me-solaire-visage-teint-e-ultra-l-g-re	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	Crème solaire visage teintée ultra-légère, idéale pour protéger les peaux claires des rayons UV au quotidien et unifier le teint. \n\nHydratation intense et absorption immédiate qui garantit une haute protection contre les rayons UV. \n\nCouvrance naturelle qui unifie le teint et donne un effet bonne mine aux peaux claires.\n\nExiste également en teinte Medium et Bronze.\n\nNon comédogène. Mineral Oil free. Hypoallergénique, formulé pour minimiser le risque d'allergie.	\N	ISD-8429420231504	8429420231504	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:28.006+00	f	contenance	same-price	f	\N
48	Fotoprotector Fusion Water Color Medium SPF 50\nCrème solaire visage teintée ultra-légère	fotoprotector-fusion-water-color-medium-spf-50-cr-me-solaire-visage-teint-e-ultra-l-g-re	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	Crème solaire visage teintée ultra-légère, idéale pour protéger les peaux claires à medium des rayons UV au quotidien et unifier le teint.\nCrème solaire visage teintée à la texture ultra légère. \n\nHydratation intense et absorption immédiate qui garantit une haute protection contre les rayons UV. \n\nCouvrance naturelle qui unifie le teint et donne un effet bonne mine aux peaux claires à medium.\n\nExiste également en teinte Light et Bronze.\n\nNon comédogène. Mineral Oil free. Hypoallergénique, formulé pour minimiser le risque d'allergie.	\N	ISD-8429420160576	8429420160576	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:28.247+00	f	contenance	same-price	f	\N
49	Fotoprotector Fusion Water Color Bronze SPF 50\nCrème solaire visage teintée ultra-légère	fotoprotector-fusion-water-color-bronze-spf-50-cr-me-solaire-visage-teint-e-ultra-l-g-re	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	Crème solaire visage teintée ultra-légère, idéale pour protéger les peaux claires à medium des rayons UV au quotidien et unifier le teint.\nCrème solaire visage teintée à la texture ultra légère. \n\nHydratation intense et absorption immédiate qui garantit une haute protection contre les rayons UV. \n\nCouvrance naturelle qui unifie le teint et donne un effet bonne mine aux peaux claires à medium.\n\nExiste également en teinte Light et Medium.\n\nNon comédogène. Mineral Oil free. Hypoallergénique, formulé pour minimiser le risque d'allergie.	\N	ISD-8429420250208	8429420250208	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:28.483+00	f	contenance	same-price	f	\N
50	Fusion Water MAGIC Repair SPF 50\nCrème solaire visage anti-âge ultra-légère	fusion-water-magic-repair-spf-50-cr-me-solaire-visage-anti-ge-ultra-l-g-re	25	Solaire	\N	330	\N	\N	5	0	#F2F2F2	Crème solaire visage anti-âge, parfaite pour les peaux matures ou pour prévenir les premiers signes de l'âge. Elle offre une triple action anti-photovieillissement :\n\n1. PROTEGE \n\nHaute protection UV SPF50 qui aide à prévenir les dommages causés par le soleil.\n\nSa formule innovante anti-pollution protège la peau des dommages causés par la pollution urbaine.\n\n2. RÉPARE\n\nContribue à la réparation des dommages solaires accumulés au niveau cellulaire.\n\n3. RÉGÉNÈRE\n\nRéduit les rides et améliore l’éclat, l’hydratation et l’élasticité de la peau.	\N	ISD-8429420281561	8429420281561	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:28.702+00	f	contenance	same-price	f	\N
51	Fusion Water MAGIC Repair Color SPF 50\nCrème solaire visage teintée anti-âge ultra-légère	fusion-water-magic-repair-color-spf-50-cr-me-solaire-visage-teint-e-anti-ge-ultra-l-g-re	25	Solaire	\N	330	\N	\N	5	0	#F2F2F2	La crème solaire anti-âge teintée Age Repair Color offre une haute protection UV (SPF50) qui aide à prévenir les dommages causés par le soleil comme les rides et les taches.\n\nCet écran solaire protège contre la pollution urbaine et contribue à la réparation des dommages solaires accumulés au niveau cellulaire. \n\nBénéficiez de son effet anti-âge. Age Repair Color inverse les signes visibles du vieillissement, en favorisant la production de collagène, la réduction des rides et l'amélioration de l'éclat de la peau.\n\nSa formule teintée est idéale pour dissimuler les imperfections et unifiera le teint des peaux claires à medium.	\N	ISD-8429420206014	8429420206014	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:28.927+00	f	contenance	same-price	f	\N
81	Cicapost\nCrème pour améliorer l'apparence des cicatrices	cicapost-cr-me-pour-am-liorer-l-apparence-des-cicatrices	25	Visage	\N	150	\N	\N	5	0	#F2F2F2	La crème Cicapost ISDIN® prend soin des cicatrices cutanées. Elle contient des ingrédients à action hydratante, apporte de l'élasticité et aide à réparer la peau, en unifiant le teint et en améliorant visiblement l'apparence des cicatrices.\n\nTesté cliniquement, résultats visibles dès le premier mois, non comédogène.	\N	ISD-8470002043961	8470002043961	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:35.979+00	f	contenance	same-price	f	\N
83	Protector Labial Baume à lèvres HV SPF 30\nBaume à lèvres avec une protection élevée pour les lèvres hypersensibles	protector-labial-baume-l-vres-hv-spf-30-baume-l-vres-avec-une-protection-lev-e-pour-les-l-vres-hypersensibles	25	Solaire	\N	85	\N	\N	5	0	#F2F2F2	Baume à lèvres avec une protection élevée (SPF 30). Traitement des lèvres hypersensibles.\n\nGrâce à sa teneur en acides gras, il nourrit en profondeur sans être gras. Protège et hydrate les lèvres grâce à sa teneur en vitamine E.\n\nAide votre peau à se régénérer grâce à l’églantier (Rosa Mosqueta).\n\nSpécialement formulé pour les lèvres hypersensibles.	\N	ISD-8470003855181	8470003855181	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:36.449+00	f	contenance	same-price	f	\N
85	ISDIN WOMAN Hydratant intime vulvaire	isdin-woman-hydratant-intime-vulvaire	25	Hygiène	\N	145	\N	\N	5	0	#F2F2F2	Crème qui aide à soulager immédiatement les signes de la sécheresse vulvaire.\nAidez à soulager la sécheresse de la zone vulvaire avec la crème hydratante intime ISDIN Woman Hydratant Vulvaire. Composée à 92 % d'ingrédients naturels, elle hydrate et aide à soulager immédiatement les démangeaisons, les irritations et l'inconfort.	\N	ISD-8470001527950	8470001527950	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:36.926+00	f	contenance	same-price	f	\N
89	Nutradeica® Shampooing Cheveux secs\nNettoyage et soin des cheveux et du cuir chevelu avec pellicules sèches.	nutradeica-shampooing-cheveux-secs-nettoyage-et-soin-des-cheveux-et-du-cuir-chevelu-avec-pellicules-s-ches	25	Cheveux	\N	210	\N	\N	5	0	#F2F2F2	Nettoyez et soignez vos cheveux et votre cuir chevelu avec le shampoing antipelliculaire Nutradeica® pour cheveux secs. Sa formule à base de piroctone olamine réduit les pellicules et aide à soulager les démangeaisons dès les premières applications, favorisant des cheveux doux et brillants.	\N	ISD-8429420174863	8429420174863	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:37.652+00	f	contenance	same-price	f	\N
97	Ureadin Ultra 40 Gel Huile exfoliant\nExfoliation intense des callosités et réduction en douceur des ongles épaissis.	ureadin-ultra-40-gel-huile-exfoliant-exfoliation-intense-des-callosit-s-et-r-duction-en-douceur-des-ongles-paissis	25	Corps	\N	210	\N	\N	5	0	#F2F2F2	Réduit les épaississements localisés de la peau et des ongles grâce à l’Urée ISDIN.\n\nFacilite l’absorption de traitements antimycosiques en assouplissant les couches superficielles de la peau et des ongles.\n\nTexture Gel Huile qui offre une cosméticité optimale, favorise la stabilité et la pénétration de l’Urée ISDIN à 40%.	\N	ISD-8429420104679	8429420104679	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:39.163+00	f	contenance	same-price	f	\N
52	Fotoprotector Fusion Fluid MINERAL SPF 50\nÉcran solaire fluide avec filtres physiques	fotoprotector-fusion-fluid-mineral-spf-50-cran-solaire-fluide-avec-filtres-physiques	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	Écran solaire fluide avec filtres physiques. Spécialement formulé pour les peaux sensibles, réactives ou intolérantes aux filtres chimiques. Recommandé pour le visage et les zones spécifiques des adultes à la peau fragile. Texture Fusion Fluid. Très résistant à l'eau et aux frottements. Hydratation intense. Haute protection solaire pour les peaux sensibles, atopiques ou intolérantes aux filtres chimiques. Sans parfum.	\N	ISD-8470001674258	8470001674258	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:29.159+00	f	contenance	same-price	f	\N
53	Fotoultra 100 Spot Prevent SPF 50+ 50ml\nCrème solaire très haute protection	fotoultra-100-spot-prevent-spf-50-50ml-cr-me-solaire-tr-s-haute-protection	25	Solaire	\N	330	\N	\N	5	0	#F2F2F2	Crème solaire très haute protection qui aide à prévenir les taches dues au soleil.\nPrenez soin de votre visage avec la protection solaire Spot Prevent SPF50+. Avec sa texture fluide et sa très haute protection UVB/UVA, elle aide à prévenir la formation de taches solaires et à améliorer l'élasticité de la peau. \nÀ qui s’adresse FotoUltra 100 Spot Prevent ? À toutes les personnes qui veulent prévenir les taches solaires qui apparaissent principalement sur le front, les joues et la région de la lèvre supérieure. Aux femmes enceintes. Aux personnes sujettes aux taches solaires.\n\nSpot Prevent peut être utilisé en conjonction avec les recommandations établies pour les personnes utilisant des produits photosensibilisants. Avant et après des interventions dermatologiques ou esthétiques.\n\nElle améliore l’élasticité de la peau et atténue les rides grâce à sa composition à base d’acide hyaluronique. \nSa texture Fusion Fluid est agréable à appliquer et est absorbée immédiatement. \nConvient aux peaux atopiques et sensibles.	\N	ISD-8429420122635	8429420122635	100	0	5	f	f	f	2026-09-07 12:07:22.592+00	2026-09-07 11:57:29.389+00	f	contenance	same-price	f	\N
202	LAIT CORPS	lait-corps	30	Corps	\N	360	\N	\N	5	0	#F2F2F2	Ce lait à la texture fine et délicate fond sur la peau et apporte hydratation et confort tout au long de la journée. La peau redevient uniforme et lumineuse grâce au complexe éclaircissant WHITESPHERETM PREMIUM qui corrige les irrégularités pigmentaires et prévient leur apparition. Les taches sont visiblement estompées dès le premier mois.\nPrincipaux ingrédients :\n– Complexe éclaircissant\nWHITESPHERE TM PREMIUM\nExtrait de soie pure\nHuile de son de riz\nGlycérine végétale\nSANS PARABEN	124	1676	3401351054884	50	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:21.183+00	f	contenance	same-price	f	laits-corps
86	ISDIN WOMAN Raffermissant\nCrème corporelle raffermissante qui remodèle et tonifie la peau	isdin-woman-raffermissant-cr-me-corporelle-raffermissante-qui-remod-le-et-tonifie-la-peau	25	Hygiène	\N	255	\N	\N	5	0	#F2F2F2	Améliorez la fermeté et l'aspect de votre peau avec ISDIN Woman Raffermissante, la crème pour le corps à absorption rapide. Composée à 91% d'ingrédients d'origine naturelle, elle hydrate intensément et aide à estomper l'apparence des vergetures récentes.	\N	ISD-8429420220461	8429420220461	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:37.147+00	f	contenance	same-price	f	\N
91	Daylisdin® Shampooing Ultra doux \nNettoyage et soin quotidiens doux qui respectent les cheveux et le cuir chevelu.	daylisdin-shampooing-ultra-doux-nettoyage-et-soin-quotidiens-doux-qui-respectent-les-cheveux-et-le-cuir-chevelu	25	Cheveux	\N	180	\N	\N	5	0	#F2F2F2	Nettoyez vos cheveux en profondeur avec le shampooing Daylisdin®. Il respecte le cuir chevelu et les cheveux, les rendant visiblement plus sains, hydratés, doux et brillants.	\N	ISD-8429420174894	8429420174894	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:37.904+00	f	contenance	same-price	f	\N
94	Ureadin Ultra 10 Lotion Plus\nHydratation maximale	ureadin-ultra-10-lotion-plus-hydratation-maximale	25	Corps	\N	205	\N	\N	5	0	#F2F2F2	Lotion corporelle hydratante intense pour le soin quotidien et la protection de la peau très sèche qui desquame, aide à soulager les démangeaisons et rend la douceur naturelle à votre peau. \n\nHydratation immédiate qui aide à réduire la démangeaison associée à la sécheresse.\n\nFavorise la restauration de la barrière cutanée grâce à la combinaison de l’Urée ISDIN et du dexpanthénol. Adjuvant au traitement des altérations de la fonction barrière comme la xérose et la peau sénile. \n\nTexture légère et non grasse à absorption rapide.	\N	ISD-8429420104518	8429420104518	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:38.446+00	f	contenance	same-price	f	\N
98	Ureadin Manos Protect Crème mains\nCrème pour les mains. Protège, hydrate et apaise la peau.	ureadin-manos-protect-cr-me-mains-cr-me-pour-les-mains-prot-ge-hydrate-et-apaise-la-peau	25	Visage	\N	95	\N	\N	5	0	#F2F2F2	Crème pour les mains à l'urée. Hydrate en profondeur et protège la peau.\nAppliquer une petite quantité sur la peau et masser jusqu'à absorption. Testé par des dermatologues.	\N	ISD-8470002098749	8470002098749	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:39.395+00	f	contenance	same-price	f	\N
100	Nutratopic Pro-AMP Crème visage Peaux Atopiques\nRenforce la première ligne de défense de la peau	nutratopic-pro-amp-cr-me-visage-peaux-atopiques-renforce-la-premi-re-ligne-de-d-fense-de-la-peau	25	Visage	\N	205	\N	\N	5	0	#F2F2F2	Prévention, soin et réduction des principaux symptômes visibles de la dermatite atopique infantile du visage : démangeaisons, sécheresse, desquamation, érythème et œdème cutané.\n\nAide à contrôler les signes de la dermatite atopique grâce à une double protection active unique du système de défense de la peau :\n- Augmente la production de peptides antimicrobiens (AMP), qui constituent la première ligne de défense de la peau, grâce à l'action de la L-isoleucine.\n- Restaure la barrière cutanée.\n\nRapidement absorbé. Sa structure lamellaire se fond avec la peau.	\N	ISD-8429420165595	8429420165595	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:39.848+00	f	contenance	same-price	f	\N
118	SEPTIPLUS PH 5.5	septiplus-ph-5-5	26	Corps	\N	95	\N	\N	5	0	#F2F2F2	PROPRIÉTÉS : DCP Septiplus pH5,5 est un soin lavant doux d’usage quotidien des peaux délicates destiné pour toute la famille. Conçu sans savon, sans alcool, DCP Septiplus pH 5,5 respecte le film hydroli- pidique, calme les zones irritées, apaise les démangeaisons et les rougeurs. Spécialement formulé pour préserver et protéger l’équilibre naturel de la peau, Septiplus pH 5,5 à pH physiologique est un soin lavant doux conçu pour apaiser et offrir un confort optimal. Ultra-formulé à base de plantes telles que le Calendula officinal et la Camomille, DCP Septiplus pH 5,5 possède des propriétés calmantes et apaisantes.\nHYGIÈNE DES PEAUX DÉLICATES POUR TOUTE LA FAMILLE\nINDICATIONS :\n– Hygiène quotidiennes des peaux délicates de toute la famille ( nourrisons- enfants et adultes)\n– Peaux pathologiques\n– Infections virales ( Zona – Herpès…etc)\n– Infections microbiennes.\n\nCARACTÉRISTIQUES :\n– PH physiologique\n– Hypoallergénique\n– Sans savon, sans alcool\n\nPRÉCAUTIONS :\n– Ne pas avaler.\n– Tenir hors de la portée des enfants.\n– Ne pas appliquer dans les orifices naturels (yeux, nez…).\n– Usage externe.\n– Ne pas utiliser plusieurs antiseptiques à la fois.\n\nCOMPOSITION :\nAqua, Lauryl Glucoside, Cocamidopropyl Betaine, Aloe Barbadensis Leaf Extract, Disodium Cocoamphodiacetate, Coco-Glucoside, Glycerin, Glyceryl Oleate, Phenoxyethanol, Chlorphenesin, Citric Acid, Lavandula Angustifolia Oil, Fragrance, Olea Europaea (Olive) Fruit Oil, Calendula Officinalis Flower Extract, Arctium Majus Root Extract, Sodium Benzoate, Potassium sorbate	41	DCP-6111263780210	6111263780210	50	0	5	t	f	f	2026-09-16 12:14:24.491+00	2026-09-07 12:01:55.665+00	f	contenance	same-price	f	hygiene-intime
120	DÉPI-PLUS INTIMATE	depi-plus-intimate	26	Corps	\N	368	\N	\N	5	0	#F2F2F2	ANTI-ODEUR - NON GRAS - NE COLLE PAS - HYDRATANT - TOUCHER SOYEUX - RÉDUCTION DES FROTTEMENTS - RÉDUCTION DES MACÉRATIONS\nDÉPI-PLUS INTIMATE est un lait éclaircissant et nourrissant des zones intimes. Notre lait DÉPI-PLUS INTIMATE a tout de l’indispensable de la salle de bain. En plus de son action ciblée contre les taches pigmentaires qui améliore l’hyperpigmentation et réduit efficacement la synthèse de la mélanine.\nCe lait bénéficie d’une texture fluide, non grasse, facile à appliquer après la douche. Pour une peau souple et soyeuse à tout âge.\n\nCOMPOSITION :\n– 5% Niacinamide : anti inflammatoire, éclaircissant\n– 0.5 % Alpha Arbutine : éclaircissant, très bien toléré au niveau des parties intimes\n– Bentonite : riche en minéraux, désintoxique la peau, calme les démangeaisons, anti-macération\n– Urée : hydratation, démangeaisons\n– Lactate : anti-odeur, favorise le développement des micro-organismes de la partie intime\n– Aloe Vera : Hydratation, texture exceptionnelle\n\nINDICATIONS :\n– Éclaircir la peau des zones intimes\n– Améliorer l’hyperpigmentation de la zone intime et réduire efficacement la synthèse de la mélanine\n– Nourrir et assurer un confort et une hydratation tout au long de la journée\n– Favoriser le developpement des lactobaciles.\n– Anti-prurit, anti-macération	43	DCP-6111263780258	6111263780258	50	0	5	t	f	f	2026-09-16 12:14:24.491+00	2026-09-07 12:01:56.051+00	f	contenance	same-price	f	apres-epilation
126	CICAPLUS ZONES LARGES	cicaplus-zones-larges	26	Visage	\N	200	\N	\N	5	0	#F2F2F2	CICAPLUS est spécialement formulé pour répondre aux besoins des peaux sensibles et réactives, il contribue à atténuer tous les signes des irritations sèches de la peau.\n\nINDICATIONS :\nGrâce à sa formule innovante, DCP CICAPLUS couvre un large spectre d’utilisations :\n– Accélère la réparatipon de la peau et la régénération de l’épiderme\n– Aseptisant, hydratant et réaparateur\n– Brûlûres 1er et 2ème degrè\n– Conseillé après les actes pour les peaux fragilisées, irritées et après les brûlures de 1er et 2éme degré, et aussi après le laser\n– Cicatrisant\n– Crème réparatrice aseptisante pour toute la famille\n– Tous types de peaux\n\nUTILISATION :\nAppliquer DCP CICAPLUS zones larges deux fois par jour sur les zones concernées.	49	DCP-6111263780401	6111263780401	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:57.338+00	f	contenance	same-price	f	cremes-cicatrisantes
129	HAIRLOSS SHAMPOING FEMMES	hairloss-shampoing-femmes	26	Cheveux	\N	250	\N	\N	5	0	#F2F2F2	DCP HAIRLOSS SHAMPOING Femmes est conçu avec une combinaison spéciale et efficace (de vitamine « Biotinyl-GHK » et l’Apigénine « flavonoïde d’argumes » et l’acide oléanolique des feuilles d’oliviers) qui aide à lutter contre l’alopécie, tout en stimulant la croissance des cheveux. Le mécanisme d’action du Hairloss shampoing cible spécifiquement les cellules du cuir chevelu pour lutter contre le vieillissement folliculaire.\nRésultat obtenu : Des cheveux renforcés de la racine jusqu’aux pointes\nHAIRLOSS cible: Micro-circulation, vieillissement folliculaire, ancrage des cheveux, 5x-réductase.\n\nINDICATIONS :\n– Lutte contre le vieillissement folliculaire\n– Protège contre la chute des cheveux\n– Stimule la repousse des cheveux\n– Indiqué pour tous types de cheveux et plus spécialement : cheveux cassants et abîmés\n– Fortifie la racine et la pointe\n– Nettoie tout en douceur sans dessécher : nettoie les cheveux en douceur sans les dessécher et facilite le coiffage\n– Respecte l’équilibre du cuir chevelu\n\nUTILISATION :\nAppliquer sur les cheveux mouillés, bien masser, rincer, renouveler si besoin.\nRincer à nouveau et sécher les cheveux.	52	DCP-6111263780456	6111263780456	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:57.942+00	f	contenance	same-price	f	chute-de-cheveux
156	D-BIOTIC PULVOBIOTIC  PH 5,5	d-biotic-pulvobiotic-ph-5-5	27	Visage	\N	114	\N	\N	5	0	#F2F2F2	D-biotic Pulvobiotic pH 5.5 nettoie en douceurs les peaux délicates, sensibles et irritées. Adapté à toutes les muqueuses et à toute la famille même la femme enceinte.	78	DBI-6111270660307	6111270660307	50	0	5	t	f	f	2026-09-16 12:14:24.491+00	2026-09-07 12:02:08.981+00	f	contenance	same-price	f	hygiene-intime
162	Baume à lèvres Très réparateur	baume-a-levres-tres-reparateur	27	Corps	\N	75	\N	\N	5	0	#F2F2F2	D-biotic Baume à lèvres Trés réparateur offre à vos lèvres une réparation intense et un confort immédiat !	84	DBI-6111270660338	6111270660338	50	0	5	t	f	f	2026-09-16 12:14:24.491+00	2026-09-07 12:02:10.16+00	f	contenance	same-price	f	cremes-cicatrisantes
163	Baume à lèvres Eclaircissant	baume-a-levres-eclaircissant	27	Corps	\N	120	\N	\N	5	0	#F2F2F2	D-biotic Baume à lèvres Éclaircissant offre à vos lèvres un éclat radieux et une hydratation intense, il nourrit, répare et illumine vos lèvres pour un sourire éblouissant au quotidien !	85	DBI-6111270660345	6111270660345	50	0	5	t	f	f	2026-09-16 12:14:24.491+00	2026-09-07 12:02:10.382+00	f	contenance	same-price	f	anti-taches
166	ECLABIOTIC SOLAIRE TEINTÉ SPF50+	eclabiotic-solaire-teinte-spf50	27	Solaire	\N	160	\N	\N	5	0	#F2F2F2	Cette crème solaire allie une très haute protection solaire à une action\nunifiante immédiate grâce à des filtres minéraux teintés. Elle prévient\nl’apparition des taches pigmentaires tout en les corrigeant\nprogressivement grâce à des actifs ciblés. Sa texture douce offre un fini\nnaturel, matifiant, idéal pour les peaux sujettes aux irrégularités du teint.	88	DBI-6111270660482	6111270660482	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:10.977+00	f	contenance	same-price	f	solaire
168	ECLABIOTIC  GEL ÉCLAIRCISSANT EXFOLIANT	eclabiotic-gel-eclaircissant-exfoliant	27	Visage	\N	250	\N	\N	5	0	#F2F2F2	Ce gel nettoyant associe une double exfoliation – mécanique et\nchimique – pour lisser la peau, stimuler le renouvellement cellulaire et\nrévéler un teint visiblement plus lumineux. En affinant le grain de peau,\nce soin prépare idéalement la peau à mieux recevoir les actifs\ndépigmentants.	90	DBI-6111270660475	6111270660475	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:11.463+00	f	contenance	same-price	f	anti-taches
195	AHA GEL PEELING 15%	aha-gel-peeling-15	29	Visage	\N	150	\N	\N	5	0	#F2F2F2	Propriétés\nHTCEUTIC AHA 15% gel est un gel peeling conçu spécialement pour peaux grasses à base de 15% d’acide glycolique.\nIndications\nÀ base de 15% d’acide glycolique.	117	HTC-6111267180153	6111267180153	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:18.61+00	f	contenance	same-price	f	peelings-doux
248	PACK REPAIR SHAMPOOING + APRÈS-SHAMPOOING	pack-repair-shampooing-apres-shampooing	33	Cheveux	2 × 250 ml	349	468	\N	5	0	#F2F2F2	Le Pack Repair Björn Axén est un soin capillaire complet en 2 étapes, formulé pour réparer, renforcer et revitaliser les cheveux abîmés, fragilisés ou cassants. Dès la première utilisation, le duo restaure la fibre capillaire, améliore la résistance des cheveux et leur redonne douceur et brillance.\n\nPour qui :\nCheveux abîmés, secs ou cassants.\nCheveux fragilisés par la coloration, le brushing ou la chaleur.\nCheveux ternes, sans vitalité.\n\nIngrédients clés :\nKératine végétale : répare la structure du cheveu et renforce la fibre.\nProvitamine B5 (panthénol) : hydrate et apporte douceur.\nSqualane : nourrit et protège, pour des cheveux souples et brillants.\nPeptides : renforcent et préviennent la casse.\n\nConseils d'utilisation :\nÉtape 1, Repair Shampoo : appliquer sur cheveux mouillés, masser délicatement le cuir chevelu et les longueurs, puis rincer soigneusement.\nÉtape 2, Repair Conditioner : appliquer sur les longueurs et les pointes, laisser agir quelques minutes, puis rincer.\nÀ utiliser régulièrement pour des résultats optimaux.	190	BJA-PACK-REPAIR	\N	10	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-16 17:31:48.843+00	f	contenance	same-price	f	shampoings-traitants
249	PACK DURCISSEUR FORT + DISSOLVANT	pack-durcisseur-fort-dissolvant	34	Corps	\N	259	320	\N	5	0	#F2F2F2	Le Pack Herôme Fort est un soin complet en deux étapes pour renforcer les ongles fragiles, mous ou cassants. Il associe un durcisseur fort, qui améliore la structure naturelle de l'ongle, à un dissolvant soignant sans acétone qui retire le vernis en douceur, sans dessécher ni fragiliser l'ongle. Avec une utilisation régulière, les ongles sont visiblement plus résistants et moins sujets à la casse.\n\nIngrédients clés :\nProvitamine B5 : hydrate en profondeur, réduit le dessèchement et la rugosité de l'ongle.\nVitamines C et E : revitalisent l'ongle et le protègent des agressions extérieures.\nExtrait de graines de céleri : nourrit la matrice pour des ongles plus lisses et robustes.\n\nConseils d'utilisation :\nJour 1 : appliquer une couche de durcisseur sur des ongles propres et secs.\nJour 2 : appliquer une deuxième couche.\nJour 3 : retirer les couches avec le dissolvant sans acétone Herôme, puis appliquer une nouvelle couche de durcisseur.\nJour 4 : appliquer une deuxième couche, et ainsi de suite pendant 30 jours.\nEn cure, quatre fois par an.	196	HER-PACK-DURCISSEUR-FORT-DISSOLVANT	\N	10	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-16 17:31:48.938+00	f	contenance	same-price	f	soins-mains-pieds
205	HA GEL NETTOYANT MOUSSANT	ha-gel-nettoyant-moussant	30	Visage	\N	280	\N	\N	5	0	#F2F2F2	Propriétés :\nNettoie, purifie et assainit l’épiderme sans l’agresser.\nDès deux semaines, les imperfections sont moins visibles, la peau est moins grasse, les impuretés sont éliminées.\nConseils d’utilisation :\nS’utilise matin et soir comme un savon. Rincer à l’eau.\nSécher la peau puis appliquer la Lotion Tonique Clarifiante pour resserrer les pores.\nPrincipes actifs :\nLipesters® CSS\nAllantoïne\nTilleul\nCamomille\nBleuet\nCalendula\nMillepertuis\nSANS SAVON\nSANS COLORANT\nSANS PARABEN	126	HEL-323033271009	323033271009	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:21.9+00	f	contenance	same-price	f	nettoyants
206	HA PURIPHYL SOLUTION	ha-puriphyl-solution	30	Visage	\N	300	\N	\N	5	0	#F2F2F2	Traitement de fond des peaux à problèmes. Combat la prolifération bactérienne. Assainit l’épiderme et lutte contre l’apparition des boutons et points noirs. La Solution doit être employée localement sur les zones à traiter.\n\nConseils d’utilisation :\n\nAppliquer le soir sur une peau parfaitement nettoyée.\nDès les premiers signes d’amélioration, espacer les applications en alternance avec la Lotion Tonique Clarifiante.\n\nPrincipaux ingrédients :\n\nLipacide C8CO\nExcipient alcoolisé	127	HEL-3401396962564	3401396962564	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:22.09+00	f	contenance	same-price	f	purifiants
207	HA SOIN HYDRATANT MATIFIANT	ha-soin-hydratant-matifiant	30	Visage	\N	250	\N	\N	5	0	#F2F2F2	Ce soin quotidien à la texture fraîche et légère hydrate, matifie et apaise dès la première application les peaux mixtes ou grasses.\nIl contient un actif breveté le Lipester®CSS qui aide à lutter contre le développement microbien et assainir la peau.\nDes poudres matifiantes SOFT FOCUS offrent un toucher velouté, estompent les imperfections et absorbent l'excès de sébum.\n\nLa peau retrouve rapidement douceur et souplesse, les sensations d’inconfort s’atténuent et les pores se resserrent.\n\nExcellente base de maquillage grâce à son fini mat et son action anti-brillance. Formule non grasse.\n\nLe soin hydratant matifiant HELIABRINE est également recommandé pour les peaux masculines.	128	HEL-3323033211005	3323033211005	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:22.283+00	f	contenance	same-price	f	purifiants
208	MASQUE REEQUILIBRANT	masque-reequilibrant	30	Visage	\N	320	\N	\N	5	0	#F2F2F2	Ultra réconfortant, ce masque crème rétablit l’équilibre nécessaire au confort et à l’éclat des peaux fragiles grâce à un cocktail d’actifs apaisants, hydratants et réparateurs. \n\nVisiblement revitalisée, la peau est souple, douce et lumineuse.	129	HEL-MASQUE-REEQUILIBRANT-0520CD	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:22.527+00	f	contenance	same-price	f	purifiants
138	DÉPI-SUN SPF100+ CREME SOLAIRE ÉCLAIRCISSANTE	depi-sun-spf100-creme-solaire-eclaircissante	26	Solaire	\N	180	\N	\N	5	0	#F2F2F2	DCP DEPI-SUN est une crème solaire\néclaircissante qui offre une très haute protection tout en\nfavorisant à prévenir et réduire les taches brunes.	\N	DCP-6111263780616	6111263780616	50	0	5	f	f	f	2026-09-16 12:14:24.491+00	2026-09-07 12:02:03.438+00	f	contenance	same-price	f	\N
160	SEBIOTIC SPF 50+	sebiotic-spf-50	27	Solaire	\N	140	\N	\N	5	0	#F2F2F2	Protège, hydrate et matifie la peau à imperfections.	82	DBI-6111270660420	6111270660420	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:09.765+00	f	contenance	same-price	f	solaire
250	PACK DURCISSEUR EXTRA FORT + DISSOLVANT	pack-durcisseur-extra-fort-dissolvant	34	Corps	\N	269	330	\N	5	0	#F2F2F2	Le Pack Herôme Extra Fort est un soin intensif destiné aux ongles extrêmement fragiles, très mous ou sévèrement cassants. Il associe le Durcisseur Extra Fort, la formule la plus puissante de Herôme, à un dissolvant soignant sans acétone, pour une routine complète qui renforce l'ongle sans l'agresser.\n\nIngrédients clés :\nProvitamine B5 : pénètre dans la plaque de l'ongle pour maintenir l'hydratation et éviter la rugosité.\nVitamines C et E : antioxydants qui revitalisent l'ongle et le protègent des agressions extérieures.\nExtrait de graines de céleri : prend soin de la structure de l'ongle pour un aspect plus lisse et uniforme.\n\nConseils d'utilisation :\nJour 1 : appliquer une couche de durcisseur sur des ongles propres et secs.\nJour 2 : appliquer une deuxième couche.\nJour 3 : retirer les couches avec le dissolvant sans acétone Herôme, puis appliquer une nouvelle couche de durcisseur.\nJour 4 : appliquer une deuxième couche, et ainsi de suite pendant 30 jours.\nEn cure intensive, quatre fois par an.	199	HER-PACK-DURCISSEUR-EXTRA-FORT-DISSOLVANT	\N	10	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-16 17:31:49.003+00	f	contenance	same-price	f	soins-mains-pieds
209	CREME CONFORT 32	creme-confort-32	30	Visage	\N	650	\N	\N	5	0	#F2F2F2	Idéale pour les peaux sèches, fragiles et exigeantes, la crème Confort 32 enveloppe la peau d’un confort infini et la protège des effets du temps. Enrichie en ingrédients végétaux hydratants, nourrissants et réparateurs, elle offre une hydratation et une protection longue durée. Intensément hydratée et plus résistante, la peau est souple, douce et visiblement plus belle. Appliquer par un léger massage sur le visage et le cou démaquillés. Texture riche recommandée pour les peaux sèches à très sèches ou en soin de nuit\n\nPrincipaux ingrédients :\n\nMélilot BIO\nMarguerite Bleue\nAllantoïne\nPro Vitamine B5\nHuile de Cameline\nHuile de Pépins de raisins\nImpérata Cylindrica\nGlycérine végétale\nAcide hyaluronique\nAlgisium C®\nSANS PARABEN	130	HEL-3401396961383	3401396961383	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:22.717+00	f	contenance	same-price	f	peaux-seches
210	SOIN MULTI CORRECTION ( CAPITAL DEFENSE)	soin-multi-correction-capital-defense	30	Visage	\N	370	\N	\N	5	0	#F2F2F2	Effet lissant – diminution de l’apparence des rides/ridules de déshydratation dès la 1ère application.*\nPoches sous les yeux visiblement atténuées**\nCernes moins visibles**\n*Test instrumental effectué 2 heures après application. **Evaluation clinique réalisée sur 21 femmes après 28 jours d’utilisation biquotidienne	131	HEL-3323031119006	3323031119006	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:22.909+00	f	contenance	same-price	f	anti-age
218	SOIN DE NUIT	soin-de-nuit	30	Visage	\N	294	\N	\N	5	0	#F2F2F2	Héliabrine Helia Green Soin de Nuit Hydratation & Confort est un soin de nuit nourrissant et hydratant conçu pour apporter réconfort et douceur à la peau tout au long de la nuit. Il est adapté aux peaux normales à sèches. La texture de ce soin est décrite comme « cocooning », c’est-à-dire qu’elle est douce et enveloppante pour procurer une sensation de confort.\nCe soin de nuit est formulé avec des ingrédients naturels, dont 99% sont d’origine naturelle, et met en avant les actifs suivants :\nHibiscus Blanc et Fruit de Baobab : Ces ingrédients sont sélectionnés pour leurs propriétés repulpantes, contribuant ainsi à maintenir la jeunesse de la peau.\nGrenade et Karité : Ils sont reconnus pour leur pouvoir hydratant et réparateur exceptionnel, aidant à garder la peau bien hydratée et à favoriser sa réparation.\nAlgue Brune de Méditerranée : Cette algue est appréciée pour ses vertus adoucissantes et raffermissantes, participant ainsi à maintenir la douceur et la fermeté de la peau.\nConseils d’application :\nPour optimiser l’utilisation de ce soin de nuit, suivez ces recommandations :\nAppliquez le produit chaque soir sur le visage, le cou et le décolleté après les avoir démaquillés.\nLe matin, utilisez le soin jour « Hydratation et Douceur » de la gamme Heliagreen pour compléter votre routine.	139	HEL-3323031108901	3323031108901	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:24.422+00	f	contenance	same-price	f	anti-age
219	GEL POST EPILATION	gel-post-epilation	30	Visage	\N	220	\N	\N	5	0	#F2F2F2	Calme instantanément les peaux fragilisées ou échauffées par l’épilation. Contient un actif breveté, le Capislow®​ qui ralentit la repousse du poil et permet de conserver des jambes nettes et douces plus longtemps. \nEstompe les rougeurs et imperfections liées à l’épilation (poils incarnés).	140	HEL-3323032640004	3323032640004	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:24.61+00	f	contenance	same-price	f	apres-epilation
172	LCP crème solaire matifiante	lcp-creme-solaire-matifiante	28	Solaire	\N	83	\N	\N	5	0	#F2F2F2	Crème solaire matifiante SPF50+ LCP est une crème solaire haute protection contre les rayons UV, tout en apportant un effet matifiant tout au long de la journée. Conçue pour les peaux grasses à tendances acneïque, elle aide à prévenir l’aggravation des lésions et l’apparition des taches brunes liées à l’exposition au soleil.                                                                                                                                      Soin en triple action: Traite, Assainit, Purifie.                                                                                                                                   0% Alcool, 0% Paraben, 0% sulfate	94	LCP-6111275500035	6111275500035	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:13.362+00	f	contenance	same-price	f	solaire
173	LCP syndet relipidant atopique gel lavant	lcp-syndet-relipidant-atopique-gel-lavant	28	Visage	\N	67	\N	\N	5	0	#F2F2F2	Syndet relipidant atopique LCP est un gel lavant ultra doux formulé sans savon, pour les peaux atopiques, sensibles à très sèches. Il nettoie sans agresser, relipide et apaise la peau en restaurant la barrière cutanée. \nGrâce à sa base lavante enrichie en actifs relipidants et apaisants, il nettoie tout en aidant à préserver et restaurer la barrière cutanée.\nSa formule haute tolérance convient à toute la famille, y compris les nourissons.                                                                                                                                       Action 3 en 1: Nettoie, Apaise, Relipide\n0% alcool, 0% paraben, 0% sulfate	95	LCP-6111275500042	6111275500042	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:13.563+00	f	contenance	same-price	f	nettoyants
174	LCP baume relipidant atopique crème émolliente	lcp-baume-relipidant-atopique-creme-emolliente	28	Visage	\N	83	\N	\N	5	0	#F2F2F2	Baume relipidant atopique LCP est une crème émolliente riche, formulée pour restaurer la barrière cutanée, réduire la perte en eau, nourrir intensément et apaiser les démangeaisons liées à la sécheresse atopique.                                                                                                                                                                         \nGrâce à sa composition enrichie en actifs relipidants et apaisants, il nourrit et apaise tout en aidant à restaurer la barrière cutanée, la protégeant des agressions extérieures. Sa formule haute tolérance convient à toute la famille, y compris les nourissons.                                                                                                                                                                                                                  Action 3 en 1: Nourrit, Apaise, Relipide\n0% alcool, 0% paraben, 0% sulfate	96	LCP-6111275500059	6111275500059	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:13.763+00	f	contenance	same-price	f	peaux-seches
217	SOIN DE JOUR	soin-de-jour	30	Visage	\N	294	\N	\N	5	0	#F2F2F2	Héliabrine Helia Green Soin de Jour Hydratation & Douceur est un soin hydratant quotidien qui convient à tous les types de peaux. Sa texture fine, fraîche et fondante aide à maintenir un taux d’hydratation optimal pour une peau plus douce, souple et éclatante.\nLes ingrédients clés de ce soin, dont 99% sont d’origine naturelle, sont les suivants :\nExtrait de Gaulthérie : Sélectionné pour son action sur l’éclat du teint, cet extrait contribue à donner à la peau un aspect lumineux.\nGrenade et Karité : Ces ingrédients sont reconnus pour leur exceptionnel pouvoir hydratant et protecteur. Ils aident à maintenir la peau bien hydratée et la protègent des agressions extérieures.\nAlgue Brune de Méditerranée : Cette algue est appréciée pour ses vertus adoucissantes et raffermissantes, aidant ainsi à préserver la douceur et la fermeté de la peau.\nConseils d’application :\nPour une utilisation optimale de ce soin hydratant, suivez ces recommandations :\nAppliquez le produit chaque matin sur le visage, le cou et le décolleté, après les avoir démaquillés.\nPour une hydratation complète, utilisez le soir le soin nuit « Hydratation & Confort » de la gamme Heliagreen.	138	HEL-3323031108802	3323031108802	50	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:24.234+00	f	contenance	same-price	f	anti-age
176	LCP Baume\nChauffant\nPieds Secs	lcp-baume-chauffant-pieds-secs	28	Corps	\N	100	\N	\N	5	0	#F2F2F2	Baume Chauffant Pieds Secs LCP est un baume dermatologique nourrissant et réchauffant, spécialement formulé pour les pieds secs à très secs, sujets aux talons fendillés et aux crevasses superficielles. Riche en actifs, ce baume nourrit et répare intensément, apaise et protège la peau des pieds, et lisse et assouplit la couche cornée.\nLa présence d'huiles essentielles assainissent la surface cutanée.\nCe baume apporte une sensation de réchauffement et de confort.                                                                                                               Action 3 en 1: Chauffe, Nourrit, Hydrate\n0% alcool, 0% paraben, 0% sulfate	98	LCP-6111275500073	6111275500073	42	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:14.155+00	f	contenance	same-price	f	soins-mains-pieds
153	D-BIOTIC ROSABIOTIC LOTION SOIN INTENSE 100 ML	d-biotic-rosabiotic-lotion-soin-intense-100-ml	27	Visage	\N	150	\N	\N	5	0	#F2F2F2	D-biotic Rosabiotic Lotion Soin intense est une lotion concentrée conçue pour atténuer les rougeurs sévères et la couperose. A base d’une synergie d’actifs exclusifs rougeurs et couperose, de la combinaison d’actifs pré-pro et post biotique et de 07 céramides.	75	DBI-6111270660284	6111270660284	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:08.382+00	f	contenance	same-price	f	peaux-sensibles
158	SEBIOTIC Soin réparateur intense	sebiotic-soin-reparateur-intense	27	Visage	\N	280	\N	\N	5	0	#F2F2F2	Formule synergique alliant le potentiel des acides et des actifs aux propriétés\nkératolytiques, antibactériennes, purifiantes pour d’assurer une prise en\ncharge globale des facteurs de l’acné vulgaire et modérée.\nLe soin réparateur Sebiotic renforce la régénération de la peau pour une prise\nen charge globale des facteurs de l’acné.	80	DBI-6111270660413	6111270660413	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:09.365+00	f	contenance	same-price	f	cremes-cicatrisantes
161	SEBIOTIC SERUM AI	sebiotic-serum-ai	27	Visage	\N	150	\N	\N	5	0	#F2F2F2	Atténue les rougeurs dues à l’inflammation cutanée.	83	DBI-6111270660444	6111270660444	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:09.958+00	f	contenance	same-price	f	purifiants
212	AMPOULES AU COLLAGENE MARIN	ampoules-au-collagene-marin	30	Visage	\N	890	\N	\N	5	0	#F2F2F2	Cure anti-âge intensive destinée aux peaux matures, fatiguées ou dévitalisées. Hautement concentrées en Collagène Marin et Peptides anti-âges très performants, ces ampoules hydratent et nourrissent en profondeur la peau pour aider à maintenir sa densité et sa fermeté qui diminue avec l’âge. La texture très douce et confortable du sérum délivre au cœur des rides ses composantes hydratantes pour un effet lissant immédiat**. L’effet jeunesse est remarquable : dès le 6ème jour la peau paraît redensifiée, le taux de collagène dermique augmente de 186%*. Après 12 jours** de cure seulement, la peau semble repulpée : visiblement plus ferme, elle retrouve éclat et vitalité. Après 24 jours**, ces résultats s’intensifient : d’apparence plus lisse et moins marquée au réveil, la peau paraît visiblement plus jeune.	133	HEL-3323031750001	3323031750001	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:23.29+00	f	contenance	same-price	f	anti-age
213	MASQUE REPULPANT COLLAGENE	masque-repulpant-collagene	30	Visage	\N	220	\N	\N	5	0	#F2F2F2	Véritable concentré de douceur et d’hydratation, ce soin allie bien-être et efficacité pour une peau repulpée et visiblement plus belle. Nous avons choisi d’associer la haute technologie de la Bio-cellulose, véritable ‘SECONDE PEAU’, aux pouvoirs reconstituants et hydratants du Collagène Marin et de l’Acide Hyaluronique. Idéalement hydratée et intensément ressourcée, la peau retrouve une nouvelle jeunesse.\n\nPrincipaux ingrédients :\n\nCollagène Marin\nAcide Hyaluronique\nGlycérine\nAloe Vera	134	HEL-MASQUE-REPULPANT-COLLAGE-0B464D	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:23.48+00	f	contenance	same-price	f	anti-age
214	HELIABRINE HUILE DEMAQUILANTE VELOURS	heliabrine-huile-demaquilante-velours	30	Visage	\N	500	\N	\N	5	0	#F2F2F2	Enrichie en huile de Macadamia aux propriétés hydratantes exceptionnelles, cette huile assure un démaquillage très doux du visage et des yeux et protège le film hydrolipidique de la peau.\n\nAu contact de l’eau, elle se transforme en une délicieuse émulsion lactée qui dissout efficacement les impuretés, le sébum et tous types de maquillage, même waterproof. Parfaitement nettoyée, la peau est incroyablement douce et confortable, le teint net et clarifié.	135	HEL-3323031085004	3323031085004	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:23.67+00	f	contenance	same-price	f	demaquillants
184	LCP lotion anti-chute	lcp-lotion-anti-chute	28	Cheveux	\N	433	\N	\N	5	0	#F2F2F2	La Lotion Anti-Chute LCP est un soin ciblé à action intensive, conçu pour freiner la chute de cheveux et stimuler la repousse dès la racine. Formulée à base de complexes anti-chute performants, elle agit directement sur le cuir chevelu pour renforcer l’ancrage du cheveu, prolonger son cycle de vie et favoriser une chevelure plus dense et plus résistante.\nSa texture légère et non grasse pénètre rapidement sans laisser de résidus, permettant une utilisation quotidienne sans alourdir les cheveux. Facile à appliquer grâce à son format spray, elle offre un geste précis et pratique pour un traitement efficace au quotidien.\nIdéale en cas de chute de cheveux, de perte de densité ou en complément d’une routine anti-chute complète.                                                           Action 3 en 1: Stimule, Redensifie, Booste\n0% alcool, 0% paraben	106	LCP-6111275500134	6111275500134	42	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:15.738+00	f	contenance	same-price	f	chute-de-cheveux
232	AMPOULES cheveux	ampoules-cheveux	31	Cheveux	\N	477	\N	\N	5	0	#F2F2F2	INDICATIONS\nChute de cheveux excessive, cheveux ternes, clairsemés, affaiblis.\nConvient au cuir chevelu sensible.\nPROPRIÉTÉS\nLes Ampoules ANP®2+ d’ECRINAL® stimulent la croissance des cheveux et atténuent leur chute. Concentrée en ANP®2+ (Activateur Naturel de Phanère, actif breveté exclusif des Laboratoires ASEPTA), l’ampoule ne se limite pas à son action principale : la chute de cheveux. Elle assure également une revitalisation des cheveux faibles et clairsemés. Le cheveu est ainsi sain, plus solide et vigoureux.\nEfficacité prouvée dès 21 jours.\nCONSEILS D'UTILISATION\n3 fois par semaine, appliquer 1 ampoule à l’aide de l’embout sur le cuir chevelu sec, raie par raie et masser délicatement. Laisser agir au minimum 30 minutes puis laver les cheveux avec le shampooing fortifiant ECRINAL®\n\nPhase d'attaque : 3 applications par semaine pendant 21 jours\nPhase d'entretien : 2 applications par semaine pendant 1 mois	151	4703	3323030000251	50	0	5	t	t	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:27.224+00	f	contenance	same-price	f	chute-de-cheveux
165	ECLABIOTIC SOLAIRE INVISIBLE SPF50+	eclabiotic-solaire-invisible-spf50	27	Solaire	\N	160	\N	\N	5	0	#F2F2F2	Cette crème allie une très haute protection solaire à une action ciblée\ncontre les taches pigmentaires. Invisible une fois appliquée, elle forme\nun bouclier contre les UVA et UVB tout en intervenant activement sur les\ndésordres pigmentaires.	87	DBI-6111270660499	6111270660499	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:10.777+00	f	contenance	same-price	f	solaire
167	ECLABIOTIC INTENSE	eclabiotic-intense	27	Visage	\N	280	\N	\N	5	0	#F2F2F2	Cette crème de nuit agit en profondeur pendant le repos cellulaire\npour corriger les taches pigmentaires, lisser le grain de peau et raviver\nl’éclat du teint. Sa formule réparatrice et éclaircissante cible\nla mélanogenèse tout en soutenant le renouvellement cutané. Nuit\naprès nuit, la peau est visiblement plus uniforme, reposée et lumineuse.	89	DBI-6111270660451	6111270660451	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:11.256+00	f	contenance	same-price	f	anti-taches
104	SUNSCREEN HYDRO	sunscreen-hydro	26	Solaire	\N	242	\N	\N	5	0	#F2F2F2	SUNSCREEN HYDRO ultra protection SPF 50+ est une crème solaire invisible avec une formule contenant « Tinosorb M, Tinosorb S, Emollionts et Aloe vera », offre une protection maximale contre les rayons UVA/UVB et hydrate profondément tous les types de peau.\n\nUTILISATION :\nAppliquer généreusement et uniformément DCP SUNSCREEN HYDRO sur la peau sèche 30 minutes avant l’exposition au soleil et aussi souvent que nécessaire.\nRenouveler l’application toutes les deux heures ou aprés la natation ou la transpiration.\n\nUNE PROTECTION OPTIMALE : TINOSORB M + TINOSORB S + UVINUL A Plus\nINDICATIONS :\n– Protection maximale absorbante UVA / UVB 50+\n– Prévention du veillissement cutané\n– Crème solaire adaptée à tous les types de peau\n– Ultra hydratant\n– Non comédogène, hypoallergénique, sans paraben\n– Toucher sec, fini mat immaculé\n– Résiste à l’eau\n– Resiste à la sudadtion\n– Miscibilité avec l’huile\n\nINGRÉDIENTS ACTIFS :\nTinsorb M : Protection et absorption maximale\nTinisorb S : Protection et absorption maximale\nUvinul A Plus : Protection et absorption maximale\nAloe Vera : Hydratation maximale. Renforcer la barrière cutanée\nVitamine E : Vieillissement cutané	27	DC925ST0PSKOENAFAMZ	6111263780029	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:52.476+00	f	contenance	same-price	f	solaire
109	TRIO ACNE LOTION	trio-acne-lotion	26	Visage	\N	294	\N	\N	5	0	#F2F2F2	PEAUX GRASSES À IMPERFECTIONS MODÉRÉES À SÉVÈRES\nTRIO ACNE LOTION spray est un traitement ciblé anti-acné zones larges à base d’acide exfoliant, anti-inflammatoire et éclaircissant, qui permet de purifier en éliminant les impuretés et matifier la peau en absorbant l’excès de sébum et en régulant sa sécrétion. Pour les lésions sur les grandes surfaces ( dos, torse, avant bras..etc ), kératose pilaire et pili incarnati. Ce traitement convient à tous les types de peau, même les plus sensibles, et à tous les phototypes.\n\nINDICATION :\n– Lésions sur les grandes surfaces\n– Kératose pilaire\n– Pili incarnati\n\nUTILISATION :\nAppliquer DCP TRIO ACNE LOTION deux fois par jour sur une peau préalablement nettoyée avec DCP TRIO-ACNE GEL. S’applique directement sur les imperfections. Idéal pour les zones larges touchées par l’acné.\n\nCOMPOSITION :\n– 10% Glycolic Acid >Exfoliant\n– 5% Niacinamide > Anti-inflammatoire et éclaircissant\n– 2% Salicylic Acid > Kératolytique\n– 1% Allantoin > Apaisant\n– 1% Tasmannia Lanceolata Fruit > Anti-inflammatoire\n– 0.5% Arctium Majus Root Extract > Apaisant\n– 5% Glycerin > Hydratant\n– 5% Aloe Barbadensis Leaf Extract > Hydratant et apaisant\n– 0.6% Centella Asiatica Leaf Water > Cicatrisant	32	DCP-6111263780234	6111263780234	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:53.492+00	f	contenance	same-price	f	purifiants
110	NC 10 SERUM	nc-10-serum	26	Visage	\N	137	\N	\N	5	0	#F2F2F2	NC 10 SERUM\nSÉRUM ANTI-IMPERFECTIONS, ACNÉ INFLAMMATOIRE, ACNÉ ROSACÉE\nNC 10 SERUM est un sérum anti-imperfections spécialement conçu pour répondre aux besoins des peaux sensibles, en particulier celles sujettes à l’acné inflammatoire et à la rosacée. Grâce à sa formule hypoallergénique, NC 10 sérum offre une solution douce et efficace pour cibler les problèmes cutanés. Sa texture légère et ses ingrédients apaisants aident à réduire les rougeurs, à calmer l’inflammation et à retrouver une peau plus équilibrée et apaisée.\n\nNC 10 - INDICATION :\n– Acné inflammatoire\n– Acné rosacée\n– Association avec les traitements anti acnéiques\n\nNC 10 - COMPOSITION :\n– 10% Niacinamide\n– 3% AC.net\n\nNC 10 - UTILISATION :\nAppliquer le DCP NC 10 sérum matin et/ou soir sur le visage bien nettoyé avec le DCP TRIO ACNE GEL.\nMasser légèrement.\nSans rinçage.	33	DCP-6111263780241	6111263780241	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:54.103+00	f	contenance	same-price	f	anti-age
139	TRIO-ACNÉ SUN SPF50+ CREME SOLAIRE MATIFIANTE	trio-acne-sun-spf50-creme-solaire-matifiante	26	Solaire	\N	160	\N	\N	5	0	#F2F2F2	DCP TRIO-ACNE-SUN SPF 50+ est une\ncrème solaire adaptée aux peaux grasses à tendance\nacnéique et allergique au soleil.	61	DCP-6111263780593	6111263780593	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:04.126+00	f	contenance	same-price	f	solaire
220	CREME HYDRA-SATINEE AU COLLAGENE MARIN	creme-hydra-satinee-au-collagene-marin	30	Visage	\N	420	\N	\N	5	0	#F2F2F2	95% d'ingrédients d'origine naturelle.\nHydratation longue durée.\nFermeté et élasticité de la peau.\nEffet lissant et anti-rides, fini satiné.\nConvient à tous types de peaux y compris les peaux sensibles, particulièrement recommandé pour les peaux sèches ou matures.	141	HEL-3323031125007	3323031125007	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:24.799+00	f	contenance	same-price	f	anti-age
111	LOTION BHA	lotion-bha	26	Visage	\N	147	\N	\N	5	0	#F2F2F2	Lotion BHA est un exfoliant BHA et kérato-régulateur à base d’aloe vera et de thé vert, formulée avec précision, la lotion est spécialement conçue pour éliminer en douceur les cellules mortes en surface de l’épiderme, tout en pénétrant profondément dans les pores pour déloger les impuretés accumulées. La lotion BHA favorise une peau nette, grâce aux ingrédients naturels tels que l’aloe vera et le thé vert, la lotion offre également une hydratation optimale.\n\nINDICATION :\n– Imperfections\n– Pores dilates\n– Points noirs\n\nUTILISATION :\nAppliquer le DCP LOTION BHA deux fois par jour\nsur le visage bien nettoyé avec DCP TRIO-ACNE GEL.\nMasser légèrement.\nSans rinçage.\n\nCOMPOSITION :\n– 2 % acide salicyliquee\n– The vert\n– Imperfections\n– Calendula\n– Isopentyldiol\n– Aloe vera	34	DCP-6111263780371	6111263780371	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:54.298+00	f	contenance	same-price	f	purifiants
105	SUNSCREEN INVISIBLE	sunscreen-invisible	26	Solaire	\N	158	\N	\N	5	0	#F2F2F2	SUNSCREEN INVISIBLE ultra protection SPF 50+ est une crème solaire invisible avec une formule innovante de triple action « Protection, Hydratation et Anti-âge », offre une protection maximale contre les rayons UVA/UVB et hydrate profondément tous les types de peau.\n\nINDICATIONS :\n– Protection maximale absorbante UVA / UVB 50+\n– Prévention du veillissement cutané\n– Crème solaire adaptée à tous les types de peau\n– Ultra hydratant\n– Non comédogène, hypoallergénique, sans paraben\n– Toucher sec, fini mat immaculé\n– Résiste à l’eau\n– Resiste à la sudadtion\n– Miscibilité avec l’huile\n\nUTILISATION :\nAppliquer généreusement et uniformément DCP SUNSCREEN INVISIBLE sur la peau sèche 30 minutes avant l’exposition au soleil et aussi souvent que nécessaire.\nRenouveler l’application toutes les deux heures ou aprés la natation ou la transpiration.\n\nUNE PROTECTION OPTIMALE : TINOSORB M + TINOSORB S + UVINUL A Plus\nINGRÉDIENTS ACTIFS :\nTinsorb M : Protection et absorption maximale\nTinisorb S : Protection et absorption maximale\nUvinul A Plus : Protection et absorption maximale\nAloe Vera : Hydratation maximale. Renforcer la barrière cutanée\nVitamine E : Vieillissement cutané	28	C-Beauty-14864	6111263780098	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:52.685+00	f	contenance	same-price	f	solaire
106	MOIST INTENSE	moist-intense	26	Visage	\N	168	\N	\N	5	0	#F2F2F2	DCP MOIST INTENSE est spécialement conçue pour les peaux sèches à très sèches, cette crème hydratante profonde apporte une sensation de confort et de douceur absolue. Elle soulage les rougeurs, les picotements et procure une hydratation intense.\n\nINDICATION :\n– Crème hydratante profonde 72 H\n– Peaux sèches à très sèches\n\nUTILISATION :\nAppliquer DCP MOIST INTENSE chaque matin et soir sur l’ensemble du visage et du cou.\n\nPROPRIÉTÉS :\nDCP MOIST INTENSE réconforte complètement les peaux les plus sensibles, soulage les rougeurs et les picotements et hydrate intensément.\n\nUNE RESTAURATION DE LA BARRIÈRE CUTANÉE\nINGRÉDIENTS ACTIFS\n15% ACIDES AMINÉS : Facteurs naturels d’hydratation ( FNH – Plastification des Cornéocytes)\n5% ALOE VERA : Véritable concentré d’actifs hydratants, de vitamines (A, B et E), de minéraux, des acides aminés essentiels et de 99% d’eau.\n1% PENTAVITIN : Actif apaisant pour une hydratation en profondeur.\n1% CALENDULA : Antioxydant, protégeant de la dégénérescence cellulaire et captant\nles radicaux libres à l’origine du vieillissement cutané prématuré.\n1% KARITÉ : Riche en vitamines A, D, E et F, le karité possède de nombreuses proprié- tés réparatrices, il assouplit, adoucit et hydrate la peau en profondeur.\n1% PROVITAMINE B5 : Hydratant et émollient, la provitamine B5 réduit la perte en eau et maintient la douceur et l’élasticité de la peau.	29	DCP-6111263780036	6111263780036	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:52.891+00	f	contenance	same-price	f	peaux-seches
113	DÉPI GEL	depi-gel	26	Visage	\N	189	\N	\N	5	0	#F2F2F2	DÉPI-CRÈME dépigmentant actif est une crème apportant une solution pour la prise en charge des tâches brunes et de l’hyperpigmentation cutanée, notamment dans les cas suivants : Mélasma (masque de grossesse), Lentigo (taches de vieillesse), Chloasma, Taches d’origine inflammatoire et Taches d’origine vasculaire.\nGrâce à sa formulation unique Hexa Actifs 6, DÉPI-CRÈME a une action complète sur :\n– la dépigmentation des taches brunes\n– le renouvellement cellulaire\n– la diminution de production de mélanine\n\nUTILISATION :\nAppliquez Dépi Crème 1 à 2 fois quotidiennement, matin et soir, pour des résultats optimaux. Le flacon 50 ml correspond à un traitement complet.\n\nPROPRIÉTÉS :\n– Synergie d’action de 6 actifs dépigmentants\n– Prise en charge complète du cycle de la mélanogénèse\n– Efficacité prouvée par des études scientifiques\n– Actions : dépigmentante, hydratante, anti-inflammatoire et anti-irritante\n\nINDICATIONS :\n– Melasma\n– Chloasma\n– Lentigo\n– Taches d’origine inflammatoire\n– Taches d’originre vasculaire\n\nINGRÉDIENTS :​\nHPPA, acide salicilyque, vitamine C, vitamine E, bisabolol, allontoine, niacinamide, arbutine..	36	DCP-6111263780081	6111263780081	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:54.692+00	f	contenance	same-price	f	apres-epilation
114	SYNDET LIPIDIK	syndet-lipidik	26	Corps	\N	131	\N	\N	5	0	#F2F2F2	Propriétés :\n– Apaisant\n– Anti-grattage\n– Base lavante douce = surgras, sans savon, non détergent\n– Préserve l’intégrité de la peau (pH physiologique)\n– Glycérine : humectant anti-déshydratation\n– Lipoamoniacide d’origine végétal (hydrate et surgraisse)\n– Extrait végétal (adoucissant – calmant)\n– Sans conservateur\n– Sans parfum\nAvantages :\n– Hygiène quotidienne des peaux sensibles et fragilisées ( Nourrison – Enfant – Adulte )\n– Visage et corps\n– Testé sous contrôle dermatologique\n– Hypoallergénique\n– Économique : 200 ml\nBénéfices :\n– Prévient les sensations de tiraillements\n– Nettoie en toute sécurité\n– Respecte l’équilibre biologique\n– Lipoamoniacide d’origine végétal (hydrate et surgraisse)\n– Extrait végétal (adoucissant – calmant)\n– Sans conservateur\n– Sans parfum	37	DCP-6111263780111	6111263780111	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:54.885+00	f	contenance	same-price	f	nettoyants
107	TRIO-ACNE GEL	trio-acne-gel	26	Visage	\N	168	\N	\N	5	0	#F2F2F2	PEAUX GRASSES À IMPERFECTIONS MODÉRÉES À SÉVÈRES\nTRIO ACNE GEL MOUSSANT est un nettoyant moussant pour peaux mixtes et grasses à imperfections modérées à sévères. Ce gel moussant nettoie en douceur les impuretés et les bactéries responsables de l’acné, régule l’excès de sébum, purifie l’épiderme, prévient les éruptions cutanées et respecte le pH cutané.\n\nINDICATION :\n– Nettoie en douceur les peaux mixtes et grasses à imperfections.\n– Séborégulateur sans provoquer l’hyper-séborrhée réactionnelle.\n– Purifie et assainit l’épiderme tout en nettoyant en douceur la peau.\n– Prévient les éruptions cutanées\n– Réspecte le pH cutané\n\nUTILISATION :\nAppliquer, matin et soir, DCP TRIO-ACNE Gel sur une peau humide. Faire mousser avec un peu d’eau le gel, rincer abondamment à l’eau, puis sécher sans frotter.\nIdéal pour toutes les zones touchées par l’acné, y compris le visage, le dos et la poitrine.\n\nINGRÉDIENTS :\naqua, sodium laureth sulfate, lauryl glucoside, cocamide dea, propylene glycol, salicylic acid, pyridoxine hcl, hydrolyzed yeast protein, threonine, biotin, niacinamide, glycerin, sodium chloride, dehydroacetic acid, benzyl alcohol, coco-glucoside, glyceryl oleate, allantoin, lactic acid, lauryl glucoside, disodium edta, ci19140, ci42090	30	DCP-6111263780074	6111263780074	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:53.088+00	f	contenance	same-price	f	purifiants
108	TRIO ACNE SOIN SKI	trio-acne-soin-ski	26	Visage	\N	126	\N	\N	5	0	#F2F2F2	PEAUX GRASSES À IMPERFECTIONS MODÉRÉES À SÉVÈRES\nTRIO ACNE SOIN SKI conçu pour une application quotidienne, sa texture laisse un fini agréable, non gras et non collant, pour une absorption rapide. Grâce à sa formule régulateur de la sécrétion du sébum, mais aussi : anti-inflammatoire, anti-bactérien et un excellent apaisant des irritations de l’acné\n\nINDICATION :\n– Séborégulateur : Régule la sécrétion du sébum\n– Keratorégulateur\n– Anti-inflammatoire\n– Anti-bactérien\n– Apaisant : Apaise et calme les irritations\n\nUTILISATION :\nAppliquer DCP TRIO-ACNE SOIN S.K.I deux fois par jour sur une peau préalablement nettoyée avec DCP TRIO-ACNE GEL.\nS’applique directement sur les imperfections.\nEviter le contour des yeux.\n\nINGRÉDIENTS :\naqua, cetearyl alcohol, coco- caprylate/caprate, vitis vinifera seed oil, zinc oxide, salicylic acid, glycerin, butylene glycol, peg-60 almond glycerides, caprylyl glycol, carbomer, nordihydroguaiaretic acid, oleanolic acid, zea mays (corn) starch, niacinamide, glyceryl stearate, ceteareth-20, chlorhexidine undecylenate, allantoin, dehydroacetic acid, benzyl alcohol, butyrospermum parkii butter, ethylhexylglycerin, propanediol, xanthan gum, pyridoxine hcl, panthenol, hydrolyzed yeast protein, threonine, biotin, lactic acid, tocopherol, melaleuca alternifolia leaf oil.	31	DCP-6111263780067	6111263780067	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:53.284+00	f	contenance	same-price	f	purifiants
143	D-BIOTIC Gel rugosités 240 ml	d-biotic-gel-rugosites-240-ml	27	Visage	\N	130	\N	\N	5	0	#F2F2F2	D-biotic crème rugosités est une crème spéciale peaux \nrugueuses. Grâce à sa formule avancée à base du \ncomplexe de sept (07) Céramides, pré- pro-et postbio_x0002_tiques, l’acide salicylique, l’urée à 10 % , D-Biotic crème \nrugosités aide la peau à retrouver dès les premières appli_x0002_cations l’équilibre de l’écosystème cutané.	65	DBI-6111270660185	6111270660185	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:06.156+00	f	contenance	same-price	f	peaux-seches
127	PRURITUS-CONTROL LOTION	pruritus-control-lotion	26	Visage	\N	158	\N	\N	5	0	#F2F2F2	PRURITUS-CONTROL est une lotion spécialement conçue pour atténuer le prurit cutané non spécifique sur des peaux prurigineuses, telles que le prurit sénile, le prurit psychogène, l’intertrigo varicelle, et les maladies bulleuses. Son action vise à soulager l’inconfort causé par les irritations cutanées et les démangeaisons non spécifiques induites par des facteurs tels que les piqûres d’insectes, l’exposition à l’herbe à puce, les coupures et les éraflures, entre autres.\nCOMPOSITION :\n– 1% Menthol\n– 1% Camphre\n– Niacinamide\n– Arbre à thé\n\nINDICATIONS :\n– Soulage l’inconfort des peaux prurigineuses à irritations cutanées\n– Soulage les démangeaisons cutanées non spécifiques, les démangeaisons causées par les piqûres d’insectes, par l’herbe à puce, les coupures et les éraflures…etc.\n\nUTILISATION :\nSur une peau propre, appliquer et masser délicatement les zones touchées jusqu’à l’absorption de la lotion DCP PRURITUS-CONTROL	50	DCP-6111263780364	6111263780364	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:57.536+00	f	contenance	same-price	f	peaux-sensibles
128	HAIRLOSS SHAMPOING HOMMES	hairloss-shampoing-hommes	26	Cheveux	\N	250	\N	\N	5	0	#F2F2F2	DCP HAIRLOSS SHAMPOING Hommes est conçu avec une combinaison spéciale et efficace (de vitamine « Biotinyl-GHK » et l’Apigénine « flavonoïde d’argumes » et l’acide oléanolique des feuilles d’oliviers) qui aide à lutter contre l’alopécie, tout en stimulant la croissance des cheveux. Le mécanisme d’action du Hairloss shampoing cible spécifiquement les cellules du cuir chevelu pour lutter contre le vieillissement folliculaire.\nRésultat obtenu : Des cheveux renforcés de la racine jusqu’aux pointes\nHAIRLOSS cible: Micro-circulation, vieillissement folliculaire, ancrage des cheveux, 5x-réductase.\n\nUTILISATION :\nAppliquer sur les cheveux mouillés, bien masser, rincer, renouveler si besoin.\nRincer à nouveau et sécher les cheveux.\n\nINDICATIONS :\n– Lutte contre le vieillissement folliculaire\n– Protège contre la chute des cheveux\n– Stimule la repousse des cheveux\n– Indiqué pour tous types de cheveux et plus spécialement : cheveux cassants et abîmés\n– Fortifie la racine et la pointe\n– Nettoie tout en douceur sans dessécher : nettoie les cheveux en douceur sans les dessécher et facilite le coiffage\n– Respecte l’équilibre du cuir chevelu	51	DCP-6111263780463	6111263780463	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:57.733+00	f	contenance	same-price	f	chute-de-cheveux
130	HAIRLOSS LOTION CAPILLAIRE HOMMES	hairloss-lotion-capillaire-hommes	26	Cheveux	\N	280	\N	\N	5	0	#F2F2F2	HAIRLOSS lotion capillaire hommes est une composition riche en actifs anti-chute et des huiles essentielles : cèdre d’atlas, gingembre, romarin et centella asiatica qui permettent de lutter efficacement contre la chute de cheveux chronique chez l’homme et favorise la croissance des cheveux tout en hydratant le cuir chevelu.\n0% sulfate – 0% colorant – 0% sel .\n\nUTILISATION :\nQuotidiennement, appliquer DCP HAIRLOSS lotion.\nRépartir sur le cuir chevelu.\nFrictionner légèrement du bout des doigts.\nSécher les cheveux puis coiffer.\nEn protocole, utiliser DCP HAIRLOSS lotion avec DCP HAIRLOSS Shampoing.\n\nINDICATIONS :\n– Fortifie les cheveux\n– Aide à ralentir la chute des cheveux\n– Stimule profondément la repousse des cheveux\n– Revitalise le cuir chevelu et le tonifie sans le dessécher\n– Indiqué pour tous types de cheveux et plus spécialement : cheveux cassants et abîmés\n– Respecte l’équilibre du cuir chevelu\n\nFormule innovante - Formule haute tolerance\nHuile essentielle de cèdre d’atlas\nAide la chute de cheveux en détruisant le gras déposé dessus et en les assainissant.\nHuile essentielle de gingembre\nStimulant capillaire par excellence. Fortifiant et renforce la chevelure.\nExtrait de centella asiatica\nElle aide à stimuler la micro-circulation et les vaisseaux sanguins, limitant ainsi la chute de cheveux.\nHuile essentielle de romarin\nStimule la croissance de la fibre capillaire et la fortifie.\nCheveux plus brillants et plus soyeux.	53	DCP-6111263780487	6111263780487	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:58.136+00	f	contenance	same-price	f	chute-de-cheveux
145	D-BIOTIC Crème solaire 75 ml	d-biotic-creme-solaire-75-ml	27	Solaire	\N	200	\N	\N	5	0	#F2F2F2	D-biotic crème solaire aide à retrouver l’équilibre du \nmicrobiome naturel de la peau et à réduire le risque \nde vieillissement cutané et d’autres effets nocifs du \nsoleil.	67	DBI-6111270660192	6111270660192	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:06.553+00	f	contenance	same-price	f	solaire
119	SEPTIPLUS PH 8	septiplus-ph-8	26	Corps	\N	95	\N	\N	5	0	#F2F2F2	PROPRIÉTÉS :\nSEPTIPLUS PH 8 est une crème lavante d’usage quotidien pour l’hygiène et la protection des peaux et des muqueuses délicates.\nDCP SEPTIPLUS PH 8 atténue le taux d’acidité dans la zone intime et aide à rétablir et protéger l’équilibre naturel de la flore intime.\n\nHYGIÈNE ET PROTECTION DES PEAUX ET DES MUQUEUSES DELICATES\nINDICATIONS :\n– Soin d’hygiène et de la protection des peaux et des muqueuses délicates.\n– Limite la prolifération des mycoses.\n– Soulager les sensations d’irritations.\n– Soulager les démangeaisons et les rougeurs.\n– Adjuvants des traitements d’infections vaginales.\n\nCARACTÉRISTIQUES :\n– PH alcalin\n– Hypoallergénique\n– Calme les irritations\n– Réduit les odeurs\n– Sans savon, sans alcool\n\nPRÉCAUTIONS :\n– Ne pas avaler.\n– Tenir hors de la portée des enfants.\n– Ne pas appliquer dans les orifices naturels (yeux, nez…).\n– Usage externe.\n– Ne pas utiliser plusieurs antiseptiques à la fois.\n\nCOMPOSITION :\nAqua, Lauryl Glucoside, Cocamidopropyl Betaine, Aloe Barbadensis Leaf Extract, Disodium Cocoamphodiacetate, Coco-Glucoside, Glycerin, Glyceryl Oleate, Phenoxyethanol, Chlorphenesin, Fragrance, Triethanolamine, Olea Europaea (Olive) Fruit Oil, Calendula Officinalis Flower Extract, Arctium Majus Root Extract, Lavandula Angustifolia Oil, Sodium Benzoate, Potassium sorbate.	42	DCP-6111263780227	6111263780227	50	0	5	t	f	f	2026-09-16 12:14:24.491+00	2026-09-07 12:01:55.859+00	f	contenance	same-price	f	hygiene-intime
131	HAIRLOSS LOTION CAPILLAIRE FEMMES	hairloss-lotion-capillaire-femmes	26	Cheveux	\N	280	\N	\N	5	0	#F2F2F2	HAIRLOSS lotion capillaire femmes est une combinaison de formule unique qui renforce la croissance des cheveux et favorise à prolonger leur cycle de vie.\nRiche en huiles essentielles de cèdre d’atlas, romarin, gingembre et d’extrait de centella asiatica. DCP HAIRLOSS lotion capillaire stimule profondément la croissance des cheveux. Adaptée à tous les types de cheveux .\n\nUTILISATION :\nQuotidiennement, appliquer DCP HAIRLOSS lotion.\nRépartir sur le cuir chevelu.\nFrictionner légèrement du bout des doigts.\nSécher les cheveux puis coiffer.\nEn protocole, utiliser DCP HAIRLOSS lotion avec DCP HAIRLOSS Shampoing.\n\nFormule innovante - Formule haute tolerance\nHuile essentielle de cèdre d’atlas\nAide la chute de cheveux en détruisant le gras déposé dessus et en les assainissant.\nHuile essentielle de gingembre\nStimulant capillaire par excellence. Fortifiant et renforce la chevelure.\nExtrait de centella asiatica\nElle aide à stimuler la micro-circulation et les vaisseaux sanguins, limitant ainsi la chute de cheveux.\nHuile essentielle de romarin\nStimule la croissance de la fibre capillaire et la fortifie.\nCheveux plus brillants et plus soyeux.\nINDICATIONS :\n– Fortifie les cheveux\n– Aide à ralentir la chute des cheveux\n– Stimule profondément la repousse des cheveux\n– Revitalise le cuir chevelu et le tonifie sans le dessécher\n– Indiqué pour tous types de cheveux et plus spécialement : cheveux cassants et abîmés\n– Respecte l’équilibre du cuir chevelu	54	DCP-6111263780470	6111263780470	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:58.336+00	f	contenance	same-price	f	chute-de-cheveux
132	HAIRLOSS SERUM CAPILLAIRE	hairloss-serum-capillaire	26	Cheveux	\N	300	\N	\N	5	0	#F2F2F2	HAIRLOSS serum capillaire est une composition riche en actifs anti chute et des huiles essentielles : centella asiatica, ortie piquante, gingembre, romarin et cèdre d’atlas qui permettent de lutter efficacement contre la chute de cheveux chronique et favorise la croissance des cheveux tout en hydratant le cuir chevelu.\n0% sulfate – 0% colorant – 0% sel .\n\nINDICATIONS :\n– Active la microcirculation\n– Limite et contrôle la chute de cheveux\n– Stimule la repousse des cheveux\n– Favorise l’ancrage des cheveux\n– Renforce le cheveu\n– Calme et limite les démangeaisons\n\nUTILISATION :\nAppliquez DCP HAIRLOSS Sérum sur le cuir chevelu propre, cheveux secs ou mouillés.\nPulvériser, masser le sérum puis coiffez-vous.\nDeux à trois fois par semaine, pendant trois à quatre mois.\nNe pas rincer.\n\nFormule innovante - Formule haute tolerance\nExtrait de centella asiatica\nElle aide à stimuler la micro-circulation et les vaisseaux sanguins, limitant ainsi la chute de cheveux.\nExtrait d’ortie piquante\nAction vivifiante et stimulante, action tonifiante. Aide à stimuler l’oxygénation du cuir chevelu.\nHuile essentielle de cèdre d’atlas\nAide la chute de cheveux en détruisant le gras déposé dessus et en les assainissant.\nHuile essentielle de gingembre\nStimulant capillaire par excellence. Fortifiant et renforce la chevelure.\nHuile essentielle de romarin\nStimule la croissance de la fibre capillaire et la fortifie.\nCheveux plus brillants et plus soyeux.	55	DCP-6111263780432	6111263780432	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:58.529+00	f	contenance	same-price	f	chute-de-cheveux
221	CREME HYDRA-PERLEE A L'ACIDE HYALURONIQUE	creme-hydra-perlee-a-l-acide-hyaluronique	30	Visage	\N	560	\N	\N	5	0	#F2F2F2	95% d'ingrédients d'origine naturelle.\nPropriétés hydratantes, adoucissante, apaisantes et régénérantes.\nConvient à tous types de peaux y compris les peaux sensibles.\nPénètre rapidement, sans laisser de fil gras sur la peau.\nNon comédogène et non acnéigène.\nEffet matifiant, moins de brillance au cours de la journée.	142	HEL-3323031123003	3323031123003	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:24.988+00	f	contenance	same-price	f	peaux-seches
222	SERUM EXPERT FERMETE	serum-expert-fermete	30	Visage	\N	450	\N	\N	5	0	#F2F2F2	Le Sérum Expert Fermeté HELIABRINE est un soin intensif conçu pour raffermir et revitaliser les peaux en manque de tonus. Sa formule légère et concentrée cible le relâchement cutané tout en lissant et tonifiant la peau. Idéal pour les peaux matures ou en perte d’élasticité, ce sérum offre une action anti-âge complète.	143	HEL-SERUM-EXPERT-FERMETE-765F18	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:25.34+00	f	contenance	same-price	f	anti-age
243	SHAMP CHEVEUX ANTI-PELLICULAIRE 200 ML	shamp-cheveux-anti-pelliculaire-200-ml	31	Cheveux	\N	220	\N	\N	5	0	#F2F2F2	SHAMP CHEVEUX ANTI-PELLICULAIRE 200 ML	\N	ECR-SHAMP-CHEVEUX-ANTI-PELLI-726D56	\N	50	0	5	f	f	f	2026-09-07 12:05:36.166+00	2026-09-07 12:02:28.838+00	f	contenance	same-price	f	\N
133	HAIRLOSS MASQUE CAPILLAIRE	hairloss-masque-capillaire	26	Cheveux	\N	220	\N	\N	5	0	#F2F2F2	HAIRLOSS masque capillaire est une composition riche en actifs anti-chute et des huiles naturelles : ortie piquante, argan, avocat et karité qui permettent de lutter efficacement contre la chute de cheveux chronique et favorise la croissance des cheveux tout en hydratant le cuir chevelu.\n0% sulfate – 0% colorant – 0% sel .\n\nINDICATIONS :\n– Fortifie les cheveux et les rend plus résistants et volumineux grâce à une combinaison spéciale à base Extrait d’ortie piquante, l’Huile d’argan, l’huile d’avocat et le beurre de karité\n– Stimule la repousse des cheveux\n– Régénératrice et nourrit intensément vos cheveux\n– Régule le sébum pour les cheveux gras et apaise les états pelliculaires\n– Extrait d’orti piquante : Fortifiant naturel, riche en sels minéraux et oligo-éléments (soufre, zinc, cuivre…), apaisante\n\nUTILISATION :\nAppliquer sur les cheveux mouillés, bien masser, rincer, renouveler si besoin.\nRincer à nouveau et sécher les cheveux.\n\nFormule innovante - Formule haute tolerance\nExtrait d’ortie piquante\nAction vivifiante et stimulante, action tonifiante. Aide à stimuler l’oxygénation du cuir chevelu.\nHuile d’argan\nNourrissant et régénérant de la fibre capillaire. Redonne force, douceur, volume et brillance à la chevelure.\nHuile d’avocat\nRiche en acides gras essentiels, l’huile d’avocat, protège, nourrit et répare la chevelure. L’huile d’avocat pénètre les cheveux sans les surgraisser.\nBeurre de karité\nHydrate et lisse les cheveux crépus, ondulés, bouclés ou frisés. Répare, renforce et nourrit les cheveux cassés, secs et ternes.	56	DCP-6111263780449	6111263780449	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:58.722+00	f	contenance	same-price	f	chute-de-cheveux
134	KOPROZ MOUSSE NETTOYANTE	koproz-mousse-nettoyante	26	Visage	\N	130	\N	\N	5	0	#F2F2F2	KOPROZ Mousse Nettoyante est une combinaison purifiante multi-action spécifiquement formulée pour répondre aux besoins des peaux sensibles sujettes aux rougeurs. \nAvec une texture mousse onctueuse KOPROZ Mousse enveloppe la peau d'une douceur réconfortante tout en éliminant efficacement les impurtés. \nCrème concentrée anti-rougeurs intense, avec une formule riche en actifs puissants, KOPROZ A.Z se distingue par son approche ciblée pour atténuer efficacement et rapidement les rougeurs sévères. ---- 10% Gel d'Aloe Vera: Hydratant et apaisant, il nettoie la peau sans provoquer d'irritation. \n- Allantoïne : Aux propriétés apaisantes, favorisant la régénération cutanée et le confort. \n- Extrait de Calendula : Connu pour ses vertus calmantes et réparatrices, idéal pour les peaux réactives.	57	DCP-6111263780494	6111263780494	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:59.084+00	f	contenance	same-price	f	purifiants
135	KOPROZ CREME SOLAIRE 50+	koproz-creme-solaire-50	26	Solaire	\N	160	\N	\N	5	0	#F2F2F2	KOPROZ 50+ est formulée pour protéger les peaux sèches sensibles et surtout sujettes aux rougeurs. \nKOPROZ 50+ combine protection et soin réparateur pour garder votre peau protégée et apaisée. \n2% Niacinamide: Améliore la barrière cutanée, réduit les inflammations et favorise l'uniformité du teint. \n- Extrait de Calendula : Apaise et répare la peau, renforçant sa confort naturellement. \n- \nAllantoïne: Hydrate et calme la peau, procurant un confort immédiat.	58	DCP-6111263780500	6111263780500	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:59.444+00	f	contenance	same-price	f	solaire
241	SHAMP CHEVEUX SECS 200 ml	shamp-cheveux-secs-200-ml	31	Cheveux	\N	220	\N	\N	5	0	#F2F2F2	SHAMP CHEVEUX SECS 200 ml	\N	ECR-SHAMP-CHEVEUX-SECS-200-M-968F76	\N	50	0	5	f	f	f	2026-09-07 12:05:36.166+00	2026-09-07 12:02:28.811+00	f	contenance	same-price	f	\N
136	KOPROZ A.Z CREME CONCENTREE INTENSE	koproz-a-z-creme-concentree-intense	26	Visage	\N	160	\N	\N	5	0	#F2F2F2	soin concentré en actifs apaisants spécialement formulée pour peaux à rougeurs intenses localisées. La Crème Concentrée KOPROZ A.Z permet à la peau de retrouver une peau plus calme et un teint plus net.	59	DCP-6111263780517	6111263780517	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:59.807+00	f	contenance	same-price	f	purifiants
137	KOPROZ R.P CREME REPARATRICE	koproz-r-p-creme-reparatrice	26	Visage	\N	120	\N	\N	5	0	#F2F2F2	KOPROZ R.P est une crème réparatrice qui favorise à réparer et protéger les peaux sensibles, sèches à rougeurs installées et aux petits vaisseaux visibles. L'extrait de centella asiatica, l'extrait de bardane et le bisabolol s'associent pour offrir à la peau sensible des bénéfices hydratants, apaisants et réparateurs.	60	DCP-6111263780524	6111263780524	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:00.166+00	f	contenance	same-price	f	cremes-cicatrisantes
148	D-BIOTIC Spray solaire Pédiatrique 100 ml	d-biotic-spray-solaire-pediatrique-100-ml	27	Solaire	\N	190	\N	\N	5	0	#F2F2F2	D-biotic spray solaire Pédiatrique est une combinaison puissante d’actifs à synergie maximale de protection, réparation et d’hydratation.	70	DBI-6111270660239	6111270660239	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:07.172+00	f	contenance	same-price	f	solaire
149	D-BIOTIC Velvet 50 ml	d-biotic-velvet-50-ml	27	Solaire	\N	270	\N	\N	5	0	#F2F2F2	D-Biotic Velvet Sunscreen offre une protection avancée contre les rayons UV grâce à son indice de protection solaire (SPF) élevé de 50+, toucher sec, sans eau.	71	DBI-6111270660253	6111270660253	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:07.37+00	f	contenance	same-price	f	solaire
157	SEBIOTIC Mousse purifiante	sebiotic-mousse-purifiante	27	Visage	\N	160	\N	\N	5	0	#F2F2F2	La mousse nettoyante Sebiotic netoie en profondeur une peau grasse sujette à l'acné Aide la peau à retrouver son calme et son équilibre cutané.\nFavorise à réduire les imperfection et la brillance dès les premières utilisations.	79	DBI-6111270660406	6111270660406	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:09.171+00	f	contenance	same-price	f	purifiants
159	SEBIOTIC Soin protecteur gelée	sebiotic-soin-protecteur-gelee	27	Visage	\N	170	\N	\N	5	0	#F2F2F2	Renforce la protection du biorythme cutané.	81	DBI-6111270660437	6111270660437	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:09.57+00	f	contenance	same-price	f	purifiants
164	ECLABIOTIC RADIANCE	eclabiotic-radiance	27	Visage	\N	280	\N	\N	5	0	#F2F2F2	Cette crème légère combine efficacité éclaircissante et soin quotidien\npour corriger les taches pigmentaires et prévenir leur apparition.\nElle agit à la source des désordres pigmentaires tout en protégeant la\npeau contre les agressions extérieures. Grâce à une synergie d’actifs\npuissants, elle aide à unifier le teint, améliorer l’éclat et renforcer la\nbarrière cutanée.	86	DBI-6111270660468	6111270660468	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:10.58+00	f	contenance	same-price	f	anti-taches
187	C30 SERUM	c30-serum	29	Visage	\N	280	\N	\N	5	0	#F2F2F2	Propriétés\nHTCeutic C30-Serum est un Sérum concentré multi action antioxydant à base de Vitamine C pure à 30%.\nIndications\nHTCeutic C30-Serum devient le geste quotidien indispensable pour prévenir et corriger les signes de l’âge rides, ridules, teint terne.\nRésultats prouvés après les premières utilisations suivies de la HTCeutic crème booster.	109	HTC-6111267180054	6111267180054	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:17.079+00	f	contenance	same-price	f	anti-age
199	WHITE GEL	white-gel	29	Visage	\N	230	\N	\N	5	0	#F2F2F2	Hautement concentré en actifs éclaircissants,\nHTCEUTIC White Gel nettoie en douceur et\nrévéle l’éclat naturel de votre peau.	121	HTC-6111267180207	6111267180207	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:19.38+00	f	contenance	same-price	f	anti-taches
125	CICASEPT	cicasept	26	Corps	\N	142	\N	\N	5	0	#F2F2F2	CICASEPT est spécialement formulée pour répondre aux besoins des peaux sensibles et réactives, cette crème cicatrisante contribue à atténuer tous les signes des irritations sèches de la peau.\n\nUTILISATION :\nAppliquer DCP CICASEPT, une à deux fois par jour sur la zone irritée et sèche préalablement nettoyée par DCP SYNDET LIPIDIK. Laisser le soin pénétrer la zone irritée.\n\nINDICATIONS :\nGrâce à sa formule innovante, DCP CICASEPT couvre un large spectre d’utilisations :\n– Eczéma atopique comme crème aseptisante, cicatrisante et relais des corticoïdes\n– Crème cicatrisante\n– Brûlures 1er et 2ème degré\n– Coup de soleil\n– Irritations des peaux intolérantes\n– Post-laser\n– Post-actes chirurgicaux\n– Post-peeling\n– Post-épilation\n– Peaux fragilisées\n– Echauffements cutanés\n– Plaies non suintantes\n– Crevasses\n– Gerçures\n– Plaques rouges\n– Crème réparatrice aseptisante pour toute la famille\n– Tous types de peaux\n\nEfficacité cliniquement prouvée avec la synergie de multiples principes actifs bien choisis pour des résultats rapides.\nHuile de ricin : cicatrisante, antibactérienne, antifongique, photo-protectrice et adoucissante.\nBeurre de karité : hydratante, adoucissante et réparatrice.\nCentella asiatica : cicatrisante des plaies et brûlures, eczéma, ulcère et synthèse de collagène et élastine.\nChlorhexidine undecylenate : antiseptique, antimicrobien biodégradable à large spectre plus efficace contre les bactéries gram-positives et gram-négatives, antifongique, antiparasitaire et mieux toléré que la Chlorhexidine classique.\nPropolis : antiseptique, antiradicalaire, cicatrisante, traitement des brûlures légères, engelures et crevasses.\nLécithine : émollient.\nHuile d’olive : nourrissante, émolliente, calmante et anti-oxydante.\nHuile de tournesol : riche en acides gras monoinsaturés, omega 6 et omega 9, hydratation des peaux sensibles irritées.\nPanthénol (ou provitamine B5) : hydratant, notamment pour soigner les peaux sensibles et sèches.	48	DCP-6111263780135	6111263780135	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:57.024+00	f	contenance	same-price	f	cremes-cicatrisantes
188	CRÉME BOOSTER	creme-booster	29	Visage	\N	160	\N	\N	5	0	#F2F2F2	Propriétés\nLe soin Créme Booster, est un soin ultra concentré, renforce l’efficacité du C30-Sérum et offre une peau profondément hydratée, repulpée,jeune et lisse.\nTexture crème légère, le soin Créme Booster s’absorbe rapidement, et surtout, convient à tous les types de peau.\nIndications\nSa formule riche, combinant plusieurs actifs, permet de booster l’effet et le potentiel de la vitamine C et offre un éclat remarquable dès la première utilisation.	110	HTC-6111267180047	6111267180047	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:17.271+00	f	contenance	same-price	f	anti-age
189	PROTEK SPF 50+	protek-spf-50	29	Solaire	\N	240	\N	\N	5	0	#F2F2F2	Propriétés\nPROTEK SPF 50+ protège les peaux les plus fragiles.\nGrâce à sa formule spécifique, PROTEK SPF 50+ redonne à la peau son confort habituel.\nIndications\n• Excellent pour les formulations\nesthétiques.\n• Renforce la protection sur tout le spectre\nUVA/UVB.\n• Réduction potentielle de l’irritation causée\npar les principes actifs pour une grande\nvariété de produits cosmétiques utilisant\ndes filtres UV inorganiques ou organiques.\n• Excellent pour les formulations résistantes\nà l’eau.	111	HTC-6111267180016	6111267180016	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:17.465+00	f	contenance	same-price	f	solaire
190	RETINOL SERUM 0.5%	retinol-serum-0-5	29	Visage	\N	220	\N	\N	5	0	#F2F2F2	Propriétés\nRETINOL SERUM 0.5% stimule l’élasticité de la peau, régénère les cellules et renforcela barrière cutanée agressée par les signes de l’âge.\nComplexe d’actifs pour une peau jeune et saine.\nPeaux fines.\nIndications\nRETINOL SERUM 0.5% est le soin quotidien qui réduit visiblement les rides, ridules et corrige le teint en améliorant sa pigmentation.	112	HTC-6111267180092	6111267180092	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:17.654+00	f	contenance	same-price	f	anti-age
191	RETINOL SERUM 2%	retinol-serum-2	29	Visage	\N	250	\N	\N	5	0	#F2F2F2	Propriétés\nRETINOL SERUM 2% est un soin de peau contre les signes de l’âge et l’irrégularité du teint.\nDestiné pour les peaux qui manquent de fermeté et les peaux grasses à tendance acnéique.\nIndications\nEfficace pour stopper et diminuer les signes de l’âge ( rides, ridules) et améliorer la texture et la pigmentation de la peau, Formule spéciale à 2% de Rétinol avec une synergie de plusieurs autres actifs pour un résultat anti-âge supérieur et surtout avec moins d’irritation.	113	HTC-6111267180085	6111267180085	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:17.843+00	f	contenance	same-price	f	anti-age
192	CRÉME RÉGÉNÉRANTE SPF 15	creme-regenerante-spf-15	29	Solaire	\N	280	\N	\N	5	0	#F2F2F2	Propriétés\nHTCEUTIC CRÈME RÉGÉNÉRANTE à base de Vit-A-Like est un soin quotidien qui possède des propriétés anti-âge et aide à stimuler le renouvellement cellulaire et la synthèse du collagène.\nIndications\nHTCEUTIC CRÈME RÉGÉNÉRANTE favorise la réduction des signes de l’âge : rides, ridules et décoloration du teint.\nPermet à la peau de retrouver sa souplesse et redonne ce résultat hydraté, jeune et raffermit.\nExcellente pour les peaux matures et sèches.	114	HTC-6111267180078	6111267180078	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:18.037+00	f	contenance	same-price	f	solaire
193	AHA GEL PRE-PEELING	aha-gel-pre-peeling	29	Visage	\N	200	\N	\N	5	0	#F2F2F2	Propriétés\nHTCEUTIC AHA gel soft and smooth est un nettoyant hydratant pré-peeling.\nGel soft de couleur vert turquoise, nettoie en douceur, aide à, préparer la peau à recevoir les autres soins de la gamme HTCEUTIC AHA et surtout à recevoir le peeling médical.\nLaisse un pH idéal pour une action optimale des AHA.\nIndications\nHTCEUTIC AHA et surtout à recevoir le peeling médical.\nLaisse un pH idéal pour une action optimale des AHA.	115	HTC-6111267180160	6111267180160	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:18.228+00	f	contenance	same-price	f	peelings-doux
196	AHA CRÉME PEELING 20%	aha-creme-peeling-20	29	Visage	\N	150	\N	\N	5	0	#F2F2F2	Propriétés\nHTCEUTIC AHA 20% crème est une crème peeling conçue spécialement pour une application sur les peaux sèches à base de 20% d’acide glycolique.\nIndications\nÀ base de 20% d’acide glycolique.	118	HTC-6111267180122	6111267180122	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:18.802+00	f	contenance	same-price	f	peelings-doux
112	DÉPI CRÈME	depi-creme	26	Visage	\N	399	\N	\N	5	0	#F2F2F2	GEL NETTOYANT ECLAIRCISSANT ACTIF - TOUS TYPES DE PEAU\nDépi-gel est un gel nettoyant éclaircissant à base de 6 ingrédients actif, spécialement formulé pour atténuer de manière efficace la dimension et la pigmentation de toute variété de tâches cutanées, indépendamment de leur origine (telles que celles induites par l’exposition au soleil, le vieillissement cutané ou les marques d’imperfections). \n\nLa formulation spécifique de Dépi-gel vise ainsi à homogénéiser la pigmentation de la peau, tout en stimulant simultanément l’éclat du teint, et ce, dans l’objectif d’offrir une apparence plus unifiée et lumineuse à l’épiderme.\n\nDépi-gel est conseillé pour tous les types de taches brunes\n\nPROPRIÉTÉS :\n– Accélère le renouvellement cellulaire\n– Élimine les squames\n– Nettoie en profondeur\n\nINDICATIONS :\n– Éclaircit et unifie le teint\n– Favorise à diminuer considérablement l’apparence des taches pigmentaires\n\nUTILISATION :\nUtiliser Dépi-gel matin et soir sur un visage légèrement humidifié. Rincer soigneusement.\n\nINGRÉDIENTS ACTIF :\n– Vitamine C et E : Eviction anti-inflamatoire antioxydants\n\n– Allontoine & Bisabolol : Agents anti-irritants\n\n– Acide salicilyque\n\n– Niacinamide	35	DCP-6111263780043	6111263780043	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:54.5+00	f	contenance	same-price	f	apres-epilation
140	D-BIOTIC Gel surgras 240 ml	d-biotic-gel-surgras-240-ml	27	Visage	\N	130	\N	\N	5	0	#F2F2F2	D-Biotic gel nettoyant surgras est un gel à base d’un \ncomplexe spécifique de sept (07) Céramides, des \nactifs probiotiques et actifs ultra hydratants, aide la \npeau à retrouver son équilibre naturel, favorise à \nrenforcer l’écosystème cutané.	62	S2-42134	6111270660161	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:05.531+00	f	contenance	same-price	f	peaux-seches
142	D-BIOTIC Baume hydratant régénérant 150 ml	d-biotic-baume-hydratant-regenerant-150-ml	27	Visage	\N	250	\N	\N	5	0	#F2F2F2	D-Biotic baume hydratant régénérant est un soin ultra \nhydratant, richement formulé à base d’une combinaison \npuissante de sept (07) Céramides, d’actifs hydratants,\nrégénérants et restructurants de l’écosystème cutané.	64	DBI-6111270660154	6111270660154	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:05.931+00	f	contenance	same-price	f	peaux-seches
115	SOIN LIPIDIK	soin-lipidik	26	Corps	\N	179	\N	\N	5	0	#F2F2F2	Propriétés :\n– Vaseline (filmogène)\n– Glycérine (humectant anti-déshydratation)\n– Huile minérale (filmogène )\n– Beurre de karité (relipidant riche en acides gras essentiels)\n– Niacinamide (anti-inflammatoire)\n– Calendula (apaisante)\n– Centella asiatica (cicatrisante)\n– Acides aminés (reconstruisent la structure des protéines de la peau : kératine, collagène, élastine et peptides)\n– Aloès Vera (Hydratante et anti-inflammatoire)\n\nAvantages :\n– Soin quotidien des peaux atopiques et sensibles ( Nourrison, enfant, adulte )\n– Visage et corps\n– Testé sous contrôle dermatologique Hypoallergénique\n– Sans parfum\n– Sans conservateur Économique : 200 ml\n\nBénéfices :\n– Emollient relipidant\n– Apaisant\n– Anti-grattage\n– Anti-inflammatoire\n– Décongestionnant\n– Réparateur cicatrisant\n– Eclaircissant\n– Espace les poussées d’eczéma atopique Souplesse, vitalité, douceur et confort immédiats Relais des corticoïdes	38	DCP-6111263780128	6111263780128	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:55.08+00	f	contenance	same-price	f	peaux-seches
116	KPP SOIN	kpp-soin	26	Corps	\N	151	\N	\N	5	0	#F2F2F2	KPP SOIN est un traitement intensif qui agit en profondeur pour adoucir et assouplir la peau rugueuse et épaisse des mains et des pieds, tout en procurant une sensation de douceur et de confort.\nNotre traitement d’attaque KPP SOIN, caractérisé par une texture douce et onctueuse, apporte souplesse et douceur à la peau râpeuse et épaisse. Sa composition est riche en principes actifs hydratants et adoucissants, tels que l’urée, l’acide salicylique et le beurre de karité.\nCes ingrédients agissent en synergie pour régénérer les cellules endommagées, nourrir profondément l’épiderme et restaurer l’élasticité de la peau.\nGrâce à ces actions combinées, le KPP SOIN permet d’améliorer considérablement l’état de la peau des mains et des pieds, en les rendant plus doux, souples et agréables au toucher.\nINDICATIONS :\n– Kératodermies palmoplantaires\n– Callosités\n– Rugosités\n– Cors et durillons\n\nUTILISATION :\nAppliquer DCP KPP SOIN sur les paumes des mains et/ou les plantes des pieds. Laisser agir 1 heure à 2 heures, puis frotter délicatement pour enlever la peau morte.\n\nPRINCIPES ACTIFS\n– 30 0/0 Urée: Action keratolytique.\n– 2% Acide salicylique: Action kératorégulatrice.\n– 5% Beurre de karité :\n – hydratation profonde et durablele des couches supérieures de l’épiderme\n – régénération plus rapide.	39	DCP-6111263780302	6111263780302	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:55.277+00	f	contenance	same-price	f	laits-corps
144	D-BIOTIC Crème rugosités 150 ml	d-biotic-creme-rugosites-150-ml	27	Visage	\N	250	\N	\N	5	0	#F2F2F2	D-biotic crème rugosités est une crème spéciale peaux \nrugueuses. Grâce à sa formule avancée à base du \ncomplexe de sept (07) Céramides, pré- pro-et postbio_x0002_tiques, l’acide salicylique, l’urée à 10 % , D-Biotic crème \nrugosités aide la peau à retrouver dès les premières appli_x0002_cations l’équilibre de l’écosystème cutané.	66	DBI-6111270660178	6111270660178	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:06.355+00	f	contenance	same-price	f	peaux-seches
117	BAUME ESSENTIEL	baume-essentiel	26	Corps	\N	116	\N	\N	5	0	#F2F2F2	BAUME ESSENTIEL est un traitement adjuvant spécifiquement conçu pour les soins des pieds et des mains. Enrichi en principes actifs tels que la Niacinamide, la Propolis, la Centella asiatica et le Beurre de karité, ce baume agit en synergie pour apporter une hydratation profonde et durable aux couches supérieures de l’épiderme.\nLa Niacinamide favorise la régulation hydrique, tandis que la Propolis offre des propriétés antimicrobiennes bénéfiques. De plus, la Centella asiatica contribue à la cicatrisation cutanée et le Beurre de karité renforce la barrière cutanée.\nCette formulation scientifique optimale assure un soin complet et efficace pour une peau radieuse et saine.\n\nINDICATIONS :\n– Fissures et crevasses\n– Pied diabétique\n\nUTILISATION :\nAppliquer DCP BAUME ESSENTIEL sur les paumes des mains et/ou les plantes des pieds fissurées et crevassées quotidiennement 2 à 3 fois par jour.\nGrâce à sa texture soyeuse, DCP BAUME ESSENTIEL s’étale facilement.\n\nPRINCIPES ACTIFS\n– Niacinamide: action apaisante-anti-inflammatoire.\n– Propolis: Propriétés analgésiques, calmer l’inconfot et réparer les gerçures.\n– Centella asiatica: Action cicatrisante.\n– Beurre de karité :\n – Hydratation profonde et durablele des couches supérieures de l’épiderme\n – régénération plus rapide.	40	DCP-6111263780296	6111263780296	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:55.472+00	f	contenance	same-price	f	laits-corps
146	D-BIOTIC Crème émolliente pédiatrique 200 ml	d-biotic-creme-emolliente-pediatrique-200-ml	27	Visage	\N	140	\N	\N	5	0	#F2F2F2	D-biotic crème émolliente pédiatrique est une combi_x0002_naison puissante d’actifs de dernière génération à base de sept (07) Ceramides et des actifs pré, pro et post biotiques	68	DBI-6111270660215	6111270660215	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:06.762+00	f	contenance	same-price	f	peaux-seches
147	D-BIOTIC Gel surgras Pédiatrique 200 ml	d-biotic-gel-surgras-pediatrique-200-ml	27	Visage	\N	120	\N	\N	5	0	#F2F2F2	D-biotic gel surgras pediatric est une combinaison puissante d’actifs de dernière génération à base de sept (07) Ceramides et des actifs pré, pro et post biotiques, conçu pour restaurer, réparer et renforcer le système de défense cutanée d’une peau délicatement altérée	69	DBI-6111270660222	6111270660222	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:06.966+00	f	contenance	same-price	f	peaux-seches
121	DS+ BASE LAVANTE	ds-base-lavante	26	Cheveux	\N	200	\N	\N	5	0	#F2F2F2	UNE BASE LAVANTE KÉRATO-RÉDUCTRICE CORPS ET CHEVEUX\nDS+ BASE LAVANTE est une base lavante anti-pelliculaire qui fait partie de la gamme DS+ conçue pour nettoyer et purifier, en douceur, le visage, le corps et le cuir chevelu sans assécher la peau.\nCette DS+ BASE LAVANTE présente plusieurs effets bénéfiques :\n– Rééquilibrage des micro-organismes présents naturellement sur le cuir chevelu ;\n– Amélioration de la fonction de barrière du cuir chevelu ;\n– Régulation de la production de sébum sur les cheveux ;\n– Diminution des démangeaisons du cuir chevelu;\n– Calme les sensations d’inconfort;\n\nPROPRIÉTÉS :​\n– Acide salicylique kerato-régulateur\n– Piroctone olamine Antifongique\n– Niacinamide Anti-inflammatoire\n– Bisabolol Apaisant\n– Badrane Apaisant\n– Bardane + Niacinamide Sébo-régulatrice\n– Extrait de clendula, Apaisante + Anti-inflammatoire\n– Huile essentielle lavande, Apaisante + Anti-inflammatoire\n– Huile de géranium Anti-pelliculaire\n– Huile de romarin Anti-pelliculaire\n– Arbre à thé Antifongique et antiseptique\n– Extrait de tazmanie Anti-inflammatoire\n– Extrait de neem Antifongique\n– Huile de menthe poivrée Rafraîchissante\n– Aloe Vera Hydratante\n– Extrait de grenade Régénérant\n– Huile d’agran Démêleur	44	DCP-6111263780142	6111263780142	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:56.245+00	f	contenance	same-price	f	shampoings-traitants
122	DS+ LOTION	ds-lotion	26	Cheveux	\N	142	\N	\N	5	0	#F2F2F2	UNE LOTION HYDRO-ALCOOLIQUE POUR TRAITEMENT DES ÉTATS SQUAMEUX SÉVÈRES\nDS+ LOTION pour les états squameux pelliculaires sévères dans leur routine de soins capillaires. La formule adaptée de DS+ LOTION assure un confort optimal et une efficacité durable.\n\nPROPRIÉTÉS :​\n– 2% Acide salicylique Kerato-régulateur\n– Piroctone olamine Antifongique\n– 2% Niacinamide Anti-inflammatoire\n– 0.1% Bisabolol Apaisant\n– 0.5% Badrane Apaisant\n– Huile de géranium Anti-pelliculaire\n– Bardane + Niacinamide Apaisant Action sébo-régulatric\n– 5% Urée Hydratant + Régulateur\n– 1 % Extrait de Tasmanie Anti-inflammatoire\n– 0.5% Extrait de neem Antifongique\n– 0.5% Chloride de Benzalkonium Antiseptique\n– Huile de menthe poivrée Rafraîchissante\n– 0.5% Aloe vera Hydratante	45	DCP-6111263780166	6111263780166	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:56.437+00	f	contenance	same-price	f	chute-de-cheveux
151	D-BIOTIC ROSABIOTIC CREME PEAUX A ROUGEURS INSTALLEES 75 ML	d-biotic-rosabiotic-creme-peaux-a-rougeurs-installees-75-ml	27	Visage	\N	150	\N	\N	5	0	#F2F2F2	D-biotic Rosabiotic Crème est une crème apaisante à base d’ actifs qui réconforte et répare les peaux sensibles à rougeurs installées.	73	DBI-6111270660277	6111270660277	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:07.762+00	f	contenance	same-price	f	peaux-sensibles
123	DS+ EMULSION	ds-emulsion	26	Corps	\N	126	\N	\N	5	0	#F2F2F2	ÉMULSION LÉGÈRE POUR UN SOIN LOCALISÉ VISAGE, COU ET CORPS\n\nDCP DS+ EMULSION est la crème qui régule le sébum, élimine les pellicules et la rougeur qui dérange notre peau et notre quotidien.\nLes formules DS+ sont hypoallergéniques et adaptées aux peaux sensibles et délicates avec un protocole dédié à la peau qui souffre de la Dermite Séborrhéique\n\nPROPRIÉTÉS :​\n– 2% Acide salicylique kérato – régulateur\n– 0,3% Piroctone olamine Antifongique\n– 0,1% Chlorure de benzalkonium Antiseptique\n– 1% Bardane Apaisant\n– 2% Niacinamide Anti-inflammatoire\n– Niacinamide + Bardine Seborégulateur\n– 5% Urée Hydratante, kérato-régulateur\n– 0,1% Alpha bisabolol Apaisant\n– 1% Aloe vera Hydratante\n– 3% Glycérine\n– 0,5% Allantoine\n– 1% Zinc pyrithione Antifongique\n– 0,5% Macérat de millepertuis Anti-inflammatoire\n– 0,07% Huile essentielle de géranium Anti-squame\n– 0,05% Huile menthe poivrée Rafraîchissante	46	DCP-6111263780159	6111263780159	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:56.638+00	f	contenance	same-price	f	laits-corps
242	SHAMP CHEVEUX GRAS 200 ml	shamp-cheveux-gras-200-ml	31	Cheveux	\N	220	\N	\N	5	0	#F2F2F2	SHAMP CHEVEUX GRAS 200 ml	\N	ECR-SHAMP-CHEVEUX-GRAS-200-M-9FB3D0	\N	50	0	5	f	f	f	2026-09-07 12:05:36.166+00	2026-09-07 12:02:28.826+00	f	contenance	same-price	f	\N
67	Fusion Water MAGIC Pediatrics SPF 50\nCrème solaire ultra-légère pour enfants	fusion-water-magic-pediatrics-spf-50-cr-me-solaire-ultra-l-g-re-pour-enfants	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	Découvrez Fusion Water Pediatrics, notre crème solaire visage SPF50, respectueuse de la peau des enfants. \n\nÉcran solaire ultra-léger pour le visage, spécialement conçu pour les enfants. Contient de l'extrait de SIEMPREVIVA, un ingrédient d'origine naturelle qui aide à apaiser la peau et à réparer et renforcer la fonction barrière de la peau. À base de vitamine E antioxydante et du panthénol, qui hydrate intensément la peau et favorise le processus naturel de régénération de la peau après une exposition au soleil. Pour les enfants à partir de 6 mois.	\N	ISD-8429420138872	8429420138872	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:32.6+00	f	contenance	same-price	f	\N
68	Fotoprotector ISDIN Mineral Baby Pediatrics SPF 50\nCrème solaire 100% minérale pour enfants	fotoprotector-isdin-mineral-baby-pediatrics-spf-50-cr-me-solaire-100-min-rale-pour-enfants	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	La crème solaire visage Mineral Baby, spécialement développée pour la peau des enfant et des bebés, offre une haute protection UVB/UVA SPF50 et protège également du rayonnement UV indirect.\n\nElle convient aux enfants et bébés à partir de 6 mois. Elle peut être appliquée sur le visage comme sur le corps de votre enfant. \n\nSes filtres sont 100% minéraux\n\nSa texture agréable est absorbée immédiatement par la peau. \n\nCette crème minérale étant très résistante à l'eau et à la friction, elle sera votre alliée de choix pour protéger vos enfants du soleil. \n\nTestée sous contrôle pédiatrique et dermatologique. Hypoallergénique. Sea Friendly.	\N	ISD-8429420122581	8429420122581	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:32.829+00	f	contenance	same-price	f	\N
69	Fotoprotector ISDIN Transparent Spray Wet Skin Pediatrics SPF 50\nCrème solaire corps en spray pour enfants	fotoprotector-isdin-transparent-spray-wet-skin-pediatrics-spf-50-cr-me-solaire-corps-en-spray-pour-enfants	25	Solaire	\N	285	\N	\N	5	0	#F2F2F2	La crème solaire Transparent Wet Skin offre une protection élevée contre les UVB et les UVA (SPF 50).\n\nFormule améliorée à base de SiempreViva extract qui apaise et renforce la barrière cutanée.\n\nLa technologie Wet Skin permet son absorption sur peau humide ou sèche sans laisser de résidu blanc.Très résistante à l'eau. \n\nAbsorption rapide et instantanée avec une touche finale soyeuse et ultra-sèche.\n\nSon format spray permet son application dans n'importe quelle direction.\n\nConvient à tous les types de peaux, y compris les peaux atopiques.	\N	ISD-8470001674241	8470001674241	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:33.053+00	f	contenance	same-price	f	\N
70	Fotoprotector ISDIN Lotion Spray Pediatrics SPF 50\nCrème solaire corps hydratante en spray pour enfants	fotoprotector-isdin-lotion-spray-pediatrics-spf-50-cr-me-solaire-corps-hydratante-en-spray-pour-enfants	25	Solaire	\N	285	\N	\N	5	0	#F2F2F2	Crème solaire corps spécialement formulée pour la peau fragile des enfants. Hydrate et pénètre immédiatement la peau sans laisser de résidu \n\nFormule améliorée à base de SiempreViva extract qui calme et renforce la barrière cutanée. \n\nÀ base de Vitamine E et Dexpanthenol \n\nTesté pédiatriquement et dermatologiquement.\n\nConvient à tous les types de peaux, y compris les peaux atopiques et sensibles.	\N	ISD-8429420196919	8429420196919	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:33.298+00	f	contenance	same-price	f	\N
71	Fotoprotector ISDIN Gel Cream Pediatrics SPF 50\nLa crème solaire corps tout-terrain pour toute la famille	fotoprotector-isdin-gel-cream-pediatrics-spf-50-la-cr-me-solaire-corps-tout-terrain-pour-toute-la-famille	25	Solaire	\N	285	\N	\N	5	0	#F2F2F2	Crème solaire formulée spécialement pour les enfants.\n\nAssure une protection élevée UVB et UVA SPF 50. \n\nHydrate comme une crème et s’absorbe rapidement comme un gel, en procurant une agréable sensation de fraîcheur avec une finition soyeuse et sans aspect brillant. \n\nTrès résistante à l'eau et aux frottements. \n\nConvient à tous les types de peaux, y compris les peaux atopiques.	\N	ISD-8429420245822	8429420245822	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:33.523+00	f	contenance	same-price	f	\N
152	D-BIOTIC ROSABIOTIC TRI-PHASIQUE NETTOYANT 200 ML	d-biotic-rosabiotic-tri-phasique-nettoyant-200-ml	27	Visage	\N	260	\N	\N	5	0	#F2F2F2	D-biotic Rosabiotic Tri-phasique Nettoyant Huile en gel en lait est conçu en trois phases pour répondre aux attentes des peaux à rougeurs, sensibles et irritées.	74	DBI-6111270660260	6111270660260	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:07.97+00	f	contenance	same-price	f	peaux-sensibles
154	D-BIOTIC CICABIOTIC 75 ML	d-biotic-cicabiotic-75-ml	27	Visage	\N	150	\N	\N	5	0	#F2F2F2	D-biotic Cicabiotic Soin réparateur pour les cicatrices atténue visiblement l’apparence de la cicatrice, favorise le processus naturel de la réparation, aide à régénérer les cellules de la peau, atténue les rougeurs dues aux cicatrices.	76	DBI-6111270660321	6111270660321	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:08.582+00	f	contenance	same-price	f	cremes-cicatrisantes
226	BB CREAM SOIN TEINTE SPF 30	bb-cream-soin-teinte-spf-30	30	Solaire	\N	400	\N	\N	5	0	#F2F2F2	BB Crème Teintée Beige SPF 30 d’HELIABRINE, un soin multifonction qui hydrate, unifie et protège la peau tout en corrigeant les imperfections. Idéale pour celles qui recherchent un teint lumineux et naturel, cette crème offre une mise en beauté instantanée en un seul geste.	147	HEL-BB-CREAM-SOIN-TEINTE-SPF-B8398B	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:26.183+00	f	contenance	same-price	f	solaire
72	Eryfotona® Night\nSérum de nuit	eryfotona-night-s-rum-de-nuit	25	Visage	\N	330	\N	\N	5	0	#F2F2F2	Sérum de nuit qui aide à réparer les dommages dus au soleil et favorise le renouvellement de la peau\nFavorisez le renouvellement de votre peau pendant votre sommeil avec le sérum de nuit Eryfotona Night. Il hydrate, offre une action antioxydante et aide à réparer et à prévenir les dommages dus au soleil accumulés au niveau cellulaire, améliorant l’apparence de la peau.\n\nSans parfum , absorption immédiate, non comédogène, mineral oil free, testé dermatologiquement et ophtalmologiquement, hypoallergénique : formulé pour minimiser le risque d’allergie.	\N	ISD-8429420285033	8429420285033	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:33.896+00	f	contenance	same-price	f	\N
73	Eryfotona AK-NMSC Fluid SPF100+\nCrème solaire fluide	eryfotona-ak-nmsc-fluid-spf100-cr-me-solaire-fluide	25	Solaire	\N	330	\N	\N	5	0	#F2F2F2	Crème solaire fluide qui prévient et répare le dommage actinique. Donnez une nouvelle chance à votre peau.\nPrévention et traitement adjuvant de la kératose actinique et d’autres formes de cancer non mélanome. Réduit et améliore le champ de cancérisation subclinique associé à la kératose actinique et au cancer cutané non mélanome. Cette crème solaire SPF100+ prévient et favorise la réparation du dommage actinique causé par le soleil. \n\nIl dépose sur la peau un film protecteur d’ADN Repairsomes® qui aide à prévenir l’apparition de nouvelles lésions. \n\nDe plus, une utilisation continue stimule le mécanisme de réparation naturel de l’ADN. \n\nSa texture fluide et ultra-légère est résistante à l'eau.	\N	ISD-8429420070875	8429420070875	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:34.12+00	f	contenance	same-price	f	\N
74	Acniben® Nettoyant matifiant\nGel pour le visage et le corps	acniben-nettoyant-matifiant-gel-pour-le-visage-et-le-corps	25	Corps	\N	230	\N	\N	5	0	#F2F2F2	Gel pour le visage et le corps qui nettoie les peaux grasses et acnéiques.\nNettoyez sans dessécher la peau du corps et du visage avec Acniben® Nettoyant matifiant. Il désobstrue les pores, élimine les impuretés et réduit l'excès de sébum des peaux grasses ou acnéiques, les laissant fraîches et matifiées.\n\nNon comédogène, sans huile minérale, ne laisse pas de résidu gras, testé sous contrôle dermatologique.	\N	ISD-8429420227590	8429420227590	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:34.351+00	f	contenance	same-price	f	\N
75	Acniben® Nettoyant purifiant\nMousse faciale	acniben-nettoyant-purifiant-mousse-faciale	25	Visage	\N	175	\N	\N	5	0	#F2F2F2	Mousse faciale qui nettoie et purifie les peaux grasses et acnéiques.\nNettoyez votre visage avec la mousse nettoyante purifiante Acniben®. Sa formule à base de niacinamide purifie délicatement et en douceur la peau, en aidant à éliminer l'excès de sébum et à réduire la brillance.\n\nSoins pour les peaux à tendance acnéique.	\N	ISD-8470003245913	8470003245913	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:34.576+00	f	contenance	same-price	f	\N
76	Acniben® Contrôle de la brillance et des boutons\nGel crème pour le visage	acniben-contr-le-de-la-brillance-et-des-boutons-gel-cr-me-pour-le-visage	25	Visage	\N	210	\N	\N	5	0	#F2F2F2	Gel crème pour le visage pour contrôler la brillance et les boutons sur les peaux sujettes à l'acné.\nCombattez les boutons et les imperfections des peaux grasses ou sujettes à l'acné avec la crème visage à texture légère Acniben® Contrôle de la brillance et des boutons. Sa formule à base de Zinc PCA et d'acide hyaluronique hydrate et matifie, offrant un fini soyeux.\n\nNon comédogène, sans huile minérale, ne laisse pas de résidu gras, testé sous contrôle dermatologique.	\N	ISD-8470003245920	8470003245920	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:34.818+00	f	contenance	same-price	f	\N
77	Acniben® Concentré Nuit\nSérum de nuit au rétinaldéhyde pour les peaux grasses	acniben-concentr-nuit-s-rum-de-nuit-au-r-tinald-hyde-pour-les-peaux-grasses	25	Visage	\N	330	\N	\N	5	0	#F2F2F2	Redonnez de l'éclat aux peaux grasses et acnéiques avec Acniben® Concentré Nuit Anti-Imperfections. Sa formule puissante, à base de rétinaldéhyde, de zinc PCA et de niacinamide, aide à atténuer et à prévenir les boutons, les points noirs et les marques résiduelles sur la peau.\n\nNon comédogène, sans huile minérale.	\N	ISD-8429420236844	8429420236844	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:35.052+00	f	contenance	same-price	f	\N
79	Acniben® Masque Visage Purifiant	acniben-masque-visage-purifiant	25	Visage	\N	190	\N	\N	5	0	#F2F2F2	Nettoie en profondeur et aide à réduire immédiatement l'excès de sébum\nLe masque facial purifiant Acniben® apporte une hygiène supplémentaire aux peaux grasses ou sujettes à l'acné. Il nettoie en profondeur et réduit immédiatement l'excès de sébum, contribuant ainsi à atténuer la brillance et les imperfections telles que les boutons ou les points noirs.	\N	ISD-8429420236868	8429420236868	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:35.513+00	f	contenance	same-price	f	\N
84	Protector Labial Baume à lèvres SPF 50+\nBaume à lèvres très haute protection pour une utilisation dans des conditions extrêmes	protector-labial-baume-l-vres-spf-50-baume-l-vres-tr-s-haute-protection-pour-une-utilisation-dans-des-conditions-extr-mes	25	Solaire	\N	85	\N	\N	5	0	#F2F2F2	Baume à lèvres à très haute protection (SPF 50+).\n\nProtège les lèvres des agressions extérieures (vent, soleil, etc.), en les hydratant et en les nourrissant intensément.\n\nIl répare les lèvres sèches tout en contribuant à apaiser la sensation d’irritation et de rougeur, en procurant une sensation de confort.\n\nTesté dermatologiquement.	\N	ISD-8429420137974	8429420137974	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:36.693+00	f	contenance	same-price	f	\N
88	ISDIN Woman Anti-vergetures\nCrème pour le corps qui aide à prévenir et à atténuer les vergetures.	isdin-woman-anti-vergetures-cr-me-pour-le-corps-qui-aide-pr-venir-et-att-nuer-les-vergetures	25	Hygiène	\N	255	\N	\N	5	0	#F2F2F2	La crème corporelle anti-vergetures ISDIN Woman prévient l'apparition des vergetures grâce à une absorption rapide. Composée à 89% d'ingrédients d'origine naturelle, elle hydrate intensément et aide à estomper les vergetures causées par les changements corporels aigus.	\N	ISD-8429420220447	8429420220447	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:37.628+00	f	contenance	same-price	f	\N
90	Nutradeica® Shampooing Anti-pelliculaire Cheveux gras\nNettoyage et soin des cheveux et du cuir chevelu avec pellicules grasses.	nutradeica-shampooing-anti-pelliculaire-cheveux-gras-nettoyage-et-soin-des-cheveux-et-du-cuir-chevelu-avec-pellicules-grasses	25	Cheveux	\N	210	\N	\N	5	0	#F2F2F2	Le shampoing Nutradeica régule l’excès de sébum, soulage les démangeaisons du cuir chevelu et\n\nélimine les pellicules grasses grâce à sa formule à base d’Ictiole Pale et Piroctone Olamine. Il laisse\n\nles cheveux doux, brillants et hydratés.\n\nTraite la dermite séborrhéique et les pellicules grasses.	\N	ISD-8429420219175	8429420219175	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:37.881+00	f	contenance	same-price	f	\N
92	Psorisdin® Shampooing Anti Desquamative Traitement	psorisdin-shampooing-anti-desquamative-traitement	25	Cheveux	\N	210	\N	\N	5	0	#F2F2F2	Elimine la desquamation et atténue les rougeurs. Particulièrement indiqué pour les personnes atteintes de psoriasis.\nGrâce à ses ingrédients, il élimine la desquamation, réduit les rougeurs et soulage les démangeaisons qui accompagnent la desquamation. Laisse les cheveux doux et faciles à coiffer.	\N	ISD-8429420174870	8429420174870	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:37.931+00	f	contenance	same-price	f	\N
93	Lambdapil® Shampoing Anti-chute                                                                          Aide à réduire la perte excessive de cheveux et à augmenter la densité capillaire.	lambdapil-shampoing-anti-chute-aide-r-duire-la-perte-excessive-de-cheveux-et-augmenter-la-densit-capillaire	25	Cheveux	\N	210	\N	\N	5	0	#F2F2F2	Prenez soin de vos cheveux au quotidien avec le shampooing Lambdapil® contre la chute des cheveux. Il aide à réduire la chute excessive des cheveux et à augmenter leur densité, leur donnant force, vigueur et une apparence plus saine.	\N	ISD-8429420174849	8429420174849	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:38.19+00	f	contenance	same-price	f	\N
95	Ureadin Ultra 20 Crème ultra-hydratante\nRétablit la douceur de votre peau et élimine les aspérités et rugosités	ureadin-ultra-20-cr-me-ultra-hydratante-r-tablit-la-douceur-de-votre-peau-et-limine-les-asp-rit-s-et-rugosit-s	25	Corps	\N	205	\N	\N	5	0	#F2F2F2	Hydratation réparatrice pour une peau très sèche, rêche et rugueuse.                                                                                                                       \n\nRéduit les aspérités et rugosités grâce à l’action exfoliante de l’Urée ISDIN.\n\nHydrate intensément et restaure la barrière cutanée. L’Urée ISDIN retient l’eau et rétablit le niveau d’hydratation optimal. Elle aide également à renforcer le système de défense cutanée.\n\nTexture crème, onctueuse, non grasse, à absorption rapide qui facilite son utilisation quotidienne et maximise l’efficacité du produit.	\N	ISD-8429420104563	8429420104563	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:38.688+00	f	contenance	same-price	f	\N
99	Ureadin Manos Repair Crème mains\nCrème pour les mains. Répare, hydrate et apaise la peau.	ureadin-manos-repair-cr-me-mains-cr-me-pour-les-mains-r-pare-hydrate-et-apaise-la-peau	25	Visage	\N	100	\N	\N	5	0	#F2F2F2	Crème réparatrice pour les mains à l'urée. Hydrate et protège la peau.\nAppliquer une petite quantité sur la peau et masser jusqu'à absorption. Testé par des dermatologues.	\N	ISD-8470002610736	8470002610736	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:39.624+00	f	contenance	same-price	f	\N
101	Nutratopic Pro-AMP Crème Emolliente Peaux Atopiques\nHydrate et apaise la peau atopique	nutratopic-pro-amp-cr-me-emolliente-peaux-atopiques-hydrate-et-apaise-la-peau-atopique	25	Visage	\N	260	\N	\N	5	0	#F2F2F2	Protection active du système de défense de la peau. Pour les peaux atopiques.\n\nRestaure la fonction de barrière\nAide à améliorer le système immunitaire naturel qui défend la peau\nAtténue les démangeaisons\nRéduit l'inflammation\nInhibe le risque d'adhésion bactérienne	\N	ISD-8470002006454	8470002006454	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:40.07+00	f	contenance	same-price	f	\N
102	Nutratopic Lotion Emolliente Peaux Atopiques\nHydrate et apaise la peau atopique	nutratopic-lotion-emolliente-peaux-atopiques-hydrate-et-apaise-la-peau-atopique	25	Visage	\N	260	\N	\N	5	0	#F2F2F2	Hydratation quotidienne pour les peaux atopiques.\n\nRestaure la fonction de barrière.\n\nHydrate en profondeur et aide à soulager les démangeaisons et les irritations grâce à sa teneur en Laureth-9 et en Niacinamide.\n\nInhibe le risque d'adhérence bactérienne.\n\nRestaure le bon équilibre de votre peau grâce à ses propriétés émollientes.\n\nSon utilisation quotidienne aide à prévenir les nouvelles poussées et à prolonger la période sans lésions.	\N	ISD-8429420166547	8429420166547	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:40.309+00	f	contenance	same-price	f	\N
103	Nutratopic Pro-AMP Gel de Bain Emollient Peaux Atopiques\nHygiène quotidienne légère, sans irritation ni démangeaison	nutratopic-pro-amp-gel-de-bain-emollient-peaux-atopiques-hygi-ne-quotidienne-l-g-re-sans-irritation-ni-d-mangeaison	25	Hygiène	\N	210	\N	\N	5	0	#F2F2F2	Hygiène quotidienne pour les peaux atopiques.\n\nAide à renforcer le système immunitaire naturel qui défend la peau.\n\nNettoie en douceur, en prévenant les démangeaisons et les irritations associées à l'hygiène de la peau atopique.\n\nHydrate grâce à sa haute teneur en huiles émollientes.\n\nInhibe le risque d'adhérence bactérienne grâce à sa formulation avec Rhamnosoft.\n\nMaintient le bon pH de la peau, facteur clé dans la prévention de nouvelles poussées.\n\nNe contient ni savon, ni conservateur, ni parfum, ni colorant.	\N	ISD-8429420166561	8429420166561	100	0	5	f	f	f	2026-09-07 12:06:36.552+00	2026-09-07 11:57:40.552+00	f	contenance	same-price	f	\N
54	Fotoultra 100 Active Unify SPF 50+\nÉcran solaire à l'effet dépigmentant	fotoultra-100-active-unify-spf-50-cran-solaire-l-effet-d-pigmentant	25	Solaire	\N	330	\N	\N	5	0	#F2F2F2	Crème solaire visage haute protection SPF50+ qui éclaircit et unifie le teint de votre peau. Aide à réduire les troubles pigmentaires et taches causés par le soleil.\n\nProtection solaire visage à la très haute protection UV pour tous les jours qui aide à corriger l'hyperpigmentation dérivée de la radiation solaire, éclaircissant et unifiant le teint de la peau grâce à sa triple action dépigmentante de Dp3-Unify complex. Mineral Oil-free. Non comédogène. Texture à l'absorption rapide. Testé dermatologiquement. Apte pour les peaux sensibles.\n\nExiste en version teintée pour les peaux claires à medium.	\N	ISD-8429420093577	8429420093577	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:29.615+00	f	contenance	same-price	f	\N
56	Fusion Water MAGIC by Alcaraz SPF 50\nProtection solaire visage	fusion-water-magic-by-alcaraz-spf-50-protection-solaire-visage	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	Protection solaire visage à la texture ultra-légère et à l’effet rafraîchissant, idéale pour le sport\nProfitez des sports en plein air avec Fusion Water MAGIC by Alcaraz SPF 50, la protection solaire visage ultra-légère à usage quotidien Full Spectrum qui protège des rayons UVB/UVA, de la lumière bleue, des IR-A et de la pollution. Il aide à prévenir le stress oxydatif occasionné par la chaleur pendant la pratique sportive grâce au Thermal Aging Protection.	\N	ISD-8429420291317	8429420291317	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:30.069+00	f	contenance	same-price	f	\N
57	Fotoultra Redness SPF 50\nCrème solaire visage pour les peaux sensibles	fotoultra-redness-spf-50-cr-me-solaire-visage-pour-les-peaux-sensibles	25	Solaire	\N	330	\N	\N	5	0	#F2F2F2	Crème solaire visage pour les peaux sensibles qui corrige et aide à prévenir les rougeurs de la peau\nCorrigez et aidez à prévenir les rougeurs de votre peau avec Redness SPF 50, l’écran solaire visage à la texture légère qui apporte une haute protection contre les rayons UVB et UVA et la lumière visible. Contribue à calmer les sensations d’irritation instantanément.\n\nN’irrite pas les yeux, mineral oil free, sans parfum, non comédogène, testé dermatologiquement, hypoallergénique : formulé pour minimiser le risque d’allergie.	\N	ISD-8429420245297	8429420245297	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:30.309+00	f	contenance	same-price	f	\N
58	Fotoultra 100 Solar AllergySolar Allergy Protect SPF 50+\nÉcran solaire haute protection	fotoultra-100-solar-allergysolar-allergy-protect-spf-50-cran-solaire-haute-protection	25	Solaire	\N	330	\N	\N	5	0	#F2F2F2	Crème solaire haute protection SPF50, indiquée pour les peaux réactives ou intolérantes au soleil, qui soulage les symptômes associés à l’allergie solaire comme les démangeaisons et l’inflammation.\n\nOffre une protection contre les rayons UVA 2 fois supérieure au minimum requis dans un protecteur solaire SPF 50+.\n\nFormulée à base d’ectoïne (1%), elle offre un effet “hardening” à la peau, la rendant plus résistante face aux agressions du rayonnement UV.\n\nSa texture Fusion Fluid légère fond sur votre peau.	\N	ISD-8429420280113	8429420280113	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:30.538+00	f	contenance	same-price	f	\N
59	Fotoprotector ISDIN Compact Arena SPF50+\nCouverture naturelle longue durée	fotoprotector-isdin-compact-arena-spf50-couverture-naturelle-longue-dur-e	25	Solaire	\N	235	\N	\N	5	0	#F2F2F2	Maquillage compact à très haute protection UVB/UVA SPF50+ HE-VL IR-A\nProtège et matifie en un seul geste.\nProcure une sensation de confort qui convient aux peaux mixtes et grasses.\nConvient aux peaux atopiques et sensibles.\nUnifie le teint de la peau, laissant un ton naturel qui dissimule les imperfections.\nEffet mat.\nCouverture longue durée.\nSans huile et non comédogène.\nRésistant à l'eau.	\N	ISD-8470001716125	8470001716125	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:30.769+00	f	contenance	same-price	f	\N
61	Post-solar ISDIN After Sun Spray\nCrème après soleil en spray	post-solar-isdin-after-sun-spray-cr-me-apr-s-soleil-en-spray	25	Visage	\N	175	\N	\N	5	0	#F2F2F2	Crème après soleil en spray qui aide a apaiser la peau, à la rafraîchit la peau et prolonge le bronzage\nDécouvrez notre lait après soleil en spray, aux effets calmants et apaisants. \n\nÀ base de Panthénol qui renforce le processus naturel de régénération de la peau.\n\nSon format spray très pratique vous permettra d'atteindre les zones les plus difficiles.	\N	ISD-8429420211285	8429420211285	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:31.233+00	f	contenance	same-price	f	\N
62	Fotoprotector ISDIN Hydro Lotion SPF 50\nLotion-huile solaire pour le corps biphasique	fotoprotector-isdin-hydro-lotion-spf-50-lotion-huile-solaire-pour-le-corps-biphasique	25	Solaire	\N	275	\N	\N	5	0	#F2F2F2	Lotion-huile solaire pour le corps, hydratante, biphasique et qui séche immédiatement, sans laisser de résidus gras. Sa composition à base de Chlorella Maris prévient l'oxydation de la peau. Haute protection UVB/UVA SPF50.                                            Lotion huile aqueuse biphasée double action :\n\n1. PROTÈGE : Haute protection UVB/UVA SPF50.\n\n2. DETOX : Grâce à sa formulation à base de Chlorella Maris, il détoxifie et revitalise la peau des dommages induits par le rayonnement solaire grâce à son action antioxydante.\n\nEn plus de protéger la peau, il procure une action hydratante desséchante immédiate avec un effet rafraîchissant. Il donne à la peau un aspect plus souple et élastique et plus lumineux.\n\nTesté dermatologiquement. Convient à tous les types de peaux. Resistant à l'eau.	\N	ISD-8429420192249	8429420192249	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:31.469+00	f	contenance	same-price	f	\N
64	Fotoprotector ISDIN Transparent Spray Wet Skin SPF 50\nÉcran solaire transparent	fotoprotector-isdin-transparent-spray-wet-skin-spf-50-cran-solaire-transparent	25	Solaire	\N	285	\N	\N	5	0	#F2F2F2	Écran solaire transparent à la formule améliorée avec Ginger Cell Protect, un extrait de gingembre 100 % naturel qui, grâce à sa teneur élevée en antioxydants, offre une protection cellulaire contre les dommages oxydatifs.\n\nCrème solaire résistante à l’eau. \n\nSon format spray permet une application dans n’importe quel sens.\n\nConvient à tous les types de peaux, y compris les peaux sensibles et/ou atopiques.	\N	ISD-8429420187948	8429420187948	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:31.869+00	f	contenance	same-price	f	\N
65	Fotoprotector ISDIN Fusion Gel Sport SPF 50\nCrème solaire corps en gel ultra-légère pour les sportifs	fotoprotector-isdin-fusion-gel-sport-spf-50-cr-me-solaire-corps-en-gel-ultra-l-g-re-pour-les-sportifs	25	Solaire	\N	270	\N	\N	5	0	#F2F2F2	Crème solaire corps ultra-légère, invisible et rafraîchissante. \n\nSa formule très résistante à l'eau et à la sueur est parfaite pour les sessions de sport en extérieur). Idéale pour les zones poilues, comme les bras et les jambes.\n\nFormule améliorée avec Ginger Cell Protect, un extrait de gingembre 100% naturel qui, grâce à sa forte teneur en antioxydants, offre une protection cellulaire contre les dommages oxydatifs.\n\nTesté dermatologiquement. Mineral Oil Free.	\N	ISD-8429420207004	8429420207004	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:32.122+00	f	contenance	same-price	f	\N
66	Fotoprotector ISDIN Gel Crème SPF 50\nLa crème solaire corps tout-terrain	fotoprotector-isdin-gel-cr-me-spf-50-la-cr-me-solaire-corps-tout-terrain	25	Solaire	\N	285	\N	\N	5	0	#F2F2F2	Crème solaire pour le corps en gel et au fini mat qui hydrate comme une crème et procure une sensation de fraîcheur comme un gel. \n\nAssure une sensation agréable de fraîcheur avec un fini mat et une texture soyeuse.	\N	ISD-8470003331180	8470003331180	100	0	5	f	f	f	2026-09-07 12:06:55.086+00	2026-09-07 11:57:32.364+00	f	contenance	same-price	f	\N
175	LCP Soin Intense Pied Diabétique	lcp-soin-intense-pied-diabetique	28	Corps	\N	90	\N	\N	5	0	#F2F2F2	Soin intense pied diabétique LCP est un soin dermatologique intensif spécialement formulé pour les pieds diabétiques non ulcérés, secs et fragilisés. Le soin hydrate intensément grâce à l’urée.\nLe beurre de karité, le panthénol et la niacinamide restaurent la barrière cutanée, apaisent et favorisent la réparation.\nLa centella asiatica & la madécassoside offrent une action cicatrisante et anti-inflammatoire.\nL'huile de lentisque elle, offre un effet antimicrobien doux, limitant les risques d’infection superficielle.                                      Action 3 en 1: Soulage, Nourrit, Hydrate\n0% alcool, 0% paraben, 0% sulfate	97	LCP-6111275500066	6111275500066	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:13.96+00	f	contenance	same-price	f	soins-mains-pieds
185	MOUSSE NETTOYANTE	mousse-nettoyante	29	Visage	\N	200	\N	\N	5	0	#F2F2F2	Propriétés\nMousse Nettoyante indispensable au rituel de la beauté des peaux asphyxées.\nIndications\nLa mousse HTCEUTIC, nettoie en douceur, assainit, élimine les impuretés et redonne à la peau son éclat habituel.\nGrâce à sa formule spécifique, HTCEUTIC MOUSSE réduit les sensations de sécheresse et de picotement tout en éliminant les impuretés qui asphyxient le teint.	107	HTC-6111267180023	6111267180023	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:16.688+00	f	contenance	same-price	f	nettoyants
186	CRÉME LAVANTE	creme-lavante	29	Visage	\N	180	\N	\N	5	0	#F2F2F2	HTCEUTIC CRÈME LAVANTE est un nettoyant surgras crémeux pour les peaux matures, sensibles et fragilisées.	108	42168735039663	6111267180115	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:16.883+00	f	contenance	same-price	f	nettoyants
194	AHA CRÉME PEELING 15%	aha-creme-peeling-15	29	Visage	\N	150	\N	\N	5	0	#F2F2F2	Propriétés\nHTCEUTIC AHA 15% crème est une crème peeling conçue spécialement pour une application sur les peaux sèches à base de 15% d’acide glycolique.\nIndications\nÀ base de 15% d’acide glycolique.	116	HTC-6111267180139	6111267180139	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:18.418+00	f	contenance	same-price	f	peelings-doux
204	SERUM FORFIANT CILS ET SORCILS	serum-forfiant-cils-et-sorcils	30	Cheveux	\N	330	\N	\N	5	0	#F2F2F2	Ce sérum fortifiant a été conçu pour sublimer le regard en favorisant la pousse naturelle des cils et des sourcils.\n\nLa formule composée d’ANP® 2+, Tripeptide et Provitamine B5 permet de fortifier durablement les cils et les sourcils tout en stimulant leur croissance.\n\nElle protège, répare et renforce tous les types de cils et sourcils même fragilisés, fins ou clairsemés. Ce traitement convient également aux yeux sensibles et porteurs de lentilles.\n\nTransparent, le sérum peut s’appliquer seul ou sous le mascara dont il facilite l’application	\N	HEL-SERUM-FORFIANT-CILS-ET-S-CEE34F	\N	50	0	5	t	f	f	2026-09-07 12:04:36.438+00	2026-09-07 12:02:21.703+00	f	contenance	same-price	f	cheveux-ongles
198	AHA CRÉME POST-PEELING	aha-creme-post-peeling	29	Visage	\N	600	\N	\N	5	0	#F2F2F2	Propriétés\nHTCEUTIC AHA crème post-peeling est une crème faciale apaisante, régénératrice, réparatrice et hydratante qui renforce et restructure la peau qui a déjà reçu un peeling médical.\nAide à corriger l’aspect de la peau après les traitements dermatologiques.\nIndications\nAide à corriger l’aspect de la peau après les traitements dermatologiques.	120	HTC-6111267180177	6111267180177	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:19.183+00	f	contenance	same-price	f	peelings-doux
201	SUN PROTECT SPF 50+	sun-protect-spf-50	29	Solaire	\N	250	\N	\N	5	0	#F2F2F2	HTCEUTIC Sun Protect SPF 50+ est une crème solaire\nvisage à très haute protection, spécialement formulée\npour les peaux sujettes à l’hyperpigmentation.\nSa texture légère et non grasse assure une application\nagréable et un fini invisible, adaptée à un usage quotidien.	123	HTC-6111267180184	6111267180184	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:19.775+00	f	contenance	same-price	f	solaire
230	O-REGEN CREME REQUILBRANTE 50ml	o-regen-creme-requilbrante-50ml	30	Visage	\N	600	\N	\N	5	0	#F2F2F2	Ce soin a été spécialement formulé pour détoxifier, protéger, rééquilibrer et dynamiser les peaux soumises aux contraintes de la vie urbaine. \nIl contient un concentré d’actifs qui agissent en synergie pour favoriser la micro circulation et l’oxygénation de la peau (Lupin et Ginkgo biloba), son hydratation (acide hyaluronique, impérata cylindrica et huile de pépins de raisin) et le renouvellement cellulaire : l’extrait de fleurs de Nopal exerce un effet peeling très doux pour révéler l’éclat du teint.	149	HEL-O-REGEN-CREME-REQUILBRAN-D344B3	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:26.797+00	f	contenance	same-price	f	purifiants
231	O-REGEN CREME EXFOLIANTE VISAGE 75ml	o-regen-creme-exfoliante-visage-75ml	30	Visage	\N	210	\N	\N	5	0	#F2F2F2	Cette crème exfoliante assure un gommage doux du visage grâce aux fines particules de noyaux de prunes de Gascogne et de coques de coco.	150	HEL-O-REGEN-CREME-EXFOLIANTE-D44C8D	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:26.864+00	f	contenance	same-price	f	peelings-doux
124	SEPTISCARS SPRAY	septiscars-spray	26	Visage	\N	99	\N	\N	5	0	#F2F2F2	SEPTISCARS SPRAY est une solution antiseptique, formulée avec six principes actifs en synergie. SEPTISCARS SPRAY démontre une action antiseptique, bactéricide, levurecide et cicatrisante et offre un large spectre d’utilisation pour traiter les plaies, brûlures, ainsi que pour assurer une bonne antisepsie cutanée.\n\nCARACTÉRISTIQUES\n– Digluconate de Chlorhexidine: Antiseptique à large spectre d’action. Effet bactériostatiques et bactéricides\n– Chlorure de benzalkonium: Antiseptique à large spectre et bactéricide\n– Chlorphénésine: Antiseptique : actif sur les bactéries, les levures et les virus\n– Centella asiatica: Cicatrisante : des plaies, brûlures,\neczéma et ulcères\n– Propolis: Antiseptique, cicatrisante,\naide au bourgeonnement\n\nAVANTAGES :​\n– Association synergique de six principes actifs\n– Action antiseptique, bactéricide, levurecide et cicatrisante\n– Large spectre d’utilisation : plaies, brûlures, avant et après les gestes chirurgicaux et esthétiques pour assurer une bonne antisepsie cutanée\n– Ne pique pas, indolore avec une bonne tolérance cutanée\n\nBÉNÉFICES\n– Pas de limite d’âge (adultes et enfants)\n– Meilleur rapport quantité / prix 125 ml à 94 dh\n– Produit de famille\n– Ne tache pas\n– Très économique : antiseptique et cicatrisant en même temps	47	DCP-6111263780203	6111263780203	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:01:56.832+00	f	contenance	same-price	f	cremes-cicatrisantes
150	D-BIOTIC ROSABIOTIC CREME SOLAIRE SPF50+ TEINTE CLAIRE 75 ML	d-biotic-rosabiotic-creme-solaire-spf50-teinte-claire-75-ml	27	Solaire	\N	150	\N	\N	5	0	#F2F2F2	D-biotic Rosabiotic SPF 50+ protège, répare, atténue et apaise les rougeurs. Sa teinte claire uniformise le teint et redonne une sensation de confiance même exposée au soleil.	72	DBI-6111270660291	6111270660291	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:07.565+00	f	contenance	same-price	f	solaire
177	LCP Crème Anti-callosités	lcp-creme-anti-callosites	28	Corps	\N	90	\N	\N	5	0	#F2F2F2	Crème Anti-callosités LCP est une crème dermatologique kératorégulatrice intensive, spécialement formulée pour réduire efficacement les callosités, durillons et talons épaissis.  Avec ses 30% d'urée, la crème anti-callosités apporte une action kératorégulatrice intensive, réduisant efficacement les callosités et assouplissant la peau épaissie. Riche en actifs, la crème offre réparation, nutrition et souplesse aux pieds, combinée à une action antibactérienne et antifongique douce.                                                                                                           Action 3 en 1: Assouplit, Nourrit, Hydrate\n0% alcool, 0% paraben, 0% sulfate	99	LCP-6111275500080	6111275500080	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:14.37+00	f	contenance	same-price	f	soins-mains-pieds
178	LCP Gommage Nourissant Pieds	lcp-gommage-nourissant-pieds	28	Corps	\N	90	\N	\N	5	0	#F2F2F2	Gommage Nourissant LCP est un gommage doux et nourrissant qui exfolie la peau des pieds, élimine les cellules mortes et restaure leur douceur. Il exfolie en douceur, éliminant les cellules mortes sans agresser la peau.\nRiche en actifs, sa formule hydrate et adoucit intensément, nourrit et régénère la peau des pieds, tout en protègeant la barrière cutanée.\nL’huile essentielle de romarin que le gommage continent purifie et tonifie la peau, pour une sensation de fraîcheur immédiate.                                                                                    Action 3 en 1: Exfolie, Nourrit, Hydrate\n0% alcool, 0% paraben, 0% sulfate	100	LCP-6111275500097	6111275500097	42	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:14.562+00	f	contenance	same-price	f	soins-mains-pieds
240	SHAMP ULTRA DOUX	shamp-ultra-doux	31	Cheveux	\N	350	\N	\N	5	0	#F2F2F2	INDICATIONS\nCheveux normaux, usages fréquents\nEnfants à partir de 3 ans\n\nPROPRIÉTÉS\nLe Shampooing Ultra Doux Family à l'ANP®2+ d’ECRINAL® restaure et maintient l’équilibre du cuir chevelu. Il assure brillance et vigueur aux cheveux. Sa douceur permet un usage fréquent.\n\nCONSEILS D'UTILISATION\nAppliquer sur cheveux mouillés 1 à 2 fois par jour. Faire mousser en massant le cuir chevelu. Rincer abondamment puis renouveler l’opération si nécessaire.	159	ECR-3323030000282	3323030000282	49	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:28.795+00	f	contenance	same-price	f	shampoings-traitants
228	O-REGEN MOUSSE	o-regen-mousse	30	Visage	\N	310	\N	\N	5	0	#F2F2F2	Les sensations de tiraillements ou de sécheresse peuvent être ressenties après l’utilisation d’un produit démaquillant.\n\nGourmande et aérienne, la mousse O-REGEN démaquille et nettoie en profondeur tout en procurant une agréable sensation de fraîcheur.\n\nFormulée à partir d’une base lavante ultra douce, elle élimine toutes les impuretés qui asphyxient le teint tout en respectant l’équilibre naturel de la peau.\n\nLa sélection d’extraits naturels spécifiques tels que le Lupin et le Ginkgo Biloba assure une meilleure oxygénation et protection de la peau. L’extrait de fleur de Nopal ravive l’éclat du teint.	\N	HEL-O-REGEN-MOUSSE-A0DA60	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:26.685+00	f	contenance	same-price	f	nettoyants
229	O-REGEN MASQUE ECLAT ANTI-POLLUTION	o-regen-masque-eclat-anti-pollution	30	Visage	\N	95	\N	\N	5	0	#F2F2F2	Héliabrine Oxy-défense Masque éclat anti-pollution Charbon Végétal Grâce au pouvoir absorbant du charbon végétal, ce masque capture les impuretés et les toxines accumulées tout au long de la journée.\n\nUn complexe anti-pollution composé de lierre, tournesol et extrait de son de riz protège la peau des fumées polluantes.	\N	HEL-O-REGEN-MASQUE-ECLAT-ANT-C61892	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:26.7+00	f	contenance	same-price	f	anti-taches
233	CAPSULE CHEVEUX	capsule-cheveux	31	Cheveux	\N	303	\N	\N	5	0	#F2F2F2	Ecrinal 30 capsules cheveux 1 mois de traitement spécialement conçu contre les carences alimentaires et déséquilibres biologiques affectant les constituants\n\nessentiels des cheveux.\n\nECRINAL CAPSULES contient les éléments complémentaires à l’alimentation quotidienne nécessaires à la croissance harmonieuse des cheveux.\n\nSa composition riche en cystine, silicium, vitamines B3, B5, B6, B8 contribue à la vigueur et à l'embellissement de vos cheveux.\n\nCOMPOSITION :\n\n-Cystine : participe à la synthèse de la kératine, constituant essentiel du cheveu.\n\n-Poudre de bambou : riche en silicium végétal, agit sur la structure de la kératine.\n\n-Vitamines B3, B5, B6 et B8 : favorisent la croissance et renforcent la résistance de la kératine.\n\n-Huile de bourrache, lécithine et huile de soja : apport d’ AGE ( acides gras essentiels ) qui contribuent à l’équilibre du cuir chevelu.\n\nFAIBLE VALEUR CALORIQUE : 2.7KCAL PAR CAPSULE .\n\nUTILISATION :\n\nUne capsule par jour, à avaler de préférence le matin ou au petit déjeuner.\n\nA utiliser en cure de 2 mois. Boite de 30 capsules sous blister.\n\n1 BOITE = 1 MOIS DE TRAITEMENT	152	1639	3323030000343	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:27.413+00	f	contenance	same-price	f	chute-de-cheveux
234	LOTION HOMME	lotion-homme	31	Cheveux	\N	260	\N	\N	5	0	#F2F2F2	INDICATIONS\nCuirs chevelus clairsemés, cheveux dévitalisés.\nS’utilise en relais après un traitement anti-chute à l’ANP®2+.\nTraitement d'entretien de la chevelure.\n\nPROPRIÉTÉS\nLa Lotion Homme Fortifiante ECRINAL® à l’ANP®2+ fortifie la fibre capillaire et stimule le bulbe pileux. Les cheveux retrouvent ainsi douceur et brillance. Rapidement, ils redeviennent sains sur toute leur longueur. D’un parfum frais, doux et raffiné son utilisation est très agréable.	153	ECR-3323030000350	3323030000350	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:27.603+00	f	contenance	same-price	f	chute-de-cheveux
235	LOTION FEMME	lotion-femme	31	Cheveux	\N	260	\N	\N	5	0	#F2F2F2	INDICATIONS\nCuirs chevelus clairsemés, cheveux dévitalisés.\nS’utilise en relais après un traitement anti-chute à l’ANP®2+.\nTraitement d'entretien de la chevelure.\n\nPROPRIÉTÉS\nLa Lotion Femme Fortifiante ECRINAL® à l’ANP®2+ fortifie la fibre capillaire et stimule le bulbe pileux. Les cheveux retrouvent ainsi douceur et brillance. Rapidement, ils redeviennent sains sur toute leur longueur. D’un parfum frais, doux et raffiné son utilisation est très agréable.	154	ECR-3323030000312	3323030000312	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:27.793+00	f	contenance	same-price	f	chute-de-cheveux
236	SHAMP HOMME 200 ml	shamp-homme-200-ml	31	Cheveux	\N	220	\N	\N	5	0	#F2F2F2	PROPRIÉTÉS\nLe Shampooing Homme ECRINAL® à l’ANP®2+ nettoie en douceur les cheveux sans irriter le cuir chevelu. Il exerce une action stimulante sur la racine et fortifie le cheveu. Son utilisation est particulièrement indiquée dans le cas d’un traitement anti-chute.\n\nCONSEILS D'UTILISATION\nAppliquer sur cheveux mouillés. Masser le cuir chevelu et les cheveux puis laisser agir 1 minute. Rincer. Si besoin, procéder à un deuxième shampooing. Rincer soigneusement et sécher les cheveux.	155	ECR-3323030000299	3323030000299	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:27.992+00	f	contenance	same-price	f	shampoings-traitants
237	SHAMP FEMME 200 ml	shamp-femme-200-ml	31	Cheveux	\N	220	\N	\N	5	0	#F2F2F2	PROPRIÉTÉS\nLe Shampooing Femme ECRINAL® à l’ANP®2+ nettoie en douceur les cheveux sans irriter le cuir chevelu. Il exerce une action stimulante sur la racine et fortifie le cheveu. Son utilisation est particulièrement indiquée dans le cas d’un traitement anti-chute.\n\nCONSEILS D'UTILISATION\nAppliquer sur cheveux mouillés. Masser le cuir chevelu et les cheveux puis laisser agir 1 minute. Rincer. Si besoin, procéder à un deuxième shampooing. Rincer soigneusement et sécher les cheveux.	156	ECR-3323030000329	3323030000329	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:28.182+00	f	contenance	same-price	f	shampoings-traitants
238	SHAMP HOMME 400 ml	shamp-homme-400-ml	31	Cheveux	\N	300	\N	\N	5	0	#F2F2F2	PROPRIÉTÉS\nLe Shampooing Homme ECRINAL® à l’ANP®2+ nettoie en douceur les cheveux sans irriter le cuir chevelu. Il exerce une action stimulante sur la racine et fortifie le cheveu. Son utilisation est particulièrement indiquée dans le cas d’un traitement anti-chute.\nCONSEILS D'UTILISATION\nAppliquer sur cheveux mouillés. Masser le cuir chevelu et les cheveux puis laisser agir 1 minute. Rincer. Si besoin, procéder à un deuxième shampooing. Rincer soigneusement et sécher les cheveux.	157	ECR-SHAMP-HOMME-400-ML-9CDFF3	\N	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:28.374+00	f	contenance	same-price	f	shampoings-traitants
239	SHAMP FEMME 400 ml	shamp-femme-400-ml	31	Cheveux	\N	300	\N	\N	5	0	#F2F2F2	PROPRIÉTÉS\nLe Shampooing Femme ECRINAL® à l’ANP®2+ nettoie en douceur les cheveux sans irriter le cuir chevelu. Il exerce une action stimulante sur la racine et fortifie le cheveu. Son utilisation est particulièrement indiquée dans le cas d’un traitement anti-chute.\n\nCONSEILS D'UTILISATION\nAppliquer sur cheveux mouillés. Masser le cuir chevelu et les cheveux puis laisser agir 1 minute. Rincer. Si besoin, procéder à un deuxième shampooing. Rincer soigneusement et sécher les cheveux.	158	ECR-3323030000244	3323030000244	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:28.572+00	f	contenance	same-price	f	shampoings-traitants
244	APRES SHAMP	apres-shamp	31	Cheveux	\N	220	\N	\N	5	0	#F2F2F2	Le Baume Après-Shampooing ECRINAL® à l’A.N.P®2+ exerce une action stimulante et régénératrice sur la racine des cheveux qui ont besoin d’être fortifiés. Il embellit, apporte brillance et douceur aux cheveux et facilite leur démêlage.\n\nIndication :\nSoin fortifiant, régénérateur, démêlant et booster d’éclat pour cheveux secs, cassants et abîmés, recommandé sans le cas de chute de cheveux et de cuir chevelu anémié.\n\nPropriétés :\n– Fabriqué à Monaco\n\nConseils d’utilisation :\nA utiliser après avoir lavé les cheveux avec le shampooing à l’A.N.P®2+. Appliquer une noix sur l’ensemble de la chevelure. Peigner pour répartir uniformément. Laisser agir 1 à 2 minutes. Rincer abondamment puis procéder au séchage des cheveux.	160	ECR-3323030000305	3323030000305	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:29.022+00	f	contenance	same-price	f	apres-shampoings
245	MASQUE CAPILLAIRE	masque-capillaire	31	Cheveux	\N	155	\N	\N	5	0	#F2F2F2	INDICATIONS\nCheveux secs, cassants, abîmés, pointes fourchues.\nRecommandé dans le cadre du programme intensif anti-chute à l’ANP®2+.\n\nPROPRIÉTÉS\nLe Masque Capillaire Nutritif ECRINAL® à l’ANP®2+ est un soin intensif pour cheveux très abîmés, secs et/ou cassants.\nIl nourrit et répare les cheveux secs et abîmés, sublime la couleur des cheveux.\nIl facilite le démêlage et coiffage. Les cheveux sont plus doux et plus beaux.\n\nCONSEILS D'UTILISATION\nAppliquer 2 fois par semaine après le shampooing fortifiant ECRINAL®. Répartir une noisette de masque sur l'ensemble de la chevelure essorée en insistant sur les pointes. Laisser poser 3 à 5 minutes et rincer abondamment.	161	ECR-3323030000275	3323030000275	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:29.21+00	f	contenance	same-price	f	masques-capillaires
246	SERUM APAISANT CAPPILAIRE	serum-apaisant-cappilaire	31	Cheveux	\N	200	\N	\N	5	0	#F2F2F2	Description :\nCalme et redonne confort au cuir chevelu sensible et fragilisé.\nRespecte et maintient l’équilibre du cuir chevelu en le laissant mieux respirer.\nHydrate le cuir chevelu et apporte douceur et brillance aux cheveux.\nTexture légère, aucun rinçage nécessaire.\nIndications :\nTous types de cheveux.\nCuir chevelu sensible avec ou sans pellicules.\nDémangeaisons du cuir chevelu sec ou fragilisé par le stress ou l’environnement.\nConseils d'utilisation :\nUne ou deux fois semaine ou au besoin, répartir le sérum directement sur le cuir chevelu, raie par raie et masser légèrement.\nNe pas rincer après l’application.\nÉviter le contact avec les yeux.\nPrincipaux ingrédients :\nExtraits de graine de Céleri\nHuile d’Échium\nEnoxolone\nProvitamine B5\nHuile de Caméline\nANP® 2+ (brevet Asepta)\nExtraits de soie\nSans Paraben	162	ECR-3323030000497	3323030000497	50	0	5	t	f	f	2026-09-16 22:38:09.914+00	2026-09-07 12:02:29.398+00	f	contenance	same-price	f	peaux-sensibles
\.


--
-- Data for Name: collections_page_rels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.collections_page_rels (id, "order", parent_id, path, products_id) FROM stdin;
\.


--
-- Data for Name: home; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home (id, promotions_grid_title, promotions_grid_subtitle, promotions_grid_limit, dermo_corner_copy_eyebrow, dermo_corner_copy_title, dermo_corner_copy_subtitle, dermo_corner_copy_cta_label, dermo_corner_copy_cta_url, dermo_corner_copy_picks_title, dermo_corner_copy_image_id, dermo_corner_copy_autoplay, dermo_corner_copy_autoplay_speed_ms, image_carousel_copy_eyebrow, image_carousel_copy_title, image_carousel_copy_subtitle, image_carousel_copy_cta_label, image_carousel_copy_cta_url, image_carousel_copy_picks_title, image_carousel_copy_image_id, summer_edit_copy_eyebrow, summer_edit_copy_year, summer_edit_copy_title, summer_edit_copy_title_accent, summer_edit_copy_description, summer_edit_copy_cta_label, summer_edit_copy_cta_url, summer_edit_copy_hero_image_id, summer_edit_copy_hero_image_mobile_id, summer_edit_copy_image_position, summer_edit_copy_image_scale, summer_edit_copy_overlay, summer_edit_copy_carousel_autoplay, summer_edit_copy_carousel_autoplay_speed_ms, summer_edit_copy_carousel_show_counter, summer_edit_copy_carousel_show_progress, summer_edit_copy_animation_enable_reveal, summer_edit_copy_animation_enable_parallax, summer_edit_copy_animation_stagger_products, summer_edit_copy_animation_speed, summer_edit_copy_colors_background, summer_edit_copy_colors_text, summer_edit_copy_colors_accent, summer_edit_copy_colors_cta, summer_edit_copy_full_width, campaign_copy_eyebrow, campaign_copy_title, campaign_copy_description, campaign_copy_cta_label, campaign_copy_cta_url, campaign_copy_rail_title, campaign_copy_image_id, coffrets_copy_eyebrow, coffrets_copy_title, coffrets_copy_subtitle, coffrets_copy_cta_label, coffrets_copy_cta_url, coffrets_copy_layout, coffrets_copy_visible_desktop, coffrets_copy_visible_mobile, instagram_show, instagram_title, instagram_subtitle, instagram_username, instagram_post_count, instagram_cta_text, instagram_cta_url, newsletter_section_title, newsletter_section_subtitle, newsletter_section_placeholder, newsletter_section_button_label, newsletter_section_success_message, free_shipping_threshold, _status, updated_at, created_at, promotions_grid_eyebrow, brands_featured_copy_eyebrow, brands_featured_copy_title, services_teaser_copy_eyebrow, services_teaser_copy_title, services_teaser_copy_subtitle, newsletter_section_logo_enabled, newsletter_section_logo_size, newsletter_section_logo_position, newsletter_section_background_color, newsletter_section_text_color, newsletter_section_cta_color, newsletter_section_border_radius, newsletter_section_particles_enabled, newsletter_section_particles_opacity, cta_banner_copy_eyebrow, cta_banner_copy_title, cta_banner_copy_description, cta_banner_copy_cta_label, cta_banner_copy_cta_url, cta_banner_copy_bg, cta_banner_copy_text_color, cta_banner_copy_cta_color, featured_promo_eyebrow, featured_promo_title, featured_promo_subtitle, featured_promo_cta_label, featured_promo_cta_url, featured_promo_limit, featured_promo_promo_title, featured_promo_promo_cta_label, featured_promo_promo_cta_url, featured_promo_promo_image_id, cta_banner_copy_bg_image_id, cta_banner_copy_overlay_opacity) FROM stdin;
1	Les offres du moment	Profitez de nos meilleures offres.	8	Dermo corner	La sélection dermatologique du moment	Actifs prouvés, formules minimalistes : les références conseillées par nos pharmaciens pour les peaux réactives, sèches ou à imperfections.	Voir le rayon dermo	/catalogue	Nos soins dermo favoris	173	t	4500	Sélection	Nos incontournables du moment	Une sélection resserrée, à retrouver aussi en boutique.	Voir la sélection	/catalogue	Notre sélection	167	01 / Summer Edit		L'été commence	par la peau	Protection solaire, hydratation intense et soins après-soleil pour une peau sublimée tout l’été.	Découvrir la sélection	/catalogue	164	\N	right	1.06	f	t	5000	t	t	t	t	t	normal	#F7EEE5	#373020	#6D28D9	#6D28D9	f	Sélection	Nos coups de cœur	Les références que nos pharmaciens recommandent le plus, réunies dans une sélection à part.	Voir la sélection	/catalogue	Nos coups de cœur	174	Idées cadeaux	Coffrets & cadeaux	Des rituels prêts à offrir, emballés à la main dans nos boutiques.	Tous les coffrets	/collections	carousel	6	3	t	Suivez-nous sur Instagram	Routines, conseils de nos pharmaciens et coulisses de la parapharmacie.	paradhiver	6	Nous suivre	https://www.instagram.com/paradhiver/	Recevez nos conseils & nouveautés	Inscrivez-vous pour découvrir nos conseils pharmaceutiques, nouveautés et offres exclusives.	Votre adresse email	S'abonner	Merci ! Votre code −10% arrive par email	399	published	2026-09-17 22:22:08.324+00	2026-09-04 01:03:02.486+00	Promotions	Nos partenaires	Marques à l'honneur	Accompagnement	Nos services	Nos pharmaciens vous accompagnent, en ligne comme en institut.	t	76	left	#5E4074	#FFFFFF	#008AA5	30	t	1				Nous contacter	/contact	#F7EEE5	#373020	#5E4074	Sélection	Les incontournables		Voir tout	/catalogue	3	Les dernières arrivées, chaque semaine	Tout parcourir	/shop/nouveautes	176	216	0
\.


--
-- Data for Name: home_brands_featured; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_brands_featured (_order, _parent_id, id, brand_id, phrase, image_id, cta_label) FROM stdin;
\.


--
-- Data for Name: home_coffrets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_coffrets (_order, _parent_id, id, active, tag, title, sub, price, price_from, image_id, cta_label, cta_url, toast, product_id) FROM stdin;
1	1	6aac6810d9b45d0001a548ca	t	Édition limitée	Coffret Rituel d'Hiver	Nettoyant doux, sérum hydratant et baume réparateur, dans une boîte cadeau.	549	f	18	Offrir	/catalogue	Coffret Rituel d'Hiver ajouté au panier	\N
2	1	6aac6810d9b45d0001a548cb	t	Best-seller	Coffret Peau Sensible	Le duo eau thermale + cicaplast, pour les peaux réactives.	319	f	19	Offrir	/catalogue	Coffret Peau Sensible ajouté au panier	\N
3	1	6aac6810d9b45d0001a548cc	t	PACK REPAIR	 SHAMPOOING + APRÈS-SHAMPOOING		349	f	202	Offrir	/produit/pack-repair-shampooing-apres-shampooing		\N
4	1	6aac6810d9b45d0001a548cd	t	OFFRE SPÉCIALE FILORGA	Cadeau a offrir	 À l’achat de 3 produits FILORGA, recevez une jolie trousse Summer FILORGA OFFERTE !	200	t	203	Offrir	/catalogue	Carte cadeau ajoutée au panier	\N
\.


--
-- Data for Name: home_cta_pair1; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_cta_pair1 (_order, _parent_id, id, eyebrow, title, bg, image_id, cta_url) FROM stdin;
1	1	6aac6810d9b45d0001a548b8	Dermocosmétique	Prenez soin de votre peau	#EFE6F3	204	\N
2	1	6aac6810d9b45d0001a548b9	Cheveux	Révélez la beauté de vos cheveux	#E4F1F4	205	\N
\.


--
-- Data for Name: home_cta_pair2; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_cta_pair2 (_order, _parent_id, id, eyebrow, title, bg, image_id, cta_url) FROM stdin;
1	1	6aac6810d9b45d0001a548be	Visage	Une routine adaptée à votre peau	#F2E9F2	172	\N
2	1	6aac6810d9b45d0001a548bf	Corps	Des soins pour chaque moment	#F5F0E3	171	\N
\.


--
-- Data for Name: home_dermo_picks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_dermo_picks (_order, _parent_id, id, product_id, actif, claim) FROM stdin;
1	1	6aac6810d9b45d0001a548c0	221	Acide hyaluronique	Barrière cutanée fortifiée
2	1	6aac6810d9b45d0001a548c1	77	Zinc PCA	Peaux grasses à imperfections
3	1	6aac6810d9b45d0001a548c2	142	Céramides	Hydratation 24 h
4	1	6aac6810d9b45d0001a548c3	32	Cica	Zones fragilisées, gerçures
5	1	6aac6810d9b45d0001a548c4	145	UVMune 400	Très haute protection UVA
\.


--
-- Data for Name: home_hero_slides; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_hero_slides (_order, _parent_id, id, active, tag, title, sub, cta, cta_url, secondary_cta, secondary_cta_url, align, "overlay", bg, image_id, mobile_image_id) FROM stdin;
1	1	6aac6810d9b45d0001a548b4	t	Édition hiver	La peau protégée, tout l'hiver	Sélection dermatologique testée par nos pharmaciens : barrière cutanée, froid, vent et lumière bleue.	Découvrir	/catalogue			right	t	linear-gradient(120deg,#2f1f3d,#5E4074 60%,#4b3563)	26	\N
2	1	6aac6810d9b45d0001a548b5	t	Jusqu'à −50%	Ventes flash soins visage	Sérums, crèmes et nettoyants des grandes marques dermatologiques à prix réduits, jusqu'à dimanche.	Voir les offres	/catalogue			right	t	linear-gradient(120deg,#123a44,#008AA5 65%,#0d5f70)	24	\N
3	1	6aac6810d9b45d0001a548b6	t	Nouveauté	Rituel corps nutrition intense	Baumes, huiles sèches et cicatrisants pour les peaux très sèches. Formules sans parfum.	Composer ma routine	/catalogue			right	t	linear-gradient(120deg,#3a3324,#5b4e33 60%,#373020)	21	\N
\.


--
-- Data for Name: home_marketing_banners; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_marketing_banners (_order, _parent_id, id, campaign, image_id, image_mobile_id, image_mode, eyebrow, title, description, cta_label, cta_url, badge_label, active, start_date, end_date, cta_align, image_framing) FROM stdin;
1	1	6aac6810d9b45d0001a548b7	campagne-2026-09-07	213	214	overlay					/catalogue		t	\N	\N	left	center
\.


--
-- Data for Name: home_rails; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_rails (_order, _parent_id, id, key, eyebrow, title, subtitle, product_source, category, brand_filter_id, "limit", sort_order, cta_label, cta_url, badge_style, editorial_image_id, brand_feature_name, brand_feature_desc, brand_feature_bg, brand_feature_image_id, editorial_eyebrow, editorial_title, editorial_description, editorial_cta_label, editorial_cta_url) FROM stdin;
1	1	6aac6810d9b45d0001a548ba	saison	Sélection du moment	Les essentiels de la saison	Découvrez notre sélection pensée pour prendre soin de vous au quotidien.	category	Visage	\N	8	newest	Voir tout	/shop/visage	none	14	\N	\N	#E7EFF3	\N					
2	1	6aac6810d9b45d0001a548bb	nouveautes	Nouveautés	Les nouveautés à découvrir	Les dernières références entrées en pharmacie.	latest	\N	18	8	newest	Voir tout	/catalogue	none	\N	\N	\N	#E7EFF3	\N					
3	1	6aac6810d9b45d0001a548bc	best	Best sellers	Soins du corps	Laits, baumes et soins ciblés	category	Corps	\N	8	newest	Voir tout	/shop/corps	none	\N	\N	\N	#E7EFF3	\N					
4	1	6aac6810d9b45d0001a548bd	rail-1788783106613	Sélection	Cheveux & cuir chevelu		category	Cheveux	\N	8	newest	Voir tout	/shop/cheveux	none	215	\N	\N	#E7EFF3	\N					
\.


--
-- Data for Name: home_rels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_rels (id, "order", parent_id, path, products_id, brands_id) FROM stdin;
389	1	1	imageCarouselProducts	76	\N
390	2	1	imageCarouselProducts	56	\N
391	3	1	imageCarouselProducts	57	\N
392	4	1	imageCarouselProducts	78	\N
393	5	1	imageCarouselProducts	79	\N
394	1	1	campaignProducts	59	\N
395	2	1	campaignProducts	79	\N
396	3	1	campaignProducts	163	\N
397	4	1	campaignProducts	76	\N
398	5	1	campaignProducts	74	\N
399	6	1	campaignProducts	142	\N
400	7	1	campaignProducts	154	\N
401	8	1	campaignProducts	145	\N
402	9	1	campaignProducts	153	\N
403	10	1	campaignProducts	150	\N
404	1	1	brands	\N	13
405	2	1	brands	\N	14
406	3	1	brands	\N	15
407	4	1	brands	\N	16
408	5	1	brands	\N	17
409	6	1	brands	\N	19
\.


--
-- Data for Name: home_review_bars; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_review_bars (_order, _parent_id, id, n, pct) FROM stdin;
1	1	6a9a211160d34b0024ec2a8f	5	72
2	1	6a9a211160d34b0024ec2a90	4	19
3	1	6a9a211160d34b0024ec2a91	3	6
4	1	6a9a211160d34b0024ec2a92	2	2
5	1	6a9a211160d34b0024ec2a93	1	1
\.


--
-- Data for Name: home_sample_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_sample_reviews (_order, _parent_id, id, name, date, stars, text) FROM stdin;
1	1	6a9a211160d34b0024ec2a94	Salma B.	il y a 3 jours	5	Texture très légère, ma peau ne tiraille plus du tout depuis le début de l'hiver. Je rachèterai.
2	1	6a9a211160d34b0024ec2a95	Yasmine E.	il y a 2 semaines	5	Conseillé par la pharmacienne pour ma peau réactive : aucune rougeur, et la livraison à Casablanca était rapide.
3	1	6a9a211160d34b0024ec2a96	Nabil R.	le mois dernier	4	Efficace, mais j'aurais aimé un format plus grand. Le flacon pompe est pratique au quotidien.
\.


--
-- Data for Name: home_sections; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_sections (_order, _parent_id, id, key, visible) FROM stdin;
1	1	6aac6810d9b45d0001a5489e	hero	t
2	1	6aac6810d9b45d0001a5489f	ctaPair1	t
3	1	6aac6810d9b45d0001a548a0	rail:nouveautes	t
4	1	6aac6810d9b45d0001a548a1	summerEdit	f
5	1	6aac6810d9b45d0001a548a2	promotionsGrid	t
6	1	6aac6810d9b45d0001a548a3	featuredPromo	t
7	1	6aac6810d9b45d0001a548a4	rail:saison	t
8	1	6aac6810d9b45d0001a548a5	marketingBanner	t
9	1	6aac6810d9b45d0001a548a6	services	f
10	1	6aac6810d9b45d0001a548a7	coffrets	t
11	1	6aac6810d9b45d0001a548a8	campaign	t
12	1	6aac6810d9b45d0001a548a9	rail:best	t
13	1	6aac6810d9b45d0001a548aa	imageCarousel	f
14	1	6aac6810d9b45d0001a548ab	dermoCorner	t
15	1	6aac6810d9b45d0001a548ac	brandsFeatured	f
16	1	6aac6810d9b45d0001a548ad	brandsMarquee	t
17	1	6aac6810d9b45d0001a548ae	rail:rail-1788783106613	t
18	1	6aac6810d9b45d0001a548af	ctaPair2	t
19	1	6aac6810d9b45d0001a548b0	ctaBanner	t
20	1	6aac6810d9b45d0001a548b1	instagram	f
21	1	6aac6810d9b45d0001a548b2	newsletter	t
22	1	6aac6810d9b45d0001a548b3	trustBar	f
\.


--
-- Data for Name: home_services_teaser; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_services_teaser (_order, _parent_id, id, title, sub, cta, href, icon) FROM stdin;
\.


--
-- Data for Name: home_summer_edit_acts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_summer_edit_acts (_order, _parent_id, id, eyebrow, title, description) FROM stdin;
1	1	6aac6810d9b45d0001a548c8	Acte I	Protéger	Des formules avancées pour protéger efficacement votre peau des rayons UV.
2	1	6aac6810d9b45d0001a548c9	Acte II	Réparer	Hydrater, apaiser et réparer la peau après l’exposition au soleil.
\.


--
-- Data for Name: home_summer_edit_copy_highlights; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_summer_edit_copy_highlights (_order, _parent_id, id, icon, label) FROM stdin;
1	1	6aac6810d9b45d0001a548c5	Sun	Protection solaire
2	1	6aac6810d9b45d0001a548c6	Droplet	Hydratation intense
3	1	6aac6810d9b45d0001a548c7	Leaf	Après-soleil réparateur
\.


--
-- Data for Name: home_trust_badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.home_trust_badges (_order, _parent_id, id, title, sub, icon) FROM stdin;
1	1	6aac6810d9b45d0001a548ce	Livraison partout au Maroc	24h à Casablanca	Truck
2	1	6aac6810d9b45d0001a548cf	Paiement 100% sécurisé	CMI, carte ou à la livraison	ShieldCheck
3	1	6aac6810d9b45d0001a548d0	Produits authentiques	Circuit pharmaceutique	BadgeCheck
4	1	6aac6810d9b45d0001a548d1	Service client expert	Pharmaciens 7j/7	Headset
\.


--
-- Data for Name: instagram_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.instagram_posts (id, instagram_id, permalink, image_url, thumbnail_url, caption, media_type, "timestamp", username, is_published, sort_order, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: navigation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.navigation (id, _status, updated_at, created_at, cat_strip_enabled, cat_strip_show_all_chip, cat_strip_all_chip_label) FROM stdin;
1	published	2026-09-18 13:49:56.157+00	2026-09-16 12:02:34.664+00	t	f	Tout
\.


--
-- Data for Name: navigation_cat_strip_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.navigation_cat_strip_items (_order, _parent_id, id, label, visible, type, category_id, brand_id, collection_route, page_route, custom_url, image_id) FROM stdin;
1	1	6aad4184f042c40001180535	Visage	t	category	143	\N	\N	\N		206
2	1	6aad4184f042c40001180536	Cheveux	t	category	164	\N	\N	\N		207
3	1	6aad4184f042c40001180537	Corps	t	category	175	\N	\N	\N		208
4	1	6aad4184f042c40001180538	Bébé & Maman	t	category	216	\N	\N	\N		209
5	1	6aad4184f042c40001180539	Maquillage	t	category	203	\N	\N	\N		212
6	1	6aad4184f042c4000118053a	Compléments	t	category	239	\N	\N	\N		211
\.


--
-- Data for Name: navigation_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.navigation_items (_order, _parent_id, id, label, visible, type, category_id, brand_id, collection_route, page_route, custom_url, badge_label, badge_color, mega_menu_enabled, mega_menu_subtitle, mega_menu_promo_image_id, mega_menu_promo_title, mega_menu_promo_description, mega_menu_promo_cta_label, mega_menu_promo_cta_url, open_in_new_tab, badge_background_color, badge_text_color, appearance_color, appearance_hover_color, appearance_active_color, appearance_background_color, animation_enabled, animation_duration, animation_delay, animation_iteration_count, appearance_font_weight, animation_type, appearance_opacity, appearance_border_color) FROM stdin;
1	1	6aad4184f042c4000118053b	Soldes	t	custom	\N	\N	\N	\N	/shop/soldes		none	f		\N					f	\N	\N	#C04BD8	#C04BD8	\N	\N	t	1.5	0	infinite	\N	shimmer	\N	\N
2	1	6aad4184f042c4000118053c	Marques	t	custom	\N	\N	\N	\N	/marques		none	f		\N					f	\N	\N	\N	\N	\N	\N	f	2	0	infinite	\N	none	\N	\N
3	1	6aad4184f042c4000118053d	Visage	t	custom	\N	\N	\N	\N	/shop/visage		none	f		\N					f	\N	\N	\N	\N	\N	\N	f	2	0	infinite	\N	none	\N	\N
4	1	6aad4184f042c4000118053e	Cheveux	t	custom	\N	\N	\N	\N	/shop/cheveux		none	f		\N					f	\N	\N	\N	\N	\N	\N	f	2	0	infinite	\N	none	\N	\N
5	1	6aad4184f042c4000118053f	Corps	t	custom	\N	\N	\N	\N	/shop/corps		none	f		\N					f	\N	\N	\N	\N	\N	\N	f	2	0	infinite	\N	none	\N	\N
6	1	6aad4184f042c40001180540	K Beauty	t	custom	\N	\N	\N	\N	/shop/k-beauty		none	f		\N					f	\N	\N	\N	\N	\N	\N	f	2	0	infinite	\N	none	\N	\N
7	1	6aad4184f042c40001180541	Maquillage	t	custom	\N	\N	\N	\N	/shop/maquillage		none	f		\N					f	\N	\N	\N	\N	\N	\N	f	2	0	infinite	\N	none	\N	\N
8	1	6aad4184f042c40001180542	Bébé & Maman	t	custom	\N	\N	\N	\N	/shop/bebe-maman		none	f		\N					f	\N	\N	\N	\N	\N	\N	f	2	0	infinite	\N	none	\N	\N
9	1	6aad4184f042c40001180543	Bucco-dentaire	t	custom	\N	\N	\N	\N	/shop/bucco-dentaire		none	f		\N					f	\N	\N	\N	\N	\N	\N	f	2	0	infinite	\N	none	\N	\N
10	1	6aad4184f042c40001180544	Compléments alimentaires	t	custom	\N	\N	\N	\N	/shop/complements-alimentaires		none	f		\N					f	\N	\N	\N	\N	\N	\N	f	2	0	infinite	\N	none	\N	\N
\.


--
-- Data for Name: navigation_items_mega_menu_columns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.navigation_items_mega_menu_columns (_order, _parent_id, id, title) FROM stdin;
\.


--
-- Data for Name: navigation_items_mega_menu_columns_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.navigation_items_mega_menu_columns_links (_order, _parent_id, id, label, type, category_id, brand_id, custom_url, visible, badge_label, badge_background_color, badge_text_color, appearance_color, appearance_hover_color, appearance_active_color, appearance_background_color, appearance_border_color, appearance_opacity, animation_enabled, animation_duration, animation_delay, animation_iteration_count, appearance_font_weight, animation_type) FROM stdin;
\.


--
-- Data for Name: products_badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products_badges (_order, _parent_id, id, enabled, type, text, bg_color, text_color, priority) FROM stdin;
\.


--
-- Data for Name: products_gallery; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products_gallery (_order, _parent_id, id, image_id) FROM stdin;
1	247	6aa9c4a34be52c6e5c520032	177
2	247	6aa9c4a34be52c6e5c520033	178
3	247	6aa9c4a34be52c6e5c520034	179
4	247	6aa9c4a34be52c6e5c520035	180
5	247	6aa9c4a34be52c6e5c520036	181
1	248	6aaad2841683cd001ed899fa	191
2	248	6aaad2841683cd001ed899fb	192
3	248	6aaad2841683cd001ed899fc	193
4	248	6aaad2841683cd001ed899fd	194
5	248	6aaad2841683cd001ed899fe	195
1	249	6aaad2841683cd001ed899ff	197
2	249	6aaad2841683cd001ed89a00	198
1	250	6aaad2851683cd001ed89a01	200
2	250	6aaad2851683cd001ed89a02	201
\.


--
-- Data for Name: products_rels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products_rels (id, "order", parent_id, path, products_id) FROM stdin;
2	1	157	relatedProducts	161
3	2	157	relatedProducts	159
4	3	157	relatedProducts	160
5	1	161	relatedProducts	157
6	2	161	relatedProducts	159
7	3	161	relatedProducts	160
8	1	159	relatedProducts	157
9	2	159	relatedProducts	161
10	3	159	relatedProducts	160
11	1	160	relatedProducts	157
12	2	160	relatedProducts	159
13	3	160	relatedProducts	161
14	1	158	relatedProducts	157
15	2	158	relatedProducts	160
16	1	140	relatedProducts	141
17	2	140	relatedProducts	142
18	3	140	relatedProducts	145
19	1	141	relatedProducts	140
20	2	141	relatedProducts	145
21	3	141	relatedProducts	142
22	1	142	relatedProducts	140
23	2	142	relatedProducts	141
24	1	143	relatedProducts	144
25	2	143	relatedProducts	140
26	1	144	relatedProducts	143
27	2	144	relatedProducts	141
28	1	147	relatedProducts	146
29	2	147	relatedProducts	148
30	1	146	relatedProducts	147
31	2	146	relatedProducts	148
32	1	148	relatedProducts	147
33	2	148	relatedProducts	146
34	1	168	relatedProducts	164
35	2	168	relatedProducts	165
36	3	168	relatedProducts	167
37	1	164	relatedProducts	168
38	2	164	relatedProducts	165
39	3	164	relatedProducts	166
40	1	167	relatedProducts	168
41	2	167	relatedProducts	165
42	3	167	relatedProducts	166
43	1	165	relatedProducts	168
44	2	165	relatedProducts	164
45	3	165	relatedProducts	167
46	1	166	relatedProducts	168
47	2	166	relatedProducts	164
48	3	166	relatedProducts	167
49	1	152	relatedProducts	153
50	2	152	relatedProducts	151
51	3	152	relatedProducts	150
52	1	153	relatedProducts	152
53	2	153	relatedProducts	151
54	3	153	relatedProducts	150
55	1	151	relatedProducts	152
56	2	151	relatedProducts	153
57	3	151	relatedProducts	150
58	1	150	relatedProducts	152
59	2	150	relatedProducts	151
60	3	150	relatedProducts	153
61	1	154	relatedProducts	140
62	2	154	relatedProducts	145
63	1	145	relatedProducts	140
64	2	145	relatedProducts	141
65	1	149	relatedProducts	140
66	2	149	relatedProducts	141
67	1	107	relatedProducts	108
68	2	107	relatedProducts	109
69	3	107	relatedProducts	139
70	1	108	relatedProducts	107
71	2	108	relatedProducts	109
72	3	108	relatedProducts	139
73	1	109	relatedProducts	107
74	2	109	relatedProducts	108
75	3	109	relatedProducts	139
76	1	139	relatedProducts	107
77	2	139	relatedProducts	108
78	3	139	relatedProducts	109
79	1	111	relatedProducts	107
80	2	111	relatedProducts	108
81	3	111	relatedProducts	139
82	1	134	relatedProducts	136
83	2	134	relatedProducts	137
84	3	134	relatedProducts	135
85	1	136	relatedProducts	134
86	2	136	relatedProducts	137
87	3	136	relatedProducts	135
88	1	137	relatedProducts	134
89	2	137	relatedProducts	136
90	3	137	relatedProducts	135
91	1	135	relatedProducts	134
92	2	135	relatedProducts	136
93	3	135	relatedProducts	137
94	1	110	relatedProducts	106
95	2	110	relatedProducts	105
96	1	106	relatedProducts	110
97	2	106	relatedProducts	104
98	1	104	relatedProducts	106
99	2	104	relatedProducts	110
100	1	105	relatedProducts	110
101	2	105	relatedProducts	106
102	1	125	relatedProducts	126
103	2	125	relatedProducts	124
104	1	126	relatedProducts	125
105	2	126	relatedProducts	124
106	1	124	relatedProducts	125
107	2	124	relatedProducts	126
108	1	114	relatedProducts	115
109	2	114	relatedProducts	117
110	1	115	relatedProducts	114
111	2	115	relatedProducts	117
112	1	117	relatedProducts	114
113	2	117	relatedProducts	115
114	1	127	relatedProducts	114
115	2	127	relatedProducts	115
116	1	116	relatedProducts	114
117	2	116	relatedProducts	117
118	1	121	relatedProducts	122
119	2	121	relatedProducts	123
120	1	122	relatedProducts	121
121	2	122	relatedProducts	123
122	1	123	relatedProducts	121
123	2	123	relatedProducts	122
124	1	112	relatedProducts	113
125	1	113	relatedProducts	112
126	1	129	relatedProducts	131
127	2	129	relatedProducts	132
128	3	129	relatedProducts	133
129	1	131	relatedProducts	129
130	2	131	relatedProducts	132
131	3	131	relatedProducts	133
132	1	128	relatedProducts	130
133	2	128	relatedProducts	132
134	3	128	relatedProducts	133
135	1	130	relatedProducts	128
136	2	130	relatedProducts	132
137	3	130	relatedProducts	133
138	1	132	relatedProducts	129
139	2	132	relatedProducts	128
140	3	132	relatedProducts	133
141	1	133	relatedProducts	132
142	2	133	relatedProducts	129
143	3	133	relatedProducts	128
144	1	232	relatedProducts	233
145	2	232	relatedProducts	240
146	3	232	relatedProducts	245
147	1	233	relatedProducts	232
148	2	233	relatedProducts	240
149	1	235	relatedProducts	237
150	2	235	relatedProducts	233
151	3	235	relatedProducts	245
152	1	234	relatedProducts	236
153	2	234	relatedProducts	233
154	1	237	relatedProducts	235
155	2	237	relatedProducts	244
156	3	237	relatedProducts	245
157	1	239	relatedProducts	235
158	2	239	relatedProducts	244
159	3	239	relatedProducts	245
160	1	236	relatedProducts	234
161	2	236	relatedProducts	233
162	1	238	relatedProducts	234
163	2	238	relatedProducts	233
164	1	240	relatedProducts	244
165	2	240	relatedProducts	245
166	3	240	relatedProducts	246
167	1	246	relatedProducts	240
168	2	246	relatedProducts	244
169	1	244	relatedProducts	240
170	2	244	relatedProducts	245
171	3	244	relatedProducts	237
172	1	245	relatedProducts	240
173	2	245	relatedProducts	244
174	3	245	relatedProducts	237
175	1	185	relatedProducts	187
176	2	185	relatedProducts	188
177	3	185	relatedProducts	189
178	1	186	relatedProducts	188
179	2	186	relatedProducts	201
180	1	187	relatedProducts	185
181	2	187	relatedProducts	188
182	3	187	relatedProducts	189
183	1	188	relatedProducts	185
184	2	188	relatedProducts	187
185	3	188	relatedProducts	189
186	1	190	relatedProducts	185
187	2	190	relatedProducts	188
188	3	190	relatedProducts	189
189	1	191	relatedProducts	185
190	2	191	relatedProducts	188
191	3	191	relatedProducts	189
192	1	200	relatedProducts	185
193	2	200	relatedProducts	199
194	3	200	relatedProducts	201
195	1	199	relatedProducts	185
196	2	199	relatedProducts	200
197	3	199	relatedProducts	201
198	1	193	relatedProducts	195
199	2	193	relatedProducts	198
200	3	193	relatedProducts	201
201	1	194	relatedProducts	193
202	2	194	relatedProducts	198
203	3	194	relatedProducts	201
204	1	195	relatedProducts	193
205	2	195	relatedProducts	198
206	3	195	relatedProducts	201
207	1	196	relatedProducts	193
208	2	196	relatedProducts	198
209	3	196	relatedProducts	201
210	1	197	relatedProducts	193
211	2	197	relatedProducts	198
212	3	197	relatedProducts	201
213	1	198	relatedProducts	201
214	2	198	relatedProducts	188
215	1	189	relatedProducts	185
216	2	189	relatedProducts	187
217	3	189	relatedProducts	188
218	1	201	relatedProducts	185
219	2	201	relatedProducts	200
220	3	201	relatedProducts	188
221	1	192	relatedProducts	186
222	2	192	relatedProducts	187
223	1	205	relatedProducts	206
224	2	205	relatedProducts	207
225	3	205	relatedProducts	208
226	1	206	relatedProducts	205
227	2	206	relatedProducts	207
228	1	207	relatedProducts	205
229	2	207	relatedProducts	206
230	3	207	relatedProducts	216
231	1	208	relatedProducts	205
232	2	208	relatedProducts	207
233	1	224	relatedProducts	205
234	2	224	relatedProducts	207
235	1	228	relatedProducts	230
236	2	228	relatedProducts	229
237	3	228	relatedProducts	231
238	1	230	relatedProducts	228
239	2	230	relatedProducts	231
240	3	230	relatedProducts	229
241	1	229	relatedProducts	228
242	2	229	relatedProducts	230
243	1	231	relatedProducts	228
244	2	231	relatedProducts	230
245	1	217	relatedProducts	222
246	2	217	relatedProducts	218
247	3	217	relatedProducts	214
248	1	218	relatedProducts	217
249	2	218	relatedProducts	222
250	3	218	relatedProducts	214
251	1	222	relatedProducts	217
252	2	222	relatedProducts	218
253	3	222	relatedProducts	212
254	1	212	relatedProducts	220
255	2	212	relatedProducts	213
256	3	212	relatedProducts	222
257	1	220	relatedProducts	212
258	2	220	relatedProducts	213
259	3	220	relatedProducts	222
260	1	213	relatedProducts	220
261	2	213	relatedProducts	212
262	1	210	relatedProducts	222
263	2	210	relatedProducts	214
264	3	210	relatedProducts	216
265	1	209	relatedProducts	223
266	2	209	relatedProducts	214
267	1	221	relatedProducts	223
268	2	221	relatedProducts	214
269	1	223	relatedProducts	221
270	2	223	relatedProducts	209
271	3	223	relatedProducts	214
272	1	203	relatedProducts	227
273	2	203	relatedProducts	216
274	3	203	relatedProducts	225
275	1	225	relatedProducts	203
276	2	225	relatedProducts	227
277	1	227	relatedProducts	203
278	2	227	relatedProducts	216
279	3	227	relatedProducts	225
280	1	214	relatedProducts	217
281	2	214	relatedProducts	218
282	3	214	relatedProducts	221
283	1	219	relatedProducts	202
284	2	219	relatedProducts	211
285	1	202	relatedProducts	211
286	1	211	relatedProducts	202
287	1	226	relatedProducts	214
288	2	226	relatedProducts	217
289	1	216	relatedProducts	214
290	2	216	relatedProducts	217
291	3	216	relatedProducts	203
292	1	173	relatedProducts	174
293	2	173	relatedProducts	181
294	1	174	relatedProducts	173
295	2	174	relatedProducts	181
296	1	181	relatedProducts	173
297	2	181	relatedProducts	174
298	1	169	relatedProducts	170
299	2	169	relatedProducts	171
300	3	169	relatedProducts	172
301	1	170	relatedProducts	169
302	2	170	relatedProducts	172
303	1	171	relatedProducts	169
304	1	172	relatedProducts	169
305	2	172	relatedProducts	170
306	1	178	relatedProducts	177
307	2	178	relatedProducts	176
308	1	176	relatedProducts	178
309	2	176	relatedProducts	177
310	1	177	relatedProducts	178
311	2	177	relatedProducts	176
312	1	175	relatedProducts	169
313	2	175	relatedProducts	171
314	1	179	relatedProducts	180
315	1	180	relatedProducts	179
316	1	182	relatedProducts	184
317	2	182	relatedProducts	183
318	1	184	relatedProducts	182
319	2	184	relatedProducts	183
320	1	183	relatedProducts	182
321	2	183	relatedProducts	184
322	1	247	relatedProducts	187
323	2	247	relatedProducts	189
324	1	248	relatedProducts	245
325	1	249	relatedProducts	180
326	2	249	relatedProducts	179
327	1	250	relatedProducts	180
328	2	250	relatedProducts	179
\.


--
-- Data for Name: products_variants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products_variants (_order, _parent_id, id, option_value, sku, barcode, price, old_price, stock, reserved_stock, low_stock_threshold, image_id, active) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, title, slug, subtitle, description, price, duration, expert, bg, icon, image_id, updated_at, created_at) FROM stdin;
7	Diagnostic de peau	diagnostic-de-peau	Analyse complète du teint, de l'hydratation et de la sensibilité, avec une routine sur mesure.	Un bilan cutané complet réalisé par un pharmacien : mesure de l'hydratation, analyse de la sensibilité et des zones à imperfections. Vous repartez avec une routine écrite, adaptée à votre peau et à votre budget.	0	30 min	Pharmacien	#EFE6F3	ScanFace	22	2026-09-04 01:38:24.958+00	2026-09-04 01:38:24.958+00
8	Soin du visage éclat	soin-du-visage-eclat	Nettoyage profond, gommage doux et masque hydratant adaptés aux peaux sensibles.	Un protocole en cabine pensé pour les peaux fatiguées par le froid : double nettoyage, exfoliation enzymatique, massage drainant et masque hydratant. Sans parfum, adapté aux peaux réactives.	299	45 min	Esthéticienne	#F5E8EC	Droplet	26	2026-09-04 01:38:24.967+00	2026-09-04 01:38:24.967+00
9	Soin capillaire	soin-capillaire	Diagnostic du cuir chevelu et soin ciblé chute, pellicules ou cheveux abîmés.	Diagnostic du cuir chevelu à la caméra, puis soin traitant appliqué en cabine : lotion anti-chute, protocole anti-pellicules ou masque de reconstruction selon le besoin identifié.	199	40 min	Experte cheveux	#F5F0E3	Scissors	17	2026-09-04 01:38:24.976+00	2026-09-04 01:38:24.975+00
10	Conseil maquillage	conseil-maquillage	Teint, correction et sélection de produits adaptés à votre carnation.	Une séance pour trouver la bonne teinte de fond de teint et apprendre des gestes simples : correction des rougeurs, sublimation du regard, tenue longue durée. Le montant est déduit de vos achats du jour.	249	45 min	Make-up artist	#F3EEF7	Palette	23	2026-09-04 01:38:24.984+00	2026-09-04 01:38:24.984+00
11	Épilation	epilation	Cire tiède hypoallergénique, protocole apaisant avant et après séance.	Épilation à la cire tiède hypoallergénique, précédée d'un nettoyage antiseptique doux et suivie d'un soin apaisant post-épilation pour limiter rougeurs et poils incarnés.	99	20 min	Esthéticienne	#EAF3F0	Feather	14	2026-09-04 01:38:24.993+00	2026-09-04 01:38:24.993+00
12	Atelier future maman	atelier-future-maman	Routine grossesse et post-partum, sélection de soins sûrs pour vous et bébé.	Un atelier en petit comité pour composer une routine sûre pendant la grossesse et l'allaitement : ingrédients à éviter, vergetures, peau du nourrisson et premiers gestes d'hygiène.	0	60 min	Pharmacienne	#F2E9F2	Baby	16	2026-09-04 01:38:25.006+00	2026-09-04 01:38:25.006+00
\.


--
-- Data for Name: services_benefits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services_benefits (_order, _parent_id, id, text) FROM stdin;
1	7	6a9a211060d34b0024ec2a49	Bilan objectif de votre type de peau
2	7	6a9a211060d34b0024ec2a4a	Routine matin et soir écrite
3	7	6a9a211060d34b0024ec2a4b	Recommandations produits sans obligation d'achat
4	7	6a9a211060d34b0024ec2a4c	Suivi à 6 semaines offert
1	8	6a9a211060d34b0024ec2a51	Teint visiblement plus lumineux
2	8	6a9a211060d34b0024ec2a52	Peau repulpée et confortable
3	8	6a9a211060d34b0024ec2a53	Protocole sans parfum ni alcool
4	8	6a9a211060d34b0024ec2a54	Convient aux peaux réactives
1	9	6a9a211060d34b0024ec2a59	Diagnostic caméra du cuir chevelu
2	9	6a9a211060d34b0024ec2a5a	Soin traitant appliqué en cabine
3	9	6a9a211060d34b0024ec2a5b	Protocole à poursuivre à la maison
4	9	6a9a211060d34b0024ec2a5c	Suivi photo d'une séance à l'autre
1	10	6a9a211060d34b0024ec2a61	Recherche de teinte en lumière neutre
2	10	6a9a211060d34b0024ec2a62	Gestes simples à reproduire seule
3	10	6a9a211060d34b0024ec2a63	Déduit de vos achats du jour
4	10	6a9a211060d34b0024ec2a64	Sélection adaptée aux peaux sensibles
1	11	6a9a211060d34b0024ec2a69	Cire tiède hypoallergénique
2	11	6a9a211060d34b0024ec2a6a	Soin apaisant post-épilation inclus
3	11	6a9a211060d34b0024ec2a6b	Zones visage et corps
4	11	6a9a211060d34b0024ec2a6c	Conseils anti-poils incarnés
1	12	6a9a211160d34b0024ec2a71	Liste d'ingrédients à éviter
2	12	6a9a211160d34b0024ec2a72	Routine vergetures et tiraillements
3	12	6a9a211160d34b0024ec2a73	Soins bébé validés pédiatrie
4	12	6a9a211160d34b0024ec2a74	Atelier en petit groupe (6 personnes)
\.


--
-- Data for Name: services_steps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services_steps (_order, _parent_id, id, title, sub) FROM stdin;
1	7	6a9a211060d34b0024ec2a4d	Questionnaire	Habitudes, sensibilités, traitements en cours.
2	7	6a9a211060d34b0024ec2a4e	Mesures	Hydratation, sébum et sensibilité par zone.
3	7	6a9a211060d34b0024ec2a4f	Analyse	Lecture des résultats avec le pharmacien.
4	7	6a9a211060d34b0024ec2a50	Routine	Prescription cosmétique remise par écrit.
1	8	6a9a211060d34b0024ec2a55	Double nettoyage	Huile démaquillante puis gel doux.
2	8	6a9a211060d34b0024ec2a56	Exfoliation	Gommage enzymatique sans grains.
3	8	6a9a211060d34b0024ec2a57	Massage	Drainage visage et cou, 10 minutes.
4	8	6a9a211060d34b0024ec2a58	Masque	Masque hydratant + soin de finition.
1	9	6a9a211060d34b0024ec2a5d	Diagnostic	Caméra cuir chevelu et fibre.
2	9	6a9a211060d34b0024ec2a5e	Nettoyage	Shampooing adapté au diagnostic.
3	9	6a9a211060d34b0024ec2a5f	Soin	Application du traitement ciblé.
4	9	6a9a211060d34b0024ec2a60	Conseils	Routine et fréquence recommandées.
1	10	6a9a211060d34b0024ec2a65	Analyse	Carnation, sous-ton et attentes.
2	10	6a9a211060d34b0024ec2a66	Teint	Test de 2 à 3 teintes en lumière du jour.
3	10	6a9a211060d34b0024ec2a67	Démonstration	Application guidée sur un demi-visage.
4	10	6a9a211060d34b0024ec2a68	Sélection	Liste des produits testés.
1	11	6a9a211060d34b0024ec2a6d	Préparation	Nettoyage antiseptique de la zone.
2	11	6a9a211060d34b0024ec2a6e	Épilation	Cire tiède, travail par bandes.
3	11	6a9a211060d34b0024ec2a6f	Apaisement	Soin calmant et rafraîchissant.
4	11	6a9a211060d34b0024ec2a70	Conseils	Gommage et hydratation à domicile.
1	12	6a9a211160d34b0024ec2a75	Accueil	Tour de table et attentes.
2	12	6a9a211160d34b0024ec2a76	Ingrédients	Ce qu'on évite, ce qu'on garde.
3	12	6a9a211160d34b0024ec2a77	Routine	Corps, visage et soins bébé.
4	12	6a9a211160d34b0024ec2a78	Questions	Échange libre avec la pharmacienne.
\.


--
-- Data for Name: site_chrome; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_chrome (id, top_bar_enabled, top_bar_marquee_speed_sec, top_bar_mobile_message, logo_image_id, logo_wordmark, logo_href, header_search_enabled, header_search_placeholder, _status, updated_at, created_at, top_bar_appearance_background_color, top_bar_appearance_text_color, top_bar_appearance_link_color, top_bar_appearance_hover_color, top_bar_appearance_opacity, header_appearance_background_color, header_appearance_text_color, header_appearance_link_color, header_appearance_hover_color, header_appearance_icon_color, header_appearance_border_color, footer_appearance_background_color, footer_appearance_text_color, footer_appearance_heading_color, footer_appearance_link_color, footer_appearance_hover_color, footer_appearance_icon_color, footer_appearance_border_color, promo_modal_enabled, promo_modal_badge, promo_modal_expiry_label, promo_modal_title, promo_modal_subtitle, promo_modal_description, promo_modal_code, promo_modal_cta_label, promo_modal_image_id, promo_modal_delay_seconds) FROM stdin;
1	t	34	Livraison offerte dès 399 MAD	189	PARA D'HIVER	/	t	Rechercher un produit, une marque…	published	2026-09-17 17:40:41.821+00	2026-09-09 13:59:28.978+00	#DB84E1	#FFFFFF	#E12323	#343232	60	\N	\N	\N	\N	\N	#FFFFFF	\N	\N	\N	\N	\N	\N	\N	t	Offre de saison	\N	Pensé pour la saison	10 % sur votre commande	\N	PARA10	Copier le code	18	6
\.


--
-- Data for Name: site_chrome_footer_columns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_chrome_footer_columns (_order, _parent_id, id, title, visible) FROM stdin;
1	1	6aac261934d23d00010298e7	À propos	t
2	1	6aac261934d23d00010298ec	Boutique	t
3	1	6aac261934d23d00010298f1	Conseils	t
4	1	6aac261934d23d00010298f6	Services	t
\.


--
-- Data for Name: site_chrome_footer_columns_links; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_chrome_footer_columns_links (_order, _parent_id, id, label, href, visible) FROM stdin;
1	6aac261934d23d00010298e7	6aac261934d23d00010298e4	Notre pharmacie	/services	t
2	6aac261934d23d00010298e7	6aac261934d23d00010298e5	Nos pharmaciens	/services	t
3	6aac261934d23d00010298e7	6aac261934d23d00010298e6	Contact	/contact	t
1	6aac261934d23d00010298ec	6aac261934d23d00010298e8	Produits	/shop	t
2	6aac261934d23d00010298ec	6aac261934d23d00010298e9	Marques	/marques	t
3	6aac261934d23d00010298ec	6aac261934d23d00010298ea	Promotions	/shop/soldes	t
4	6aac261934d23d00010298ec	6aac261934d23d00010298eb	Nouveautés	/shop/nouveautes	t
1	6aac261934d23d00010298f1	6aac261934d23d00010298ed	Conseils pharmaceutiques	/services	t
2	6aac261934d23d00010298f1	6aac261934d23d00010298ee	Articles	/services	t
3	6aac261934d23d00010298f1	6aac261934d23d00010298ef	Routines	/services	t
4	6aac261934d23d00010298f1	6aac261934d23d00010298f0	Préoccupations	/services	t
1	6aac261934d23d00010298f6	6aac261934d23d00010298f2	Livraison	/services	t
2	6aac261934d23d00010298f6	6aac261934d23d00010298f3	Scanner ordonnance	/services	t
3	6aac261934d23d00010298f6	6aac261934d23d00010298f4	Contact	/contact	t
4	6aac261934d23d00010298f6	6aac261934d23d00010298f5	FAQ	/services	t
\.


--
-- Data for Name: site_chrome_header_actions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_chrome_header_actions (_order, _parent_id, id, key, label, icon, href, visible) FROM stdin;
1	1	6aac261934d23d00010298e0	services	Magasin et services	MapPin	/services	t
2	1	6aac261934d23d00010298e1	contact	Contact	MessageCircle	/contact	t
3	1	6aac261934d23d00010298e2	favoris	Favoris	Heart		t
4	1	6aac261934d23d00010298e3	panier	Panier	ShoppingBag		t
\.


--
-- Data for Name: site_chrome_promo_modal_conditions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_chrome_promo_modal_conditions (_order, _parent_id, id, text) FROM stdin;
\.


--
-- Data for Name: site_chrome_top_bar_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_chrome_top_bar_messages (_order, _parent_id, id, text, active) FROM stdin;
1	1	6aac261934d23d00010298da	Des remises exceptionnelles : -40% -50% -60% sur une sélection de produits, profitez-en vite	t
2	1	6aac261934d23d00010298db	Livraison partout au Maroc	t
3	1	6aac261934d23d00010298dc	Paiement 100% sécurisé	t
4	1	6aac261934d23d00010298dd	Produits authentiques garantis	t
5	1	6aac261934d23d00010298de	Conseil pharmacien gratuit	t
6	1	6aac261934d23d00010298df	Livraison offerte dès 399 MAD	t
\.


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stores (id, name, address, phone, email, map_url, "order", updated_at, created_at) FROM stdin;
3	Para d'Hiver — Aïn Sebaâ	4A Allée des Amandiers, Aïn Sebaâ, Casablanca 20000	06 19 96 90 07	paradhiver@gmail.com	\N	0	2026-09-04 01:38:24.792+00	2026-09-04 01:38:24.792+00
4	Para d'Hiver — Magasin 2 (à compléter)	Adresse à compléter	Téléphone à compléter	\N	\N	1	2026-09-04 01:38:24.798+00	2026-09-04 01:38:24.798+00
\.


--
-- Data for Name: stores_hours; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stores_hours (_order, _parent_id, id, days, hours) FROM stdin;
1	3	6a9a211060d34b0024ec2a20	Horaires à compléter	—
1	4	6a9a211060d34b0024ec2a21	Horaires à compléter	—
\.


--
-- Data for Name: theme; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.theme (id, preset, color_primary, color_secondary, color_accent, color_sale, color_text_primary, color_text_muted, color_background_secondary, button_bg, button_text, button_hover_bg, button_hover_text, button_radius, button_font_weight, button_letter_spacing, _status, updated_at, created_at, badge_bg, badge_text, badge_font_size, badge_font_weight, badge_letter_spacing, badge_radius, badge_padding_x, badge_padding_y, badge_gap) FROM stdin;
1	custom	#5E4074	#008AA5	#5FBE00	#FF514D	#0D0D0D	#A0A1A2	#FFFFFF	#5E4074	#FFFFFF	#432951	#FFFFFF	999	600	0.08	published	2026-09-18 13:50:22.414+00	2026-09-17 14:52:39.429+00	#B969F2	#FFFFFF	10.5	600	0.3	999	11	5	6
\.


--
-- Name: brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.brands_id_seq', 34, true);


--
-- Name: catalogue_page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.catalogue_page_id_seq', 1, true);


--
-- Name: catalogue_page_rels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.catalogue_page_rels_id_seq', 20, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 242, true);


--
-- Name: collections_page_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.collections_page_id_seq', 1, true);


--
-- Name: collections_page_rels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.collections_page_rels_id_seq', 1, false);


--
-- Name: home_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.home_id_seq', 1, true);


--
-- Name: home_rels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.home_rels_id_seq', 409, true);


--
-- Name: instagram_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.instagram_posts_id_seq', 1, false);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.media_id_seq', 216, true);


--
-- Name: navigation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.navigation_id_seq', 1, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 250, true);


--
-- Name: products_rels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_rels_id_seq', 328, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.services_id_seq', 12, true);


--
-- Name: site_chrome_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.site_chrome_id_seq', 1, true);


--
-- Name: stores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stores_id_seq', 4, true);


--
-- Name: theme_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.theme_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

\unrestrict NwYX7wa6YeT1XI035xX2brflHnhLHjIW7cO6Ps6sm9M9dWgtZgwHnX6b3WRmboT

COMMIT;
