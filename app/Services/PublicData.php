<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class PublicData
{
    public function currentForecasts(Builder $query, string $region): Builder
    {
        $batch = DB::table('forecasts')->where('region_code', $region)->max('ingestion_run_id');

        return $query->where('region_code', $region)->where('expires_at', '>', now())
            ->when($batch !== null, fn (Builder $query) => $query->where('ingestion_run_id', $batch));
    }

    public function activeAlerts(Builder $query): Builder
    {
        return $query->where('official_alerts.message_type', '!=', 'Cancel')->whereNull('official_alerts.superseded_at')
            ->where('official_alerts.effective_at', '<=', now())->where('official_alerts.expires_at', '>', now());
    }

    /** @var array<int, array<string, mixed>> */
    private array $sources = [];

    /** @return array<string, mixed> */
    public function source(int $id): array
    {
        if (isset($this->sources[$id])) {
            return $this->sources[$id];
        }
        $source = DB::table('sources')->where('id', $id)->first();
        abort_unless($source !== null, 404);
        $state = $source->sync_status === 'FAILED' ? 'FAILED' : ($source->last_success_at === null ? 'UNAVAILABLE' : (CarbonImmutable::parse($source->last_success_at)->addSeconds($source->freshness_sla)->isPast() ? 'STALE' : 'FRESH'));

        if ($state === 'FRESH' && $source->sync_status === 'PARTIAL') {
            $state = 'PARTIAL';
        }

        return $this->sources[$id] = ['id' => $source->id, 'name' => $source->name, 'agency' => $source->agency, 'attribution' => $source->attribution, 'last_success_at' => $source->last_success_at, 'sync_status' => $source->sync_status, 'freshness' => $state, 'source_url' => $source->endpoint];
    }

    /** @return array<string, mixed> */
    public function record(\stdClass $row, string $kind): array
    {
        $state = $this->source($row->source_id);
        $expired = $row->expires_at !== null && CarbonImmutable::parse($row->expires_at)->lessThanOrEqualTo(now());
        $alertState = null;
        if ($kind === 'alert') {
            $alertState = $row->message_type === 'Cancel' ? 'CANCELLED' : ($row->superseded_at !== null ? 'SUPERSEDED' : ($expired ? 'EXPIRED' : (CarbonImmutable::parse($row->effective_at)->isFuture() ? 'UPCOMING' : 'ACTIVE')));
        }

        return ['id' => $row->id, 'kind' => $kind, 'title' => $row->title, 'message' => $row->message,
            'source' => $state, 'source_url' => $row->source_url, 'source_time' => CarbonImmutable::parse($row->source_time)->toIso8601String(),
            'fetched_at' => CarbonImmutable::parse($row->fetched_at)->toIso8601String(), 'expires_at' => $row->expires_at ? CarbonImmutable::parse($row->expires_at)->toIso8601String() : null,
            'expired' => $expired, 'synthetic' => (bool) $row->synthetic, 'hazard_type_id' => $row->hazard_type_id,
            'alert_state' => $alertState,
            'forecast_at' => $kind === 'forecast' ? CarbonImmutable::parse($row->forecast_at)->toIso8601String() : null,
            'data' => json_decode($row->payload_json, true, 512, JSON_THROW_ON_ERROR)];
    }
}
