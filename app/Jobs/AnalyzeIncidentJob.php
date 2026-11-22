<?php

namespace App\Jobs;

use App\Models\IncidentReport;
use App\Services\AI\AnalysisService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;

class AnalyzeIncidentJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(public int $reportId) {}

    /** @return list<int> */
    public function backoff(): array
    {
        return [60, 180, 600];
    }

    public function handle(AnalysisService $service): void
    {
        $service->analyze($this->reportId);
        if (IncidentReport::findOrFail($this->reportId)->analysis_status === 'DISABLED') {
            IncidentReport::whereKey($this->reportId)->update(['duplicate_status' => 'DISABLED']);

            return;
        }
        if (DB::getDriverName() === 'pgsql') {
            try {
                FindDuplicateReportsJob::dispatch($this->reportId)->afterCommit();
            } catch (\Throwable) {
                IncidentReport::whereKey($this->reportId)->update(['duplicate_status' => 'DISPATCH_FAILED']);
            }
        } else {
            IncidentReport::whereKey($this->reportId)->update(['duplicate_status' => 'POSTGIS_REQUIRED']);
        }
    }

    public function failed(?\Throwable $exception): void
    {
        IncidentReport::whereKey($this->reportId)->update(['analysis_status' => 'FAILED']);
    }
}
