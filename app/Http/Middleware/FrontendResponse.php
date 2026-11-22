<?php

namespace App\Http\Middleware;

use App\Http\Controllers\AiController;
use App\Http\Controllers\ReportController;
use App\Models\IncidentReport;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/** Keep existing JSON contracts while serving the same authorized actions to Inertia. */
class FrontendResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return $response;
        }
        if (! $response instanceof JsonResponse || ! $response->isSuccessful()) {
            return $response;
        }
        $payload = app(NormalizeDisasterDates::class)->normalize($response->getData(true));
        $name = $request->route()?->getName();
        if (! $request->isMethod('GET')) {
            if ($name === 'reports.store') {
                return redirect('/my/reports/'.$payload['data']['id'].'?submitted=1', 303)->with('notice', 'Laporan tersimpan sebagai PENDING. Verifikasi dilakukan oleh moderator manusia.');
            }

            return back(303)->with('notice', 'Perubahan berhasil disimpan.');
        }
        $component = match ($name) {
            'reports.mine' => 'reports/index', 'reports.show', 'admin.reports.show' => 'reports/detail',
            'admin.reports.index' => 'moderation/queue',
            'admin.sources', 'admin.ai.health' => 'admin/sources',
            'admin.guides' => 'admin/guides', 'admin.alerts' => 'admin/alerts',
            'admin.audit' => 'admin/audit', default => null,
        };
        if ($component === null) {
            return $response;
        }
        $props = ['payload' => $payload];
        if ($component === 'admin/sources') {
            $props['health'] = app(AiController::class)->health()->getData(true);
        }
        if ($component === 'admin/guides') {
            $props['hazards'] = DB::table('hazard_types')->get()->all();
        }
        if ($component === 'moderation/queue') {
            $selectedId = $request->integer('report', (int) ($payload['data'][0]['id'] ?? 0));
            $report = $selectedId ? IncidentReport::findOrFail($selectedId) : null;
            $props['selected'] = $report ? app(ReportController::class)->show($report)->getData(true)['data'] : null;
            $props['suggestions'] = $report ? app(AiController::class)->suggestions($report)->getData(true) : null;
            $props['duplicates'] = $report ? app(AiController::class)->candidates($report)->getData(true) : null;
        }

        return Inertia::render($component, app(NormalizeDisasterDates::class)->normalize($props))->toResponse($request);
    }
}
