# DisasterReady - Audit Functional Requirements (FR) & Peta Backend

- **Tanggal audit:** 22 November 2026
- **Stack backend (`composer.json`):** PHP `^8.3`, Laravel Framework `^13.17`, Inertia Laravel `^3.0`, Laravel Fortify `^1.37.2`, Laravel Wayfinder `^0.1.14`, PostgreSQL + PostGIS. Tidak ada paket S3 (`league/flysystem-aws-s3-v3`) maupun SDK LLM HTTP.
- **Stack frontend (`package.json`):** React `^19.2.0`, `@inertiajs/react ^3.0.0`, Tailwind CSS `^4.0.0`, MapLibre GL `^6.19.0`, Vite+ `1.4.0`.
- **Status integrasi:** Halaman publik, pelaporan, moderasi, admin, landing (`welcome.tsx`), dan dashboard (`dashboard.tsx`) sudah tersambung ke kontrak backend nyata (0 data mock lokal tersisa). Backend belum menyertakan provider LLM nyata, ingestion live aktif default, PVMBG live API, InaRISK approved layer, shelter/routing, TMA Pintu Air, S3 storage, atau seeder akun demo multi-role.

---

## 1. Tabel Lengkap Audit FR & Fitur Backend

| Kode / Nama Fitur (FR) | Prioritas PRD | Status Nyata | Endpoint / Controller & Data/Props ke Frontend | Halaman (Page) Frontend Terhubung |
| --- | --- | --- | --- | --- |
| **FR-01 / National Overview & Dashboard** | P0 | **Verified Full** (butuh ingestion aktif agar terisi data) | `GET /`, `GET /dashboard` (`FrontendController@page`), `GET /data/overview` (`PublicDataController@overview`). Props `overview`: `events[30]`, `alerts[50]`, `active_alert_count`, `sources`, `forecasts[80]`, `region`, `regions`, `hazards`, `layers`, `generated_at`. | `welcome.tsx`, `dashboard.tsx` (`NationalOverview`, `SiagaStatusBanner`, `AppSidebar`, `AppSidebarHeader`). |
| **FR-02 / Peta Multi-Bahaya & GIS PostGIS** | P0 | **Partial** (wajib `pgsql`/PostGIS; bug filter `forecast` tanpa `region`) | `GET /map` (`FrontendController@page`), `GET /data/map` (`PublicDataController@map` -> GeoJSON `FeatureCollection`, `truncated`, `ST_MakeEnvelope` + `ST_AsGeoJSON`, HTTP 503 jika bukan `pgsql`). | `public/map.tsx`, `dashboard.tsx` (`NationalOverview` & `FloodMapView` via `MapPanel` / `hazard-map.tsx`). |
| **FR-03 / Feed & Detail Gempa BMKG** | P0 | **Verified Full** (live sync off by default) | `GET /earthquakes`, `GET /events/{id}` (`FrontendController@page/detail`); `GET /data/events`, `/data/events/{id}` (`PublicDataController`). Ingestion: `BmkgAdapter@earthquakes` (gabungan `gempaterkini.json`, `gempadirasakan.json`, `autogempa.json`). | `public/feed.tsx`, `public/detail.tsx`, `dashboard.tsx` (`NationalOverview`, `AlertHistoryView`, `HazardsFeedView`). |
| **FR-04 / Prakiraan Cuaca BMKG (`adm4`)** | P0 | **Partial** (live sync off by default + hardcoded 2 kelurahan) | `GET /weather` (`FrontendController@page`, region hanya menerima `31.75.03.1001` & `31.75.03.1002`), `GET /data/weather?region=&current=1` (`PublicDataController@weather`). Ingestion: `BmkgAdapter@weather`. | `public/feed.tsx`, `dashboard.tsx` (`HazardsFeedView`, `RegionPickerModal`, `RegionWaterLevelDrawer`). |
| **FR-05 / Peringatan Dini Cuaca BMKG CAP** | P0 | **Partial** (live sync off by default + rapuh >44 item RSS / urutan `Cancel`) | `GET /weather`, `GET /alerts/{id}` (`FrontendController`); `GET /data/alerts?status=active`, `/data/alerts/{id}` (`PublicDataController`). Ingestion: `BmkgAdapter@alerts/cap` (RSS + CAP 1.2 XML + MultiPolygon + XXE guard). | `public/feed.tsx`, `public/detail.tsx`, `public/map.tsx`, `dashboard.tsx` (`SiagaStatusBanner`, `AlertHistoryView`, `NationalOverview`). |
| **FR-06 / Layer Risiko Historis BNPB InaRISK** | P0 | **Partial / Broken Retry** | `GET /data/layers` (`PublicDataController@layers`), `overview.layers` (`FrontendData@historicalLayer` -> `tile_template` aktif hanya jika `publication_approved=true`). Seeded unapproved, belum ada UI approval, retry di `/admin/sources` crash `UNKNOWN_SOURCE`. | `public/map.tsx`, `dashboard.tsx` (`NationalOverview`, `FloodMapView` + tautan langsung WebGIS InaRISK). |
| **FR-07 / Gunung Api PVMBG MAGMA** | P1 | **Masih Mock-Stub** (arsip statis di config) | `GET /volcanoes`, `GET /volcanoes/{id}` (`FrontendController@volcanoes`). Data statis dari `config/pvmbg.php` (`anak-krakatau`, `merapi`, `semeru`, bertanggal 21-22 Nov 2026). Tanpa tabel DB, tanpa live API, tanpa `/admin/volcanoes`. | `public/volcanoes.tsx`, tautan dari `dashboard.tsx` (`HazardsFeedView`) & sidebar. |
| **FR-08 / Pusat Kesiapsiagaan & Admin Panduan** | P0 | **Partial** (`PUT /admin/guides/0` bug insert; `emergency_contacts` per panduan belum ada di UI admin) | Public: `GET /preparedness`, `/preparedness/{hazard}` (`FrontendController@page`), `GET /data/preparedness/{hazard}` (`PublicDataController@guides`). Admin: `GET/POST /admin/guides`, `PUT /admin/guides/{id}` (`DataAdminController`). | `public/preparedness.tsx`, `admin/guides.tsx`, `dashboard.tsx` (`PreparednessView` & `EvacuationGuideDrawer` via fetch `/data/preparedness/{hazard}`). |
| **FR-09 / Pelaporan Warga + Foto Privat + Follow-Up** | P0 | **Partial** (core lengkap; celah akun suspended di `/reports/create` & UX 409) | `GET /reports/create` (`FrontendController`), `POST /reports`, `GET /my/reports`, `GET /my/reports/{report}`, `POST /my/reports/{report}/follow-ups`, `GET /reports/{report}/evidence/{evidence}` (`ReportController`, `SubmitReport`, `FollowUpReport`, `PrivatePhotoStorage`). | `reports/create.tsx`, `reports/index.tsx`, `reports/detail.tsx`. |
| **FR-10 / Moderasi Manusia & Audit Log** | P0 | **Verified Full** (minor: validasi sebelum gate di `review`, hilang `withQueryString`) | `GET /admin/reports`, `GET /admin/reports/{report}`, `POST /admin/reports/{report}/reviews` (`ReportController` + `ReviewReport`), `GET /admin/audit-logs` (`DataAdminController@audit`). | `moderation/queue.tsx`, `reports/detail.tsx`, `admin/audit.tsx`. |
| **AI-01 / Incident Analyzer** | P0 | **Masih Mock-Stub** (queue/validasi/audit penuh, provider regex stub) | `GET /admin/reports/{report}/ai-suggestions`, `POST /admin/reports/{report}/ai-feedback`, `POST /admin/reports/{report}/ai-retry` (`AiController`, `AnalyzeIncidentJob`, `AnalysisService`, `StubAiProvider`). Selalu `simulation_only: true`, `synthetic-rule-stub-v1`. | `moderation/queue.tsx` (panel saran & feedback per field), `admin/sources.tsx` (retry). |
| **AI-02 / Duplicate Detection** | P0 | **Masih Mock-Stub** (PostGIS jarak/waktu nyata, similarity Jaccard stub + searah) | `GET /admin/reports/{report}/duplicate-candidates`, `POST /admin/reports/{report}/duplicate-candidates/{candidate}` (`AiController`, `FindDuplicateReportsJob`, `StubAiProvider@similarity`). | `moderation/queue.tsx` (panel kandidat duplikat). |
| **AI-03 / Preparedness RAG Assistant** | P1 | **Tidak Ada di Backend** | Tidak ada route `POST /preparedness/ask`, tidak ada tabel `knowledge_documents`/`knowledge_chunks`, tidak ada service RAG. | `public/preparedness.tsx`, `admin/guides.tsx`, `dashboard.tsx` (`PreparednessView` menampilkan status jujur `Belum Tersedia`). |
| **AI-04 / Visual Incident Indicators** | P2 | **Tidak Ada di Backend** (deferred) | Tidak ada route/job/service analisis gambar. | `admin/sources.tsx` (`UNAVAILABLE`). |
| **FR-11 / Admin Sources, AI Health & Kill Switch** | P0 | **Partial** (`GET /admin/ai/health` HTML salah payload; retry `inarisk` crash) | `GET /admin/sources`, `POST /admin/sources/{id}`, `POST /admin/sources/{id}/retry` (`DataAdminController`); `GET /admin/ai/health`, `POST /admin/ai/settings` (`AiController`). | `admin/sources.tsx`. |
| **FR-12 / Admin Official Alerts** | P0 | **Partial** (kirim raw `geom` EWKB & tanpa `alert_state`) | `GET /admin/alerts` (`DataAdminController@alerts` -> `DB::table('official_alerts')->paginate(50)`). Read-only. | `admin/alerts.tsx` (terhubung dari sidebar `AppSidebar` & `DisasterLayout` khusus admin). |
| **FR-13 / Shelter & Verifikasi Operasional** | P1 | **Tidak Ada di Backend** (placeholder unavailable) | `GET /shelters`, `/shelters/{id}`, `/admin/shelters` -> `FrontendController@unavailable`. Tanpa tabel/CRUD. | `public/unavailable.tsx`, kartu status jujur di `public/map.tsx` & `dashboard.tsx` (`FloodMapView`). |
| **FR-14 / Pembatasan Ruas & Simulasi Rute** | P2 | **Tidak Ada di Backend** (placeholder unavailable) | `GET /admin/road-restrictions` -> `FrontendController@unavailable`. Tanpa tabel/pgRouting. | `public/unavailable.tsx`, `public/map.tsx`, `dashboard.tsx` (`FloodMapView`). |
| **FR-15 / TMA Pintu Air Jakarta (BPBD/DSDA)** | Pilot | **Tidak Ada di Backend** | Nol route, nol tabel, nol adapter live. | `dashboard.tsx` (`RegionWaterLevelDrawer` menampilkan rujukan tautan resmi BPBD DKI / Pantau Banjir / DSDA tanpa angka rekaan). |
| **FR-16 / Auth (Fortify + 2FA + Passkeys) & RBAC** | P0 | **Partial** (`DELETE /settings/profile` crash FK jika user punya laporan/review/audit) | Fortify routes (`config/fortify.php:163-175`), `routes/settings.php:8-33`, `php artisan disaster:role` (`routes/console.php:19-41`). | `auth/*` (`login`, `register`, `forgot-password`, `reset-password`, `verify-email`, `two-factor-challenge`, `confirm-password`), `settings/{overview,profile,security,appearance}.tsx`. |
| **FR-17 / Storage Foto S3 & Seeder Akun Demo** | Ops | **Tidak Ada / Lokal Only** | `config/disaster.php:8` hardcode `'photo_disk' => 'local'`; `DatabaseSeeder.php:20-23` hanya buat 1 user `test@example.com` (`reporter`). | Stream foto privat lewat `GET /reports/{report}/evidence/{evidence}`. |

---

## 2. Peta Lengkap Backend (`path:line`)

### A. Routing (Tidak ada `routes/api.php`)
- `bootstrap/app.php:11-25`: mendaftarkan `routes/web.php`, `routes/console.php`, health `/up`, middleware `HandleAppearance`, `HandleInertiaRequests`, `AddLinkHeadersForPreloadedAssets`. Semua write JSON memakai session cookie + CSRF (bukan bearer token).
- `routes/web.php:6-28`:
  - Public (`L6-L18`): `/`, `/dashboard`, `/map`, `/earthquakes`, `/weather`, `/preparedness`, `/preparedness/{hazard}`, `/events/{id}`, `/alerts/{id}`, `/volcanoes`, `/volcanoes/{id}`, `/shelters`, `/shelters/{id}`.
  - Auth + Verified (`L20-L25`): `/reports/create`, `/settings`, `/admin/shelters` (`can:administer`), `/admin/road-restrictions` (`can:administer`).
- `routes/disaster.php:11-52` (dibungkus `NormalizeDisasterDates`):
  - Public JSON (`prefix('data')`, `throttle:60,1`, `L13-L23`): `/data/overview`, `/data/events`, `/data/events/{id}`, `/data/alerts`, `/data/alerts/{id}`, `/data/weather`, `/data/map`, `/data/layers`, `/data/preparedness/{hazard}`.
  - Auth + Verified + `FrontendResponse` (`L25-L51`):
    - Pelapor (`L26-L30`): `POST /reports` (`throttle:10,1`), `GET /my/reports`, `GET /my/reports/{report}`, `POST /my/reports/{report}/follow-ups` (`throttle:10,1`), `GET /reports/{report}/evidence/{evidence}`.
    - Admin/Moderasi (`prefix('admin')`, `L31-L50`): `GET/POST /admin/sources`, `POST /admin/sources/{id}/retry`, `GET /admin/audit-logs`, `GET/POST /admin/guides`, `PUT /admin/guides/{id}`, `GET /admin/alerts`, `GET /admin/reports`, `GET /admin/reports/{report}` (`can:moderate`), `POST /admin/reports/{report}/reviews`, `GET /admin/reports/{report}/ai-suggestions`, `POST /admin/reports/{report}/ai-feedback`, `GET /admin/reports/{report}/duplicate-candidates`, `POST /admin/reports/{report}/duplicate-candidates/{candidate}`, `GET /admin/ai/health`, `POST /admin/ai/settings`, `POST /admin/reports/{report}/ai-retry`.
- `routes/settings.php:8-33`: profil (`GET/PATCH/DELETE settings/profile`), keamanan (`GET settings/security` dengan `RequirePassword`, `PUT settings/password` `throttle:6,1`), `settings/appearance`, `.well-known/passkey-endpoints`.
- `routes/console.php:19-105`:
  - `disaster:role {email} {role}` (`L19-L41`): ubah role + tulis `audit_logs`.
  - `disaster:ingest` (`L43-L54`): dispatch `IngestSourceJob` untuk `bmkg-earthquake`, `bmkg-weather`, `bmkg-cap` bila `sources_enabled=true`.
  - `disaster:recover-analysis` (`L56-L73`): re-dispatch `DISPATCH_FAILED` jobs.
  - `Schedule::command(...)` (`L75-L76`): `disaster:ingest` & `disaster:recover-analysis` tiap 5 menit `withoutOverlapping()`.
  - `disaster:evaluate-stub` (`L78-L80`) & `disaster:doctor` (`L82-L105`, cek Postgres + PostGIS).

### B. Controllers, Middleware, Policies, Requests, Providers
- `app/Http/Controllers/FrontendController.php:16-70`: `page`, `detail`, `unavailable`, `volcanoes`.
- `app/Http/Controllers/PublicDataController.php:12-119`: `overview`, `events`, `alerts`, `weather`, `event`, `alert`, `guides`, `layers`, `map` (PostGIS bbox).
- `app/Http/Controllers/ReportController.php:19-92`: `store`, `show`, `mine`, `followUp`, `index`, `review`, `evidence`.
- `app/Http/Controllers/AiController.php:17-112`: `suggestions`, `feedback`, `candidates`, `decideCandidate`, `health`, `toggle`, `retry`.
- `app/Http/Controllers/DataAdminController.php:14-97`: `sources`, `source`, `retry`, `audit`, `guides`, `saveGuide`, `alerts`.
- `app/Http/Controllers/Settings/ProfileController.php:20-61` & `SecurityController.php:19-65`.
- `app/Http/Middleware/FrontendResponse.php:18-62`: negosiasi konten JSON vs Inertia HTML + redirect 303.
- `app/Http/Middleware/HandleInertiaRequests.php:37-50`: shared props `name`, `notice`, `emergency_contacts`, `pending_reports`, `auth.user`, `sidebarOpen`.
- `app/Http/Middleware/NormalizeDisasterDates.php:13-41`: normalisasi rekursif key `*_at` & `source_time` ke ISO 8601 UTC.
- `app/Http/Middleware/HandleAppearance.php:17-22`: share cookie tema `appearance`.
- `app/Providers/AppServiceProvider.php:20-33`: bind `AiProviderInterface -> StubAiProvider` (`L22`), Gate `moderate` (`L31`), Gate `administer` (`L32`).
- `app/Providers/FortifyServiceProvider.php:40-99`: actions, Inertia auth views, rate limiter `login`, `two-factor`, `passkeys`.
- `app/Policies/IncidentReportPolicy.php:10-18`: `view` (pemilik aktif / moderator aktif), `review` (moderator aktif & bukan pelapor sendiri).
- `app/Http/Requests/StoreReportRequest.php:9-27`: validasi status aktif, deskripsi, `observed_at` bertimezone `<= now`, lat/lon, consent, foto (JPG/PNG <= 5MB, max 6000x6000).

### C. Actions, Jobs, Services, & Config
- **Actions:** `app/Actions/SubmitReport.php:17-49`, `ReviewReport.php:13-30`, `FollowUpReport.php:15-40`, `Fortify/CreateNewUser.php:20-32`, `Fortify/ResetUserPassword.php:19-28`.
- **Jobs:** `app/Jobs/AnalyzeIncidentJob.php:11-49`, `FindDuplicateReportsJob.php:11-57`, `IngestSourceJob.php:9-28`.
- **Services:** `app/Services/PublicData.php:11-54`, `FrontendData.php:12-43`, `Audit.php:13-20`, `PrivatePhotoStorage.php:13-34` (GD re-encode JPEG 85% strip EXIF ke disk `local`).
- **BMKG Integration:** `app/Services/Integrations/BmkgAdapter.php:13-221` (HTTP client, rate limit 45/min, no redirect, max 5MB, XXE guard) & `IngestSource.php:13-86` (lock 1200s, idempotent upsert, CAP supersede).
- **AI Services:** `app/Services/AI/AiProviderInterface.php:5-13`, `AnalysisService.php:14-84` (redaksi email/telepon `L41`, validasi skema & evidence substring `L43-L65`), `StubAiProvider.php:6-32`, `StubEvaluation.php:8-32`.
- **Config:** `config/disaster.php:3-16`, `config/pvmbg.php:3-31`, `config/fortify.php:18-175`, `config/database.php:20-104`, `config/filesystems.php:16-62`.

### D. Models, Migrations, & Seeders
- **Models:** `app/Models/User.php:32-54` (`#[Fillable(['name','email','password'])]`, `MustVerifyEmail`, `PasskeyUser`, `TwoFactorAuthenticatable`) & `app/Models/IncidentReport.php:21-31` (`$hidden` menyembunyikan `latitude`, `longitude`, `geom`, `reporter_id`, `privacy_consented_at`, `photo_consented_at`).
- **Migrations (11 file):**
  - Default/Fortify: `0001_01_01_000000_create_users_table.php`, `0001_01_01_000001_create_cache_table.php`, `0001_01_01_000002_create_jobs_table.php`, `2024_01_01_000000_create_passkeys_table.php`, `2025_08_14_170933_add_two_factor_columns_to_users_table.php`.
  - Domain:
    1. `2026_11_22_000001_create_reporting_tables.php:12-65`: `users.{role,status}`, `incident_reports` (+ PostGIS `geom` & GiST `L32-L36`), `report_evidence`, `report_reviews`, `audit_logs`.
    2. `2026_11_22_000002_create_ai_tables.php:11-72`: `ai_analysis_runs`, `ai_analysis_attempts`, `ai_report_suggestions`, `ai_feedback`, `report_duplicate_candidates`, `operational_settings`.
    3. `2026_11_22_000003_create_official_data_tables.php:12-106`: `sources`, `hazard_types` (7 bahaya), `disaster_events`, `official_alerts`, `forecasts` (+ PostGIS `geom` & GiST `L66-L69`), `ingestion_runs`, `hazard_layers`, `preparedness_guides`.
    4. `2026_11_22_000004_create_report_follow_ups.php:11-23` & `000005_add_follow_up_consent_timestamps.php:12-19`: `report_follow_ups` + `report_evidence.follow_up_id`.
    5. `2026_11_22_000006_allow_unreviewed_guide_drafts.php:11-13`: `preparedness_guides.reviewed_at` nullable.
- **Seeders:**
  - `database/seeders/DatabaseSeeder.php:16-24`: 1 user `test@example.com` (`reporter`, password `password`); tidak memanggil seeder domain dan tidak membuat akun demo moderator/admin.
  - `database/seeders/DisasterSourceSeeder.php:10-24`: 4 sumber (`bmkg-earthquake`, `bmkg-weather`, `bmkg-cap`, `inarisk`, semua `enabled=false`) + 1 layer InaRISK (`publication_approved=false`).
  - `database/seeders/PilotFloodGuideSeeder.php:11-48`: 1 draf panduan banjir Jatinegara (`published=false`, `reviewed_at=null`).

---

## 3. Catatan Jujur Keterbatasan, Stub, & Daftar Bug Backend

### A. Integrasi yang Masih Stub / Nonaktif Default
1. **AI-01 & AI-02 stub deterministik:** `AppServiceProvider.php:22` mengikat `StubAiProvider` (hanya regex `\bbanjir\b` & `\d+ cm`; 4 field lain dan 6 bahaya lain selalu `null`; `similarity()` memakai Jaccard kata; `token_usage` & `estimated_cost` selalu `0`).
2. **BMKG live nonaktif default:** `config/disaster.php:9-10` (`sources_enabled=false`, `weather_regions=[]`) dan semua baris `sources.enabled=false`. Butuh `.env` (`DISASTER_SOURCES_ENABLED=true`, `BMKG_WEATHER_REGIONS=31.75.03.1001,31.75.03.1002`), aktivasi source di `/admin/sources`, serta `queue:work` + `schedule:work`.
3. **Modul belum ada di backend:** AI-03 RAG (`POST /preparedness/ask`), AI-04 Vision, PVMBG live API, Shelter CRUD/verifikasi, Road Restrictions/Routing, TMA Pintu Air, S3 photo disk, dan seeder akun demo multi-role.

### B. Daftar Bug & Celah Backend (Untuk Tindak Lanjut Tim Backend)
1. **Akun suspended masih bisa baca laporan sendiri di `/reports/create`:** `FrontendController.php:38-40` tidak mengecek `$request->user()->status === 'active'`.
2. **Urutan validasi sebelum otorisasi di `POST /admin/reports/{report}/reviews`:** `ReportController.php:75-82` memvalidasi input sebelum `ReviewReport.php:17` mengecek Gate (`422` vs `404` membocorkan eksistensi ID laporan).
3. **Teks tanpa redaksi PII dikirim ke `similarity()`:** `FindDuplicateReportsJob.php:48` mengirim `$report->description` mentah tanpa redaksi email/telepon seperti `AnalysisService.php:41`.
4. **Retry source `inarisk` selalu gagal:** `DataAdminController.php:35-43` mengizinkan retry `inarisk`, lalu `IngestSource.php:32` -> `BmkgAdapter.php:19` throw `UNKNOWN_SOURCE`.
5. **`PUT /admin/guides/0` membuat record baru (201):** `DataAdminController.php:77-89` memakai pengecekan truthy `$id` alih-alih `$id !== null`.
6. **`DELETE /settings/profile` logout dulu lalu HTTP 500:** `ProfileController.php:53-55` memanggil `Auth::logout()` sebelum `$user->delete()`, padahal FK di `incident_reports`/`report_reviews`/`audit_logs` bersifat `RESTRICT`.
7. **Route param non-numerik menghasilkan 500 bukan 404:** tidak ada `->whereNumber()` pada parameter integer di `routes/web.php` dan `routes/disaster.php`.
8. **CAP ingestion rapuh terhadap >44 item & urutan `Cancel`:** `BmkgAdapter.php:25,119-135` memakai shared rate limiter 45/min tanpa skip item lama/per-item catch; `IngestSource.php:81-84` meng-update `superseded_at` per baris sehingga `Cancel` sebelum `Alert` di RSS terbaru tidak menandai alert asli.
9. **Edge case pipeline AI:** kegagalan AI-01 membuat `duplicate_status` macet di `QUEUED` (`AnalyzeIncidentJob.php:29-48`); deteksi duplikat bersifat searah (`FindDuplicateReportsJob.php:45-50`); retry saat AI mati menimpa `COMPLETED` -> `DISABLED` (`AnalysisService.php:19-30`); circuit breaker terbuka global pada 1 error (`AnalysisService.php:80`).
10. **Kontrak respons & pagination minor:** `GET /admin/ai/health` (HTML/Inertia) merender `admin/sources` dengan bentuk `payload` salah (`FrontendResponse.php:39,47-49`); `GET /admin/alerts` mengembalikan raw `geom` EWKB dan tanpa `alert_state` (`DataAdminController.php:96`); `GET /data/map?kind=forecast` tanpa `region` tidak memfilter `expires_at > now()` (`PublicDataController.php:108-116`); `ReportController.php:45,72` belum memakai `->withQueryString()`.

---

## 4. Ringkasan Alur Domain Utama

1. **Official Hazard Ingestion & Public Read:** `Schedule (5m)` -> `disaster:ingest` -> `IngestSourceJob` -> `IngestSource` -> `BmkgAdapter` -> `disaster_events` / `official_alerts` / `forecasts` (PostGIS `geom`) -> `PublicData` / `FrontendData` -> `/data/*`, `welcome.tsx`, `dashboard.tsx`, `public/{map,feed,detail}.tsx`.
2. **Citizen Incident Reporting:** `reports/create.tsx` -> `POST /reports` (`StoreReportRequest`) -> `SubmitReport` (`PrivatePhotoStorage` strip EXIF -> DB tx `PENDING` -> `afterCommit` dispatch `AnalyzeIncidentJob`) -> redirect 303 ke `/my/reports/{id}` -> jika `NEEDS_EVIDENCE`, `POST /my/reports/{id}/follow-ups` (`FollowUpReport`) -> kembali `PENDING`.
3. **AI-Assisted Triage (Stub):** `AnalyzeIncidentJob` -> `AnalysisService` (redaksi PII -> `StubAiProvider` regex -> validasi evidence) -> `ai_analysis_runs` + `ai_report_suggestions` -> `FindDuplicateReportsJob` (PostGIS `ST_DWithin` 1km/24j + Jaccard stub) -> `report_duplicate_candidates`.
4. **Human Moderation & Audit:** `moderation/queue.tsx` (`GET /admin/reports`) -> moderator beri feedback saran (`POST .../ai-feedback`) & kandidat (`POST .../duplicate-candidates/{c}`) -> putuskan status (`POST .../reviews` -> `ReviewReport` `lockForUpdate` + `version` + `report_reviews` + `audit_logs`). Tidak pernah menulis `official_alerts`.
5. **Admin Governance & Auth:** Fortify session/2FA/passkeys + `disaster:role` CLI -> `admin/{sources,alerts,guides,audit}.tsx` (`Gate::authorize('administer')`) -> kelola sumber, kill switch/retry AI, publikasi panduan ber-`reviewed_at`, baca `audit_logs`.
