<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Carbon\Exceptions\InvalidFormatException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class FloodMapController extends Controller
{
    public function __invoke(string $feed): JsonResponse
    {
        $reports = $feed === 'flood-report';
        $url = $reports ? 'https://api.petabencana.id/reports' : 'https://data.petabencana.id/floods';
        $query = $reports
            ? ['disaster' => 'flood', 'timeperiod' => 86400]
            : ['admin' => 'ID-JK', 'minimum_state' => 1];

        try {
            $data = Cache::remember('flood-map:'.$feed, 60, function () use ($url, $query) {
                $result = Http::acceptJson()->withUserAgent('DisasterReady/1.0')->withoutRedirecting()
                    ->connectTimeout(3)->timeout(8)->get($url, $query + ['geoformat' => 'geojson'])
                    ->throw()->json('result');
                abort_unless(is_array($result) && ($result['type'] ?? null) === 'FeatureCollection'
                    && is_array($result['features'] ?? null), 503, 'Data PetaBencana tidak tersedia.');

                $features = [];
                foreach ($result['features'] as $feature) {
                    if (is_array($feature['properties'] ?? null) && is_array($feature['geometry'] ?? null)) {
                        $features[] = [
                            'properties' => Arr::only($feature['properties'], ['pkey', 'area_id', 'created_at', 'last_updated', 'is_training', 'disaster_type', 'state']),
                            'geometry' => Arr::only($feature['geometry'], ['type', 'coordinates']),
                        ];
                    }
                }

                return ['features' => $features, 'fetched_at' => now()->toIso8601String()];
            });
        } catch (ConnectionException|RequestException) {
            abort(503, 'Data PetaBencana tidak tersedia.');
        }

        $features = [];
        $now = CarbonImmutable::now();
        foreach ($data['features'] as $feature) {
            $properties = $feature['properties'] ?? [];
            $geometry = $feature['geometry'] ?? null;
            $id = filter_var($properties[$reports ? 'pkey' : 'area_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            $timestamp = $properties[$reports ? 'created_at' : 'last_updated'] ?? null;
            if ($id === false || ! is_string($timestamp) || ! preg_match('/^\d{4}-\d{2}-\d{2}T/', $timestamp)
                || ! is_array($geometry) || ! is_array($geometry['coordinates'] ?? null)) {
                continue;
            }
            if ($reports && (($properties['is_training'] ?? null) !== false || ($properties['disaster_type'] ?? null) !== 'flood'
                || ($geometry['type'] ?? null) !== 'Point')) {
                continue;
            }
            if (! $reports && (! in_array($geometry['type'] ?? null, ['Polygon', 'MultiPolygon'], true)
                || ! in_array($properties['state'] ?? null, [1, 2, 3, 4, '1', '2', '3', '4'], true))) {
                continue;
            }

            try {
                $updated = CarbonImmutable::parse($timestamp);
            } catch (InvalidFormatException) {
                continue;
            }
            $expires = $updated->addHours($reports ? 24 : 6);
            if ($updated > $now || $expires <= $now) {
                continue;
            }

            $features[$id] = [
                'type' => 'Feature',
                'geometry' => $geometry,
                'properties' => [
                    'id' => $id,
                    'kind' => $feed,
                    'title' => $reports ? 'Laporan banjir warga' : 'Area genangan Jakarta',
                    'source_time' => $updated->toIso8601String(),
                    'fetched_at' => $data['fetched_at'],
                    'expires_at' => $expires->toIso8601String(),
                    'source_url' => 'https://petabencana.id/',
                ],
            ];
        }

        return response()->json(['type' => 'FeatureCollection', 'features' => array_values($features), 'truncated' => false]);
    }
}
