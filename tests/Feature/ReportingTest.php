<?php

namespace Tests\Feature;

use App\Actions\ReviewReport;
use App\Jobs\AnalyzeIncidentJob;
use App\Models\IncidentReport;
use App\Models\User;
use App\Services\AI\AiProviderInterface;
use App\Services\AI\AnalysisService;
use App\Services\AI\StubAiProvider;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReportingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function report(?User $user = null, string $text = 'Banjir setinggi 40 cm di jalan kampung.'): IncidentReport
    {
        return IncidentReport::create(['reporter_id' => ($user ?? User::factory()->create())->id, 'description' => $text, 'observed_at' => now()->subMinutes(5), 'latitude' => -6.22, 'longitude' => 106.87, 'status' => 'PENDING', 'privacy_consented_at' => now()]);
    }

    /** @return array<string, mixed> */
    private function payload(): array
    {
        return ['description' => 'Banjir 40 cm di jalan kampung.', 'observed_at' => now()->subMinute()->toIso8601String(), 'latitude' => -6.22, 'longitude' => 106.87, 'privacy_consent' => true];
    }

    public function test_submission_is_pending_and_cannot_override_role_or_status(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/reports', $this->payload() + ['status' => 'VERIFIED', 'role' => 'admin']);
        $response->assertCreated()->assertJsonPath('data.status', 'PENDING')->assertJsonMissingPath('data.latitude');
        $this->assertDatabaseHas('incident_reports', ['reporter_id' => $user->id, 'status' => 'PENDING']);
        $this->assertSame('reporter', $user->refresh()->role);
        Queue::assertPushed(AnalyzeIncidentJob::class);
    }

    public function test_unverified_and_inactive_users_cannot_submit(): void
    {
        $this->actingAs(User::factory()->unverified()->create())->postJson('/reports', $this->payload())->assertForbidden();
        $inactive = User::factory()->create(['status' => 'suspended']);
        $this->actingAs($inactive)->postJson('/reports', $this->payload())->assertForbidden();
    }

    public function test_report_write_requires_csrf_token_outside_test_bypass(): void
    {
        $this->app->instance('env', 'local');
        $this->actingAs(User::factory()->create())->postJson('/reports', $this->payload())->assertStatus(419);
        $this->assertDatabaseCount('incident_reports', 0);
    }

    public function test_reporter_cannot_review_their_own_report_even_if_moderator(): void
    {
        $owner = User::factory()->create(['role' => 'moderator']);
        $report = $this->report($owner);
        $this->actingAs($owner)->postJson('/admin/reports/'.$report->id.'/reviews', ['version' => 1, 'decision' => 'VERIFIED', 'reason' => 'Tidak boleh review sendiri.'])->assertForbidden();
    }

    public function test_photo_requires_explicit_consent(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/reports', $this->payload() + ['photo' => UploadedFile::fake()->image('photo.jpg')])->assertUnprocessable()->assertJsonValidationErrors('photo_consent');
        $this->assertDatabaseCount('incident_reports', 0);
    }

    public function test_validation_and_ownership_are_enforced(): void
    {
        $report = $this->report();
        $this->actingAs(User::factory()->create())->getJson('/my/reports/'.$report->id)->assertForbidden();
        $this->postJson('/reports', ['description' => 'short'])->assertUnprocessable();
        $owner = User::findOrFail($report->reporter_id);
        $this->actingAs($owner)->getJson('/my/reports/'.$report->id)->assertOk()->assertJsonPath('data.latitude', '-6.220000');
    }

    public function test_observation_offset_is_converted_to_utc_before_storage(): void
    {
        Queue::fake();
        $payload = array_replace($this->payload(), ['observed_at' => '2026-01-01T10:00:00+07:00']);
        $this->actingAs(User::factory()->create())->postJson('/reports', $payload)->assertCreated()->assertJsonPath('data.observed_at', '2026-01-01T03:00:00+00:00');
        $this->assertDatabaseHas('incident_reports', ['observed_at' => '2026-01-01 03:00:00']);
    }

    public function test_registration_cannot_assign_admin_role(): void
    {
        $this->post('/register', ['name' => 'SINTETIS', 'email' => 'role-test@example.com', 'password' => 'password', 'password_confirmation' => 'password', 'role' => 'admin', 'status' => 'active'])->assertRedirect();
        $this->assertDatabaseHas('users', ['email' => 'role-test@example.com', 'role' => 'reporter']);
    }

    public function test_candidate_decision_never_merges_or_verifies_reports(): void
    {
        $report = $this->report();
        $other = $this->report();
        $candidate = DB::table('report_duplicate_candidates')->insertGetId(['report_id' => $report->id, 'candidate_report_id' => $other->id, 'method_version' => 'synthetic-test', 'geo_distance_m' => 10, 'time_delta_minutes' => 2, 'text_score' => 1]);
        $this->actingAs(User::factory()->create(['role' => 'moderator']))->postJson('/admin/reports/'.$report->id.'/duplicate-candidates/'.$candidate, ['decision' => 'DUPLICATE', 'reason' => 'SINTETIS kandidat cocok.'])->assertOk();
        $this->assertDatabaseCount('incident_reports', 2);
        $this->assertSame('PENDING', $report->refresh()->status);
        $this->assertSame('PENDING', $other->refresh()->status);
        $this->assertDatabaseHas('report_duplicate_candidates', ['id' => $candidate, 'reviewer_decision' => 'DUPLICATE']);
    }

    public function test_dispatch_failure_does_not_lose_report(): void
    {
        Bus::shouldReceive('dispatch')->once()->andThrow(new \RuntimeException('queue offline'));
        $this->actingAs(User::factory()->create())->postJson('/reports', $this->payload())->assertCreated()->assertJsonPath('data.analysis_status', 'DISPATCH_FAILED');
        $this->assertDatabaseCount('incident_reports', 1);
    }

    public function test_photo_is_reencoded_private_and_authorized(): void
    {
        Queue::fake();
        Storage::fake('local');
        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/reports', $this->payload() + ['photo' => UploadedFile::fake()->image('image.jpg'), 'photo_consent' => true]);
        $response->assertCreated();
        $file = DB::table('report_evidence')->first();
        $this->assertNotNull($file);
        $bytes = Storage::disk('local')->get($file->storage_key);
        $this->assertStringNotContainsString('Exif', $bytes);
        $this->assertSame(hash('sha256', $bytes), $file->sha256);
        $url = '/reports/'.$response->json('data.id').'/evidence/'.$file->id;
        $this->getJson($url)->assertOk()->assertHeader('Content-Type', 'image/jpeg');
        $this->actingAs(User::factory()->create())->getJson($url)->assertForbidden();
    }

    public function test_moderation_is_atomic_authorized_and_versioned(): void
    {
        $report = $this->report();
        $input = ['version' => 1, 'decision' => 'VERIFIED', 'reason' => 'Bukti diperiksa manual.'];
        $this->actingAs(User::factory()->create())->postJson('/admin/reports/'.$report->id.'/reviews', $input)->assertForbidden();
        $moderator = User::factory()->create(['role' => 'moderator']);
        $this->actingAs($moderator)->postJson('/admin/reports/'.$report->id.'/reviews', $input)->assertOk()->assertJsonPath('data.version', 2);
        $this->postJson('/admin/reports/'.$report->id.'/reviews', $input)->assertConflict();
        $this->assertDatabaseCount('report_reviews', 1);
        $this->assertDatabaseCount('audit_logs', 1);
        $this->assertDatabaseCount('official_alerts', 0);
    }

    public function test_audit_failure_rolls_back_review_and_status(): void
    {
        $report = $this->report();
        $moderator = User::factory()->create(['role' => 'moderator']);
        DB::statement('DROP TABLE audit_logs');
        try {
            app(ReviewReport::class)->handle($moderator, $report->id, 1, 'VERIFIED', 'Bukti diperiksa manual.');
            $this->fail('Audit failure must fail the transaction.');
        } catch (QueryException) {
            $this->assertSame('PENDING', $report->refresh()->status);
            $this->assertDatabaseCount('report_reviews', 0);
        }
    }

    public function test_ai_extracts_explicit_depth_and_is_idempotent(): void
    {
        $report = $this->report();
        app(AnalysisService::class)->analyze($report->id);
        app(AnalysisService::class)->analyze($report->id);
        $this->assertDatabaseCount('ai_analysis_runs', 1);
        $this->assertDatabaseCount('ai_report_suggestions', 6);
        $row = DB::table('ai_report_suggestions')->where('field_name', 'water_depth_cm')->first();
        $this->assertNotNull($row);
        $this->assertEquals(40, json_decode($row->suggested_value_json));
        $this->assertSame('40 cm', $row->evidence_span);
        $this->assertSame('PENDING', $report->refresh()->status);
    }

    public function test_ai_missing_depth_is_null_and_feedback_does_not_verify(): void
    {
        $report = $this->report(text: 'Banjir terlihat di sekitar jalan kampung.');
        app(AnalysisService::class)->analyze($report->id);
        $row = DB::table('ai_report_suggestions')->where('field_name', 'water_depth_cm')->first();
        $this->assertNotNull($row);
        $this->assertNull(json_decode($row->suggested_value_json));
        $this->assertNull($row->evidence_span);
        $this->actingAs(User::factory()->create(['role' => 'moderator']))->postJson('/admin/reports/'.$report->id.'/ai-feedback', ['suggestion_id' => $row->id, 'decision' => 'ACCEPTED', 'corrected_value' => null, 'reason' => 'Nilai memang tidak disebutkan.'])->assertOk();
        $this->assertSame('PENDING', $report->refresh()->status);
        $this->assertDatabaseCount('ai_feedback', 1);
    }

    public function test_depth_feedback_keeps_numeric_type_and_rejects_repeated_review(): void
    {
        $report = $this->report();
        app(AnalysisService::class)->analyze($report->id);
        $suggestion = DB::table('ai_report_suggestions')->where('field_name', 'water_depth_cm')->first();
        $this->assertNotNull($suggestion);
        $this->actingAs(User::factory()->create(['role' => 'moderator']));
        $response = $this->getJson('/admin/reports/'.$report->id.'/ai-suggestions')->assertOk()->assertJsonPath('simulation_only', true);
        $depth = collect($response->json('data'))->firstWhere('field_name', 'water_depth_cm');
        $this->assertEquals(40, $depth['suggested_value_json']);
        $payload = ['suggestion_id' => $suggestion->id, 'decision' => 'CORRECTED', 'corrected_value' => 45.5, 'reason' => 'SINTETIS koreksi reviewer.'];
        $this->postJson('/admin/reports/'.$report->id.'/ai-feedback', $payload)->assertOk();
        $this->postJson('/admin/reports/'.$report->id.'/ai-feedback', $payload)->assertConflict();
        $this->assertSame(45.5, json_decode(DB::table('ai_feedback')->value('corrected_json')));
        $this->assertSame('PENDING', $report->refresh()->status);
    }

    public function test_measurement_must_match_its_original_text_evidence(): void
    {
        $report = $this->report();
        $output = (new StubAiProvider)->analyze($report->description);
        $output['water_depth_cm'] = ['value' => 999, 'evidence' => '40 cm'];
        $provider = $this->createMock(AiProviderInterface::class);
        $provider->method('model')->willReturn('synthetic-invalid-depth');
        $provider->method('analyze')->willReturn($output);
        try {
            (new AnalysisService($provider))->analyze($report->id);
            $this->fail('Fabricated measurement must fail validation.');
        } catch (\RuntimeException $e) {
            $this->assertSame('AI_ANALYSIS_FAILED', $e->getMessage());
        }
        $this->assertDatabaseCount('ai_report_suggestions', 0);
        $this->assertSame('PENDING', $report->refresh()->status);
    }

    public function test_invalid_ai_output_is_recorded_without_sensitive_exception(): void
    {
        $report = $this->report();
        $provider = $this->createMock(AiProviderInterface::class);
        $provider->method('model')->willReturn('offline-test');
        $provider->method('analyze')->willReturn(['fabricated' => 'unsafe']);
        try {
            (new AnalysisService($provider))->analyze($report->id);
            $this->fail('Invalid provider schema should fail.');
        } catch (\RuntimeException $e) {
            $this->assertSame('AI_ANALYSIS_FAILED', $e->getMessage());
        }
        $this->assertSame('PENDING', $report->refresh()->status);
        $this->assertSame('FAILED', $report->analysis_status);
        $this->assertDatabaseHas('ai_analysis_runs', ['error_code' => 'PROVIDER_OR_SCHEMA_FAILURE']);
        $this->assertDatabaseCount('ai_report_suggestions', 0);
    }

    public function test_provider_outage_does_not_change_pending_status_and_can_retry(): void
    {
        $report = $this->report();
        $provider = $this->createMock(AiProviderInterface::class);
        $provider->method('model')->willReturn('offline-test');
        $provider->method('analyze')->willThrowException(new \RuntimeException('secret-provider-token'));
        try {
            (new AnalysisService($provider))->analyze($report->id);
            $this->fail('Provider outage must be recorded.');
        } catch (\RuntimeException $e) {
            $this->assertSame('AI_ANALYSIS_FAILED', $e->getMessage());
        }
        $this->assertSame('PENDING', $report->refresh()->status);
        Cache::forget('ai-circuit-open');
        app(AnalysisService::class)->analyze($report->id);
        $this->assertSame('COMPLETED', $report->refresh()->analysis_status);
        $this->assertDatabaseCount('ai_report_suggestions', 6);
    }

    public function test_admin_kill_switch_and_health_are_protected(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'moderator']))->getJson('/admin/ai/health')->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'admin']))->postJson('/admin/ai/settings', ['enabled' => false])->assertOk();
        $report = $this->report();
        app(AnalysisService::class)->analyze($report->id);
        $this->assertSame('DISABLED', $report->refresh()->analysis_status);
        $this->getJson('/admin/ai/health')->assertOk()->assertJsonPath('simulation_only', true);
    }
}
