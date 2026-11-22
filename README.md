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
[runbook](docs/BACKEND_RUNBOOK.md) and run `php artisan schedule:work` alongside
the queue worker. Use an isolated `disaster_ready_test` database for the PostGIS
test suite. See the [national P0 handoff](docs/NATIONAL_P0.md) for coverage,
provider configuration, and the UI/UX sprint.

## Backend implementation

The backend includes private citizen reports, human moderation/audit, deterministic AI simulation, official-source adapters, public/GIS data contracts and admin operations. The Figma-based React/Inertia frontend now connects these flows, with responsive public pages and role-protected reporting/admin pages. Live ingestion remains disabled by default in shared configuration; the local project database has verified BMKG ingestion. See the frontend progress document for database port 55432, setup, verification and remaining acceptance gates.

- [API contract](docs/BACKEND_API.md)
- [Setup, workers, tests and recovery](docs/BACKEND_RUNBOOK.md)
- [Verification evidence and remaining gates](docs/BACKEND_VERIFICATION.md)
- [Backend sprint checklist](BACKEND_SPRINTS.md)
- [Frontend integration progress and local PostGIS connection](docs/FRONTEND_PROGRESS.md)

## Attribution & Open-Source Libraries

- Built on the official [Laravel 13 React Starter Kit](https://github.com/laravel/react-starter-kit) (MIT License) with [shadcn/ui](https://ui.shadcn.com/) and [Lucide Icons](https://lucide.dev/).
- Development assisted using Antigravity AI coding assistant (documented per IT RUSH 2026 competition guidelines).
