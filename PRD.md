# DisasterReady — PRD

Draft kompetisi · 22 November 2026 · konsolidasi keputusan Notion v2–v4.

[Sumber Notion](https://app.notion.com/p/42071d69eee181049d18cae69e35d147)

## Tujuan produk

DisasterReady membantu warga Indonesia menemukan informasi resmi kebencanaan dan panduan kesiapsiagaan, serta membantu moderator meninjau laporan warga. Cakupan produk nasional dan multi-bahaya. Jatinegara, terutama Kampung Melayu dan Bidara Cina, adalah kandidat pilot banjir, cuaca, pelaporan, dan shelter. Pilot gunung api masih terbuka. Draft ini belum tervalidasi lapangan.

## Cakupan produk

1. National disaster feed: kejadian gempa, peringatan cuaca, laporan status gunung api yang dapat diakses secara sah, dan pengumuman resmi; tampilkan waktu, sumber, wilayah terdampak, status kedaluwarsa.
2. Multi-hazard map: banjir, gempa, tsunami, gunung api, longsor, cuaca ekstrem; pisahkan **kejadian**, **peringatan**, **prakiraan**, dan **peta risiko historis**.
3. Weather: prakiraan hujan, suhu, kondisi cuaca BMKG. Curah hujan adalah indikator meteorologi, bukan kategori bencana tersendiri; tidak otomatis berarti banjir.
4. Volcano: profil gunung, tingkat aktivitas resmi, rekomendasi dan kawasan rawan bencana. Jangan menginfer status dari grafik sendiri.
5. Preparedness center: panduan resmi per jenis bencana, checklist tas siaga, rencana keluarga, kontak darurat resmi.
6. Citizen reporting, shelter provenance, verification workflow, and optional _scenario-only_ evacuation route planner, first piloted in Jatinegara.

## Prioritas implementasi

- **P0** — Dashboard dan peta nasional, BMKG cuaca/gempa/CAP, layer InaRISK, provenance dan staleness, panduan kesiapsiagaan, RBAC/admin, ingestion, pelaporan warga, moderasi, AI-01 dan AI-02. Jika waktu kompetisi sempit, AI-01 dengan review manual menjadi batas minimum demo AI.
- **P1** — Integrasi PVMBG setelah akses sah terkonfirmasi, atau tautan/snapshot resmi yang diizinkan, verifikasi kandidat shelter Jatinegara, dan AI-03.
- **P2** — Simulasi rute, push notification, analitik, perluasan sumber regional, dan AI-04. Prediksi bahaya di luar MVP.

## Sumber data nasional

- BMKG open data [https://data.bmkg.go.id/](https://data.bmkg.go.id/) : prakiraan, gempa terbaru/dirasakan/M5+, tsunami-potential feed; JSON/XML; documented rate limit 60/min/IP for earthquake. Verified documentation, test ingestion before release.
- BMKG CAP nowcast [https://data.bmkg.go.id/peringatan-dini-cuaca/](https://data.bmkg.go.id/peringatan-dini-cuaca/) : CAP XML, polygon, effective/expires; 60/min/IP; suitable for official weather alerts.
- BNPB InaRISK [https://gis.bnpb.go.id/server/rest/services/inarisk](https://gis.bnpb.go.id/server/rest/services/inarisk) : GIS hazard layers for banjir, gempa, tsunami, volcano, longsor and more. Historical/modelled hazard != current emergency.
- PVMBG MAGMA [https://magma.esdm.go.id/](https://magma.esdm.go.id/) : official volcanic monitoring; October 2026 announcement mentions CAP/API for stakeholders and public, but specific access, credentials, terms, schema, and rate limits remain unverified. Begin with official source links and manual sourced snapshots if authorized; no assumed public endpoint.
- BPBD Jakarta/Pantau Banjir for Jakarta-specific data; access and rights pending validation.

## Audit sumber data pilot (desk audit, belum uji endpoint end-to-end)

| Sumber                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Temuan                                                                                                                                                                   | Status                                                           | Tindakan                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| BMKG prakiraan cuaca                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | JSON tingkat kelurahan, 3 hari, per 3 jam, 2 update/hari, 60 request/menit/IP, wajib atribusi                                                                            | Layak untuk MVP                                                  | Uji kode adm4 setiap kelurahan Jatinegara; cache                                                               |
| InaRISK BNPB                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | ArcGIS REST folder berisi layanan indeks bahaya banjir                                                                                                                   | Layak bersyarat                                                  | Inspeksi layer ID, CRS, extent, query/export, lisensi dan resolusi                                             |
| Pantau Banjir Jakarta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Peta RT, lintas tahun, tinggi muka air dan informasi banjir                                                                                                              | Referensi portal; API belum terkonfirmasi                        | Cek unduhan resmi/izin akses; jangan scraping tanpa persetujuan                                                |
| Dinas SDA / BPBD TMA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Informasi pantauan air dan hujan tersedia di halaman publik                                                                                                              | Layak sebagai tautan/referensi; API belum terkonfirmasi          | Minta akses data machine-readable                                                                              |
| PPID Jakarta Lokasi Pengungsian Banjir PDF                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Mencantumkan Kampung Melayu: Kantor Kelurahan, SMPN 26, Masjid Itthadul Ikhwan, Kantor Sudin Kesehatan, Rusunawa Jatinegara Barat; Bidara Cina: SDN 03, Posko GOR Otista | Kandidat historis, BUKAN shelter aktif/terverifikasi operasional | Geocode manual, cek dokumen bertanggal, konfirmasi kelurahan/BPBD, jangan publikasikan kapasitas tak bersumber |
| Satu Data Indonesia rekap lokasi pengungsi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Dataset ada tetapi tautan CSV/XLSX dilaporkan bermasalah                                                                                                                 | Blocked                                                          | Minta file melalui pengelola; fallback PPID                                                                    |
| OpenStreetMap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Jaringan jalan dan POI                                                                                                                                                   | Layak bersyarat                                                  | Download extract, cek coverage, lisensi ODbL/atribusi, jangan klaim POI shelter resmi                          |
| Sumber: [https://data.bmkg.go.id/prakiraan-cuaca/](https://data.bmkg.go.id/prakiraan-cuaca/) ; [https://gis.bnpb.go.id/server/rest/services/inarisk](https://gis.bnpb.go.id/server/rest/services/inarisk) ; [https://pantaubanjir.jakarta.go.id/](https://pantaubanjir.jakarta.go.id/) ; [https://dsda.jakarta.go.id/layanan](https://dsda.jakarta.go.id/layanan) ; [https://bpbd.jakarta.go.id/waterlevel/](https://bpbd.jakarta.go.id/waterlevel/) ; [https://ppid.jakarta.go.id/assets/pdf/Lokasi%20Pengungsian%20Banjir.pdf](https://ppid.jakarta.go.id/assets/pdf/Lokasi%20Pengungsian%20Banjir.pdf) ; [https://data.go.id/dataset/dataset/data-rekapitulasi-lokasi-pengungsi-banjir-di-provinsi-dki-jakarta](https://data.go.id/dataset/dataset/data-rekapitulasi-lokasi-pengungsi-banjir-di-provinsi-dki-jakarta) |                                                                                                                                                                          |                                                                  |                                                                                                                |

## Alur dan halaman

Public: / (national overview) → /map (hazard filters) → /events/{id} (source/time/detail) → /alerts/{id} (official action) → /preparedness/{hazard} (guide/checklist); /weather?region=...; /earthquakes; /volcanoes; /volcanoes/{id}; /shelters; /reports/create.

Moderator: /admin/reports → inspect evidence/duplicates → verify/reject → audit.

Admin: /admin/sources → health, last sync, retry; /admin/alerts; /admin/volcanoes; /admin/guides; /admin/shelters; /admin/audit-logs.

Citizen: open report form → input category (optional), description, observed time, approximate location, optional photo → see privacy notice → submit → pending state → optional follow-up for missing evidence.

Moderator: open review queue → inspect original text/photo → compare AI classification and extracted evidence → inspect duplicate candidates and official context → accept/edit/reject suggestion → decide report status with reason → audit log.

Admin: monitor provider health, token budget, queue failures, model versions, reviewer correction rate, and feature kill switch.

Preparedness user (P1): select hazard → ask question → retrieve reviewed official documents → grounded answer with source links or explicit no-answer fallback.

## Arsitektur (v4)

- Backend: Laravel 13 (PHP 8.3+ as user-selected baseline; verify actual framework/PHP compatibility during installation), Inertia.js v3, Laravel Fortify, Laravel Wayfinder.
- Frontend: React 19, TypeScript, Tailwind CSS v4, shadcn/ui based on Radix UI, Lucide Icons, Vite+ (verify availability and integration compatibility with Laravel/Inertia; use standard Vite if needed).
- GIS UI: MapLibre GL JS with React components, source timestamp/legend and hazard layers.
- Database: local PostgreSQL; production Supabase-hosted PostgreSQL. Enable PostGIS in both. pgvector optional after extension verification. pgRouting optional and only if available in target infrastructure; avoid depending on it for MVP.
- Authentication: Laravel Fortify is authoritative; do not introduce a second Supabase Auth identity system without explicit architectural decision.
- AI: Laravel service/provider abstraction, queue-based report analysis, HTTP-based LLM provider, schema validation, privacy minimization, feedback and evaluation. Inertia passes server data to React; JSON endpoints can serve interactive GIS data.
- Queue and scheduler: Laravel Scheduler + Queue Worker running in application compute; Supabase is managed database, not the Laravel application/worker host. Database queue driver possible for early deployments; Redis optional if operationally justified.
- Files: private S3-compatible storage for incident photos, not public database attachments; avoid storing sensitive photos in a publicly readable Supabase bucket.

Browser React 19 + Inertia + MapLibre → Laravel controllers/actions/Wayfinder → Laravel domain services (hazard data, incident reports, AI, moderation, GIS) → local PostgreSQL/PostGIS or Supabase PostgreSQL/PostGIS. Separate Laravel scheduled ingestion jobs and AI analysis queue workers connect to same database. Official alert ingestion is isolated from AI-generated user-report suggestions.

Keep PostgreSQL major versions/extensions and migrations compatible between local and production; use environment variables for database SSL, pooler vs direct connection, secrets and storage; run migrations through controlled deployment, never browser client; enforce server-side authorization, backups, network restrictions and observability. Verify Supabase connection pooling and migration connection behavior before launch.

## Model data

- sources(id, agency, name, endpoint, license, attribution, freshness_sla, last_success_at)
- hazard_types(id, slug, label)
- disaster_events(id, hazard_type_id, source_id, external_id, occurred_at, geom, payload_json, dedup_key)
- official_alerts(id, source_id, hazard_type_id, issued_at, effective_at, expires_at, severity, certainty, area_geom, message, source_url)
- forecasts(id, source_id, region_code, forecast_at, rain_metric, units, payload_json)
- volcanoes(id, name, geom, official_identifier)
- volcano_status_history(id, volcano_id, source_id, official_level, issued_at, recommendation, source_url)
- hazard_layers(id, hazard_type_id, source_id, layer_url, temporal_scope, legend)
- preparedness_guides(id, hazard_type_id, title, content, official_reference, reviewed_at)
- users, incident_reports, report_evidence, report_reviews, shelters, shelter_verifications, shelter_operational_updates, audit_logs (lihat skema pilot di bawah)
- ingestion_runs(id, source_id, started_at, finished_at, status, count, error)

Use PostGIS GiST indices, unique(source_id,external_id) when stable, UTC storage and timezone-aware rendering; distinguish alert severity from volcano level and local report status.

### Skema pilot dan moderasi

users(id PK, role, status); shelters(id PK, name, geom, source_id FK); shelter_verifications(id PK, shelter_id FK, dimension, result, evidence_id, reviewer_id FK, checked_at, expires_at); shelter_operational_updates(id PK, shelter_id FK, status, observed_at, expires_at, source_id); incident_reports(id PK, reporter_id FK, category, geom, observed_at, status); report_evidence(id PK, report_id FK, storage_key, sha256); report_reviews(id PK, report_id FK, reviewer_id FK, decision, reason, created_at); road_nodes(id PK, geom); road_edges(id PK, source FK, target FK, geom, length_m, walk_cost_s, graph_version); road_restrictions(id PK, edge_id FK, report_id FK nullable, status, starts_at, expires_at, approved_by FK); hazard_layers(id PK, name, geom_or_raster_ref, source_id FK, valid_at); data_sources(id PK, name, url, license, fetched_at, attribution); ingestion_runs(id PK, source_id FK, status, started_at, error); audit_logs(id PK, actor_id FK, entity_type, entity_id, before_json, after_json, timestamp).

Index GiST on spatial columns; unique and foreign keys; retain history, use soft delete where needed. Avoid storing exact reporter coordinates publicly.

### Model data AI

- ai_models(id, provider, model_identifier, task, config_version, active)
- ai_analysis_runs(id, report_id FK, ai_model_id FK, prompt_version, status, input_hash, output_json, started_at, completed_at, latency_ms, token_usage, estimated_cost, error_code)
- ai_report_suggestions(id, analysis_run_id FK, field_name, suggested_value_json, evidence_span, review_status, reviewed_by FK, reviewed_at)
- report_duplicate_candidates(id, report_id FK, candidate_report_id FK, method_version, text_score, geo_distance_m, time_delta_minutes, reviewer_decision)
- knowledge_documents(id, source_id FK, hazard_type_id FK, title, source_url, published_at, reviewed_at, license, status)
- knowledge_chunks(id, document_id FK, chunk_text, embedding nullable, section, content_hash)
- ai_feedback(id, analysis_run_id FK, reviewer_id FK, feedback_type, corrected_json, created_at)
- ai_evaluation_cases(id, task, input_ref, expected_json, split, consent_status)
- ai_evaluation_results(id, ai_model_id FK, evaluation_version, metrics_json, tested_at)
- ai_usage_daily(id, day, feature, provider, request_count, token_count, estimated_cost)

## AI dan kontrak aplikasi

**AI-01 Incident Analyzer (P0):** Asynchronously classify Indonesian citizen reports, summarize text, extract only explicitly stated hazard, place, observation time, water depth and road-access issues; flag missing evidence. Every extracted field can be null and is linked to evidence in original text. Moderator accepts, corrects or rejects AI suggestions. Never publish AI output as verified fact.

**AI-02 Duplicate Detection (P0):** PostGIS geographic/time-window candidate search, then semantic similarity ranking. Show candidate IDs, spatial distance, time delta and explanation to moderator. Never automatically merge or delete. Benchmark against a simple distance/time baseline.

**AI-03 Preparedness RAG Assistant (P1):** Retrieve curated, legally usable official BMKG/BNPB/PVMBG guidance, answer with links and publication/review dates. Abstain when sources are insufficient. Never fabricate real-time warnings or evacuation orders.

**AI-04 Visual Incident Indicators (P2):** Analyze consented photographs for visible floodwater, debris, smoke/ash and apparent damage. Not a safety, structural-integrity or water-depth determination; requires labeled data and human validation.

**AI-05 Hazard prediction (out of MVP):** No unsupported prediction from rainfall or LLM text. Requires historical outcome labels, time-based validation, calibrated probabilities and independent evaluation.

POST /reports; GET /my/reports/{id}; GET /admin/reports/{id}/ai-suggestions; POST /admin/reports/{id}/ai-feedback; GET /admin/reports/{id}/duplicate-candidates; GET /admin/ai/health; POST /preparedness/ask (P1). Return ai_generated, model_version, review_status and fallback state.

AI dijalankan lewat `AnalyzeIncidentJob` dan `FindDuplicateReportsJob`, dengan provider HTTP di balik `AiProviderInterface`, validasi skema, retry/backoff, circuit breaker, rate limit, dan batas penggunaan. PostGIS menyaring kandidat. Penyimpanan embedding dengan pgvector bersifat opsional.

## Penerimaan dan evaluasi

- Submitting a report returns PENDING even if AI provider is offline; background queue never blocks user submission.
- AI suggestions clearly marked unverified; reviewer alone sets VERIFIED/REJECTED/NEEDS_EVIDENCE.
- Missing measurements stay null; no fabricated water level, coordinates or severity.
- Duplicate recommendations never automatically suppress, merge or delete reports.
- Every run records model identifier, prompt version, timing, result schema, failures and reviewer feedback.
- Official alerts remain from trusted source adapters, never from AI-generated reports.
- Assistant responses link cited official guidance and redirect urgent real-time queries to official alert sources.

- Setiap layer menampilkan jenis data, sumber, waktu relevan, dan status kedaluwarsa/kegagalan. Kandidat shelter tanpa konfirmasi operasional tidak diberi label aktif. Riwayat moderasi dan perubahan admin tercatat.
- Jika simulasi rute dikerjakan, hanya pembatasan ruas terverifikasi yang masih berlaku boleh mengubah graph. Respons mencantumkan graph version, provenance, peringatan, dan `simulation_only=true`. Data yang kurang atau graph tanpa jalur menghasilkan status eksplisit.

Incident dataset: de-identified Indonesian report text, hazard label, observation time, approximate location, evidence spans, ambiguous/no-disaster negatives. Collect 200–500 consented or synthetic cases for initial smoke tests; not statistically representative.

Duplicate dataset: human-labeled positive and hard-negative report pairs; measure precision@k, recall@k, false matches, and reviewer time vs distance/time baseline.

RAG dataset: curated official guides with rights, URL, title, version and reviewed date; 50–100 questions including unknown and urgent prompts; measure groundedness, correct citations and refusal.

Vision dataset (P2): licensed/consented labeled images, separate validation/test splits; no private-photo scraping.

Privacy: strip EXIF, minimize personal data sent to AI provider, set retention/deletion policy, review provider processing terms, encrypt sensitive records and restrict raw logs. No invented confidence percentages; calibrate before displaying.

Submit synthetic flood report with explicit 40 cm depth; AI extracts that value; submit near-duplicate; reviewer inspects and corrects AI classification; only human action changes verified status; demonstrate missing depth remains null and provider outage still accepts reports. Record accuracy, duplicate retrieval, latency and human correction rate.

## Batas keselamatan

Never call a risk map a live alert; never call an event forecast; never manufacture government warning; do not assert shelter availability without confirmation. Show authoritative original link, issued/expires, last fetched, and stale/failure state. If source unavailable, keep labeled historical snapshot or show unavailable, not green/all clear. Volcano status levels are official and not derived from rainfall or crowd reports. Do not publish precise reporter location or identifiable photo metadata without safeguards.

Simulasi rute dilabeli sebagai simulasi dan tidak menjamin keamanan jalur. Sertakan tautan sumber resmi dan kontak darurat resmi yang sudah diverifikasi.

## Backlog dan pembagian kerja

W1: Dev A report UI + moderation wireframe; Dev B AI provider contract, schema, privacy controls; jointly create labeled fixtures.

W2: Dev A suggestions and pending states; Dev B queue-based incident analyzer, retries, unit tests.

W3: Dev A duplicate review UI; Dev B PostGIS candidate retrieval, semantic ranking and evaluation.

W4: Dev A reviewer corrections and AI health dashboard; Dev B feedback persistence, monitoring, costs and fallback.

W5–6: Both integrate with multi-hazard dashboard and official-source ingestion, run QA, security, usability and competition demo.

W7–8 optional: RAG guidance and evaluation; image vision P2 deferred.

**Scope dependency:** citizen reporting moves from v2 P1 to v3 P0 because AI incident analysis requires report inputs. If deadline is short, AI-01 alone plus manual review is the minimum credible AI MVP.

Developer A: React 19/Inertia/TypeScript, shadcn/ui, MapLibre, citizen report form, moderator AI review, dashboards. Developer B: Laravel 13/Fortify/Wayfinder, PostgreSQL/PostGIS/Supabase migration parity, ingestion adapters, AI jobs, authorization and tests. Jointly maintain typed page props, data contracts, integration QA and deployment.

## Keputusan terbuka

Competition deadline, model provider/budget, external API permissions, reporting privacy and consent, evaluation annotators, and volcanic pilot region. Do not claim a self-trained or predictive model without proof.

Confirm Laravel 13/PHP version compatibility, Inertia.js v3 and Wayfinder package integration, Vite+ support with Laravel, Supabase PostGIS/pgvector/pgRouting availability, hosting for Laravel scheduler/worker, and AI provider pricing/permissions. Do not represent unverified versions/extensions as already tested.
