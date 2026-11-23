<?php

namespace Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class TsunamiMapTest extends TestCase
{
    public static function bulletins(): array
    {
        return [
            'recent warning' => ['20261123135500', 'PD-2', 1],
            'ended warning' => ['20261123135500', 'PD-4', 0],
            'old bulletin' => ['20261123123000', 'PD-2', 0],
        ];
    }

    #[DataProvider('bulletins')]
    public function test_only_recent_non_ending_bulletins_show_a_point(string $id, string $stage, int $count): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-23 14:00:00', 'Asia/Jakarta'));
        Http::fake(['https://cdn.bmkg.go.id/*' => Http::response(
            <<<XML
            <alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
                <status>Actual</status>
                <info>
                    <eventid>{$id}</eventid><subject>Warning Tsunami {$stage}</subject>
                    <headline>Buletin tsunami BMKG</headline><area>NTT</area>
                    <point><coordinates>121.39,-8.41</coordinates></point>
                    <wzarea><level>SIAGA</level></wzarea><wzarea><level>AMAN</level></wzarea>
                </info>
            </alert>
            XML
        )]);

        $response = $this->getJson('/data/map/tsunami')->assertOk()->assertJsonCount($count, 'features');
        if ($count === 1) {
            $response->assertJsonPath('features.0.geometry.coordinates', [121.39, -8.41]);
        }
    }
}
