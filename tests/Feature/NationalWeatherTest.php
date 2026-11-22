<?php

namespace Tests\Feature;

use App\Jobs\FetchRegionalWeatherJob;
use App\Services\Integrations\BmkgAdapter;
use App\Services\Integrations\IngestSource;
use Database\Seeders\DisasterSourceSeeder;
use Database\Seeders\NationalPreparednessSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NationalWeatherTest extends TestCase
{
    private const REGION = '91.71.01.1001';

    use RefreshDatabase;

    public function test_search_returns_regional_codes_and_context(): void
    {
        foreach (['11.01.01.2001', '31.75.03.1001', '64.71.01.1001', '73.71.01.1001', '53.71.01.1001', self::REGION] as $code) {
            $this->getJson('/data/regions?q='.$code)->assertOk()->assertJsonPath('data.0.code', $code)
                ->assertJsonStructure(['data' => [['name', 'area', 'code']]]);
        }
        $this->getJson('/data/regions?q=Gurabesi+Papua')->assertOk()->assertJsonPath('data.0.code', self::REGION);
        $this->getJson('/data/regions?q=%21')->assertUnprocessable();
        $this->getJson('/data/weather?region=91.71')->assertUnprocessable();
    }

    public function test_regional_requests_are_deduplicated_and_limited(): void
    {
        $this->enableWeather();
        Queue::fake();
        $url = '/data/weather?current=1&region='.self::REGION;
        $this->getJson($url)->assertOk()->assertJsonPath('region_status.state', 'QUEUED');
        $this->getJson($url)->assertOk()->assertJsonPath('region_status.state', 'QUEUED');
        Queue::assertPushed(FetchRegionalWeatherJob::class, fn (FetchRegionalWeatherJob $job) => $job->region === self::REGION);
        Queue::assertPushed(FetchRegionalWeatherJob::class, 1);
        for ($i = 1; $i <= 8; $i++) {
            $code = sprintf('11.01.01.%04d', 2000 + $i);
            $this->getJson('/data/weather?region='.$code)->assertJsonPath('region_status.state', $i === 8 ? 'BUSY' : 'QUEUED');
        }
        Queue::assertPushed(FetchRegionalWeatherJob::class, 8);
    }

    public function test_job_saves_forecasts_idempotently_and_keeps_local_time(): void
    {
        $this->enableWeather();
        Http::fake(['api.bmkg.go.id/*' => Http::response($this->forecast(self::REGION))]);
        $this->fetch();
        $this->fetch();
        $this->assertDatabaseCount('forecasts', 1);
        $this->assertDatabaseHas('ingestion_runs', ['status' => 'COMPLETED', 'count' => 1]);
        $url = '/data/weather?current=1&region='.self::REGION;
        $this->getJson($url)->assertOk()->assertJsonPath('region_status.state', 'FRESH')
            ->assertJsonPath('data.0.data.local_datetime', '2026-02-01 14:00:00');
        $this->travel(6)->hours();
        config(['disaster.sources_enabled' => false]);
        $this->getJson($url)->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('region_status.state', 'STALE');
    }

    public function test_wrong_region_does_not_pollute_forecasts(): void
    {
        $this->enableWeather();
        Http::fake(['api.bmkg.go.id/*' => Http::response($this->forecast('31.75.03.1001'))]);
        $this->fetch();
        $this->assertDatabaseCount('forecasts', 0);
        $this->getJson('/data/weather?region='.self::REGION)->assertJsonPath('region_status.state', 'UNAVAILABLE');
        $this->assertDatabaseHas('ingestion_runs', ['status' => 'FAILED', 'error_code' => 'REGIONAL_FORECAST_UNAVAILABLE']);
    }

    public function test_current_view_excludes_slots_omitted_from_a_newer_batch(): void
    {
        $this->enableWeather();
        Http::fake(['api.bmkg.go.id/*' => Http::sequence()
            ->push($this->forecast(self::REGION))
            ->push($this->forecast(self::REGION, 3))]);
        $this->fetch();
        $this->fetch();

        $this->getJson('/data/weather?current=1&region='.self::REGION)->assertJsonPath('total', 1);
        $this->getJson('/data/weather?region='.self::REGION)->assertJsonPath('total', 2);
    }

    public function test_provider_failure_is_sanitized_and_visible_after_retry_exhaustion(): void
    {
        $this->enableWeather();
        Http::fake(['api.bmkg.go.id/*' => Http::response('sensitive body', 503)]);
        try {
            $this->fetch();
            $this->fail('Upstream failure should be retried.');
        } catch (\RuntimeException $exception) {
            $this->assertSame('REGIONAL_WEATHER_FAILED', $exception->getMessage());
            (new FetchRegionalWeatherJob(self::REGION))->failed($exception);
        }
        $this->getJson('/data/weather?region='.self::REGION)->assertJsonPath('region_status.state', 'FAILED');
        $this->assertDatabaseHas('ingestion_runs', ['status' => 'FAILED', 'error_code' => 'REGIONAL_WEATHER_FAILED']);
    }

    public function test_national_guides_remain_private_until_review(): void
    {
        $this->seed(NationalPreparednessSeeder::class);
        $this->seed(NationalPreparednessSeeder::class);
        $this->assertDatabaseCount('preparedness_guides', 3);
        foreach (['flood', 'earthquake', 'tsunami'] as $hazard) {
            $this->getJson('/data/preparedness/'.$hazard)->assertOk()->assertJsonCount(0, 'data');
        }
    }

    private function enableWeather(): void
    {
        Cache::flush();
        $this->seed(DisasterSourceSeeder::class);
        DB::table('sources')->where('slug', 'bmkg-weather')->update(['enabled' => true]);
        config(['disaster.sources_enabled' => true]);
    }

    private function fetch(): void
    {
        (new FetchRegionalWeatherJob(self::REGION))->handle(app(BmkgAdapter::class), app(IngestSource::class));
    }

    /** @return array<string, mixed> */
    private function forecast(string $code, int $ahead = 1): array
    {
        return ['data' => [[
            'lokasi' => ['adm4' => $code, 'lat' => -2.5, 'lon' => 140.7],
            'cuaca' => [[[
                'utc_datetime' => now()->addHours($ahead)->toIso8601String(),
                'analysis_date' => now()->toIso8601String(),
                'local_datetime' => '2026-02-01 14:00:00',
                'weather_desc' => 'SINTETIS · Berawan',
            ]]],
        ]]];
    }
}
