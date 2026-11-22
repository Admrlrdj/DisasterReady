<?php

namespace App\Http\Controllers;

use App\Http\Middleware\NormalizeDisasterDates;
use App\Models\IncidentReport;
use App\Services\FrontendData;
use App\Services\PublicData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FrontendController extends Controller
{
    public function page(Request $request, FrontendData $data): Response
    {
        $request->validate(['region' => ['sometimes', 'in:31.75.03.1001,31.75.03.1002']]);
        $component = match ($request->route()?->getName()) {
            'home' => 'welcome', 'dashboard' => 'dashboard', 'map' => 'public/map',
            'preparedness', 'preparedness.hazard' => 'public/preparedness',
            'reports.create' => 'reports/create', 'settings.overview' => 'settings/overview',
            default => 'public/feed',
        };
        $props = ['overview' => $data->overview($request->string('region', '31.75.03.1001')->toString())];
        if ($component === 'public/preparedness') {
            $hazard = $request->route('hazard') ?? 'flood';
            abort_unless(DB::table('hazard_types')->where('slug', $hazard)->exists(), 404);
            $props['hazard'] = $hazard;
            $props['guides'] = DB::table('preparedness_guides')->where('published', true)->whereNotNull('reviewed_at')->where('hazard_type_id', DB::table('hazard_types')->where('slug', $hazard)->value('id'))->get()->map(function (\stdClass $row) {
                foreach (['checklist', 'family_plan', 'emergency_contacts'] as $field) {
                    $row->{$field} = $row->{$field} === null ? [] : json_decode($row->{$field}, true, 512, JSON_THROW_ON_ERROR);
                }

                return $row;
            })->all();
        }
        if ($component === 'reports/create') {
            $props['reports'] = IncidentReport::where('reporter_id', $request->user()?->id)->latest('id')->limit(10)->get();
        }

        return Inertia::render($component, app(NormalizeDisasterDates::class)->normalize($props));
    }

    public function detail(Request $request, int $id, PublicData $data): Response
    {
        $kind = $request->route()?->getName() === 'events.show' ? 'event' : 'alert';
        $row = DB::table($kind === 'event' ? 'disaster_events' : 'official_alerts')->where('id', $id)->first();
        abort_unless($row !== null, 404);

        return Inertia::render('public/detail', app(NormalizeDisasterDates::class)->normalize(['record' => $data->record($row, $kind)]));
    }

    public function unavailable(Request $request): Response
    {
        return Inertia::render('public/unavailable', ['feature' => $request->route()?->getName()]);
    }

    public function volcanoes(?string $id = null): Response
    {
        /** @var array<string, array<string, mixed>> $reports */
        $reports = config('pvmbg.reports');
        abort_if($id !== null && ! isset($reports[$id]), 404);

        return Inertia::render('public/volcanoes', [
            'reports' => $id === null ? $reports : [$id => $reports[$id]],
            'selected' => $id,
            'statusUrl' => config('pvmbg.status_url'),
        ]);
    }
}
