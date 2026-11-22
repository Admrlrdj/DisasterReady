<?php

use App\Jobs\AnalyzeIncidentJob;
use App\Jobs\FindDuplicateReportsJob;
use App\Jobs\IngestSourceJob;
use App\Models\IncidentReport;
use App\Models\User;
use App\Services\AI\StubEvaluation;
use App\Services\Audit;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('disaster:role {email} {role}', function () {
    $role = $this->argument('role');
    if (! in_array($role, ['reporter', 'moderator', 'admin'], true)) {
        $this->error('Role harus reporter, moderator, atau admin.');

        return 1;
    }
    $user = User::where('email', $this->argument('email'))->first();
    if (! $user) {
        $this->error('Pengguna tidak ditemukan.');

        return 1;
    }
    DB::transaction(function () use ($user, $role) {
        $before = $user->role;
        $user->role = $role;
        $user->save();
        Audit::record(null, 'user', $user->id, 'console_role_change', ['role' => $before], ['role' => $role]);
    });
    $this->info('Role diperbarui dan dicatat dalam audit.');

    return 0;
})->purpose('Provision an existing user role through trusted server access');

Artisan::command('disaster:ingest', function () {
    if (! config('disaster.sources_enabled')) {
        $this->warn('Sinkronisasi live nonaktif.');

        return 0;
    }
    $scheduled = ['bmkg-earthquake', 'bmkg-cap'];
    if (config('disaster.weather_regions')) {
        $scheduled[] = 'bmkg-weather';
    }
    foreach (DB::table('sources')->where('enabled', true)->whereIn('slug', $scheduled)->pluck('id') as $id) {
        IngestSourceJob::dispatch($id);
    }

    return 0;
});

Artisan::command('disaster:recover-analysis', function () {
    IncidentReport::where('analysis_status', 'DISPATCH_FAILED')->eachById(function (IncidentReport $report) {
        $report->update(['analysis_status' => 'QUEUED']);
        try {
            AnalyzeIncidentJob::dispatch($report->id)->afterCommit();
        } catch (Throwable) {
            $report->update(['analysis_status' => 'DISPATCH_FAILED']);
        }
    });
    IncidentReport::where('duplicate_status', 'DISPATCH_FAILED')->eachById(function (IncidentReport $report) {
        $report->update(['duplicate_status' => 'QUEUED']);
        try {
            FindDuplicateReportsJob::dispatch($report->id)->afterCommit();
        } catch (Throwable) {
            $report->update(['duplicate_status' => 'DISPATCH_FAILED']);
        }
    });
});

Schedule::command('disaster:ingest')->everyFiveMinutes()->withoutOverlapping();
Schedule::command('disaster:recover-analysis')->everyFiveMinutes()->withoutOverlapping();

Artisan::command('disaster:evaluate-stub', function () {
    $this->line(json_encode(app(StubEvaluation::class)->run(), JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
});

Artisan::command('disaster:doctor', function () {
    try {
        if (DB::getDriverName() !== 'pgsql') {
            $this->error('PostgreSQL diperlukan untuk pemeriksaan spasial.');

            return 1;
        }
        $extension = DB::selectOne("SELECT installed_version FROM pg_available_extensions WHERE name = 'postgis'");
        $this->line('Database connection: OK');
        $this->line('PostgreSQL: '.DB::selectOne('SHOW server_version')->server_version);
        if (! $extension || $extension->installed_version === null) {
            $this->warn('PostGIS belum tersedia/diaktifkan pada database ini.');

            return 1;
        }
        $this->line('PostGIS: '.$extension->installed_version);

        return 0;
    } catch (Throwable) {
        $this->error('Database tidak dapat diperiksa. Periksa koneksi lokal tanpa membagikan kredensial.');

        return 1;
    }
});
