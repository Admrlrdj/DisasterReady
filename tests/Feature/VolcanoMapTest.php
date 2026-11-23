<?php

namespace Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class VolcanoMapTest extends TestCase
{
    public function test_recent_eruptions_and_elevated_activity_use_separate_magma_sources(): void
    {
        $this->travelTo(CarbonImmutable::parse('2026-11-23T16:00:00+07:00'));
        $base = 'https://magma.esdm.go.id/v1/gunung-api/';
        $eruption = $base.'informasi-letusan/45c3cd2f-e70d-11f1-a61d-005056b54356/show';
        $old = $base.'informasi-letusan/45c3cd2e-e70d-11f1-a61d-005056b54356/show';
        $report = $base.'laporan/123?signature=abc';
        Http::preventStrayRequests();
        Http::fake([
            $base.'informasi-letusan' => Http::response(<<<HTML
                <div class="timeline-item">
                  <p class="timeline-title"><a>Ibu</a></p>
                  <p class="timeline-text">Terjadi erupsi G. Ibu pada hari Senin, 23 November 2026, pukul 16:12 WIT.</p>
                  <a href="{$eruption}">Details</a>
                </div>
                <div class="timeline-item">
                  <p class="timeline-title"><a>Dukono</a></p>
                  <p class="timeline-text">Terjadi erupsi G. Dukono pada hari Minggu, 22 November 2026, pukul 10:00 WIT.</p>
                  <a href="{$old}">Details</a>
                </div>
                HTML),
            $base.'tingkat-aktivitas' => Http::response(<<<HTML
                <table><tbody>
                  <tr><td rowspan="1"><a>Level IV (Awas)</a></td><td>0</td></tr>
                  <tr><td rowspan="1"><a>Level III (Siaga)</a></td><td>0</td></tr>
                  <tr><td rowspan="2"><a>Level II (Waspada)</a></td><td>1</td></tr>
                  <tr><td>Ibu - Maluku Utara <a href="{$report}">Lihat laporan</a></td></tr>
                  <tr><td rowspan="2"><a>Level I (Normal)</a></td><td>1</td></tr>
                  <tr><td>Agung - Bali <a href="{$base}laporan/999?signature=def">Lihat laporan</a></td></tr>
                </tbody></table>
                HTML),
            $eruption => Http::response('<script>L.marker([1.488,127.63], {});</script>'),
        ]);

        $this->getJson('/data/map/volcano/event')->assertOk()->assertJsonCount(1, 'features')
            ->assertJsonPath('features.0.properties.source_time', '2026-11-23T07:12:00+00:00')
            ->assertJsonPath('features.0.properties.source_url', $eruption)
            ->assertJsonPath('features.0.geometry.coordinates', [127.63, 1.488]);
        $this->getJson('/data/map/volcano/alert')->assertOk()->assertJsonCount(1, 'features')
            ->assertJsonPath('features.0.properties.title', 'Ibu · Level II (Waspada)')
            ->assertJsonPath('features.0.properties.volcanoLevel', 2)
            ->assertJsonPath('features.0.properties.source_url', $report);
    }
}
