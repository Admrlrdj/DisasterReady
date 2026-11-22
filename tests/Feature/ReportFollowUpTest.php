<?php

namespace Tests\Feature;

use App\Actions\ReviewReport;
use App\Models\IncidentReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReportFollowUpTest extends TestCase
{
    use RefreshDatabase;

    private function report(User $user): IncidentReport
    {
        return IncidentReport::create(['reporter_id' => $user->id, 'description' => 'SINTETIS laporan asli banjir di jalan.', 'observed_at' => now()->subMinute(), 'latitude' => -6.22, 'longitude' => 106.87, 'privacy_consented_at' => now()]);
    }

    public function test_my_reports_is_paginated_and_owner_scoped(): void
    {
        $owner = User::factory()->create();
        $mine = $this->report($owner);
        $this->report(User::factory()->create());
        $this->actingAs($owner)->getJson('/my/reports')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $mine->id)->assertJsonMissingPath('data.0.latitude');
        $this->getJson('/my/reports?per_page=101')->assertUnprocessable();
    }

    public function test_follow_up_preserves_original_and_reopens_pending_with_audit(): void
    {
        $owner = User::factory()->create();
        $report = $this->report($owner);
        app(ReviewReport::class)->handle(User::factory()->create(['role' => 'moderator']), $report->id, 1, 'NEEDS_EVIDENCE', 'Perlu bukti tambahan.');
        $payload = ['version' => 2, 'description' => 'SINTETIS tambahan: pengamatan ulang di lokasi.', 'privacy_consent' => true];
        $this->actingAs($owner)->postJson('/my/reports/'.$report->id.'/follow-ups', $payload)->assertCreated()->assertJsonPath('data.status', 'PENDING')->assertJsonPath('data.version', 3);
        $this->assertSame('SINTETIS laporan asli banjir di jalan.', $report->refresh()->description);
        $this->assertDatabaseCount('report_follow_ups', 1);
        $this->assertDatabaseCount('audit_logs', 2);
        $this->assertDatabaseCount('ai_analysis_runs', 0);
        $this->getJson('/my/reports/'.$report->id)->assertJsonCount(1, 'data.follow_ups');
        $this->postJson('/my/reports/'.$report->id.'/follow-ups', $payload)->assertConflict();
    }

    public function test_other_users_cannot_follow_up_and_photo_is_private(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $report = $this->report($owner);
        $this->actingAs(User::factory()->create())->postJson('/my/reports/'.$report->id.'/follow-ups', ['version' => 1])->assertForbidden();
        $report->update(['status' => 'NEEDS_EVIDENCE']);
        $this->actingAs($owner)->postJson('/my/reports/'.$report->id.'/follow-ups', ['version' => 1, 'privacy_consent' => true, 'photo_consent' => true, 'photo' => UploadedFile::fake()->image('extra.jpg')])->assertCreated();
        $file = DB::table('report_evidence')->first();
        $this->assertNotNull($file);
        $this->assertNotNull($file->follow_up_id);
        Storage::disk('local')->assertExists($file->storage_key);
    }

    public function test_failed_follow_up_audit_rolls_back_and_cleans_new_photo(): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $report = $this->report($owner);
        $report->update(['status' => 'NEEDS_EVIDENCE']);
        DB::statement('DROP TABLE audit_logs');
        $this->actingAs($owner)->postJson('/my/reports/'.$report->id.'/follow-ups', ['version' => 1, 'privacy_consent' => true, 'photo_consent' => true, 'photo' => UploadedFile::fake()->image('extra.jpg')])->assertStatus(500);
        $this->assertSame('NEEDS_EVIDENCE', $report->refresh()->status);
        $this->assertDatabaseCount('report_follow_ups', 0);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }
}
