# DisasterReady cloud preview

## Production runtime

The production domain is https://disaster-ready-seven.vercel.app. Set `APP_URL` to this domain. The Vercel project uses Node.js 22 and has Fluid Compute disabled because the community PHP runtime fails to start under the Fluid launcher. The function excludes unused AWS service definitions while retaining S3, STS, SSO and SSO OIDC definitions to stay within the uncompressed function size limit. Keep these project settings when redeploying.

Deploy production using `vercel deploy --prod --yes --scope akmal-yonans-projects` after building frontend assets. Production has its own `APP_KEY`, `DB_URL` and `DISASTER_SOURCES_ENABLED` variables. The existing Supabase `disaster_ready` schema contains the Laravel migrations and initial BMKG ingestion. Scheduled jobs, SMTP and private photo storage still require activation and end-to-end verification.

Vercel runs the Laravel web app and serves the compiled Vite assets. Supabase stores PostgreSQL data with PostGIS and the private photo bucket. The GitHub Actions worker processes the Laravel database queue and schedules BMKG ingestion. Vercel Hobby cron runs daily, while the ingestion workflow runs every five minutes when enabled. GitHub can delay scheduled runs. Fortify stays responsible for application accounts and email verification.

## Supabase and secrets

1. Select the Supabase project intended for this preview. Use its **Session pooler** connection on port 5432 with `sslmode=require`. Keep the app tables in the `disaster_ready` schema and PostGIS in `extensions`. Leave the application schema out of Supabase's exposed Data API schemas.
2. Create a private Storage bucket for report photos and enable the S3 endpoint. Record the S3 endpoint, region, bucket name and server-side access keys in Vercel Preview. Supply `AWS_ENDPOINT`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. The Supabase S3 driver omits unsupported ACL headers. Laravel Policies protect downloads, and photos pass through JPEG re-encoding before storage.
3. In Vercel Preview, set `DB_URL` as a secret alongside the generated `APP_KEY`. Set `MAIL_MAILER=smtp`, the SMTP host, port, scheme and credentials, and a verified `MAIL_FROM_ADDRESS` for Fortify email verification. Add `GEMINI_API_KEY` only if the preview should provide live chatbot responses. The reporting analysis provider uses the configured stub by default.
4. In GitHub's `cloud-preview` environment, set `DISASTER_CLOUD_DB_URL` and `DISASTER_CLOUD_APP_KEY` as secrets. Run **DisasterReady cloud jobs** on `main` with `operation=bootstrap` to install PostGIS, run migrations, register the sources and process the first ingestion. The workflow provisions source metadata and consumes official data. Users and private reports are created through normal application flows.
5. After the initial job succeeds, set repository variable `DISASTER_CLOUD_ENABLED=true` and Vercel Preview variable `DISASTER_SOURCES_ENABLED=true`. Leave `BMKG_WEATHER_REGIONS` empty for on-demand forecasts, or set a short list of verified ADM4 codes to prefetch.

## Build and deploy

```powershell
composer install --no-interaction
npm ci
npm run build
vercel deploy --environment preview --yes --scope akmal-yonans-projects
```

The legacy Vercel builders package `public/build` and serve only the declared public asset paths. The PHP function runs with ephemeral scratch storage. Build the frontend before the source upload. `public/hot`, private files, dependencies and local environment files are excluded from uploads. Before a separate production deployment, choose its domain, project/database and secrets, and rebuild for that environment.

## Acceptance checks

- Check Vercel build and runtime logs, the Laravel health route, and authenticated navigation after deployment.
- Confirm the Supabase connection and PostGIS version using `php artisan disaster:doctor`. Check a fresh official event, a CAP alert, and one on-demand forecast through the app.
- Register a test account and verify email using the configured SMTP provider. Use a separate reviewer account for moderation and confirm that unrelated users cannot access uploaded photos. Vercel limits the photo form to 4 MB.
- Submit a synthetic report and confirm the worker processes it, then review its audit history. Inspect `failed_jobs` and ingestion runs if any job fails. Disable the scheduled workflow and automatic collection while investigating a sustained failure.
