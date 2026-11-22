<?php

namespace Tests\Feature;

use App\Models\IncidentReport;
use App\Models\User;
use App\Services\AI\AiProviderInterface;
use App\Services\AI\StubAiProvider;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class QueueWorkflowTest extends TestCase
{
    use DatabaseMigrations;

    public function test_database_worker_processes_committed_report_without_provider_credentials(): void
    {
        Cache::flush();
        config(['queue.default' => 'database']);
        $this->actingAs(User::factory()->create())->postJson('/reports', [
            'description' => 'SINTETIS banjir 40 cm di jalan kampung.', 'observed_at' => now()->subMinute()->toIso8601String(),
            'latitude' => -6.22, 'longitude' => 106.87, 'privacy_consent' => true,
        ])->assertCreated()->assertJsonPath('data.status', 'PENDING');
        $this->assertDatabaseCount('jobs', 1);
        $this->assertDatabaseCount('ai_analysis_runs', 0);
        $this->artisan('queue:work', ['--once' => true, '--tries' => 1])->assertSuccessful();
        $this->assertDatabaseCount('jobs', 0);
        $this->assertDatabaseCount('failed_jobs', 0);
        $this->assertSame('COMPLETED', IncidentReport::firstOrFail()->analysis_status);
        $this->assertSame('PENDING', IncidentReport::firstOrFail()->status);
    }

    public function test_failed_job_is_sanitized_and_retry_recovers_the_same_report(): void
    {
        Cache::flush();
        config(['queue.default' => 'database']);
        $provider = $this->createMock(AiProviderInterface::class);
        $provider->method('model')->willReturn('synthetic-rule-stub-v1');
        $provider->method('analyze')->willThrowException(new \RuntimeException('private-provider-secret'));
        $this->app->instance(AiProviderInterface::class, $provider);
        $this->actingAs(User::factory()->create())->postJson('/reports', [
            'description' => 'SINTETIS banjir 40 cm di jalan kampung.', 'observed_at' => now()->subMinute()->toIso8601String(),
            'latitude' => -6.22, 'longitude' => 106.87, 'privacy_consent' => true,
        ])->assertCreated();
        $this->artisan('queue:work', ['--once' => true, '--tries' => 1])->assertSuccessful();
        $this->travel(61)->seconds();
        $this->artisan('queue:work', ['--once' => true, '--tries' => 1])->assertSuccessful();
        $this->travel(181)->seconds();
        $this->artisan('queue:work', ['--once' => true, '--tries' => 1])->assertSuccessful();
        $failed = DB::table('failed_jobs')->first();
        $this->assertNotNull($failed);
        $this->assertStringNotContainsString('private-provider-secret', $failed->exception);
        $this->assertSame('FAILED', IncidentReport::firstOrFail()->analysis_status);
        Cache::forget('ai-circuit-open');
        $this->app->instance(AiProviderInterface::class, new StubAiProvider);
        $this->artisan('queue:retry', ['id' => [$failed->uuid]])->assertSuccessful();
        $this->artisan('queue:work', ['--once' => true, '--tries' => 1])->assertSuccessful();
        $this->assertDatabaseCount('failed_jobs', 0);
        $this->assertDatabaseCount('ai_analysis_runs', 1);
        $this->assertDatabaseCount('ai_analysis_attempts', 4);
        $this->assertSame(3, DB::table('ai_analysis_attempts')->where('status', 'FAILED')->count());
        $this->assertSame('COMPLETED', IncidentReport::firstOrFail()->analysis_status);
        $this->assertSame('PENDING', IncidentReport::firstOrFail()->status);
    }
}
