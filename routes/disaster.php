<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\DataAdminController;
use App\Http\Controllers\PublicDataController;
use App\Http\Controllers\ReportController;
use App\Http\Middleware\FrontendResponse;
use App\Http\Middleware\NormalizeDisasterDates;
use Illuminate\Support\Facades\Route;

Route::middleware(NormalizeDisasterDates::class)->group(function () {

    Route::prefix('data')->middleware('throttle:60,1')->group(function () {
        Route::get('/overview', [PublicDataController::class, 'overview'])->name('data.overview');
        Route::get('/events', [PublicDataController::class, 'events'])->name('data.events');
        Route::get('/events/{id}', [PublicDataController::class, 'event'])->name('data.event');
        Route::get('/alerts', [PublicDataController::class, 'alerts'])->name('data.alerts');
        Route::get('/alerts/{id}', [PublicDataController::class, 'alert'])->name('data.alert');
        Route::get('/weather', [PublicDataController::class, 'weather'])->name('data.weather');
        Route::get('/regions', [PublicDataController::class, 'regions'])->name('data.regions');
        Route::get('/map', [PublicDataController::class, 'map'])->name('data.map');
        Route::get('/layers', [PublicDataController::class, 'layers'])->name('data.layers');
        Route::get('/preparedness/{hazard}', [PublicDataController::class, 'guides'])->name('data.guides');
    });

    Route::middleware(['auth', 'verified', FrontendResponse::class])->group(function () {
        Route::post('/reports', [ReportController::class, 'store'])->middleware('throttle:10,1')->name('reports.store');
        Route::get('/my/reports/{report}', [ReportController::class, 'show'])->name('reports.show');
        Route::get('/my/reports', [ReportController::class, 'mine'])->name('reports.mine');
        Route::post('/my/reports/{report}/follow-ups', [ReportController::class, 'followUp'])->middleware('throttle:10,1')->name('reports.follow-up');
        Route::get('/reports/{report}/evidence/{evidence}', [ReportController::class, 'evidence'])->name('reports.evidence');
        Route::prefix('admin')->group(function () {
            Route::get('/sources', [DataAdminController::class, 'sources'])->name('admin.sources');
            Route::post('/sources/{id}', [DataAdminController::class, 'source'])->name('admin.sources.update');
            Route::post('/sources/{id}/retry', [DataAdminController::class, 'retry'])->name('admin.sources.retry');
            Route::get('/audit-logs', [DataAdminController::class, 'audit'])->name('admin.audit');
            Route::get('/guides', [DataAdminController::class, 'guides'])->name('admin.guides');
            Route::post('/guides', [DataAdminController::class, 'saveGuide'])->name('admin.guides.store');
            Route::put('/guides/{id}', [DataAdminController::class, 'saveGuide'])->name('admin.guides.update');
            Route::get('/alerts', [DataAdminController::class, 'alerts'])->name('admin.alerts');
            Route::get('/reports', [ReportController::class, 'index'])->name('admin.reports.index');
            Route::get('/reports/{report}', [ReportController::class, 'show'])->middleware('can:moderate')->name('admin.reports.show');
            Route::post('/reports/{report}/reviews', [ReportController::class, 'review'])->name('admin.reports.review');
            Route::get('/reports/{report}/ai-suggestions', [AiController::class, 'suggestions'])->name('admin.reports.suggestions');
            Route::post('/reports/{report}/ai-feedback', [AiController::class, 'feedback'])->name('admin.reports.feedback');
            Route::get('/reports/{report}/duplicate-candidates', [AiController::class, 'candidates'])->name('admin.reports.candidates');
            Route::post('/reports/{report}/duplicate-candidates/{candidate}', [AiController::class, 'decideCandidate'])->name('admin.reports.candidate-review');
            Route::get('/ai/health', [AiController::class, 'health'])->name('admin.ai.health');
            Route::post('/ai/settings', [AiController::class, 'toggle'])->name('admin.ai.settings');
            Route::post('/reports/{report}/ai-retry', [AiController::class, 'retry'])->name('admin.reports.ai-retry');
        });
    });
});
