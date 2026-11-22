<?php

namespace App\Actions;

use App\Models\IncidentReport;
use App\Models\User;
use App\Services\Audit;
use App\Services\PrivatePhotoStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class FollowUpReport
{
    public function handle(User $user, int $id, int $version, ?string $description, ?UploadedFile $photo): IncidentReport
    {
        $report = IncidentReport::findOrFail($id);
        abort_unless($user->status === 'active' && $report->reporter_id === $user->id, 403);
        abort_if($report->status !== 'NEEDS_EVIDENCE' || $report->version !== $version, 409, 'Laporan berubah atau tidak memerlukan bukti tambahan.');
        $evidence = $photo ? app(PrivatePhotoStorage::class)->store($photo) : null;
        try {
            return DB::transaction(function () use ($user, $id, $version, $description, $evidence) {
                $report = IncidentReport::query()->lockForUpdate()->findOrFail($id);
                abort_if($report->status !== 'NEEDS_EVIDENCE' || $report->version !== $version, 409, 'Laporan berubah.');
                $followUp = DB::table('report_follow_ups')->insertGetId(['report_id' => $id, 'reporter_id' => $user->id, 'description' => $description, 'version' => $version + 1, 'privacy_consented_at' => now(), 'photo_consented_at' => $evidence ? now() : null, 'created_at' => now()]);
                if ($evidence) {
                    DB::table('report_evidence')->insert($evidence + ['report_id' => $id, 'follow_up_id' => $followUp, 'created_at' => now(), 'updated_at' => now()]);
                }
                $report->update(['status' => 'PENDING', 'version' => $version + 1]);
                Audit::record($user->id, 'incident_report', $id, 'follow_up', ['status' => 'NEEDS_EVIDENCE', 'version' => $version], ['status' => 'PENDING', 'version' => $version + 1, 'follow_up_id' => $followUp]);

                return $report;
            });
        } catch (\Throwable $e) {
            if ($evidence) {
                Storage::disk($evidence['disk'])->delete($evidence['storage_key']);
            }
            throw $e;
        }
    }
}
