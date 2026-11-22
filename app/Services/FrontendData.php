<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class FrontendData
{
    public function __construct(private PublicData $publicData) {}

    /** @return array<string, mixed> */
    public function overview(string $region = '31.75.03.1001'): array
    {
        return [
            'events' => $this->records('disaster_events', 'event', 30),
            'alerts' => $this->records('official_alerts', 'alert', 50),
            'active_alert_count' => $this->publicData->activeAlerts(DB::table('official_alerts'))->count(),
            'sources' => DB::table('sources')->orderBy('id')->pluck('id')->map(fn (int $id) => $this->publicData->source($id))->all(),
            'forecasts' => DB::table('forecasts')->where('region_code', $region)->where('expires_at', '>', now())->orderBy('forecast_at')->limit(80)->get()->map(fn (\stdClass $row) => $this->publicData->record($row, 'forecast'))->all(),
            'region' => $region,
            'regions' => ['31.75.03.1001' => 'Kampung Melayu', '31.75.03.1002' => 'Bidara Cina'],
            'hazards' => DB::table('hazard_types')->orderBy('id')->get()->all(),
            'layers' => DB::table('hazard_layers')->where('publication_approved', true)->get()->map($this->historicalLayer(...))->all(),
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    private function historicalLayer(\stdClass $layer): array
    {
        $url = rtrim($layer->layer_url, '/');
        $tiles = preg_match('~\Ahttps://gis\.bnpb\.go\.id/server/rest/services/inarisk/[A-Za-z0-9_]+/ImageServer\z~', $url) === 1
            ? $url.'/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&f=image'
            : null;

        return (array) $layer + ['tile_template' => $tiles];
    }

    /** @return list<array<string, mixed>> */
    private function records(string $table, string $kind, int $limit): array
    {
        return array_values(DB::table($table)->orderByDesc('source_time')->limit($limit)->get()->map(fn (\stdClass $row) => $this->publicData->record($row, $kind))->all());
    }
}
