# Backend verification — 22 November 2026

> **Later update:** PostGIS now runs in a project-local PostgreSQL 18.7 instance on port 55432; domain migrations and BMKG live ingestion have succeeded there. See [frontend integration progress](FRONTEND_PROGRESS.md) for current evidence and database connection details. The original sections below describe the earlier snapshot; their pending PostGIS/live-source items are superseded by that update. Cloud and representative AI evaluation remain pending.

## Implementation status

Backend code covers B0–B7 capabilities for local development: reporting/private photos, role policies, transactional human review/audit, queued synthetic analysis and feedback, PostGIS candidate/query code, source adapters/idempotent ingestion, public data/GIS contracts, reviewed preparedness data and admin operations. This is not a declaration that every sprint gate, live integration or production release has passed.

| Area              | Evidence                                                                                                                                                                | Remaining gate                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime/lockfiles | PHP 8.3.30, Node 24.13.0, `composer check-platform-reqs` passed; npm installed using lockfile                                                                           | Supabase deployment version parity                                                                                                     |
| Reporting/photos  | HTTP validation, verified/active account, role injection protection, owner access, private JPEG reencoding, consent, UTC conversion and dispatch failure tests          | Same workflow on PostgreSQL/PostGIS                                                                                                    |
| Moderation        | Unauthorized/self-review denied; optimistic conflict and audit rollback tests                                                                                           | Two-connection row-lock scenario is in PostGIS suite, not executed locally                                                             |
| AI-01             | Stub schema/evidence/null/offline/idempotency/feedback/kill-switch tests; model/prompt metadata and per-attempt sanitized history                                       | External HTTP provider, privacy/provider terms, representative evaluation and reviewer time                                            |
| Worker/scheduler  | Database-queue processing, three failed attempts, failed-job storage and successful retry exercised; schedule lists ingestion/recovery every five minutes               | Production process supervisor and scheduler                                                                                            |
| AI-02             | PostGIS geography/time filtering and lexical simulation implemented; bounded candidates and reviewer decisions                                                          | Spatial execution and synthetic ranking benchmark; semantic provider remains deferred                                                  |
| Ingestion         | Synthetic HTTP fixtures cover idempotent ingest, malformed payloads, sanitized failure, staleness, weather classification and CAP namespace/polygon/expiry/cancellation | Live weather/CAP end-to-end and configured pilot region codes                                                                          |
| Public/admin      | Private citizen data excluded; bounded/paginated contracts, published guides, source settings and audit                                                                 | GIS execution, live data approval, reviewed preparedness content/contact sources                                                       |
| Toolchain         | Production build, Wayfinder generation, TypeScript and frontend lint/format checks passed                                                                               | Optional fontaine optimization produces a non-blocking existing build warning                                                          |
| Spatial/CI        | Dedicated PostGIS suite, compose configuration and CI job added                                                                                                         | Docker not found in PATH; local PostgreSQL 18.7 is running but PostGIS is unavailable/uninstalled in application DB; remote CI not run |

The original Windows sandbox reported PostgreSQL unresponsive and autoload.php unreadable. Read-only doctor and test execution with normal host access established the actual state: local database connection succeeds; PostgreSQL is 18.7; PostGIS is unavailable/not enabled. No migration was run against the existing application database and no existing records were reset. No cloud credentials or user database contents were printed.

## Commands and results

- `composer validate --no-check-publish`: passed.
- `composer check-platform-reqs`: passed.
- `composer test`: passed — Pint, PHPStan, 73 non-spatial tests and 293 assertions. This includes existing auth/settings tests and the new backend workflows.
- `npm run check`: formatting and lint passed after formatting documentation/compose files; no product decisions in PRD were changed.
- `npm run types:check`: passed.
- `npm run build`: passed, including generated Wayfinder action/route types.
- `php artisan schedule:list`: ingestion and dispatch recovery registered every five minutes with overlap protection.
- `php artisan disaster:doctor`: application DB connects, PostgreSQL 18.7, PostGIS unavailable/not enabled; exit 1 is the intended readiness failure.
- `php artisan disaster:evaluate-stub`: 200 deterministic synthetic template cases; 100/100 explicit depths, 100/100 absent depths preserved null, 200/200 valid evidence. These are smoke checks of rules, not a language/semantic model accuracy claim.
- `php vendor/phpunit/phpunit/phpunit -c phpunit.postgis.xml`: prepared but not executed; requires the isolated PostGIS test database described in the runbook. Spatial tests are not silently skipped or counted as passing SQLite tests.

Initial baseline tests had 12 failures due to the missing production Vite manifest; installing locked dependencies and building resolved them. Existing authentication/settings tests are included in the passing suite.

## Source verification

- [BMKG earthquake documentation](https://data.bmkg.go.id/gempabumi/) and [latest feed](https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json): documentation and sample JSON accessed; coordinates are latitude,longitude and DateTime includes UTC. Scheduled application-worker live ingestion is not yet verified.
- [BMKG forecast documentation](https://data.bmkg.go.id/prakiraan-cuaca/): endpoint/adm4/schema/attribution reviewed; direct example endpoint returned 403 through the browsing tool. No pilot code is assumed.
- [BMKG CAP documentation](https://data.bmkg.go.id/peringatan-dini-cuaca/): RSS/detail paths, times and polygon format reviewed; live nowcast fetch was inaccessible through the browsing tool. Parser/integration behavior uses explicit synthetic fixtures.
- [InaRISK flood ImageServer metadata](https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIR/ImageServer?f=pjson): EPSG:3395, nominal pixel size 100, image capabilities, empty copyright field. License, legend, model date and publication permission remain unverified; seeded layer is not publicly approved.
- [PostGIS image upstream](https://github.com/postgis/docker-postgis): PostgreSQL 16/PostGIS 3.7 image selected for isolated test/CI configuration. Installed host PostgreSQL is major 18; no production parity is claimed.
- [Supabase PostGIS documentation](https://supabase.com/docs/guides/database/extensions/postgis): capability documented; actual project extension schema/version/pooler behavior remains unverified.

## Acceptance boundary and next steps

Use [BACKEND_API.md](BACKEND_API.md) for the actual interface and [BACKEND_RUNBOOK.md](BACKEND_RUNBOOK.md) to start workers and isolated tests. AI remains explicitly synthetic, storage remains private/local and live sources remain disabled by default.

Before declaring backend P0 fully accepted: run PostGIS suite and CI; verify generated geometries, spatial indexes and concurrent review; exercise live source ingestion with correct access/region configuration; obtain InaRISK publication rights/legend/model metadata; finalize retention; validate Supabase/database major parity and operational backup/restore in staging. Real-provider/S3/cloud work stays deferred under the agreed local-first scope. UI/UX, full user journey, representative AI evaluation and production deployment remain separate acceptance milestones.
