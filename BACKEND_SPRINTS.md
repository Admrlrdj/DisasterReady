# DisasterReady — Backend dahulu, UI/UX berikutnya

> Pembaruan 22 November 2026: frontend sudah terhubung dan sprint aktif adalah B7/F4. Siklus scheduler dan worker lokal BMKG serta skenario pelapor sampai audit sudah diverifikasi. CI untuk perubahan ini, staging, penerimaan browser dengan tiga peran, publikasi panduan, InaRISK, dan evaluasi provider AI masih terbuka. Lihat [bukti progres](docs/FRONTEND_PROGRESS.md).

Rencana aktif sejak 22 November 2026. Mengikuti [PRD.md](PRD.md) dan [AGENTS.md](AGENTS.md), menggantikan urutan pelaksanaan awal di [SPRINTS.md](SPRINTS.md).

## Pembagian dua fase

**Fase A — Backend P0:** fondasi, alur laporan dan moderasi, AI, ingestion, penyediaan data publik/GIS, serta kesiapan operasi. Setiap sprint menghasilkan alur HTTP → validasi/otorisasi → action/service → database/queue → respons yang diuji tanpa menunggu desain UI.

**Fase B — UI/UX dan integrasi:** desain alur dan state, kemudian implementasi React/Inertia dan MapLibre terhadap kontrak fase A. Produk P0 baru selesai setelah alur pengguna, keamanan, aksesibilitas, dan deployment terintegrasi telah diverifikasi.

Arahan backend dahulu dari pengguna menjadi penyesuaian terhadap urutan UI–server–penyimpanan di AGENTS. Bangun satu alur backend lengkap per sprint; jangan membuat seluruh tabel atau semua service sekaligus. Prioritas dan batas keselamatan produk tetap berlaku.

Informasi tambahan bila dokumen lokal kurang: [Notion DisasterReady — PRD, Data Audit, ERD, Technical Backlog](https://app.notion.com/p/DisasterReady-PRD-Data-Audit-ERD-Technical-Backlog-Draft-42071d69eee181049d18cae69e35d147?source=copy_link). Notion belum diambil ulang dalam revisi rencana ini karena dokumen lokal cukup untuk pembagian fase. Catat perbedaan versi jika kelak ditemukan; jangan mengubah keputusan arsitektur diam-diam.

## Kontrak agar backend dapat dipakai frontend

- Tetap Laravel + Fortify dengan autentikasi sesi, middleware web/CSRF, dan Policies/Gates. Frontend tetap Inertia; backend dahulu tidak berarti mengganti aplikasi menjadi SPA/API terpisah atau menambah sistem identitas baru.
- Gunakan Form Request, action/service, dan representasi data yang dapat dipakai controller Inertia maupun endpoint JSON yang diperlukan. Hindari membuat endpoint JSON untuk setiap halaman jika tidak diperlukan; response HTTP final disepakati per alur sebelum implementasi.
- Pada setiap sprint dokumentasikan route/method, role/ownership, payload, required/nullable, enum status, format waktu UTC, pagination/filter, error validasi/akses/konflik, dan contoh respons sintetis. Bedakan kontrak usulan dengan endpoint yang sudah tersedia.
- Siapkan kontrak props untuk halaman Inertia dan JSON untuk interaksi GIS/operasi yang relevan. Lindungi lokasi presisi dan storage key foto dari seluruh representasi publik.
- Feature test menjadi bukti alur sementara UI belum dibuat. Test middleware sesi/CSRF yang relevan perlu diverifikasi tersendiri karena middleware tertentu dapat dinonaktifkan oleh test harness.

## Sprint backend

Implementasi sedang diverifikasi. Checkbox menandai task yang telah memiliki bukti pada cakupan lokal yang disepakati (AI stub dan storage privat lokal); gate PostgreSQL/PostGIS, integrasi live, dan cloud tetap terpisah. Lihat [bukti verifikasi](docs/BACKEND_VERIFICATION.md). B0 diperkirakan 2–3 hari kerja; B1–B7 masing-masing sekitar 1 minggu sebagai asumsi awal. Durasi perlu dikalibrasi setelah baseline B0 dan kapasitas tim diketahui. Pembagian dua fase bukan janji total pengerjaan lebih cepat; estimasi fase UI menyusul setelah desain dan kontrak cukup jelas.

### B0 — Runtime, database, queue, dan baseline

- [x] B0-01: periksa PHP/extension, Composer, Node, struktur dan lockfile; instal dari lockfile dan jalankan `composer check-platform-reqs` serta pemeriksaan backend awal. Catat hasil dan blocker.
- [x] B0-02: verifikasi auth Fortify yang sudah ada, middleware, routing dan integrasi Wayfinder/Inertia. Lakukan smoke build toolchain yang tersedia untuk mengangkat masalah kompatibilitas sejak awal; desain UI belum menjadi pekerjaan sprint ini.
- [x] B0-03: PostgreSQL 18.7/PostGIS 3.7.0 berjalan untuk development dan test terisolasi. Workflow CI sudah dikonfigurasi memakai PostGIS. Kesetaraan dengan Supabase dan eksekusi workflow terbaru tetap menjadi gate B7.
- [x] B0-04: verifikasi database queue, worker, scheduler, retry/failed jobs dan konfigurasi tersanitasi. Identifikasi host Laravel/worker; Supabase menjadi database.
- [ ] B0-05: tetapkan keputusan minimum pelaporan akun, role, privasi lokasi, foto/consent/retensi, target storage privat dan kontrak HTTP laporan. Identifikasi provider/budget AI serta akses sumber sejak awal; keputusan belum terverifikasi tetap terbuka.

**Gate:** baseline tercatat, auth berjalan, test/migrasi PostGIS terbukti dan job diproses worker. Keterbatasan akses produksi dicatat untuk B7. Tidak menambah tabel fitur fase berikutnya.

### B1 — Pengiriman laporan dan foto privat

- [x] B1-01: migrasi/model laporan dan bukti, Form Request, ownership Policy, action penyimpanan; status awal `PENDING` dengan kategori opsional, deskripsi, waktu dan lokasi tervalidasi.
- [x] B1-02: kontrak `POST /reports` dan pembacaan laporan sendiri; sertakan status, error validasi dan akses, serta pemisahan data internal/publik. Route halaman `/reports/create` diintegrasikan pada fase B.
- [x] B1-03: upload foto opsional ke storage lokal privat sesuai scope implementasi yang disepakati (adapter S3 nyata ditunda), validasi isi/ukuran/jenis, hapus EXIF, akses terotorisasi, penanganan kegagalan serta pembersihan file yatim.
- [x] B1-04: commit laporan sebelum menjadwalkan analisis; dispatch setelah commit dan mekanisme pemulihan jika dispatch gagal. Provider AI belum diperlukan.
- [x] B1-05: fixture sintetis untuk kedalaman 40 cm, kedalaman absen, teks ambigu dan pasangan duplikat; feature test HTTP sampai persistence.

**Gate:** laporan tersimpan PENDING tanpa AI; hanya pemilik/role berwenang dapat membaca; foto privat tanpa EXIF; respons publik tidak mengekspos lokasi presisi. Dispatch gagal tidak kehilangan laporan.

### B2 — Moderasi manusia dan audit

- [x] B2-01: role/status akun, Policies/Gates moderator/admin, provisioning role yang tidak bisa dipilih melalui registrasi publik.
- [x] B2-02: query antrean/detail laporan, pagination/filter dan action keputusan dengan alasan; dokumentasikan kontrak agar UI review dapat menyusul.
- [x] B2-03: transisi `PENDING`, `NEEDS_EVIDENCE`, `VERIFIED`, `REJECTED`; simpan review, status dan audit dalam transaksi yang sama.
- [x] B2-04: uji review bersamaan dan data usang, pembatasan role, rollback audit, riwayat review serta akses foto di suite lokal.

**Gate:** manusia memutuskan status melalui aksi terotorisasi dan seluruh perubahan memiliki audit konsisten. Verifikasi laporan tidak menerbitkan peringatan resmi.

### B3 — AI-01 analisis laporan

- [x] B3-01: interface, stub default, adapter HTTP opsional, validasi, backoff, circuit breaker dan kill switch tersedia. Verifikasi live dan biaya menunggu konfigurasi provider.
- [x] B3-02: `AnalyzeIncidentJob` idempoten, model/run/saran/feedback, metadata penggunaan/latency/error tersanitasi dan minimisasi input provider.
- [x] B3-03: ekstraksi hanya yang tertulis, field absen `null`, evidence span dari teks asli; kontrak saran, status job/fallback dan koreksi per field.
- [x] B3-04: action terima/koreksi/tolak saran serta feedback reviewer; pisahkan keputusan saran dari status verifikasi laporan.
- [ ] B3-05: evaluasi 200–500 kasus sintetis/berizin sesuai PRD, subset evaluasi terpisah, metrik ekstraksi/null/latency/koreksi dan keterbatasan dataset. Provider nyata hanya setelah kredensial/ketentuan tersedia; stub tetap mendukung pengembangan offline.

**Gate:** 40 cm disertai bukti, kedalaman absen tetap null, output invalid/offline aman, retry tidak menggandakan hasil dan AI tidak mengubah status verifikasi. Alur diuji melalui HTTP/job tanpa UI.

### B4 — AI-02 kandidat duplikat dan operasi AI

- [x] B4-01: `FindDuplicateReportsJob`, indeks GiST, kandidat lokasi/waktu, persistensi idempoten dan kontrak daftar kandidat beserta jarak dan selisih waktu.
- [x] B4-02: baseline jarak/waktu, ranking stub berlabel, dan adapter embedding HTTP berversi yang diuji dengan respons sintetis. Evaluasi ranking nyata masih terbuka.
- [ ] B4-03: action keputusan kandidat oleh reviewer, tanpa merge/delete/suppress otomatis; fixture pasangan positif/hard-negative dan evaluasi precision@k/recall@k/false match terhadap baseline. Pengukuran waktu review dengan UI dilanjutkan pada fase B.
- [x] B4-04: query/action admin AI health, failed jobs, versi, usage/biaya, koreksi, retry dan kill switch dengan otorisasi serta audit relevan.

**Gate:** kandidat dan keputusan reviewer dapat ditelusuri; metrik retrieval tercatat; fallback provider jelas; tidak ada perubahan laporan otomatis.

### B5 — Ingestion data resmi

- [x] B5-01: model kanonis `sources` untuk variasi `sources/data_sources` pada PRD, hazard types, events, official alerts, forecasts dan ingestion runs dengan provenance/constraint.
- [x] B5-02: verifikasi ingestion live BMKG gempa, cuaca dan CAP serta kode Kampung Melayu dan Bidara Cina. Scheduler menjadwalkan ingestion dan worker menyelesaikan ketiga job pada 22 November 2026 pukul 15.05 WIB.
- [x] B5-03: adapter sumber resmi yang terpisah dari AI, normalisasi, deduplikasi stabil, scheduler/cache/retry dan status sinkronisasi.
- [x] B5-04: freshness SLA, source/issued/effective/expires/fetched time, state stale/unavailable; query kesehatan sumber serta retry admin yang terotorisasi.
- [x] B5 nasional: katalog ADM4 dan ingestion sesuai permintaan, dengan verifikasi live melalui PostgreSQL untuk enam sampel lintas wilayah.
- [ ] B5-05: uji ingest ulang, kegagalan parsial, payload invalid, timeout, expired dan larangan AI menulis alert resmi.

**Gate:** retry idempoten, asal/waktu data lengkap dan kegagalan terlihat dalam kontrak respons; sumber tak tersedia tidak dianggap aman. Integrasi live belum lulus bila baru memakai fixture.

### B6 — Data publik, GIS, dan panduan

- [x] B6-01: query/kontrak overview, feed, detail kejadian/alert, gempa dan cuaca; pagination/filter dan proyeksi data publik yang aman.
- [x] B6-02: kueri GIS berbatas, filter dan geometri terbukti di PostGIS. Peta publik menampilkan data resmi yang bersumber dan menjaga koordinat laporan warga tetap privat.
- [ ] B6-03: tautan WebGIS Nasional InaRISK dan renderer MapLibre tersedia. Publikasi raster di aplikasi menunggu izin tertulis BNPB dan verifikasi operasional layer.
- [x] B6-04: model/query panduan dengan referensi resmi dan tanggal review; kontrak checklist/rencana keluarga dan kontak darurat yang telah diverifikasi.
- [x] B6-05: action admin sumber/alert/panduan dan query audit dengan Policies, validasi serta transaksi audit. Alert tetap bersumber resmi.

**Gate:** kontrak data publik/GIS diuji pada PostGIS, tidak membocorkan lokasi/foto privat, serta menyertakan kategori data dan kesegaran. InaRISK tetap risiko historis/model, bukan alert aktif.

### B7 — Stabilisasi backend dan serah terima frontend

- [x] B7-01: regression lokal HTTP/service/job, Pint, PHPStan, frontend lint, TypeScript dan build lulus. Penerimaan browser dan staging tetap terbuka.
- [ ] B7-02: validasi staging PostgreSQL/PostGIS–Supabase, SSL/pooler/prepared statements, migrasi terkendali, storage privat, worker/scheduler, backup/restore, monitoring dan rollback.
- [x] B7-03: finalisasi dokumentasi kontrak per alur, contoh data sintetis, error/status, prosedur menjalankan test/worker, fixture dan hasil evaluasi. Tandai endpoint/fitur yang masih stub atau terblokir.
- [x] B7-04: uji skenario sintetis laporan → PENDING → worker → kandidat → koreksi → verifikasi manusia → audit di database PostGIS terisolasi. Kasus null, provider gagal, dan CAP expired memiliki tes. Demo browser dengan tiga peran masih terbuka pada F4.

**Gate:** backend siap diintegrasikan dengan bukti pemeriksaan dan daftar keterbatasan. Ini milestone backend P0, belum penerimaan produk P0 penuh.

## Fase B — UI/UX dan integrasi frontend

1. **F1 — Desain alur:** sitemap, wireframe publik/pelapor/moderator/admin, mobile dan state kosong/loading/gagal/stale; cocokkan kebutuhan dengan kontrak backend.
2. **F2 — Laporan dan review:** form, privacy notice, status laporan, bukti privat, antrean moderasi, saran AI, kandidat duplikat dan koreksi manusia.
3. **F3 — Informasi publik:** dashboard nasional, feed/detail, cuaca/gempa, MapLibre/layer/legend, provenance dan panduan kesiapsiagaan.
4. **F4 — Admin dan penerimaan P0:** source/AI health, panduan/alert/audit, aksesibilitas/mobile, pengukuran waktu reviewer, regression end-to-end, build produksi dan demo kompetisi.

Setiap tahap frontend memvalidasi ulang backend jika ada kebutuhan kontrak yang berubah. P1 (PVMBG, shelter terverifikasi dan RAG) dikerjakan setelah P0 stabil; P2/prediksi tidak masuk fase backend P0.

## Verifikasi dan langkah pertama

Untuk perubahan backend jalankan `composer test` (Pint, PHPStan, PHPUnit) beserta test PostGIS relevan; catat perintah, hasil, database dan pemeriksaan tertunda. Perubahan routing/kontrak yang memengaruhi Wayfinder/Inertia juga memerlukan pemeriksaan frontend/build. Pada integrasi frontend jalankan `npm run check`, `npm run types:check`, `npm run build` dan regression backend yang relevan.

Lanjutkan [sprint UI/UX nasional](docs/NATIONAL_P0.md) dengan review draf kesiapsiagaan dan penerimaan browser dengan tiga peran. Izin layer InaRISK, verifikasi provider nyata, retensi, serta kesiapan cloud tetap terbuka. Checkbox menandai pekerjaan yang sudah memiliki bukti sesuai cakupannya.
