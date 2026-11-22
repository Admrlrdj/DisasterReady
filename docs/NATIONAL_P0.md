# National P0 handoff

## Run after pulling main

```powershell
php artisan migrate
php artisan db:seed --class=DisasterSourceSeeder
php artisan db:seed --class=NationalPreparednessSeeder
npm ci
npm run build
```

Follow [the runbook](BACKEND_RUNBOOK.md) to enable the BMKG adapters and start the Laravel queue worker and scheduler. `DISASTER_SOURCES_ENABLED=true` and the enabled BMKG weather source are required for on-demand ingestion. `BMKG_WEATHER_REGIONS` optionally prewarms selected codes on the scheduler. Leave the variable empty for on-demand-only weather. An authenticated admin can retry the default forecast from Adapter & AI Health if the list is empty.

The database migration links forecasts to ingestion runs. The first successful sync after migrating establishes the latest batch for each region. Previous records remain accessible on the historical API. SQLite supports functional tests. PostgreSQL/PostGIS is required for spatial validation and serving GeoJSON.

## Coverage and API

- Search with `GET /data/regions?q=Gurabesi`. Results contain `code`, `name`, and district, city or regency, and province context in `area`. The endpoint returns up to 20 results and reports catalogue year 2022.
- Use `GET /data/weather?region=91.71.01.1001&current=1` for paginated, unexpired slots from the latest batch. Omit `current=1` for stored history. `region_status.state` is `FRESH`, `QUEUED`, `BUSY`, `FAILED`, `STALE`, or `UNAVAILABLE`. `region_status.fetched_at` is an ISO 8601 UTC timestamp or null. Keep `data.local_datetime` for local-time display.
- Requests reuse cached forecasts and share an app-wide enqueue budget of eight new regions per minute. All BMKG adapter requests share a 45 requests/minute app budget. The [BMKG public API](https://data.bmkg.go.id/prakiraan-cuaca/) publishes a 60 requests/minute/IP limit. Apps sharing an egress IP should coordinate their quotas.
- The national catalogue bundles 83,467 ADM4 codes from the MIT-licensed [Wilayah 2022 SQL transcription](https://github.com/cahyadsn/wilayah/tree/fff36379736bad88c619bbf554a634e726b63f5f), based on the [Kemendagri 2022 decree](https://ppid.kemendagri.go.id/storage/dokumen/rzsfKHjEVW5fqubRcHFjosmTsVDPS1HJVTwGt193.pdf). Extract the four-part codes and names from `db/archive/wilayah_2022.sql`, look up the district, city and province by code prefix, and store code, name, and comma-separated context as UTF-8 tab-separated rows sorted by code. The [upstream license](../resources/data/WILAYAH-LICENSE.txt) accompanies the compressed catalogue. Administrative changes and BMKG availability can differ from the snapshot.
- Live forecast samples were checked for Aceh, DKI Jakarta, East Kalimantan, South Sulawesi, East Nusa Tenggara, and Papua. Each returned its requested ADM4 code and fresh records through local Laravel/PostgreSQL. The PostGIS endpoint also returned one regional forecast point for Papua. This is sampled coverage.
- Local browser checks selected Gurabesi, Papua from the public weather page and Keude Bakongan, Aceh from the dashboard with the keyboard. Both displayed the forecast in local time. The public MapLibre view exposed zoom controls and the national InaRISK link.
- The [national InaRISK WebGIS](https://inarisk.bnpb.go.id/webgis/) is linked from the map. Embedded layers require documented approval. The [BNPB flood-hazard catalogue](https://data.bnpb.go.id/lt/dataset/indeks-bahaya-banjir-inarisk-2021) states that written permission is required. The seeded raster remains unpublished.
- The national flood, earthquake, and tsunami guides are draft records. An admin reviews and publishes them through `/admin/guides`. The [BNPB source guide](https://www.bnpb.go.id/buku/buku-saku-bencana) is linked on the public page.

## AI provider

The deterministic stub is the default and needs no credentials. To validate a real provider in a controlled environment, set `DISASTER_AI_PROVIDER=http` with an HTTPS `DISASTER_AI_API_BASE`, `DISASTER_AI_API_KEY`, `DISASTER_AI_CHAT_MODEL`, and `DISASTER_AI_EMBEDDING_MODEL`. Use an OpenAI-compatible endpoint that supports JSON object chat completion and batched embeddings. Restart workers after changing config. Confirm the resolved provider from `/admin/ai/health`.

Incomplete or invalid configuration keeps the stub. When a configured provider fails, queued processing retries and the report remains available for human review. The app sends a bounded excerpt of report text, masks common email, phone, NIK, and coordinate patterns, and excludes separate identity, location, and photo fields. Review the provider's data terms and remaining identifiers in free text before enabling it for real reports. HTTP contract tests use fakes. Live credentials, model quality, latency, and billing remain unverified. The daily budget counts requests. The cost field has no pricing model configured.

## Next frontend sprint

1. **Public data and map.** Check the national landing map and dashboard on mobile and desktop. Exercise region search outside Java, local-time labels, active versus historical CAP, empty viewports, and stalled sources. Show a clear timestamp and source in every data state.
2. **Reporting and moderation.** With authorized test accounts, run the report, photo, follow-up, AI feedback, duplicate review, and audit flows end to end. Include keyboard navigation, validation errors, and conflict recovery.
3. **Preparedness and handoff.** Review the three national drafts, verify accessibility and touch targets, and record test evidence. Keep InaRISK embedded layer acceptance dependent on written authorization. Use the existing routes, frontend shell, and server contracts.

Cloud deployment, release acceptance, and P1/P2 features remain outside this sprint.
