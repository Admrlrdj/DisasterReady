<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FloodMapTest extends TestCase
{
    public function test_only_recent_public_reports_and_recent_genangan_reach_the_map(): void
    {
        $this->travelTo(now()->setTime(14, 0));
        $report = [
            'geometry' => ['type' => 'Point', 'coordinates' => [106.8, -6.2]],
            'properties' => [
                'pkey' => 1, 'created_at' => now()->subHour()->toIso8601String(),
                'is_training' => false, 'disaster_type' => 'flood',
                'text' => 'Raw citizen text',
            ],
        ];
        $area = [
            'geometry' => ['type' => 'Polygon', 'coordinates' => [[[106.8, -6.2], [106.9, -6.2], [106.8, -6.3], [106.8, -6.2]]]],
            'properties' => ['area_id' => 1, 'last_updated' => now()->subHour()->toIso8601String(), 'state' => 2],
        ];
        Http::fake([
            'https://api.petabencana.id/reports*' => Http::response(['result' => [
                'type' => 'FeatureCollection', 'features' => [
                    $report,
                    array_replace_recursive($report, ['properties' => ['pkey' => 2, 'created_at' => now()->subHours(24)->toIso8601String()]]),
                    array_replace_recursive($report, ['properties' => ['pkey' => 3, 'is_training' => true]]),
                ],
            ]]),
            'https://data.petabencana.id/floods*' => Http::response(['result' => [
                'type' => 'FeatureCollection', 'features' => [
                    $area,
                    array_replace_recursive($area, ['properties' => ['area_id' => 2, 'last_updated' => now()->subHours(6)->toIso8601String()]]),
                ],
            ]]),
        ]);

        $this->getJson('/data/flood/flood-report')->assertOk()->assertJsonCount(1, 'features')
            ->assertJsonPath('features.0.properties.id', 1)
            ->assertJsonMissingPath('features.0.properties.text');
        $this->getJson('/data/flood/flood-area')->assertOk()->assertJsonCount(1, 'features')
            ->assertJsonPath('features.0.properties.kind', 'flood-area');
    }

    public function test_upstream_failure_is_not_reported_as_an_empty_map(): void
    {
        Http::fake(['https://api.petabencana.id/reports*' => Http::response([], 500)]);

        $this->getJson('/data/flood/flood-report')->assertServiceUnavailable();
    }
}
