<?php

namespace App\Actions;

use App\Jobs\AnalyzeIncidentJob;
use App\Models\IncidentReport;
use App\Models\User;
use App\Services\PrivatePhotoStorage;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SubmitReport
{
    /** @param array<string, mixed> $data */
    public function handle(User $user, array $data, ?UploadedFile $photo = null): IncidentReport
    {
        $evidence = $photo ? app(PrivatePhotoStorage::class)->store($photo) : null;
        try {
            $report = DB::transaction(function () use ($user, $data, $evidence) {
                $report = IncidentReport::create([
                    'reporter_id' => $user->id, 'category' => $data['category'] ?? null,
                    'description' => $data['description'] ?? 'Laporan foto tanpa deskripsi tambahan.', 'observed_at' => CarbonImmutable::parse($data['observed_at'])->utc(),
                    'latitude' => $data['latitude'], 'longitude' => $data['longitude'],
                    'status' => 'PENDING', 'analysis_status' => 'QUEUED',
                    'privacy_consented_at' => now(), 'photo_consented_at' => $evidence ? now() : null,
                ]);
                if ($evidence) {
                    DB::table('report_evidence')->insert($evidence + ['report_id' => $report->id, 'created_at' => now(), 'updated_at' => now()]);
                }

                return $report;
            });
        } catch (\Throwable $e) {
            if ($evidence) {
                Storage::disk($evidence['disk'])->delete($evidence['storage_key']);
            }
            throw $e;
        }
        // Submission has committed; queue failure must not turn it into a failed submission.
        try {
            AnalyzeIncidentJob::dispatch($report->id)->afterCommit();
        } catch (\Throwable) {
            $report->update(['analysis_status' => 'DISPATCH_FAILED']);
        }

        return $report->refresh();
    }
}
