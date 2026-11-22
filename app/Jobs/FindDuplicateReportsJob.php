<?php

namespace App\Jobs;

use App\Models\IncidentReport;
use App\Services\AI\AiProviderInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class FindDuplicateReportsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    /** @return list<int> */
    public function backoff(): array
    {
        return [60, 180, 600];
    }

    public function __construct(public int $reportId) {}

    public function handle(AiProviderInterface $provider): void
    {
        $enabled = DB::table('operational_settings')->where('key', 'ai')->value('enabled');
        if (! config('disaster.ai_enabled') || $enabled === false || $enabled === 0) {
            IncidentReport::whereKey($this->reportId)->update(['duplicate_status' => 'DISABLED']);

            return;
        }
        if (DB::getDriverName() !== 'pgsql') {
            throw new \RuntimeException('POSTGIS_REQUIRED');
        }
        $report = IncidentReport::findOrFail($this->reportId);
        $rows = DB::select('SELECT id, description, ST_Distance(geom, ST_SetSRID(ST_MakePoint(?,?),4326)::geography) AS distance, ABS(EXTRACT(EPOCH FROM (observed_at - ?::timestamptz)))/60 AS minutes FROM incident_reports WHERE id <> ? AND observed_at BETWEEN ? AND ? AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint(?,?),4326)::geography, ?) ORDER BY distance LIMIT 20', [
            $report->longitude, $report->latitude, $report->observed_at->toIso8601String(), $report->id,
            $report->observed_at->copy()->subHours((int) config('disaster.duplicate_window_hours')),
            $report->observed_at->copy()->addHours((int) config('disaster.duplicate_window_hours')),
            $report->longitude, $report->latitude, config('disaster.duplicate_radius_m'),
        ]);
        foreach ($rows as $row) {
            DB::table('report_duplicate_candidates')->updateOrInsert(['report_id' => $report->id, 'candidate_report_id' => $row->id], [
                'method_version' => 'postgis-time+lexical-simulation-v1', 'geo_distance_m' => $row->distance,
                'time_delta_minutes' => $row->minutes, 'text_score' => $provider->similarity($report->description, $row->description),
            ]);
        }
        $report->update(['duplicate_status' => 'COMPLETED']);
    }

    public function failed(?\Throwable $exception): void
    {
        IncidentReport::whereKey($this->reportId)->update(['duplicate_status' => 'FAILED']);
    }
}
