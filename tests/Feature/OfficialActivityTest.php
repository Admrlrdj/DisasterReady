<?php

namespace Tests\Feature;

use App\Services\Integrations\IngestSource;
use App\Services\VolcanoSnapshot;
use Carbon\CarbonImmutable;
use Database\Seeders\DisasterSourceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OfficialActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_latest_activity_mixes_public_sources_and_limits_the_result(): void
    {
        Http::preventStrayRequests();
        $this->seed(DisasterSourceSeeder::class);
        $reports = collect(app(VolcanoSnapshot::class)->snapshot()['volcanoes'])->pluck('report')->filter();
        $this->travelTo(CarbonImmutable::parse($reports->max('observed_until'))->addHour());

        $ingest = app(IngestSource::class);
        $earthquake = DB::table('sources')->where('slug', 'bmkg-earthquake')->value('id');
        $cap = DB::table('sources')->where('slug', 'bmkg-cap')->value('id');
        $event = [
            'kind' => 'event', 'hazard' => 'earthquake', 'external_id' => 'official-test-event',
            'title' => 'Gempa fixture', 'source_url' => 'https://data.bmkg.go.id/gempabumi/',
            'source_time' => now()->subMinutes(2), 'latitude' => -6.2, 'longitude' => 107, 'payload_json' => [],
        ];
        $alert = [
            'kind' => 'alert', 'hazard' => 'extreme_weather', 'external_id' => 'official-test-alert',
            'title' => 'Peringatan fixture', 'source_url' => 'https://www.bmkg.go.id/',
            'source_time' => now()->subMinutes(4), 'effective_at' => now()->subMinutes(3),
            'expires_at' => now()->addHour(), 'severity' => 'Moderate', 'certainty' => 'Likely', 'payload_json' => [],
        ];
        $ingest->persist($earthquake, [$event, array_replace($event, [
            'external_id' => 'synthetic-event', 'source_time' => now(), 'synthetic' => true,
        ])]);
        $ingest->persist($cap, [$alert, array_replace($alert, [
            'external_id' => 'expired-alert', 'source_time' => now()->subMinute(),
            'effective_at' => now()->subMinute(), 'expires_at' => now(),
        ]), array_replace($alert, [
            'external_id' => 'upcoming-alert', 'source_time' => now(), 'effective_at' => now()->addMinute(),
        ])]);

        $this->getJson('/data/activity')->assertOk()->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.kind', 'event')->assertJsonPath('data.0.href', '/events/1')
            ->assertJsonPath('data.1.kind', 'alert')->assertJsonPath('data.1.href', '/alerts/1')
            ->assertJsonPath('data.2.kind', 'volcano')->assertJsonPath('data.2.source', 'PVMBG · MAGMA');

        $this->travel(2)->days();
        $this->getJson('/data/activity')->assertOk()->assertExactJson(['data' => []]);
    }
}
