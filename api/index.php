<?php

if (! getenv('DB_URL') && ! getenv('DB_HOST') && parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) !== '/up') {
    http_response_code(503);
    header('Content-Type: text/plain; charset=UTF-8');
    header('Cache-Control: no-store');
    echo 'Preview DisasterReady menunggu koneksi database Supabase.';

    return;
}

$storage = sys_get_temp_dir().'/disaster-ready';
foreach (['bootstrap', 'framework/views', 'framework/cache', 'framework/sessions', 'logs'] as $directory) {
    $path = $storage.'/'.$directory;
    if (! is_dir($path)) {
        mkdir($path, 0700, true);
    }
}

$_SERVER['LARAVEL_STORAGE_PATH'] = $_ENV['LARAVEL_STORAGE_PATH'] = $storage;
$_SERVER['APP_PACKAGES_CACHE'] = $_ENV['APP_PACKAGES_CACHE'] = $storage.'/bootstrap/packages.php';
$_SERVER['APP_SERVICES_CACHE'] = $_ENV['APP_SERVICES_CACHE'] = $storage.'/bootstrap/services.php';
if (! getenv('APP_URL') && ($host = getenv('VERCEL_URL'))) {
    $_SERVER['APP_URL'] = $_ENV['APP_URL'] = 'https://'.$host;
}

require dirname(__DIR__).'/public/index.php';
