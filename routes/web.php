<?php

use App\Http\Controllers\FrontendController;
use Illuminate\Support\Facades\Route;

Route::get('/', [FrontendController::class, 'page'])->name('home');
Route::get('/bantuan', [FrontendController::class, 'help'])->name('help');
Route::get('/dashboard', [FrontendController::class, 'page'])->name('dashboard');
Route::get('/map', [FrontendController::class, 'page'])->name('map');
Route::get('/earthquakes', [FrontendController::class, 'page'])->name('earthquakes');
Route::get('/weather', [FrontendController::class, 'page'])->name('weather');
Route::get('/preparedness', [FrontendController::class, 'page'])->name('preparedness');
Route::get('/preparedness/{hazard}', [FrontendController::class, 'page'])->name('preparedness.hazard');
Route::get('/events/{id}', [FrontendController::class, 'detail'])->name('events.show');
Route::get('/alerts/{id}', [FrontendController::class, 'detail'])->name('alerts.show');
Route::get('/volcanoes', [FrontendController::class, 'volcanoes'])->name('volcanoes');
Route::get('/volcanoes/{id}', [FrontendController::class, 'volcanoes'])->name('volcanoes.show');
Route::get('/shelters', [FrontendController::class, 'unavailable'])->name('shelters');
Route::get('/shelters/{id}', [FrontendController::class, 'unavailable'])->name('shelters.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/reports/create', [FrontendController::class, 'page'])->name('reports.create');
    Route::get('/settings', [FrontendController::class, 'page'])->name('settings.overview');
    Route::get('/admin/shelters', [FrontendController::class, 'unavailable'])->middleware('can:administer')->name('admin.shelters');
    Route::get('/admin/road-restrictions', [FrontendController::class, 'unavailable'])->middleware('can:administer')->name('admin.road-restrictions');
});

require __DIR__.'/settings.php';
require __DIR__.'/disaster.php';
