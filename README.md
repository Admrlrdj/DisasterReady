# DisasterReady

Web application built for **IT RUSH 2026 (Universitas Bengkulu)** — Subtema: _Mitigasi Bencana dan Perubahan Iklim_.

## Tech Stack

- **Backend:** Laravel 13 (PHP 8.3+), Inertia.js v3, Laravel Fortify, Laravel Wayfinder
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix UI), Lucide Icons, Vite+
- **Database:** PostgreSQL (local development) & Supabase PostgreSQL (production)

## Local Setup

1. Ensure PHP 8.3+ (with `pdo_pgsql`, `pgsql`, GD, EXIF and zlib enabled), Composer, a supported Node.js version (verified: 24.13.0), and PostgreSQL with PostGIS are installed.
2. Copy environment configuration and configure PostgreSQL / Supabase credentials:
    ```bash
    cp .env.example .env
    ```
3. Install dependencies, generate application key, run migrations, and start the dev servers:
    ```bash
    composer install
    php artisan key:generate
    php artisan migrate
    php artisan db:seed --class=DisasterSourceSeeder
    npm ci
    composer run dev
    ```

For live local BMKG updates, enable the adapters as described in the
[runbook](docs/BACKEND_RUNBOOK.md) `composer run dev` starts the web server, queue listener, Vite, and scheduler together. Use an isolated `disaster_ready_test` database for the PostGIS
test suite. See the [national P0 handoff](docs/NATIONAL_P0.md) for coverage,
provider configuration, and the UI/UX sprint.


### Handover to another computer

Git does not include `.env`, PostgreSQL data, or private uploaded evidence. Configure a local PostgreSQL database with PostGIS, run migrations, and run `php artisan db:seed --class=DisasterSourceSeeder`. To restore existing accounts, reports, guides, and history, obtain a database backup and private storage from the previous maintainer.

For official BMKG feeds, set `DISASTER_SOURCES_ENABLED=true`, configure `BMKG_WEATHER_REGIONS` with supported adm4 codes (the documented pilot uses `31.75.03.1001,31.75.03.1002`), and enable the BMKG sources in admin settings. Run `php artisan config:clear`, then `php artisan disaster:ingest` with the queue listener running. `composer run dev` includes the scheduler, which dispatches updates every five minutes. Restart that command after changing environment settings. The port 55432 mentioned in earlier verification notes belongs to the previous maintainer's local instance; use the port of your actual PostGIS installation.

## Backend implementation

### Shelter and photo reporting demo

- Open `/shelters` to choose a fictional shelter and open a walking route in Google Maps. The points and routes are for demonstration only.
- For photo category suggestions, set `GEMINI_API_KEY` in the server's `.env`, then run `php artisan config:clear`. `GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`. Keep the key out of the repository. Users opt in before a metadata-free JPEG is sent to Gemini. The result is an editable category suggestion, with the existing human review still required.

The backend includes private citizen reports, human moderation/audit, deterministic AI simulation, official-source adapters, public/GIS data contracts and admin operations. The Figma-based React/Inertia frontend now connects these flows, with responsive public pages and role-protected reporting/admin pages. Live ingestion remains disabled by default in shared configuration; the local project database has verified BMKG ingestion. See the frontend progress document for database port 55432, setup, verification and remaining acceptance gates.

- [API contract](docs/BACKEND_API.md)
- [Setup, workers, tests and recovery](docs/BACKEND_RUNBOOK.md)
- [Verification evidence and remaining gates](docs/BACKEND_VERIFICATION.md)
- [Backend sprint checklist](BACKEND_SPRINTS.md)
- [Frontend integration progress and local PostGIS connection](docs/FRONTEND_PROGRESS.md)

## Attribution & Open-Source Libraries

- Built on the official [Laravel 13 React Starter Kit](https://github.com/laravel/react-starter-kit) (MIT License) with [shadcn/ui](https://ui.shadcn.com/) and [Lucide Icons](https://lucide.dev/).
- Development assisted using Antigravity AI coding assistant (documented per IT RUSH 2026 competition guidelines).
- Codex assisted development and local verification. [Google Gemini](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite) powers optional photo categorization and the preparedness chat. Both use the server's `GEMINI_API_KEY`. The chat sends the question and up to three previous questions for context, and cites references selected from the app's curated sources.
