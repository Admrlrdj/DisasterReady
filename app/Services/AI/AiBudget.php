<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

final class AiBudget
{
    public static function reserve(): void
    {
        $key = 'ai-budget:'.now()->format('Y-m-d');
        Cache::lock($key.':lock', 5)->block(1, function () use ($key): void {
            if (RateLimiter::tooManyAttempts($key, (int) config('disaster.ai_daily_limit')) || Cache::has('ai-circuit-open')) {
                throw new \RuntimeException('AI_TEMPORARILY_UNAVAILABLE');
            }
            RateLimiter::hit($key, 86400);
        });
    }
}
