<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Integrations\BmkgAdapter;
use App\Services\Integrations\IngestSource;
use Database\Seeders\DisasterSourceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class IngestionTest extends TestCase
{
    use RefreshDatabase;

    private function earthquake(): string
    {
        return json_encode(['Infogempa' => ['gempa' => ['DateTime' => now()->subHour()->toIso8601String(), 'Coordinates' => '-6.2,106.8', 'Magnitude' => '5.1', 'Wilayah' => 'SINTETIS pengujian', 'Potensi' => 'Fixture sintetis, bukan peringatan']]], JSON_THROW_ON_ERROR);
    }

    public function test_ingestion_retry_deduplicates_and_exposes_stale_state(): void
    {
        Cache::flush();
        $this->seed(DisasterSourceSeeder::class);
        config(['disaster.sources_enabled' => true]);
        DB::table('sources')->where('slug', 'bmkg-earthquake')->update(['enabled' => true]);
        $id = DB::table('sources')->where('slug', 'bmkg-earthquake')->value('id');
        Http::fake(['*' => Http::response($this->earthquake())]);
        app(IngestSource::class)->handle($id);
        app(IngestSource::class)->handle($id);
        $this->assertDatabaseCount('disaster_events', 1);
        $this->assertDatabaseCount('ingestion_runs', 2);
        $this->getJson('/data/events')->assertOk()->assertJsonPath('data.0.kind', 'event')->assertJsonPath('data.0.source.freshness', 'FRESH');
        $this->travel(2)->hours();
        $this->getJson('/data/events')->assertJsonPath('data.0.source.freshness', 'STALE');
    }

    public function test_source_failure_is_sanitized_and_preserves_snapshot(): void
    {
        Cache::flush();
        $this->seed(DisasterSourceSeeder::class);
        config(['disaster.sources_enabled' => true]);
        DB::table('sources')->where('slug', 'bmkg-earthquake')->update(['enabled' => true]);
        $id = DB::table('sources')->where('slug', 'bmkg-earthquake')->value('id');
        Http::fake(['*' => Http::response('invalid secret payload')]);
        try {
            app(IngestSource::class)->handle($id);
            $this->fail('Invalid payload must fail.');
        } catch (\RuntimeException $e) {
            $this->assertSame('SOURCE_INGESTION_FAILED', $e->getMessage());
        }
        $this->assertDatabaseHas('ingestion_runs', ['status' => 'FAILED', 'error_code' => 'SOURCE_FETCH_OR_SCHEMA_FAILURE']);
        $this->getJson('/data/overview')->assertJsonPath('sources.0.freshness', 'FAILED');
    }

    public function test_earthquake_feeds_merge_with_existing_event_even_when_one_feed_fails(): void
    {
        Cache::flush();
        $this->seed(DisasterSourceSeeder::class);
        config(['disaster.sources_enabled' => true]);
        $source = DB::table('sources')->where('slug', 'bmkg-earthquake');
        $source->update(['enabled' => true]);
        $id = $source->value('id');
        $fixture = json_decode($this->earthquake(), true, 512, JSON_THROW_ON_ERROR);
        $record = $fixture['Infogempa']['gempa'];
        $legacy = app(BmkgAdapter::class)->earthquake($this->earthquake());
        $legacy[0]['external_id'] = hash('sha256', $record['DateTime'].'|'.$record['Coordinates']);
        app(IngestSource::class)->persist($id, $legacy);
        $legacyId = DB::table('disaster_events')->value('id');
        $felt = $record;
        $felt['Coordinates'] = '-6.2000,106.800';
        $felt['Dirasakan'] = 'SINTETIS II MMI';
        $another = array_replace($felt, ['Coordinates' => '-7.25,110.4']);
        Http::fake([
            '*gempaterkini.json' => Http::response('', 503),
            '*gempadirasakan.json' => Http::response(['Infogempa' => ['gempa' => [$felt, $another]]]),
            '*autogempa.json' => Http::response($fixture),
        ]);

        app(IngestSource::class)->handle($id);
        app(IngestSource::class)->handle($id);

        $this->assertDatabaseCount('disaster_events', 2);
        $this->assertDatabaseHas('ingestion_runs', ['status' => 'PARTIAL', 'error_code' => 'EARTHQUAKE_FEED_PARTIAL', 'count' => 2]);
        $this->getJson('/data/events/'.$legacyId)->assertOk()->assertJsonPath('data.data.Dirasakan', 'SINTETIS II MMI')->assertJsonPath('data.data.Potensi', $record['Potensi'])->assertJsonPath('data.source.freshness', 'PARTIAL');
    }

    public function test_cap_namespace_polygon_and_expiry_are_preserved(): void
    {
        $xml = '<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>synthetic-cap</identifier><status>Actual</status><scope>Public</scope><msgType>Alert</msgType><sent>2026-01-01T01:00:00Z</sent><info><language>id-ID</language><effective>2026-01-01T01:00:00Z</effective><expires>2026-01-01T04:00:00Z</expires><severity>Moderate</severity><certainty>Likely</certainty><headline>SINTETIS</headline><description>Fixture sintetis</description><area><polygon>-6,106 -6,107 -7,107 -6,106</polygon></area></info></alert>';
        $rows = app(BmkgAdapter::class)->cap($xml, 'https://www.bmkg.go.id/alerts/nowcast/id/synthetic_alert.xml');
        $this->assertCount(1, $rows);
        $this->assertSame([106.0, -6.0], $rows[0]['geometry_json']['coordinates'][0][0][0]);
        $this->seed(DisasterSourceSeeder::class);
        $id = DB::table('sources')->where('slug', 'bmkg-cap')->value('id');
        $rows[0]['synthetic'] = true;
        app(IngestSource::class)->persist($id, $rows);
        $this->getJson('/data/alerts')->assertOk()->assertJsonPath('data.0.expired', true)->assertJsonPath('data.0.synthetic', true);
    }

    public function test_xml_entities_are_rejected(): void
    {
        $this->expectException(\RuntimeException::class);
        app(BmkgAdapter::class)->cap('<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><alert/>', 'https://www.bmkg.go.id/');
    }

    public function test_well_formed_non_rss_payload_is_not_a_successful_empty_feed(): void
    {
        Cache::flush();
        Http::fake(['*' => Http::response('<html><body>Unavailable</body></html>')]);
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('INVALID_RSS');
        app(BmkgAdapter::class)->fetch('bmkg-cap');
    }

    public function test_cap_cancellation_supersedes_referenced_alert_without_all_clear(): void
    {
        $this->seed(DisasterSourceSeeder::class);
        $source = DB::table('sources')->where('slug', 'bmkg-cap')->value('id');
        $service = app(IngestSource::class);
        $service->persist($source, [['kind' => 'alert', 'hazard' => 'extreme_weather', 'external_id' => 'synthetic-original', 'title' => 'SINTETIS', 'source_url' => 'https://www.bmkg.go.id/', 'source_time' => now()->subHour(), 'effective_at' => now()->subHour(), 'expires_at' => now()->addHour(), 'severity' => 'Moderate', 'certainty' => 'Likely', 'payload_json' => [], 'synthetic' => true]]);
        $xml = '<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2"><identifier>synthetic-cancel</identifier><status>Actual</status><scope>Public</scope><msgType>Cancel</msgType><sent>'.now()->toIso8601String().'</sent><references>sender,synthetic-original,2026-01-01T00:00:00Z</references></alert>';
        $rows = app(BmkgAdapter::class)->cap($xml, 'https://www.bmkg.go.id/alerts/nowcast/id/synthetic_alert.xml');
        $rows[0]['synthetic'] = true;
        $service->persist($source, $rows);
        $service->persist($source, $rows);
        $this->assertDatabaseCount('official_alerts', 2);
        $response = $this->getJson('/data/alerts')->assertOk();
        $response->assertJsonPath('data.0.alert_state', 'CANCELLED')->assertJsonPath('data.1.alert_state', 'SUPERSEDED');
    }

    public function test_weather_parser_keeps_forecast_time_and_does_not_infer_flood(): void
    {
        $rows = app(BmkgAdapter::class)->weather(json_encode(['data' => [['lokasi' => ['adm4' => '31.71.03.1001', 'lat' => -6.1, 'lon' => 106.8], 'cuaca' => [[['utc_datetime' => '2026-11-22 12:00:00', 'analysis_date' => '2026-11-22T00:00:00', 'weather_desc' => 'SINTETIS hujan']]]]]], JSON_THROW_ON_ERROR));
        $this->assertSame('forecast', $rows[0]['kind']);
        $this->assertNull($rows[0]['hazard']);
        $this->assertSame('2026-11-22T12:00:00+00:00', $rows[0]['forecast_at']->toIso8601String());
    }

    public function test_admin_access_guide_audit_and_unapproved_layers(): void
    {
        $this->seed(DisasterSourceSeeder::class);
        $this->getJson('/data/layers')->assertOk()->assertJsonCount(0, 'data');
        $this->actingAs(User::factory()->create())->getJson('/admin/sources')->assertForbidden();
        $this->actingAs(User::factory()->create(['role' => 'admin']))->postJson('/admin/guides', ['hazard_type_id' => 1, 'title' => 'Panduan uji', 'content' => 'SINTETIS, jangan dipakai sebagai panduan darurat.', 'official_reference' => 'https://www.bnpb.go.id/', 'reviewed_at' => now()->subMinute()->toIso8601String(), 'published' => true])->assertCreated();
        $this->assertDatabaseCount('audit_logs', 1);
        $this->getJson('/data/preparedness/flood')->assertJsonCount(1, 'data');
        $this->getJson('/data/map?kind=event&bbox[]=106&bbox[]=-7&bbox[]=108&bbox[]=-5')->assertStatus(503);
    }
}
