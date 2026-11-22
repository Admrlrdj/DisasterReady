<?php

namespace Tests\Postgis;

use App\Actions\ReviewReport;
use App\Jobs\AnalyzeIncidentJob;
use App\Jobs\FindDuplicateReportsJob;
use App\Models\IncidentReport;
use App\Models\User;
use App\Services\AI\AiProviderInterface;
use App\Services\Integrations\IngestSource;
use Database\Seeders\DisasterSourceSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SpatialWorkflowTest extends TestCase
{
    use DatabaseMigrations;

    public function test_postgis_queue_duplicates_and_map_work_together(): void
    {
        $this->assertSame('pgsql', DB::getDriverName());
        $this->assertSame('UTC', DB::selectOne('SHOW timezone')->TimeZone);
        $this->assertNotEmpty(DB::selectOne('SELECT PostGIS_Version() AS version')->version);
        $owner = User::factory()->create();
        $attributes = ['reporter_id' => $owner->id, 'description' => 'Banjir 40 cm di jalan kampung.', 'observed_at' => now()->subMinutes(5), 'latitude' => -6.22, 'longitude' => 106.87, 'privacy_consented_at' => now()];
        $first = IncidentReport::create($attributes);
        $near = IncidentReport::create(array_replace($attributes, ['longitude' => 106.871]));
        IncidentReport::create(array_replace($attributes, ['longitude' => 110]));
        AnalyzeIncidentJob::dispatch($first->id);
        $this->artisan('queue:work', ['--stop-when-empty' => true, '--tries' => 1])->assertSuccessful();
        $this->assertSame('COMPLETED', $first->refresh()->analysis_status);
        (new FindDuplicateReportsJob($first->id))->handle(app(AiProviderInterface::class));
        $this->assertDatabaseCount('report_duplicate_candidates', 1);
        $this->assertDatabaseHas('report_duplicate_candidates', ['candidate_report_id' => $near->id]);
        $this->assertSame('PENDING', $first->status);
        $this->seed(DisasterSourceSeeder::class);
        $source = DB::table('sources')->where('slug', 'bmkg-earthquake')->value('id');
        app(IngestSource::class)->persist($source, [['kind' => 'event', 'hazard' => 'earthquake', 'external_id' => 'synthetic-spatial', 'title' => 'SINTETIS', 'source_url' => 'https://data.bmkg.go.id/', 'source_time' => now(), 'payload_json' => [], 'synthetic' => true, 'latitude' => -6.2, 'longitude' => 106.8]]);
        $this->getJson('/data/map?kind=event&bbox[]=106&bbox[]=-7&bbox[]=108&bbox[]=-5')->assertOk()->assertJsonCount(1, 'features')->assertJsonPath('features.0.geometry.coordinates.0', 106.8);
    }

    public function test_synthetic_duplicate_ranking_can_be_compared_with_distance_baseline(): void
    {
        $owner = User::factory()->create();
        $attributes = ['reporter_id' => $owner->id, 'description' => 'Banjir 40 cm jalan kampung tertutup air.', 'observed_at' => now()->subMinutes(5), 'latitude' => -6.22, 'longitude' => 106.87, 'privacy_consented_at' => now()];
        $report = IncidentReport::create($attributes);
        $negative = IncidentReport::create(array_replace($attributes, ['longitude' => 106.8701, 'description' => 'SINTETIS latihan kesiapsiagaan, tidak ada banjir.']));
        $positive = IncidentReport::create(array_replace($attributes, ['longitude' => 106.871]));
        (new FindDuplicateReportsJob($report->id))->handle(app(AiProviderInterface::class));
        $candidates = DB::table('report_duplicate_candidates')->where('report_id', $report->id)->get();
        $this->assertCount(2, $candidates);
        $this->assertSame($negative->id, $candidates->sortBy('geo_distance_m')->first()->candidate_report_id);
        $this->assertSame($positive->id, $candidates->sortByDesc('text_score')->first()->candidate_report_id);
        // One labeled positive: baseline precision@1=0, lexical-stub precision@1=1;
        // recall@2=1 for both. This tiny fixture is not a semantic-model benchmark.
    }

    public function test_pilot_demo_from_authenticated_submission_to_audit(): void
    {
        $reporter = User::factory()->create();
        $neighbor = User::factory()->create();
        $moderator = User::factory()->create(['role' => 'moderator']);
        $admin = User::factory()->create(['role' => 'admin']);
        $payload = [
            'description' => 'SINTETIS banjir 40 cm di ujung gang dan 42 cm di depan rumah.',
            'observed_at' => now()->subMinutes(5)->toIso8601String(),
            'latitude' => -6.22, 'longitude' => 106.87, 'privacy_consent' => true,
        ];
        $id = $this->actingAs($reporter)->postJson('/reports', $payload)->assertCreated()->assertJsonPath('data.status', 'PENDING')->json('data.id');
        $neighborId = $this->actingAs($neighbor)->postJson('/reports', array_replace($payload, [
            'description' => 'SINTETIS banjir menutup jalan kampung.', 'longitude' => 106.871,
        ]))->assertCreated()->json('data.id');
        $this->getJson('/my/reports/'.$id)->assertForbidden();
        $this->artisan('queue:work', ['--stop-when-empty' => true, '--tries' => 1])->assertSuccessful();
        $this->assertDatabaseCount('failed_jobs', 0);

        $this->actingAs($moderator)->get('/admin/reports?report='.$id)->assertInertia(fn (Assert $page) => $page
            ->component('moderation/queue')->where('selected.id', $id)->where('selected.status', 'PENDING'));
        $endpoint = '/admin/reports/'.$id;
        $analysis = $this->getJson($endpoint.'/ai-suggestions')->assertOk()->assertJsonPath('simulation_only', true);
        $depth = collect($analysis->json('data'))->firstWhere('field_name', 'water_depth_cm');
        $this->assertEquals(40, $depth['suggested_value_json']);
        $this->assertSame('40 cm', $depth['evidence_span']);
        $neighborAnalysis = $this->getJson('/admin/reports/'.$neighborId.'/ai-suggestions')->assertOk();
        $this->assertNull(collect($neighborAnalysis->json('data'))->firstWhere('field_name', 'water_depth_cm')['suggested_value_json']);

        $candidateId = $this->getJson($endpoint.'/duplicate-candidates')->assertOk()->assertJsonPath('data.0.candidate_report_id', $neighborId)->json('data.0.id');
        $this->postJson($endpoint.'/duplicate-candidates/'.$candidateId, ['decision' => 'DUPLICATE', 'reason' => 'SINTETIS: kejadian, lokasi, dan waktu cocok.'])->assertOk();
        $this->postJson($endpoint.'/ai-feedback', ['suggestion_id' => $depth['id'], 'decision' => 'CORRECTED', 'corrected_value' => 42, 'reason' => 'SINTETIS: gunakan pengukuran di depan rumah.'])->assertOk();
        $this->assertDatabaseHas('incident_reports', ['id' => $id, 'status' => 'PENDING']);
        $this->assertDatabaseHas('incident_reports', ['id' => $neighborId, 'status' => 'PENDING']);
        $this->postJson($endpoint.'/reviews', ['version' => 1, 'decision' => 'VERIFIED', 'reason' => 'SINTETIS: bukti diperiksa moderator.'])->assertOk()->assertJsonPath('data.status', 'VERIFIED');
        $this->actingAs($reporter)->get('/my/reports/'.$id)->assertInertia(fn (Assert $page) => $page
            ->component('reports/detail')->where('payload.data.status', 'VERIFIED'));
        $this->getJson('/admin/audit-logs')->assertForbidden();
        $this->actingAs($admin)->get('/admin/audit-logs')->assertInertia(fn (Assert $page) => $page->component('admin/audit'));
        $this->assertDatabaseHas('audit_logs', ['entity_type' => 'incident_report', 'entity_id' => $id, 'actor_id' => $moderator->id, 'action' => 'review']);
        $this->assertDatabaseCount('official_alerts', 0);
    }

    public function test_dashboard_map_filters_alert_state_and_current_regional_forecast(): void
    {
        $this->freezeTime();
        $this->seed(DisasterSourceSeeder::class);
        $source = DB::table('sources')->where('slug', 'bmkg-cap')->value('id');
        $base = ['kind' => 'alert', 'hazard' => 'extreme_weather', 'title' => 'SINTETIS CAP', 'source_url' => 'https://data.bmkg.go.id/', 'source_time' => now()->subHour(), 'payload_json' => [], 'synthetic' => true, 'latitude' => -6.2, 'longitude' => 106.8, 'effective_at' => now()->subHour(), 'expires_at' => now()->addHour(), 'severity' => 'Moderate', 'certainty' => 'Likely'];
        app(IngestSource::class)->persist($source, [
            $base + ['external_id' => 'active'],
            array_replace($base, ['external_id' => 'expired', 'expires_at' => now()->subMinute()]),
            $base + ['external_id' => 'cancelled', 'message_type' => 'Cancel'],
            array_replace($base, ['external_id' => 'upcoming', 'effective_at' => now()->addMinute()]),
            $base + ['external_id' => 'superseded', 'superseded_at' => now()],
        ]);
        $bbox = '&bbox[]=106&bbox[]=-7&bbox[]=108&bbox[]=-5';
        $this->getJson('/data/map?kind=alert'.$bbox)->assertOk()->assertJsonCount(5, 'features');
        $this->getJson('/data/map?kind=alert&status=active'.$bbox)->assertOk()->assertJsonCount(1, 'features')->assertJsonPath('features.0.properties.alert_state', 'ACTIVE');
        $this->getJson('/data/alerts?status=active&per_page=1')->assertOk()->assertJsonPath('total', 1);

        $source = DB::table('sources')->where('slug', 'bmkg-weather')->value('id');
        $forecast = ['kind' => 'forecast', 'hazard' => null, 'title' => 'SINTETIS prakiraan', 'source_url' => 'https://data.bmkg.go.id/', 'source_time' => now()->subHour(), 'payload_json' => ['t' => 29], 'synthetic' => true, 'latitude' => -6.2, 'longitude' => 106.8];
        $history = [];
        for ($i = 1; $i <= 81; $i++) {
            $history[] = $forecast + ['external_id' => 'past-'.$i, 'region_code' => '31.75.03.1001', 'forecast_at' => now()->subDays($i), 'expires_at' => now()->subDays($i)->addHours(3)];
        }
        app(IngestSource::class)->persist($source, [
            ...$history,
            $forecast + ['external_id' => 'first', 'region_code' => '31.75.03.1001', 'forecast_at' => now()->addHour(), 'expires_at' => now()->addHours(4)],
            $forecast + ['external_id' => 'second', 'region_code' => '31.75.03.1002', 'forecast_at' => now()->addHours(2), 'expires_at' => now()->addHours(5)],
        ]);
        $this->getJson('/data/map?kind=forecast&region=31.75.03.1001'.$bbox)->assertOk()->assertJsonCount(1, 'features')->assertJsonPath('features.0.properties.data.t', 29);
        $this->getJson('/data/weather?region=31.75.03.1001&current=1')->assertOk()->assertJsonPath('total', 1);
        $this->get('/dashboard')->assertInertia(fn ($page) => $page->has('overview.forecasts', 1)->where('overview.active_alert_count', 1));
    }

    public function test_concurrent_review_cannot_bypass_the_row_lock(): void
    {
        $owner = User::factory()->create();
        $reviewer = User::factory()->create(['role' => 'moderator']);
        $report = IncidentReport::create(['reporter_id' => $owner->id, 'description' => 'SINTETIS laporan banjir untuk review.', 'observed_at' => now()->subMinute(), 'latitude' => -6.22, 'longitude' => 106.87, 'privacy_consented_at' => now()]);
        config(['database.connections.review_racer' => config('database.connections.pgsql')]);
        $primary = DB::connection('pgsql');
        $primary->beginTransaction();
        $primary->table('incident_reports')->where('id', $report->id)->lockForUpdate()->first();
        DB::connection('review_racer')->statement("SET lock_timeout = '100ms'");
        DB::setDefaultConnection('review_racer');
        try {
            app(ReviewReport::class)->handle($reviewer, $report->id, 1, 'VERIFIED', 'SINTETIS keputusan bersamaan.');
            $this->fail('A concurrent connection must respect the row lock.');
        } catch (QueryException $e) {
            $this->assertSame('55P03', $e->getCode());
        } finally {
            DB::setDefaultConnection('pgsql');
            $primary->rollBack();
            DB::purge('review_racer');
        }
        $this->assertSame('PENDING', $report->refresh()->status);
        $this->assertDatabaseCount('report_reviews', 0);
        $this->assertDatabaseCount('audit_logs', 0);
    }
}
