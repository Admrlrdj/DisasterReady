# DisasterReady — Rencana Sprint

> **Pembaruan arah kerja, 22 November 2026:** pengerjaan dibagi menjadi fase backend terlebih dahulu, lalu UI/UX dan integrasi frontend. Rencana aktif berada di [BACKEND_SPRINTS.md](BACKEND_SPRINTS.md). Urutan, estimasi, dan pembagian Dev A/B di bawah menjadi referensi rencana awal; jangan digunakan sebagai jadwal aktif. Scope produk tetap mengikuti PRD dan AGENTS. Sesuai arahan pengguna, validasi fase backend dilakukan melalui kontrak HTTP, database, queue, dan test sebelum integrasi UI.

Disusun 22 November 2026 berdasarkan [PRD.md](PRD.md), [AGENTS.md](AGENTS.md), dan inspeksi repositori. Dokumen ini adalah rencana pelaksanaan; prioritas produk dan batas arsitektur tetap mengikuti PRD dan AGENTS.

## Asumsi dan cara memakai

- Estimasi awal: dua developer, Sprint 0 selama 2–3 hari kerja dan setiap sprint berikutnya 1 minggu. Ini perkiraan kapasitas, bukan tanggal komitmen; deadline kompetisi belum diketahui.
- Dev A berfokus pada React/Inertia, UX, dan peta. Dev B berfokus pada Laravel, database, integrasi, dan AI. Kontrak data, keamanan, pengujian integrasi, dan demo dikerjakan bersama. Jika dikerjakan sendiri, pertahankan urutan dan sesuaikan durasi.
- Kerjakan satu sprint aktif. Task selesai setelah acceptance criteria terbukti, bukan hanya setelah kode dibuat.
- Pada akhir sprint: demo alur utuh, catat hasil pemeriksaan, perbarui status task, lalu pilih pekerjaan sprint berikutnya.
- Semua task di bawah berstatus belum dimulai. Dokumen ini tidak menyatakan fitur sudah diimplementasikan atau integrasi sudah terverifikasi.

## Kondisi awal yang ditemukan

| Area              | Bukti di repositori                                                                          | Implikasi                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Autentikasi       | Fortify, halaman auth/settings, model User, test autentikasi                                 | Gunakan fondasi ini; role moderator/admin belum terlihat                                          |
| Halaman produk    | `/` menggunakan welcome; `/dashboard` menggunakan placeholder                                | Dashboard kebencanaan dan halaman domain perlu dibuat                                             |
| Domain            | Migrasi user, passkey, cache, jobs; belum ada model laporan/sumber/bencana                   | Bangun skema bertahap sesuai alur sprint                                                          |
| GIS dan AI        | Belum ada dependensi MapLibre atau service/job domain GIS/AI                                 | Verifikasi dan tambahkan saat diperlukan                                                          |
| Database          | `.env.example` memakai PostgreSQL; PHPUnit memakai SQLite in-memory                          | Test spasial wajib memiliki jalur PostgreSQL/PostGIS tersendiri                                   |
| CI                | Service `postgres:16-alpine`, PHP 8.3, Node 22                                               | Belum menyediakan PostGIS; jangan menganggap test saat ini memverifikasi spasial                  |
| Lockfile PHP      | Laravel v13.43.0 mensyaratkan PHP `^8.3`; Inertia v3.7.0, Fortify v1.43.0, Wayfinder v0.1.23 | Batas PHP framework sesuai deklarasi proyek; runtime dan seluruh dependency tetap perlu diperiksa |
| Lockfile frontend | React 19.3.1, Inertia React 3.11.0, Vite+ 1.4.0                                              | Vite+ sudah dikonfigurasi; integrasi belum dibuktikan lewat build pada audit ini                  |
| Runtime frontend  | Engine Vite+ pada lockfile: `^22.18.0 \|\| ^24.11.0 \|\| >=26.0.0`                           | Petunjuk umum Node 22+ perlu diperjelas sesuai engine yang terkunci                               |

Audit ini membaca kode, konfigurasi, dan lockfile. Audit tidak menjalankan aplikasi, menguji endpoint sumber, atau memverifikasi infrastruktur Supabase. Folder `vendor` tersedia, `node_modules` belum tersedia saat inspeksi.

## Urutan dan milestone

| Sprint      | Fokus                          | Hasil yang dapat didemokan                                                | Dependensi                                     |
| ----------- | ------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------- |
| 0           | Fondasi dan validasi stack     | Aplikasi, auth, database, worker, dan build berjalan                      | Akses environment pengembangan                 |
| 1           | Laporan warga                  | Pengguna mengirim laporan dan melihat status PENDING                      | Sprint 0                                       |
| 2           | Moderasi manusia               | Moderator memutuskan status dengan alasan dan audit                       | Sprint 1                                       |
| 3           | AI-01 Incident Analyzer        | Saran AI berbukti, bisa dikoreksi, tetap menerima laporan saat AI offline | Sprint 2                                       |
| 4           | AI-02 Duplicate Detection      | Kandidat duplikat berbasis lokasi/waktu dan ranking semantik              | Sprint 3                                       |
| 5           | Ingestion sumber resmi         | Gempa, cuaca, dan CAP tersimpan idempoten dengan status sumber            | Fondasi Sprint 0; dijadwalkan setelah Sprint 4 |
| 6           | Dashboard, peta, kesiapsiagaan | Alur informasi publik nasional terhubung                                  | Sprint 5 dan alur laporan                      |
| 7           | Stabilisasi dan rilis P0       | Demo kompetisi dan deployment terverifikasi                               | Sprint 1–6                                     |
| 8, opsional | P1                             | Shelter bersumber, informasi gunung api, AI-03                            | P0 lulus; akses data dan kapasitas tersedia    |

Urutan ini mempertahankan fokus AI W1–W4 di PRD, menambahkan fondasi yang belum tervalidasi, dan memberi ruang eksplisit untuk integrasi serta QA. Dengan asumsi di atas, P0 penuh diperkirakan 7 minggu + 2–3 hari kerja. Sprint opsional dapat dipecah lagi berdasarkan kapasitas.

## Sprint 0 — Fondasi yang dapat dijalankan

**Tujuan:** menghilangkan hambatan teknis sebelum membangun fitur produk.

- [ ] S0-01 — Bersama: inventaris runtime PHP/extension, Composer, Node; jalankan instalasi dari lockfile dan `composer check-platform-reqs`. Catat matriks versi aktual, bukan hanya versi di README.
- [ ] S0-02 — Bersama: verifikasi Laravel/Inertia/Wayfinder, auth, development server, dan production build Vite+. Gunakan Vite standar hanya jika ada masalah kompatibilitas yang terbukti dan catat keputusan.
- [ ] S0-03 — Dev B: siapkan database pengembangan dan test PostgreSQL/PostGIS; catat versi major/extension dan rencana kesetaraan Supabase. Sediakan service CI PostGIS serta konfigurasi test spasial yang benar-benar memakai PostgreSQL.
- [ ] S0-04 — Dev B: verifikasi database queue, worker, scheduler, retry dan failed-job dasar; tetapkan host aplikasi/worker yang terpisah dari layanan database Supabase.
- [ ] S0-05 — Dev A: petakan navigasi publik, pelapor, moderator, admin dan state loading/kosong/error/kedaluwarsa; sepakati kontrak props dengan Dev B.
- [ ] S0-06 — Bersama: putuskan mekanisme pelaporan akun, role, batas lokasi publik, persetujuan foto, retensi/penghapusan, provider AI/budget, dan target penyimpanan S3 privat. Verifikasi akses sumber resmi secara awal untuk mengangkat blocker sebelum Sprint 5.
- [ ] S0-07 — Bersama: rapikan petunjuk setup sesuai hasil validasi; rekam baseline lint, typecheck, test, build dan masalah awal.

**Selesai jika:** auth dan build berjalan; migrasi/test spasial lulus di PostGIS; job contoh diproses worker; keputusan atau blocker eksternal tercatat beserta alternatifnya. Bukti produksi Supabase yang belum tersedia tetap menjadi gate Sprint 7.

## Sprint 1 — Laporan warga dari form sampai database

**Tujuan:** alur P0 pertama menghubungkan UI, server, penyimpanan, dan otorisasi.

- [ ] S1-01 — Dev B: migrasi/model `incident_reports` dan `report_evidence`, validasi kategori opsional, deskripsi, waktu pengamatan, lokasi, pemilik, serta status awal `PENDING`.
- [ ] S1-02 — Dev A: `/reports/create`, pemberitahuan privasi, validasi form, konfirmasi berhasil, dan `/my/reports/{id}` dengan status yang jelas.
- [ ] S1-03 — Dev B: penyimpanan foto opsional di S3-compatible privat, validasi isi/ukuran/jenis, penghapusan EXIF, akses berbasis otorisasi, dan penanganan kegagalan upload.
- [ ] S1-04 — Bersama: simpan koordinat untuk kebutuhan internal secara terbatas; tentukan representasi lokasi perkiraan untuk publik. Jangan membocorkan lokasi presisi melalui props atau JSON.
- [ ] S1-05 — Dev B: simpan laporan sebelum dispatch job melalui mekanisme setelah commit; belum perlu provider AI nyata. Kegagalan dispatch dicatat dan dapat dipulihkan tanpa kehilangan laporan.
- [ ] S1-06 — Bersama: buat fixture sintetis berlabel, termasuk laporan banjir 40 cm, tanpa kedalaman, ambigu, dan potensi duplikat.

**Selesai jika:** pengguna dapat mengirim dan membuka laporan miliknya; status awal selalu PENDING; akses laporan orang lain ditolak; foto tidak publik dan EXIF hilang; AI offline tidak memengaruhi penyimpanan laporan.

## Sprint 2 — Moderasi, role, dan audit

**Tujuan:** manusia dapat meninjau laporan sebelum ada saran AI.

- [ ] S2-01 — Dev B: role pelapor/moderator/admin, Policies/Gates, dan pembatasan aksi pada server.
- [ ] S2-02 — Dev A: antrean `/admin/reports`, detail teks/foto asli, filter status, form keputusan dan alasan.
- [ ] S2-03 — Dev B: `report_reviews`, `audit_logs`, transisi status PENDING/NEEDS_EVIDENCE/VERIFIED/REJECTED yang eksplisit; simpan review, status, dan audit dalam satu transaksi.
- [ ] S2-04 — Bersama: lindungi dari keputusan bersamaan/berulang dan state usang; tampilkan riwayat review serta status terbaru kepada pemilik laporan.
- [ ] S2-05 — Bersama: uji pengguna tanpa role, rollback saat audit gagal, review bersamaan, dan akses foto privat.

**Selesai jika:** moderator dapat meminta bukti, memverifikasi, atau menolak dengan alasan; pengguna biasa gagal melakukan aksi tersebut; setiap perubahan memiliki audit konsisten. Verifikasi laporan warga tidak membuat peringatan resmi.

## Sprint 3 — AI-01 Incident Analyzer

**Tujuan:** mempercepat review dengan saran terstruktur dan bukti dari laporan asli.

- [ ] S3-01 — Dev B: `AiProviderInterface`, adapter HTTP, provider stub, konfigurasi model/prompt, timeout, retry/backoff, rate limit, circuit breaker, budget dan kill switch.
- [ ] S3-02 — Dev B: `AnalyzeIncidentJob`, persistensi model/run/saran/feedback; validasi skema dan idempotensi agar retry tidak menggandakan hasil. Kirim data minimum ke provider.
- [ ] S3-03 — Bersama: kontrak ekstraksi kategori, ringkasan, tempat, waktu, kedalaman air, akses jalan, bukti teks, dan bukti yang kurang. Field tanpa bukti tetap `null`.
- [ ] S3-04 — Dev A: panel saran berlabel AI/belum diverifikasi, evidence span, status antrean/gagal/nonaktif, serta aksi terima/koreksi/tolak per saran.
- [ ] S3-05 — Dev B: simpan koreksi reviewer, model/prompt version, latency, penggunaan dan error tersanitasi; pisahkan penerimaan saran dari keputusan status laporan.
- [ ] S3-06 — Bersama: siapkan 200–500 kasus sintetis atau berizin sesuai PRD untuk smoke evaluation awal; pisahkan subset evaluasi dan catat keterbatasan representativitas. Ukur ekstraksi, null, latency, dan correction rate tanpa mengarang target akurasi.

**Selesai jika:** contoh 40 cm diekstrak dengan bukti; tanpa kedalaman menghasilkan null; output invalid/provider offline tidak menghilangkan laporan; retry aman; hanya reviewer mengubah status verifikasi. Metadata dan koreksi dapat ditelusuri tanpa log sensitif.

**Milestone AI minimum:** Sprint 1–3 menghasilkan demo AI-01 dengan review manual. Ini batas minimum demo AI menurut PRD, belum merupakan P0 penuh.

## Sprint 4 — AI-02 dan operasional AI

**Tujuan:** membantu moderator menemukan laporan terkait tanpa menggabungkannya otomatis.

- [ ] S4-01 — Dev B: `FindDuplicateReportsJob`, indeks GiST, pencarian kandidat dalam jendela lokasi/waktu, dan persistensi `report_duplicate_candidates` secara idempoten.
- [ ] S4-02 — Dev B: baseline jarak/waktu, lalu ranking kesamaan semantik dengan kontrak provider berversi. pgvector hanya jika dukungannya sudah diverifikasi; jangan menjadikannya prasyarat MVP.
- [ ] S4-03 — Dev A: perbandingan laporan, jarak, selisih waktu, alasan kandidat, dan keputusan reviewer. Saran tidak otomatis menyembunyikan, menggabungkan, atau menghapus laporan.
- [ ] S4-04 — Bersama: pasangan positif dan hard-negative berlabel; ukur precision@k, recall@k, false match, dan waktu review terhadap baseline. Catat hasil sebelum menentukan kelayakan ranking semantik.
- [ ] S4-05 — Bersama: `/admin/ai/health` menampilkan antrean gagal, versi model, penggunaan/biaya, koreksi reviewer, retry dan kill switch dengan akses admin.

**Selesai jika:** fixture duplikat dan bukan duplikat menghasilkan kandidat yang dapat diperiksa; metrik baseline/semantik tercatat; fallback eksplisit jika provider gagal; tidak ada perubahan status atau penggabungan otomatis.

## Sprint 5 — Sumber resmi dan ingestion

**Tujuan:** menyimpan data resmi dengan asal-usul, umur data, dan kesehatan sumber yang dapat diperiksa.

- [ ] S5-01 — Dev B: putuskan satu model kanonis `sources` untuk variasi `sources/data_sources` di PRD; bangun `hazard_types`, `disaster_events`, `official_alerts`, `forecasts`, `ingestion_runs`, constraint dan provenance.
- [ ] S5-02 — Bersama: verifikasi endpoint/ketentuan/atribusi/rate limit BMKG gempa, prakiraan cuaca, CAP serta kode wilayah pilot. Simpan contoh fixture sintetis jika akses belum terverifikasi.
- [ ] S5-03 — Dev B: adapter per sumber, normalisasi, deduplikasi berdasarkan ID/kunci stabil, scheduler, retry/backoff, cache dan pencatatan hasil sinkronisasi tersanitasi.
- [ ] S5-04 — Bersama: definisikan freshness SLA per sumber, issued/effective/expires/source time/last fetched dalam UTC; tampilkan kedaluwarsa, sinkronisasi gagal, dan tidak tersedia secara berbeda.
- [ ] S5-05 — Dev A: `/admin/sources` dengan kesehatan sumber, last success, error aman dan retry terotorisasi; audit perubahan konfigurasi/aksi admin.
- [ ] S5-06 — Bersama: uji ingest berulang, retry parsial, timeout, XML/JSON invalid, alert expired, dan larangan AI menulis peringatan resmi.

**Selesai jika:** job berulang tidak menggandakan data; kegagalan terlihat; data lama tidak berubah menjadi indikasi aman; provenance tersimpan dan endpoint yang belum terverifikasi tidak diklaim sebagai data live.

## Sprint 6 — Dashboard nasional, peta, dan panduan

**Tujuan:** warga dapat membaca informasi kebencanaan dari data yang benar-benar terhubung.

- [ ] S6-01 — Dev A: ganti welcome dengan national overview, feed dan navigasi; halaman `/events/{id}`, `/alerts/{id}`, `/earthquakes`, `/weather?region=...`.
- [ ] S6-02 — Bersama: verifikasi MapLibre dan penyedia basemap/atribusi; bangun `/map`, filter multi-bahaya, legend, serta panel detail berbasis endpoint GIS server.
- [ ] S6-03 — Bersama: verifikasi InaRISK layer ID, CRS, extent, metode layanan, lisensi dan resolusi sebelum integrasi; simpan konfigurasi `hazard_layers` dan tampilkan sebagai risiko historis/model, terpisah dari kejadian/peringatan/prakiraan/laporan warga.
- [ ] S6-04 — Dev B: kelola panduan resmi dengan referensi dan tanggal review; Dev A: `/preparedness/{hazard}`, checklist tas siaga, rencana keluarga dan kontak darurat yang sudah diverifikasi. AI RAG belum diperlukan.
- [ ] S6-05 — Bersama: lengkapi pengelolaan P0 `/admin/alerts`, `/admin/guides`, `/admin/audit-logs` dengan Policies dan audit; pengelolaan alert mempertahankan sumber resmi, bukan teks buatan AI.
- [ ] S6-06 — Bersama: uji mobile, keyboard, kontras, loading/kosong/error/stale, sumber tidak tersedia, serta pembatasan koordinat pada setiap respons publik. Publikasi laporan terverifikasi mengikuti keputusan privasi, bukan membuka semua laporan.

**Selesai jika:** overview → peta → detail → panduan dapat didemokan; setiap layer menampilkan kategori data, sumber, waktu dan status kesegaran; InaRISK tidak tampil sebagai peringatan aktif; tidak ada klaim wilayah aman karena sumber gagal.

## Sprint 7 — QA, deployment, dan demo P0

**Tujuan:** semua alur P0 siap ditunjukkan dan dioperasikan dengan batas data yang jujur.

- [ ] S7-01 — Bersama: regression alur publik/pelapor/moderator/admin, pembatasan akses, privasi foto/lokasi, audit transaksi, kegagalan sumber/AI, retry dan deduplikasi.
- [ ] S7-02 — Dev B: verifikasi kesetaraan PostgreSQL/PostGIS lokal–Supabase, SSL, direct/session/transaction pooler sesuai kebutuhan, prepared statements dan jalur migrasi terkendali. Jangan mengandalkan pgRouting/pgvector yang belum tersedia.
- [ ] S7-03 — Dev B: staging Laravel + worker + scheduler, storage privat, secrets, backup/restore, pembatasan jaringan, log tersanitasi, monitoring dan prosedur rollback. Supabase hanya menjadi host database.
- [ ] S7-04 — Bersama: uji build produksi dan migrasi di staging; smoke test scheduler/queue/ingestion/AI dari deployment yang sama; catat hasil dan blocker rilis.
- [ ] S7-05 — Dev A: siapkan skenario demo: laporan 40 cm → PENDING → AI berbukti → kandidat duplikat → koreksi manusia → audit, lalu tanpa kedalaman/null, AI offline dan sumber expired.
- [ ] S7-06 — Bersama: README setup/runbook, atribusi sumber/library dan penggunaan AI sesuai ketentuan kompetisi; hasil evaluasi, keterbatasan dataset, dan known issues.

**Selesai jika:** pemeriksaan relevan lulus; migrasi spasial dan operasi staging terbukti; seluruh kriteria P0 pada PRD dipetakan ke bukti demo/test; tidak ada masalah akses atau kebocoran data yang belum ditangani. Sumber wajib yang belum tersedia tetap blocker integrasi P0 penuh, walaupun demo sintetis dapat berjalan dengan label jelas.

## Sprint 8 — P1 opsional, setelah P0 stabil

Sprint ini adalah kelompok backlog; jadwalkan sub-sprint terpisah bila kapasitas tidak cukup.

- [ ] S8-01 — Gunung api: akses PVMBG yang sah atau tautan/snapshot resmi yang diizinkan; profil, level resmi, rekomendasi, waktu, sumber dan administrasi. Jangan menebak endpoint atau menurunkan level dari data lain.
- [ ] S8-02 — Shelter Jatinegara: pisahkan identitas lokasi, penetapan resmi, verifikasi, dan status operasional beserta kedaluwarsanya; konfirmasi kandidat historis ke otoritas sebelum memberi label aktif. Bangun halaman publik/admin sesuai data yang tersedia.
- [ ] S8-03 — AI-03: dokumen resmi terkurasi dan berizin, retrieval, jawaban dengan tautan/tanggal review, abstain saat bukti kurang, serta rujukan sumber resmi untuk pertanyaan darurat real-time.
- [ ] S8-04 — Evaluasi RAG 50–100 pertanyaan termasuk unknown/urgent; ukur groundedness, ketepatan sitasi dan abstention sebelum rilis.

**Gate:** akses dan hak data terbukti, tidak mengurangi kualitas P0, serta ada waktu untuk evaluasi. Simulasi rute, push notification, analitik lanjutan dan AI-04 tetap P2. Prediksi bahaya tetap di luar MVP.

## Definition of Done untuk setiap sprint

1. Alur yang ditargetkan bekerja dari UI sampai database; tidak hanya mockup atau endpoint terpisah.
2. Validasi, otorisasi server, state gagal, privasi dan audit yang relevan memiliki bukti pemeriksaan.
3. Test domain menggunakan fixture sintetis/provider stub untuk kasus offline, null, duplikat dan review manusia. Perubahan spasial/migrasi extension diuji pada PostgreSQL/PostGIS.
4. Jalankan perintah repo yang relevan: `npm run check`, `npm run types:check`, `npm run build`, dan `composer test` (sudah mencakup Pint, PHPStan, dan PHPUnit). `composer ci:check` menggabungkan pemeriksaan frontend dan backend, tetapi build tetap terpisah. Jangan menjalankan ulang semuanya tanpa alasan setelah hasil valid.
5. Catat perintah, hasil, test database yang digunakan, metrik yang relevan dan verifikasi tertunda. Sprint yang masih bergantung pada gate wajib belum dinyatakan selesai.
6. Tidak ada rahasia/foto sensitif di log, tidak ada output AI berlabel resmi, dan tidak ada fixture berlabel data live.

## Jika deadline lebih pendek

- Pertahankan Sprint 0–3 sebagai jalur minimum AI-01 dengan review manusia. Tetap sertakan otorisasi, privasi, audit, null, dan fallback offline.
- Bila masih ada waktu, prioritaskan satu alur informasi resmi sampai UI beserta provenance/staleness dari Sprint 5–6, lalu kesiapan deployment Sprint 7 sesuai cakupan yang benar-benar tersedia.
- Tunda P1/P2 lebih dahulu. Jika AI-02 atau integrasi P0 lain harus ditunda, catat sebagai pengurangan scope terhadap PRD; jangan menyebut hasilnya P0 penuh.
- Jangan mengganti verifikasi endpoint dengan asumsi. Demo sintetis boleh digunakan dengan label eksplisit; data shelter historis tidak boleh disebut aktif.

## Langkah pertama pada sesi implementasi berikutnya

Mulai S0-01 dan S0-02: pastikan runtime sesuai lockfile, instal dependensi, jalankan baseline dan dokumentasikan hasil. Setelah itu siapkan PostGIS/CI (S0-03), worker/scheduler (S0-04), lalu tutup keputusan minimum agar Sprint 1 dapat dimulai.
