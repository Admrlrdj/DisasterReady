<?php

namespace App\Http\Middleware;

use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NormalizeDisasterDates
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        if ($response instanceof JsonResponse) {
            $data = $response->getData(true);
            if (is_array($data)) {
                $response->setData($this->normalize($data));
            }
        }

        return $response;
    }

    /**
     * @param  array<array-key, mixed>  $data
     * @return array<array-key, mixed>
     */
    public function normalize(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->normalize($value);
            } elseif (is_string($key) && is_string($value) && (str_ends_with($key, '_at') || $key === 'source_time') && $value !== '') {
                $data[$key] = CarbonImmutable::parse($value, 'UTC')->utc()->toIso8601String();
            }
        }

        return $data;
    }
}
