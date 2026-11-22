<?php

namespace App\Services\Integrations;

use App\Jobs\FetchRegionalWeatherJob;
use App\Services\PublicData;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

final class RegionalWeather
{
    public function __construct(private PublicData $data) {}

    /** @return array{state: string, fetched_at: ?string} */
    public function status(string $region, bool $refresh = true): array
    {
        $current = $this->data->currentForecasts(DB::table('forecasts'), $region)->max('fetched_at');
        $latest = $current ?? DB::table('forecasts')->where('region_code', $region)->max('fetched_at');
        $fetchedAt = $latest ? Carbon::parse($latest, 'UTC')->toIso8601String() : null;
        if ($current && Carbon::parse($current, 'UTC')->gte(now()->subHours(6))) {
            return ['state' => 'FRESH', 'fetched_at' => $fetchedAt];
        }

        $state = Cache::get(self::key($region));
        if ($state === null && $refresh && config('disaster.sources_enabled')
            && DB::table('sources')->where('slug', 'bmkg-weather')->where('enabled', true)->exists()) {
            $state = Cache::lock('weather-request-budget', 5)->get(function () use ($region) {
                if (RateLimiter::tooManyAttempts('weather-request-budget', 8)) {
                    return 'BUSY';
                }
                if (! Cache::add(self::key($region), 'QUEUED', 300)) {
                    return Cache::get(self::key($region));
                }
                RateLimiter::hit('weather-request-budget', 60);
                try {
                    FetchRegionalWeatherJob::dispatch($region);

                    return Cache::get(self::key($region), 'QUEUED');
                } catch (\Throwable) {
                    self::mark($region, 'FAILED');

                    return 'FAILED';
                }
            }) ?: 'BUSY';
        }

        return ['state' => $state ?? ($latest ? 'STALE' : 'UNAVAILABLE'), 'fetched_at' => $fetchedAt];
    }

    public static function mark(string $region, string $state): void
    {
        Cache::put(self::key($region), $state, 600);
    }

    public static function key(string $region): string
    {
        return 'weather-region:'.$region;
    }
}
