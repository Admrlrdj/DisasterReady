<?php

namespace App\Jobs;

use App\Services\Integrations\BmkgAdapter;
use App\Services\Integrations\IngestSource;
use App\Services\Integrations\RegionalWeather;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class FetchRegionalWeatherJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public int $uniqueFor = 600;

    public function __construct(public string $region) {}

    public function uniqueId(): string
    {
        return $this->region;
    }

    public function backoff(): int
    {
        return 60;
    }

    public function handle(BmkgAdapter $adapter, IngestSource $ingest): void
    {
        $source = DB::table('sources')->where('slug', 'bmkg-weather')->where('enabled', true)->first();
        if (! $source || ! config('disaster.sources_enabled')) {
            RegionalWeather::mark($this->region, 'UNAVAILABLE');

            return;
        }
        $run = DB::table('ingestion_runs')->insertGetId([
            'source_id' => $source->id,
            'status' => 'RUNNING',
            'started_at' => now(),
        ]);
        try {
            $records = $adapter->fetch('bmkg-weather', $this->region);
            if ($records === [] || array_column($records, 'region_code') !== array_fill(0, count($records), $this->region)) {
                $this->closeUnavailableRun($run);

                return;
            }
            DB::transaction(function () use ($ingest, $records, $source, $run): void {
                DB::table('sources')->where('id', $source->id)->lockForUpdate()->first();
                $ingest->persist($source->id, $records, $run);
                DB::table('sources')->where('id', $source->id)->update(['sync_status' => 'OK', 'last_success_at' => now(), 'updated_at' => now()]);
                DB::table('ingestion_runs')->where('id', $run)->update(['status' => 'COMPLETED', 'count' => count($records), 'finished_at' => now()]);
            });
            Cache::forget(RegionalWeather::key($this->region));
        } catch (RequestException $exception) {
            if (in_array($exception->response->status(), [400, 404, 422], true)) {
                $this->closeUnavailableRun($run);

                return;
            }
            $this->failRun($run);
        } catch (\Throwable) {
            $this->failRun($run);
        }
    }

    private function closeUnavailableRun(int $run): void
    {
        DB::table('ingestion_runs')->where('id', $run)->update(['status' => 'FAILED', 'error_code' => 'REGIONAL_FORECAST_UNAVAILABLE', 'finished_at' => now()]);
        RegionalWeather::mark($this->region, 'UNAVAILABLE');
    }

    private function failRun(int $run): never
    {
        DB::table('ingestion_runs')->where('id', $run)->update(['status' => 'FAILED', 'error_code' => 'REGIONAL_WEATHER_FAILED', 'finished_at' => now()]);
        throw new \RuntimeException('REGIONAL_WEATHER_FAILED');
    }

    public function failed(?\Throwable $exception): void
    {
        RegionalWeather::mark($this->region, 'FAILED');
    }
}
