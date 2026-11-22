<?php

namespace App\Services\Integrations;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class IngestSource
{
    public function __construct(private BmkgAdapter $adapter) {}

    public function handle(int $sourceId): void
    {
        Cache::lock('ingest-source:'.$sourceId, 1200)->block(1, function () use ($sourceId) {
            $source = DB::table('sources')->where('id', $sourceId)->first();
            if (! $source || ! $source->enabled || ! config('disaster.sources_enabled')) {
                return;
            }
            $run = DB::table('ingestion_runs')->insertGetId(['source_id' => $sourceId, 'status' => 'RUNNING', 'started_at' => now()]);
            try {
                $regions = $source->slug === 'bmkg-weather' ? config('disaster.weather_regions') : [null];
                if (! $regions) {
                    throw new \RuntimeException('REGIONS_NOT_CONFIGURED');
                }
                $records = [];
                $partial = false;
                if ($source->slug === 'bmkg-earthquake') {
                    ['records' => $records, 'partial' => $partial] = $this->adapter->earthquakes();
                } else {
                    foreach ($regions as $region) {
                        $records = array_merge($records, $this->adapter->fetch($source->slug, $region));
                    }
                }
                DB::transaction(function () use ($records, $sourceId, $run, $partial) {
                    DB::table('sources')->where('id', $sourceId)->lockForUpdate()->first();
                    $this->persist($sourceId, $records, $run);
                    DB::table('sources')->where('id', $sourceId)->update(['sync_status' => $partial ? 'PARTIAL' : 'OK', 'last_success_at' => now(), 'updated_at' => now()]);
                    DB::table('ingestion_runs')->where('id', $run)->update(['status' => $partial ? 'PARTIAL' : 'COMPLETED', 'error_code' => $partial ? 'EARTHQUAKE_FEED_PARTIAL' : null, 'count' => count($records), 'finished_at' => now()]);
                });
            } catch (\Throwable) {
                DB::table('sources')->where('id', $sourceId)->update(['sync_status' => 'FAILED', 'updated_at' => now()]);
                DB::table('ingestion_runs')->where('id', $run)->update(['status' => 'FAILED', 'error_code' => 'SOURCE_FETCH_OR_SCHEMA_FAILURE', 'finished_at' => now()]);
                throw new \RuntimeException('SOURCE_INGESTION_FAILED');
            }
        });
    }

    /** @param list<array<string, mixed>> $records */
    public function persist(int $sourceId, array $records, ?int $runId = null): void
    {
        foreach ($records as $record) {
            $table = match ($record['kind']) {
                'event' => 'disaster_events', 'alert' => 'official_alerts', 'forecast' => 'forecasts', default => throw new \InvalidArgumentException('UNKNOWN_RECORD_TYPE')
            };
            $record['hazard_type_id'] = $record['hazard'] ? DB::table('hazard_types')->where('slug', $record['hazard'])->value('id') : null;
            unset($record['kind'], $record['hazard']);
            $payload = $record['payload_json'];
            if (isset($record['geometry_json'])) {
                $record['geometry_json'] = json_encode($record['geometry_json'], JSON_THROW_ON_ERROR);
            }
            $record['fetched_at'] = now();
            $externalId = $record['external_id'];
            unset($record['external_id']);
            $existing = DB::table($table)->where('source_id', $sourceId)->where('external_id', $externalId)->first();
            if ($table === 'forecasts' && $runId !== null) {
                if (($existing->ingestion_run_id ?? 0) > $runId) {
                    continue;
                }
                $record['ingestion_run_id'] = $runId;
            }
            if ($table === 'disaster_events' && $record['latitude'] !== null && $record['longitude'] !== null) {
                $existing ??= DB::table($table)->where('source_id', $sourceId)->where('source_time', $record['source_time'])->where('latitude', $record['latitude'])->where('longitude', $record['longitude'])->first();
                if ($existing) {
                    $externalId = $existing->external_id;
                    $payload += json_decode($existing->payload_json, true, 512, JSON_THROW_ON_ERROR);
                    $record['message'] ??= $existing->message;
                }
            }
            $record['payload_json'] = json_encode($payload, JSON_THROW_ON_ERROR);
            if ($existing && CarbonImmutable::parse($existing->source_time)->greaterThan(CarbonImmutable::parse($record['source_time']))) {
                continue;
            }
            $references = $record['references_json'] ?? [];
            if ($table === 'official_alerts') {
                $record['references_json'] = json_encode($references, JSON_THROW_ON_ERROR);
            }
            DB::table($table)->updateOrInsert(['source_id' => $sourceId, 'external_id' => $externalId], $record);
            if ($table === 'official_alerts' && in_array($record['message_type'] ?? 'Alert', ['Update', 'Cancel'], true)) {
                DB::table('official_alerts')->where('source_id', $sourceId)->whereIn('external_id', $references)->update(['superseded_at' => $record['source_time']]);
            }
        }
    }
}
