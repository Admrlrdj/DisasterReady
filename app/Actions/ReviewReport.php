<?php

namespace App\Actions;

use App\Models\IncidentReport;
use App\Models\User;
use App\Services\Audit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class ReviewReport
{
    public function handle(User $reviewer, int $id, int $version, string $decision, string $reason): IncidentReport
    {
        return DB::transaction(function () use ($reviewer, $id, $version, $decision, $reason) {
            $report = IncidentReport::query()->lockForUpdate()->findOrFail($id);
            Gate::forUser($reviewer)->authorize('review', $report);
            abort_if($report->version !== $version, 409, 'Laporan berubah; muat ulang sebelum review.');
            abort_if(in_array($report->status, ['VERIFIED', 'REJECTED'], true), 409, 'Keputusan final sudah tersimpan.');
            $before = ['status' => $report->status, 'version' => $report->version];
            $report->update(['status' => $decision, 'version' => $version + 1]);
            DB::table('report_reviews')->insert([
                'report_id' => $id, 'reviewer_id' => $reviewer->id, 'decision' => $decision,
                'reason' => $reason, 'version' => $version + 1, 'created_at' => now(), 'updated_at' => now(),
            ]);
            Audit::record($reviewer->id, 'incident_report', $id, 'review', $before, ['status' => $decision, 'version' => $version + 1]);

            return $report;
        });
    }
}
