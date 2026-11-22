<?php

return [
    'ai_enabled' => env('DISASTER_AI_ENABLED', true),
    'ai_daily_limit' => (int) env('DISASTER_AI_DAILY_LIMIT', 500),
    'ai_provider' => env('DISASTER_AI_PROVIDER', 'stub'),
    'ai_api_base' => env('DISASTER_AI_API_BASE'),
    'ai_api_key' => env('DISASTER_AI_API_KEY'),
    'ai_chat_model' => env('DISASTER_AI_CHAT_MODEL'),
    'ai_embedding_model' => env('DISASTER_AI_EMBEDDING_MODEL'),
    'duplicate_radius_m' => 1000,
    'duplicate_window_hours' => 24,
    'photo_disk' => 'local',
    'sources_enabled' => env('DISASTER_SOURCES_ENABLED', false),
    'weather_regions' => array_filter(explode(',', (string) env('BMKG_WEATHER_REGIONS', ''))),
    'emergency_contacts' => [
        ['name' => 'BNPB', 'phone' => '117', 'source_url' => 'https://www.bnpb.go.id/kontak', 'verified_at' => '2026-11-22T00:00:00Z'],
        ['name' => 'Basarnas', 'phone' => '115', 'source_url' => 'https://balikpapan.basarnas.go.id/berita/informasi-layanan-kontak-darurat-dan-hotline-basarnas-balikpapan', 'verified_at' => '2026-11-22T00:00:00Z'],
        ['name' => 'Jakarta Siaga', 'phone' => '112', 'source_url' => 'https://www.jakarta.go.id/jakarta-siaga-112', 'verified_at' => '2026-11-22T00:00:00Z'],
    ],
];
