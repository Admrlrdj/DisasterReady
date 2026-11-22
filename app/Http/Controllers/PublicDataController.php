<?php

namespace App\Http\Controllers;

use App\Services\Integrations\RegionalWeather;
use App\Services\Integrations\WeatherRegions;
use App\Services\PublicData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicDataController extends Controller
{
    public function overview(PublicData $data): JsonResponse
    {
        return response()->json([
            'events' => DB::table('disaster_events')->orderByDesc('source_time')->limit(10)->get()->map(fn (object $row) => $data->record($row, 'event')),
            'alerts' => DB::table('official_alerts')->orderByDesc('source_time')->limit(10)->get()->map(fn (object $row) => $data->record($row, 'alert')),
            'sources' => DB::table('sources')->orderBy('id')->pluck('id')->map(fn (int $id) => $data->source($id)),
        ]);
    }

    public function events(Request $request, PublicData $data): JsonResponse
    {
        return $this->listing($request, $data, 'disaster_events', 'event');
    }

    public function alerts(Request $request, PublicData $data): JsonResponse
    {
        return $this->listing($request, $data, 'official_alerts', 'alert');
    }

    public function weather(Request $request, PublicData $data, RegionalWeather $weather): JsonResponse
    {
        $request->validate(['region' => ['required', WeatherRegions::RULE]]);

        $payload = $this->listing($request, $data, 'forecasts', 'forecast')->getData(true);
        $payload['region_status'] = $weather->status($request->string('region')->toString());

        return response()->json($payload);
    }

    public function regions(Request $request, WeatherRegions $regions): JsonResponse
    {
        $query = $request->validate(['q' => ['required', 'string', 'min:2', 'max:100']]);

        return response()->json(['data' => $regions->search($query['q']), 'catalogue_year' => 2022]);
    }

    public function event(int $id, PublicData $data): JsonResponse
    {
        $row = DB::table('disaster_events')->where('id', $id)->first();
        abort_unless($row !== null, 404);

        return response()->json(['data' => $data->record($row, 'event')]);
    }

    public function alert(int $id, PublicData $data): JsonResponse
    {
        $row = DB::table('official_alerts')->where('id', $id)->first();
        abort_unless($row !== null, 404);

        return response()->json(['data' => $data->record($row, 'alert')]);
    }

    private function listing(Request $request, PublicData $data, string $table, string $kind): JsonResponse
    {
        $input = $request->validate(['hazard' => ['sometimes', 'exists:hazard_types,slug'], 'per_page' => ['sometimes', 'integer', 'between:1,100'], 'status' => ['sometimes', 'in:active'], 'current' => ['sometimes', 'boolean']]);
        $query = DB::table($table)->orderByDesc('source_time');
        if ($kind === 'alert' && isset($input['status'])) {
            $data->activeAlerts($query);
        }
        if (isset($input['hazard'])) {
            $query->where('hazard_type_id', DB::table('hazard_types')->where('slug', $input['hazard'])->value('id'));
        }
        if ($table === 'forecasts') {
            $region = $request->string('region')->toString();
            if ($request->boolean('current')) {
                $data->currentForecasts($query, $region)->reorder('forecast_at');
            } else {
                $query->where('region_code', $region);
            }
        }
        $page = $query->orderByDesc('id')->paginate((int) ($input['per_page'] ?? 20))->withQueryString();
        $page->setCollection($page->getCollection()->map(fn (\stdClass $row) => $data->record($row, $kind)));

        return response()->json($page);
    }

    public function guides(string $hazard): JsonResponse
    {
        $hazardId = DB::table('hazard_types')->where('slug', $hazard)->value('id');
        abort_unless($hazardId, 404);

        return response()->json(['data' => DB::table('preparedness_guides')->where('hazard_type_id', $hazardId)->where('published', true)->whereNotNull('reviewed_at')->get()->map(function (\stdClass $row) {
            foreach (['checklist', 'family_plan', 'emergency_contacts'] as $field) {
                $row->{$field} = $row->{$field} === null ? [] : json_decode($row->{$field}, true, 512, JSON_THROW_ON_ERROR);
            }

            return $row;
        })]);
    }

    public function layers(): JsonResponse
    {
        return response()->json(['kind' => 'historical_modelled_risk', 'data' => DB::table('hazard_layers')->where('publication_approved', true)->get()]);
    }

    public function map(Request $request, PublicData $data): JsonResponse
    {
        $input = $request->validate(['bbox' => ['required', 'array', 'size:4'], 'bbox.*' => ['required', 'numeric'], 'kind' => ['required', 'in:event,alert,forecast'], 'limit' => ['sometimes', 'integer', 'between:1,200'], 'hazard' => ['sometimes', 'exists:hazard_types,slug'], 'region' => ['sometimes', 'regex:/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/'], 'status' => ['sometimes', 'in:active']]);
        [$west, $south, $east, $north] = array_map('floatval', $input['bbox']);
        abort_if($west < -180 || $east > 180 || $south < -90 || $north > 90 || $west >= $east || $south >= $north || $east - $west > 60 || $north - $south > 40, 422, 'Bbox tidak valid atau terlalu luas.');
        abort_unless(DB::getDriverName() === 'pgsql', 503, 'POSTGIS_REQUIRED');
        $table = match ($input['kind']) {
            'event' => 'disaster_events', 'alert' => 'official_alerts', 'forecast' => 'forecasts', default => throw new \InvalidArgumentException('UNKNOWN_MAP_KIND')
        };
        $query = DB::table($table)->whereRaw('geom && ST_MakeEnvelope(?,?,?,?,4326)', [$west, $south, $east, $north]);
        if ($input['kind'] === 'alert' && isset($input['status'])) {
            $data->activeAlerts($query);
        }
        if ($input['kind'] === 'forecast' && isset($input['region'])) {
            $data->currentForecasts($query, $input['region'])->reorder('forecast_at');
        }
        if (isset($input['hazard'])) {
            $query->where('hazard_type_id', DB::table('hazard_types')->where('slug', $input['hazard'])->value('id'));
        }
        $limit = (int) ($input['limit'] ?? 100);
        $regionalForecast = $input['kind'] === 'forecast' && isset($input['region']);
        $rows = $query->select('*')->selectRaw('ST_AsGeoJSON(geom) AS geojson')->orderByDesc('source_time')->orderBy('id')->limit($regionalForecast ? 1 : $limit + 1)->get();

        return response()->json(['type' => 'FeatureCollection', 'truncated' => $rows->count() > $limit, 'features' => $rows->take($limit)->map(fn (object $row) => ['type' => 'Feature', 'geometry' => json_decode($row->geojson, true, 512, JSON_THROW_ON_ERROR), 'properties' => $data->record($row, $input['kind'])])->values()]);
    }
}
