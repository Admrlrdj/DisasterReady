# Frontend DisasterReady — 22 November 2026

## Implemented

Design read through the official Figma MCP, file `0SoKdozbdRreDEiN0OiQ3p`, task session `3cd6a1ac-cd79-4b2a-bfd2-c2f2f07d5ce3`. High fidelity design contexts cover desktop, tablet, mobile, components, authentication, reporting, moderation, sources, audit, guides, settings and deferred views. Dashboard frame 5:14 is hidden in Figma and its screenshot renders 1×1; its detailed context and visible tablet reference 23:2 were used. No Figma design was changed.

- Instrument Sans 400–700, forest/sage/amber tokens, light/dark themes, 244px sidebar, tablet rail, mobile menu and bottom navigation.
- Landing, national dashboard, MapLibre map, earthquake/weather feed, source details and provenance.
- Verified account report form, own report history, private evidence, follow-up and review history. Submission remains PENDING; original text remains unchanged.
- Moderator queue, original evidence, per-field AI feedback, duplicate comparison and human decisions with reasons and version conflicts.
- Admin source retry/settings, ingestion history, AI health/kill switch/retry, published/draft guide editing, source alerts and audit history.
- Preparedness guides/checklists read reviewed, published database content. A Jatinegara flood draft is available locally in `/admin/guides`. It has no review timestamp and remains private. The public flood page links to the BPBD DKI guide.
- Existing Fortify registration, login, passkey, password and security flows retained; login/register use the Figma shell.
- Volcano pages show dated excerpts of published PVMBG activity reports and link to MAGMA for current status. Shelter, roads, RAG and route views retain their unavailable states.

Design sample values are replaced by server values. The landing page and dashboard use the same interactive MapLibre component and official GeoJSON. Dashboard layer controls, regional forecasts, source disclosures, pagination and refresh work through existing routes. Source health and expiration remain visible.

108 Figma SVG references were downloaded using the supplied curl instructions. See [FIGMA_ASSETS.json](FIGMA_ASSETS.json) for node/path provenance and `resources/js/lib/figma-assets.ts` for local URLs. No temporary Figma asset URL is used at runtime. Intrinsic SVG dimensions are preserved; live data/MapLibre replace illustrative operational-map and chart values.

## Data and local database

The project uses **127.0.0.1:55432**, database `disaster_ready`, PostgreSQL 18.7 + PostGIS 3.7.0. The original system database on port 5432 and Supabase were preserved. Connect the database GUI to port 55432 to see the migrated tables. Read credentials from private `.env`.

Official BMKG gempa, weather and CAP adapters were enabled locally and successfully processed on 22 November 2026. At 14:16 WIB the database held 28 earthquake events, 99 forecast slots and 78 CAP messages including history, with zero synthetic public records. Earthquake ingestion combines the latest, M5+ and felt feeds, preserves existing IDs and records partial failures. Weather coverage is limited to verified adm4 codes **31.75.03.1001 Kampung Melayu** and **31.75.03.1002 Bidara Cina**.

The map links directly to the national and Jakarta InaRISK viewers. MapLibre can render allowlisted BNPB ImageServer rasters when the database layer is marked publication-approved. The seeded flood-hazard layer stays unpublished because [BNPB's catalog](https://data.bnpb.go.id/tr/dataset/indeks-bahaya-banjir-inarisk-2021) requires written permission for use. The official WebGIS disallows cross-origin framing.

The PVMBG snapshot is maintained in `config/pvmbg.php` with explicit observation periods and source links. The public MAGMA site restricts automated collection in its [robots policy](https://magma.esdm.go.id/robots.txt). Live integration depends on a documented [CAP endpoint](https://geologi.esdm.go.id/media-center/wajah-baru-magma-indonesia-ekosistem-digital-kebencanaan-geologi-yang-lebih-inovatif-terintegrasi-dan-hadir-di-semua-perangkat). Operational shelter/roads and RAG remain deferred.

```powershell
./scripts/local-postgis.ps1 start
composer run dev
php artisan schedule:work
```

`composer run dev` starts application/frontend and a queue listener. Use only one of that listener or a standalone worker for the same development queue. On 22 November 2026, `schedule:work` dispatched the regular 15:05 WIB cycle and `queue:work` completed all three BMKG jobs by 15:05:29 WIB. The overview then reported all three BMKG sources FRESH. The local processes used for verification are terminal workers and need supervision for sustained operation.

`.tools` contains private credentials/backups and must not be uploaded. No frontend migration was needed beyond the previously applied backend/follow-up migrations.

## Contracts

- Public HTML/Inertia pages use server props; `/data/*` stays JSON.
- Existing authenticated report/admin routes negotiate HTML/Inertia versus JSON using `FrontendResponse`; existing Policies remain authoritative. JSON callers must send `Accept: application/json`.
- HTML report submission responds 303 to `/my/reports/{id}?submitted=1`. JSON submission retains 201 and the existing envelope. Successful HTML mutations redirect with a notice.
- Moderator/admin interactive mutations use same-origin session/CSRF JSON requests and handle validation, expired sessions, forbidden access and stale versions.
- Official times, including `forecast_at`, are ISO 8601 UTC; UI displays WIB. Raw source forecast timestamps without timezone are not interpreted in the browser.
- Map queries use bounded bbox, kind/hazard filters, a 100-feature limit, debounce, cancellation and visible failure/empty states. GeoJSON is served by PostGIS; citizen precise locations are not sent to the public map.
- MapLibre 6.19 worker is bundled explicitly with `?worker&url`. The default basemap is [OpenFreeMap Positron](https://openfreemap.org/quick_start/) with OpenStreetMap attribution and a `VITE_MAP_STYLE_URL` override.
- The existing `/data/map` supports `status=active` for CAP and `region` for current regional forecasts. `/data/alerts` supports `status=active`, and `/data/weather` supports `current=1`. Existing unfiltered requests retain their list shapes.

## Verification and remaining acceptance

- PHP suite: **84 tests, 560 assertions passed**. Coverage includes partial earthquake feed failure, legacy event ID preservation, and the human review requirement for guide publication.
- PostGIS: **5 tests, 90 assertions passed** using the isolated `disaster_ready_test` database. Coverage includes a synthetic authenticated submission, worker processing, duplicate candidate, reviewer correction, human verification, admin audit and public alert separation.
- Pint, PHPStan, frontend lint/format, TypeScript and production build passed during implementation; final recheck is recorded in the task response.
- Chrome rendered 28 official event features on the landing map with OpenStreetMap attribution. Verified marker details, zoom, reset, forecast region changes, refresh, source disclosure and pagination. Checked desktop, tablet and mobile layouts with the browser's dark theme, and verified primary text and button contrast pairs for both themes. Visual browser acceptance for the light theme remains pending.
- Remote CI last ran successfully on commit `22f4d23`, before the working tree changes. Production basemap, cloud services and authenticated end-to-end browser acceptance remain open.
- Build warns about the lazy-loaded MapLibre chunk size and optional font fallback optimization. A low-severity pre-existing Babel prerelease advisory remains; no unrelated dependency upgrades were made.

Contact references: [BNPB 117](https://www.bnpb.go.id/kontak), [Basarnas 115](https://balikpapan.basarnas.go.id/berita/informasi-layanan-kontak-darurat-dan-hotline-basarnas-balikpapan), [Jakarta Siaga 112](https://www.jakarta.go.id/jakarta-siaga-112). Jakarta's 112 is labelled by region.
