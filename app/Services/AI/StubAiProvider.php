<?php

namespace App\Services\AI;

/** Deterministic simulation only; not an evaluated language/semantic model. */
class StubAiProvider implements AiProviderInterface
{
    public function model(): string
    {
        return 'synthetic-rule-stub-v1';
    }

    public function analyze(string $text): array
    {
        $fields = array_fill_keys(['hazard', 'summary', 'place', 'observation_time', 'water_depth_cm', 'road_access'], ['value' => null, 'evidence' => null]);
        if (preg_match('/\bbanjir\b/iu', $text, $match)) {
            $fields['hazard'] = ['value' => 'flood', 'evidence' => $match[0]];
        }
        if (preg_match('/\b(\d+(?:[.,]\d+)?)\s*cm\b/iu', $text, $match)) {
            $fields['water_depth_cm'] = ['value' => (float) str_replace(',', '.', $match[1]), 'evidence' => $match[0]];
        }

        return $fields;
    }

    public function similarity(string $left, string $right): float
    {
        $a = array_unique(preg_split('/\W+/u', mb_strtolower($left), -1, PREG_SPLIT_NO_EMPTY) ?: []);
        $b = array_unique(preg_split('/\W+/u', mb_strtolower($right), -1, PREG_SPLIT_NO_EMPTY) ?: []);

        return count(array_intersect($a, $b)) / max(1, count(array_unique(array_merge($a, $b))));
    }
}
