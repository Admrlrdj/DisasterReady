# Backend development and operation

> Current local setup: see [frontend integration progress](FRONTEND_PROGRESS.md). The application now uses the project PostGIS instance on localhost:55432; the original system database remains on port 5432.

## Environment

Use PHP 8.3+ with pdo_pgsql, pgsql, GD, EXIF and standard Laravel extensions. The inspected runtime is PHP 8.3.30 and Node 24.13.0; Vite+ engine requires a supported Node version, not any arbitrary Node 22 release. Install using the existing Composer/npm lockfiles.

```powershell
composer install
npm ci
Copy-Item .env.example .env
php artisan key:generate
```

Copy the environment only for a new checkout; preserve existing credentials. Configure local PostgreSQL with PostGIS before migrations. `DB_SEARCH_PATH=public,extensions` supports PostGIS installed in either schema; confirm the actual extension schema/permissions for Supabase before production. Use dedicated development/test databases. SQLite is only for non-spatial tests.

```powershell
php artisan disaster:doctor
php artisan migrate
php artisan db:seed --class=DisasterSourceSeeder
npm run build
php artisan serve
```

The seeder is idempotent, creates no login/password and leaves all sources disabled. It stores InaRISK metadata as unapproved; legend/licensing/model date need review before publication. No private photo is written to public storage. Private photos use `storage/app/private/incident-photos` and authenticated streaming. S3/Supabase cloud integration is deferred.

Provision an existing, verified account through trusted console access:

```powershell
php artisan disaster:role moderator@example.com moderator
php artisan disaster:role admin@example.com admin
```

Role changes are audited as console actions with null actor. Do not distribute console/database credentials to ordinary users.

## Worker and scheduler

Run worker and scheduler in Laravel application compute, independently of the Supabase database host:

```powershell
php artisan queue:work --tries=3 --timeout=60
php artisan schedule:work
```

On a persistent production host, supervise the worker and use cron `schedule:run` every minute. Database queue dispatch is after commit; retry_after is 90 seconds, above the worker timeout. Restart workers after deployment. The scheduler enqueues ingestion and recovers dispatch failures every five minutes with overlap protection. Runtime retry/failed-job integration is tested on a database queue; source/duplicate PostGIS scenarios have their separate suite.

```powershell
php artisan disaster:recover-analysis
php artisan queue:failed
php artisan queue:retry <failed-job-uuid>
php artisan queue:restart
```

Admin AI retry reuses completed analysis instead of overwriting reviewed suggestions. Inspect source health and sanitized ingestion_runs for source failures; do not publish upstream payloads or raw exception traces in public dashboards. Kill switch: `DISASTER_AI_ENABLED=false` or admin AI settings; it pauses new analysis/duplicate processing. Reenable and retry deliberately. `DISASTER_AI_DAILY_LIMIT` defaults to 500 stub calls; it is a local operational limit, not a calibrated external-provider budget.

Live source fetching requires `DISASTER_SOURCES_ENABLED=true` plus the source enabled in admin settings. Configure verified `BMKG_WEATHER_REGIONS` as comma-separated adm4 codes. URLs are fixed in source adapters; CAP links must remain under the documented HTTPS BMKG nowcast path and redirects are disabled. The shared BMKG request limiter allows 45 calls/minute, below the documented per-IP allowance; coordinate other applications sharing that IP. Weather/CAP may require multiple worker attempts when many regions/messages are configured.

```powershell
php artisan disaster:ingest
php artisan disaster:evaluate-stub
```

## Test database and CI

`compose.postgis.yaml` creates a disposable PostgreSQL 18/PostGIS 3.7 test service on localhost:55432; it does not modify the installed PostgreSQL 18 service. Docker is required and was not available in the inspected PATH. The upstream supported image was checked against [docker-postgis](https://github.com/postgis/docker-postgis). The CI configuration uses the same test major and extension. Deployment parity with Supabase is still a release gate.

```powershell
docker compose -f compose.postgis.yaml up -d --wait
$env:DB_HOST='127.0.0.1'
$env:DB_PORT='55432'
$env:DB_USERNAME='postgres'
$env:DB_PASSWORD='local-test-only'
php vendor/phpunit/phpunit/phpunit -c phpunit.postgis.xml
```

The PostGIS configuration forces `DB_DATABASE=disaster_ready_test` and clears DB_URL. The spatial suite creates/rolls back migrations in that dedicated database; never repoint it at application data. It checks generated geometry/GiST-backed queries, candidate radius/time filtering, lexical-vs-distance synthetic ranking, and database-worker processing. These tests must run, not be replaced by passing SQLite tests.

```powershell
composer test
npm run check
npm run types:check
npm run build
```

On this Windows host, sandbox file-access checks report `vendor/autoload.php` unreadable even though it exists. Running verification with normal host access resolved that issue; no vendor patch was needed. Production build supplies the manifest needed by existing auth/settings rendering tests.

## Deployment and recovery gate

No cloud deployment is performed by this change. Before production, select a PostgreSQL major/extension combination supported by the actual Supabase project and use it in local development, CI and staging. Check [Supabase PostGIS documentation](https://supabase.com/docs/guides/database/extensions/postgis), extension schema, privileges, direct/session/transaction-pooler behavior, SSL and prepared statements. Use a controlled migration connection and server-side credentials only; restrict browser-access database roles and network access.

Before release: back up database and private storage, verify a restore in a separate environment, run migrations in staging, supervise worker/scheduler, verify source freshness/failed queues, set APP_DEBUG=false, review PII minimization/provider terms and test private-storage access. Validate retention/deletion rules with the product owner before enabling automated destructive cleanup; no automatic retention deletion is introduced here.

For rollback, stop ingestion/workers, restore the previous compatible application version, and assess migrations before changing schema. Prefer a forward fix or restore into a separate database. The guide-draft migration cannot restore the original non-null review field while unreviewed drafts exist. Preserve drafts and do not invent review timestamps for rollback. Keep original source timestamps, review/audit history and photo keys in backups. Never run migrate:fresh against development or production data to resolve an error.

## Pilot demo

After migrating the local development database, run `php artisan db:seed --class=PilotFloodGuideSeeder` to create the Jatinegara draft once. It is excluded from public pages until a human reviewer opens it in `/admin/guides`, checks the content and reference, records the actual review time, and publishes it. Reference material includes the [BPBD DKI flood guide](https://bpbd.jakarta.go.id/perpustakaan/Y2NRQ0ZDUFBRalMrc3hmK0owd3YwZz09/kesiapsiagaan-menghadapi-banjir-bagi-masyarakat) and [BNPB family preparedness catalogue](https://perpustakaan.bnpb.go.id/inlislite/digitalcollection/detail-opac?id=2006).

Use the isolated PostGIS suite for the reproducible reporter → queue → moderator → audit scenario, with no persistent demo accounts or reports:

```powershell
php vendor/phpunit/phpunit/phpunit -c phpunit.postgis.xml --filter=pilot_demo
```

For browser acceptance, use authorized demo accounts and clearly labelled synthetic reports. Submit a flood report with 40 cm at the lane entrance and 42 cm at the house, then a nearby report without a measurement. Check that both begin as PENDING, the stub cites the first depth, the neighbor's depth remains null, and the reviewer can record 42 cm and a duplicate decision. A separate human verification must change the report status. Confirm the admin can read the audit and that no official alert was created. Use isolated tests for provider outages and CAP expiry so the working sources can stay available.
