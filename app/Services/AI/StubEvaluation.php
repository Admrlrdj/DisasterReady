<?php

namespace App\Services\AI;

class StubEvaluation
{
    /** @return array<string, mixed> */
    public function run(): array
    {
        $provider = new StubAiProvider;
        $correct = 0;
        $nullCorrect = 0;
        $evidenceCorrect = 0;
        $start = microtime(true);
        for ($i = 1; $i <= 200; $i++) {
            $explicit = $i <= 100;
            $text = $explicit ? "SINTETIS kasus {$i}: banjir {$i} cm di jalan kampung." : "SINTETIS kasus {$i}: banjir terlihat di jalan kampung, kedalaman tidak diketahui.";
            $output = $provider->analyze($text);
            $depth = $output['water_depth_cm'];
            if ($explicit && $depth['value'] === (float) $i) {
                $correct++;
            }
            if (! $explicit && $depth['value'] === null) {
                $nullCorrect++;
            }
            if ($depth['value'] === null ? $depth['evidence'] === null : is_string($depth['evidence']) && str_contains($text, $depth['evidence'])) {
                $evidenceCorrect++;
            }
        }

        return ['provider' => $provider->model(), 'simulation_only' => true, 'dataset_version' => 'synthetic-template-smoke-v1', 'cases' => 200, 'explicit_depth_correct' => $correct, 'explicit_depth_cases' => 100, 'null_depth_correct' => $nullCorrect, 'null_depth_cases' => 100, 'evidence_valid' => $evidenceCorrect, 'duration_ms' => (int) ((microtime(true) - $start) * 1000), 'limitations' => 'Deterministic template smoke checks, not representative model accuracy. No trained or semantic model evaluated. Reviewer time and real-provider evaluation pending.'];
    }
}
