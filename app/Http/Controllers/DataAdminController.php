<?php

namespace App\Http\Controllers;

use App\Jobs\FetchRegionalWeatherJob;
use App\Jobs\IngestSourceJob;
use App\Services\Audit;
use App\Services\Integrations\WeatherRegions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class DataAdminController extends Controller
{
    public function sources(): JsonResponse
    {
        Gate::authorize('administer');

        return response()->json(['data' => DB::table('sources')->orderBy('id')->get(), 'recent_runs' => DB::table('ingestion_runs')->orderByDesc('id')->limit(50)->get()]);
    }

    public function source(Request $request, int $id): JsonResponse
    {
        Gate::authorize('administer');
        $data = $request->validate(['enabled' => ['required', 'boolean'], 'freshness_sla' => ['required', 'integer', 'between:60,604800']]);
        DB::transaction(function () use ($request, $id, $data) {
            $row = DB::table('sources')->where('id', $id)->lockForUpdate()->first();
            abort_unless($row !== null, 404);
            DB::table('sources')->where('id', $id)->update($data + ['updated_at' => now()]);
            Audit::record($request->user()?->id, 'source', $id, 'settings', ['enabled' => $row->enabled, 'freshness_sla' => $row->freshness_sla], $data);
        });

        return response()->json(['saved' => true]);
    }

    public function retry(Request $request, int $id): JsonResponse
    {
        Gate::authorize('administer');
        $source = DB::table('sources')->where('id', $id)->first();
        abort_unless($source !== null, 404);
        abort_unless($source->enabled && config('disaster.sources_enabled'), 422, 'Sinkronisasi sumber nonaktif.');
        abort_unless(in_array($source->slug, ['bmkg-earthquake', 'bmkg-weather', 'bmkg-cap'], true), 422, 'Sumber ini tidak memiliki adapter sinkronisasi.');
        if ($source->slug === 'bmkg-weather' && ! config('disaster.weather_regions')) {
            $region = $request->validate(['region' => ['sometimes', WeatherRegions::RULE]])['region'] ?? WeatherRegions::DEFAULT_REGION;
            FetchRegionalWeatherJob::dispatch($region)->afterCommit();
        } else {
            IngestSourceJob::dispatch($id)->afterCommit();
        }
        Audit::record($request->user()?->id, 'source', $id, 'retry', [], ['queued' => true]);

        return response()->json(['queued' => true], 202);
    }

    public function audit(): JsonResponse
    {
        Gate::authorize('administer');

        return response()->json(DB::table('audit_logs')->orderByDesc('id')->paginate(50));
    }

    public function guides(): JsonResponse
    {
        Gate::authorize('administer');

        return response()->json(DB::table('preparedness_guides')->orderByDesc('id')->paginate(50));
    }

    public function saveGuide(Request $request, ?int $id = null): JsonResponse
    {
        Gate::authorize('administer');
        $data = $request->validate([
            'hazard_type_id' => ['required', 'integer', 'exists:hazard_types,id'], 'title' => ['required', 'string', 'max:255'], 'content' => ['required', 'string', 'max:50000'],
            'official_reference' => ['required', 'url:https', 'max:255'], 'reviewed_at' => ['required_if:published,true,1', 'nullable', 'date', 'before_or_equal:now'], 'published' => ['required', 'boolean'],
            'checklist' => ['sometimes', 'array', 'max:100'], 'checklist.*' => ['string', 'max:500'],
            'family_plan' => ['sometimes', 'array', 'max:100'], 'family_plan.*' => ['string', 'max:500'],
            'emergency_contacts' => ['sometimes', 'array', 'max:30'], 'emergency_contacts.*' => ['array:name,phone,source_url,verified_at'],
            'emergency_contacts.*.name' => ['required', 'string', 'max:255'], 'emergency_contacts.*.phone' => ['required', 'string', 'max:50'],
            'emergency_contacts.*.source_url' => ['required', 'url:https', 'max:255'], 'emergency_contacts.*.verified_at' => ['required', 'date', 'before_or_equal:now'],
        ]);
        foreach (['checklist', 'family_plan', 'emergency_contacts'] as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = json_encode($data[$field], JSON_THROW_ON_ERROR);
            }
        }
        $guideId = DB::transaction(function () use ($request, $id, $data) {
            $before = $id ? DB::table('preparedness_guides')->where('id', $id)->lockForUpdate()->first() : null;
            abort_if($id && ! $before, 404);
            if ($id) {
                DB::table('preparedness_guides')->where('id', $id)->update($data + ['updated_at' => now()]);
            } else {
                $id = DB::table('preparedness_guides')->insertGetId($data + ['created_at' => now(), 'updated_at' => now()]);
            }
            Audit::record($request->user()?->id, 'preparedness_guide', $id, 'save', $before ? (array) $before : [], $data);

            return $id;
        });

        return response()->json(['id' => $guideId], $id ? 200 : 201);
    }

    public function alerts(): JsonResponse
    {
        Gate::authorize('administer');

        return response()->json(DB::table('official_alerts')->orderByDesc('source_time')->paginate(50));
    }
}
