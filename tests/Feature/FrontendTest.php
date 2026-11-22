<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\IncidentReport;
use App\Models\User;
use Database\Seeders\DisasterSourceSeeder;
use Database\Seeders\PilotFloodGuideSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FrontendTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_pages_render_real_empty_data_and_do_not_require_login(): void
    {
        $this->seed(DisasterSourceSeeder::class);
        foreach (['/' => 'welcome', '/dashboard' => 'dashboard', '/map' => 'public/map', '/weather' => 'public/feed', '/earthquakes' => 'public/feed', '/preparedness' => 'public/preparedness'] as $url => $component) {
            $this->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->component($component)->has('overview.sources', 4)->has('overview.events', 0));
        }
        $this->get('/preparedness/invalid')->assertNotFound();
        $this->get('/weather?region=invalid')->assertSessionHasErrors('region');
        $this->get('/shelters')->assertInertia(fn (Assert $page) => $page->component('public/unavailable')->where('feature', 'shelters'));
    }

    public function test_html_submission_redirects_to_owned_report_while_json_contract_is_preserved(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        $payload = ['description' => 'Laporan pengujian sintetis, air setinggi 40 cm.', 'observed_at' => now()->subMinute()->toIso8601String(), 'latitude' => -6.22, 'longitude' => 106.87, 'privacy_consent' => true];
        $this->actingAs($user)->post('/reports', $payload)->assertStatus(303)->assertRedirect('/my/reports/1?submitted=1');
        $this->get('/my/reports/1')->assertInertia(fn (Assert $page) => $page->component('reports/detail')->where('payload.data.status', 'PENDING')->has('payload.data.latitude'));
        $this->get('/my/reports')->assertInertia(fn (Assert $page) => $page->component('reports/index')->has('payload.data', 1));
        $this->getJson('/my/reports/1')->assertOk()->assertJsonPath('data.status', 'PENDING')->assertJsonMissingPath('component');
        $this->actingAs(User::factory()->create())->get('/my/reports/1')->assertForbidden();
    }

    public function test_volcano_pages_expose_dated_official_reports(): void
    {
        $this->get('/volcanoes')->assertOk()->assertInertia(fn (Assert $page) => $page->component('public/volcanoes')->has('reports', 3)->where('selected', null));
        $this->get('/volcanoes/merapi')->assertOk()->assertInertia(fn (Assert $page) => $page->component('public/volcanoes')->has('reports', 1)->where('reports.merapi.level', 3)->where('reports.merapi.observed_until', '2026-11-22T05:00:00Z'));
        $this->get('/volcanoes/unknown')->assertNotFound();
    }

    public function test_pilot_guide_stays_private_until_admin_records_a_review_and_publishes(): void
    {
        $this->seed(PilotFloodGuideSeeder::class);
        $this->seed(PilotFloodGuideSeeder::class);
        $this->assertDatabaseCount('preparedness_guides', 1);
        $guide = DB::table('preparedness_guides')->first();
        $this->assertNull($guide->reviewed_at);
        $this->getJson('/data/preparedness/flood')->assertJsonCount(0, 'data');
        $this->get('/preparedness/flood')->assertInertia(fn (Assert $page) => $page->has('guides', 0));

        $url = '/admin/guides/'.$guide->id;
        $payload = ['hazard_type_id' => $guide->hazard_type_id, 'title' => $guide->title, 'content' => $guide->content, 'official_reference' => $guide->official_reference, 'reviewed_at' => null, 'published' => true];
        $this->actingAs(User::factory()->create())->putJson($url, $payload)->assertForbidden();
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->putJson($url, $payload)->assertUnprocessable()->assertJsonValidationErrors('reviewed_at');
        $this->putJson($url, array_replace($payload, ['published' => '1']))->assertUnprocessable()->assertJsonValidationErrors('reviewed_at');
        $this->putJson($url, array_replace($payload, ['reviewed_at' => now()->subMinute()->toIso8601String()]))->assertOk();
        $this->getJson('/data/preparedness/flood')->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', $guide->title);
        $this->assertDatabaseHas('audit_logs', ['actor_id' => $admin->id, 'entity_type' => 'preparedness_guide', 'entity_id' => $guide->id, 'action' => 'save']);
    }

    public function test_map_only_exposes_raster_templates_for_approved_official_layers(): void
    {
        $this->seed(DisasterSourceSeeder::class);
        $this->get('/map')->assertInertia(fn (Assert $page) => $page->has('overview.layers', 0));
        DB::table('hazard_layers')->update(['publication_approved' => true]);
        $this->get('/map')->assertInertia(fn (Assert $page) => $page->where('overview.layers.0.tile_template', fn (string $url) => str_contains($url, '/ImageServer/exportImage?bbox={bbox-epsg-3857}')));
        DB::table('hazard_layers')->update(['layer_url' => 'https://example.test/ImageServer']);
        $this->get('/map')->assertInertia(fn (Assert $page) => $page->where('overview.layers.0.tile_template', null));
    }

    public function test_role_protected_frontend_and_inertia_visits_use_existing_authorization(): void
    {
        $reporter = User::factory()->create();
        $report = IncidentReport::create(['reporter_id' => $reporter->id, 'description' => 'Laporan sintetis untuk review UI.', 'observed_at' => now(), 'latitude' => -6.22, 'longitude' => 106.87, 'status' => 'PENDING', 'privacy_consented_at' => now()]);
        $this->actingAs($reporter)->get('/admin/reports')->assertForbidden();
        $this->get('/admin/sources')->assertForbidden();
        $moderator = User::factory()->create(['role' => 'moderator']);
        $this->actingAs($moderator)->get('/admin/reports')->assertInertia(fn (Assert $page) => $page->component('moderation/queue')->where('selected.id', $report->id)->has('suggestions.data', 0));
        $this->get('/admin/sources')->assertForbidden();
        $admin = User::factory()->create(['role' => 'admin']);
        foreach (['/admin/sources' => 'admin/sources', '/admin/guides' => 'admin/guides', '/admin/alerts' => 'admin/alerts', '/admin/audit-logs' => 'admin/audit', '/settings' => 'settings/overview'] as $url => $component) {
            $this->actingAs($admin)->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->component($component));
        }
        $version = app(HandleInertiaRequests::class)->version(Request::create('/admin/reports'));
        $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => $version ?? '', 'X-Requested-With' => 'XMLHttpRequest', 'Accept' => 'text/html, application/xhtml+xml'])->get('/admin/reports')->assertOk()->assertJsonPath('component', 'moderation/queue');
    }
}
