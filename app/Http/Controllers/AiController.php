<?php

namespace App\Http\Controllers;

use App\Jobs\AnalyzeIncidentJob;
use App\Jobs\FindDuplicateReportsJob;
use App\Models\IncidentReport;
use App\Services\AI\AiProviderInterface;
use App\Services\AI\HttpAiProvider;
use App\Services\AI\StubAiProvider;
use App\Services\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;

class AiController extends Controller
{
    public function __construct(private AiProviderInterface $provider) {}

    public function suggestions(IncidentReport $report): JsonResponse
    {
        Gate::authorize('moderate');
        $runs = DB::table('ai_analysis_runs')->where('report_id', $report->id)->orderByDesc('id')->get();
        $suggestions = DB::table('ai_report_suggestions')->whereIn('analysis_run_id', $runs->pluck('id'))->get();
        foreach ($runs as $run) {
            $run->simulation_only = $run->model_identifier === (new StubAiProvider)->model();
            $run->output_json = $run->output_json === null ? null : json_decode($run->output_json, true, 512, JSON_THROW_ON_ERROR);
        }
        foreach ($suggestions as $suggestion) {
            $suggestion->suggested_value_json = $suggestion->suggested_value_json === null ? null : json_decode($suggestion->suggested_value_json, true, 512, JSON_THROW_ON_ERROR);
        }

        $model = $runs->first()->model_identifier ?? $this->provider->model();

        return response()->json(['ai_generated' => true, 'simulation_only' => $model === (new StubAiProvider)->model(), 'model_version' => $model, 'review_status' => 'UNVERIFIED', 'fallback_state' => $report->analysis_status, 'runs' => $runs, 'data' => $suggestions]);
    }

    public function feedback(Request $request, IncidentReport $report): JsonResponse
    {
        Gate::authorize('review', $report);
        $data = $request->validate(['suggestion_id' => ['required', 'integer'], 'decision' => ['required', 'in:ACCEPTED,CORRECTED,REJECTED'], 'corrected_value' => ['present', 'nullable'], 'reason' => ['required', 'string', 'min:5', 'max:2000']]);
        DB::transaction(function () use ($request, $report, $data) {
            $suggestion = DB::table('ai_report_suggestions')->where('id', $data['suggestion_id'])->lockForUpdate()->first();
            abort_unless($suggestion && DB::table('ai_analysis_runs')->where('id', $suggestion->analysis_run_id)->where('report_id', $report->id)->exists(), 404);
            abort_if($suggestion->review_status !== 'UNREVIEWED', 409, 'Saran sudah ditinjau.');
            $rules = match ($suggestion->field_name) {
                'water_depth_cm' => ['nullable', 'numeric', 'min:0', 'max:100000'],
                'hazard' => ['nullable', 'in:flood,earthquake,tsunami,volcano,landslide,extreme_weather,other'],
                'observation_time' => ['nullable', 'date'],
                default => ['nullable', 'string', 'max:2000'],
            };
            Validator::make($data, ['corrected_value' => $data['decision'] === 'CORRECTED' ? $rules : ['nullable', 'prohibited']])->validate();
            $actor = $request->user()?->id;
            DB::table('ai_report_suggestions')->where('id', $suggestion->id)->update(['review_status' => $data['decision'], 'reviewed_by' => $actor, 'reviewed_at' => now()]);
            DB::table('ai_feedback')->insert(['suggestion_id' => $suggestion->id, 'reviewer_id' => $actor, 'decision' => $data['decision'], 'corrected_json' => json_encode($data['corrected_value'], JSON_THROW_ON_ERROR), 'reason' => $data['reason'], 'created_at' => now()]);
            Audit::record($actor, 'ai_suggestion', $suggestion->id, 'review', ['status' => 'UNREVIEWED'], ['status' => $data['decision']]);
        });

        return response()->json(['saved' => true]);
    }

    public function candidates(IncidentReport $report): JsonResponse
    {
        Gate::authorize('moderate');

        $candidates = DB::table('report_duplicate_candidates')->where('report_id', $report->id)->orderByDesc('text_score')->get();
        $methods = $candidates->pluck('method_version')->unique();
        $method = $methods->isEmpty()
            ? ($this->provider instanceof HttpAiProvider ? $this->provider->duplicateMethod() : FindDuplicateReportsJob::SIMULATED_METHOD)
            : $methods->join(', ');

        return response()->json(['simulation_only' => $method === FindDuplicateReportsJob::SIMULATED_METHOD, 'fallback_state' => $report->duplicate_status, 'method' => $method, 'data' => $candidates]);
    }

    public function decideCandidate(Request $request, IncidentReport $report, int $candidate): JsonResponse
    {
        Gate::authorize('review', $report);
        $data = $request->validate(['decision' => ['required', 'in:DUPLICATE,NOT_DUPLICATE'], 'reason' => ['required', 'string', 'min:5', 'max:2000']]);
        DB::transaction(function () use ($report, $candidate, $request, $data) {
            $row = DB::table('report_duplicate_candidates')->where('id', $candidate)->where('report_id', $report->id)->lockForUpdate()->first();
            abort_unless($row !== null, 404);
            abort_if($row->reviewer_decision !== null, 409);
            DB::table('report_duplicate_candidates')->where('id', $candidate)->update(['reviewer_decision' => $data['decision'], 'reviewed_by' => $request->user()?->id, 'reviewed_at' => now()]);
            Audit::record($request->user()?->id, 'duplicate_candidate', $candidate, 'review', [], $data);
        });

        return response()->json(['saved' => true]);
    }

    public function health(): JsonResponse
    {
        Gate::authorize('administer');

        return response()->json([
            'provider' => $this->provider instanceof HttpAiProvider ? 'http' : 'stub',
            'simulation_only' => $this->provider instanceof StubAiProvider, 'model_version' => $this->provider->model(),
            'enabled' => config('disaster.ai_enabled') && (DB::table('operational_settings')->where('key', 'ai')->value('enabled') ?? true),
            'circuit_open' => Cache::has('ai-circuit-open'), 'pending_jobs' => DB::table('jobs')->count(), 'failed_jobs' => DB::table('failed_jobs')->count(),
            'runs' => DB::table('ai_analysis_runs')->selectRaw('status, count(*) AS count')->groupBy('status')->get(),
            'feedback' => DB::table('ai_feedback')->selectRaw('decision, count(*) AS count')->groupBy('decision')->get(),
            'estimated_cost' => DB::table('ai_analysis_runs')->sum('estimated_cost'), 'token_usage' => DB::table('ai_analysis_runs')->sum('token_usage'),
        ]);
    }

    public function toggle(Request $request): JsonResponse
    {
        Gate::authorize('administer');
        $data = $request->validate(['enabled' => ['required', 'boolean']]);
        DB::transaction(function () use ($request, $data) {
            $before = DB::table('operational_settings')->where('key', 'ai')->value('enabled');
            DB::table('operational_settings')->updateOrInsert(['key' => 'ai'], ['enabled' => $data['enabled']]);
            Audit::record($request->user()?->id, 'operational_setting', 0, 'ai_toggle', ['enabled' => $before], $data);
        });

        return response()->json(['saved' => true]);
    }

    public function retry(IncidentReport $report): JsonResponse
    {
        Gate::authorize('administer');
        AnalyzeIncidentJob::dispatch($report->id)->afterCommit();
        if (in_array($report->duplicate_status, ['FAILED', 'DISPATCH_FAILED'], true)) {
            FindDuplicateReportsJob::dispatch($report->id)->afterCommit();
        }
        Audit::record(auth()->user()?->id, 'incident_report', $report->id, 'ai_retry', [], ['queued' => true]);

        return response()->json(['queued' => true], 202);
    }
}
