<?php

namespace App\Http\Controllers;

use App\Actions\FollowUpReport;
use App\Actions\ReviewReport;
use App\Actions\SubmitReport;
use App\Http\Requests\StoreReportRequest;
use App\Models\IncidentReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function store(StoreReportRequest $request, SubmitReport $action): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);
        $report = $action->handle($user, $request->validated(), $request->file('photo'));

        return response()->json(['data' => $report], 201);
    }

    public function show(IncidentReport $report): JsonResponse
    {
        Gate::authorize('view', $report);

        return response()->json(['data' => $report->toArray() + [
            'latitude' => $report->latitude, 'longitude' => $report->longitude,
            'evidence' => DB::table('report_evidence')->where('report_id', $report->id)->get(['id', 'sha256']),
            'reviews' => DB::table('report_reviews')->where('report_id', $report->id)->orderBy('id')->get(),
            'follow_ups' => DB::table('report_follow_ups')->where('report_id', $report->id)->orderBy('id')->get(['id', 'description', 'version', 'created_at']),
        ]]);
    }

    public function mine(Request $request): JsonResponse
    {
        abort_unless($request->user()?->status === 'active', 403);
        $data = $request->validate(['per_page' => ['sometimes', 'integer', 'between:1,100']]);

        return response()->json(IncidentReport::where('reporter_id', $request->user()->id)->latest('id')->paginate((int) ($data['per_page'] ?? 20)));
    }

    public function followUp(Request $request, IncidentReport $report, FollowUpReport $action): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null && $user->status === 'active' && $report->reporter_id === $user->id, 403);
        $data = $request->validate([
            'version' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'required_without:photo', 'string', 'min:10', 'max:5000'],
            'privacy_consent' => ['required', 'accepted'],
            'photo_consent' => ['exclude_without:photo', 'required_with:photo', 'accepted'],
            'photo' => ['nullable', 'required_without:description', 'image', 'mimes:jpg,jpeg,png', 'max:5120', 'dimensions:max_width=6000,max_height=6000'],
        ]);

        return response()->json(['data' => $action->handle($user, $report->id, (int) $data['version'], $data['description'] ?? null, $request->file('photo'))], 201);
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('moderate');
        $data = $request->validate(['status' => ['sometimes', 'in:PENDING,NEEDS_EVIDENCE,VERIFIED,REJECTED'], 'per_page' => ['sometimes', 'integer', 'between:1,100']]);
        $query = IncidentReport::query()->latest('id');
        if (isset($data['status'])) {
            $query->where('status', $data['status']);
        }

        return response()->json($query->paginate((int) ($data['per_page'] ?? 20)));
    }

    public function review(Request $request, IncidentReport $report, ReviewReport $action): JsonResponse
    {
        $data = $request->validate(['version' => ['required', 'integer', 'min:1'], 'decision' => ['required', 'in:NEEDS_EVIDENCE,VERIFIED,REJECTED'], 'reason' => ['required', 'string', 'min:5', 'max:2000']]);
        $user = $request->user();
        abort_unless($user !== null, 401);

        return response()->json(['data' => $action->handle($user, $report->id, (int) $data['version'], $data['decision'], $data['reason'])]);
    }

    public function evidence(IncidentReport $report, int $evidence): StreamedResponse
    {
        Gate::authorize('view', $report);
        $file = DB::table('report_evidence')->where('report_id', $report->id)->where('id', $evidence)->first();
        abort_unless($file !== null, 404);
        abort_unless(Storage::disk($file->disk)->exists($file->storage_key), 404);

        return Storage::disk($file->disk)->response($file->storage_key, 'evidence.jpg', ['Content-Type' => 'image/jpeg', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}
