# DisasterReady

Web application built for **IT RUSH 2026 (Universitas Bengkulu)** — Subtema: _Mitigasi Bencana dan Perubahan Iklim_.

## Tech Stack

- **Backend:** Laravel 13 (PHP 8.3+), Inertia.js v3, Laravel Fortify, Laravel Wayfinder
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix UI), Lucide Icons, Vite+
- **Database:** PostgreSQL (local development) & Supabase PostgreSQL (production)

## Local Setup

1. Ensure PHP 8.3+ (with `pdo_pgsql` and `pgsql` extensions enabled), Composer, and Node.js 22+ are installed.
2. Copy environment configuration and configure PostgreSQL / Supabase credentials:
    ```bash
    cp .env.example .env
    ```
3. Install dependencies, generate application key, run migrations, and start the dev servers:
    ```bash
    composer install
    php artisan key:generate
    php artisan migrate
    npm install
    composer run dev
    ```

## Attribution & Open-Source Libraries

- Built on the official [Laravel 13 React Starter Kit](https://github.com/laravel/react-starter-kit) (MIT License) with [shadcn/ui](https://ui.shadcn.com/) and [Lucide Icons](https://lucide.dev/).
- Development assisted using Antigravity AI coding assistant (documented per IT RUSH 2026 competition guidelines).
