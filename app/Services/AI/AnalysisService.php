<?php

namespace App\Services\AI;

use App\Models\IncidentReport;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AnalysisService
{
    public function __construct(private AiProviderInterface $provider) {}

    public function analyze(int $reportId): void
    {
        Cache::lock('incident-analysis:'.$reportId, 120)->block(1, function () use ($reportId) {
            $report = IncidentReport::findOrFail($reportId);
            $enabled = DB::table('operational_settings')->where('key', 'ai')->value('enabled');
            if (! config('disaster.ai_enabled') || $enabled === false || $enabled === 0) {
                $report->update(['analysis_status' => 'DISABLED']);

                return;
            }
            $identity = ['report_id' => $reportId, 'model_identifier' => $this->provider->model(), 'prompt_version' => 'incident-v1', 'input_hash' => hash('sha256', $report->description)];
            $existing = DB::table('ai_analysis_runs')->where($identity)->first();
            if ($existing?->status === 'COMPLETED') {
                $report->update(['analysis_status' => 'COMPLETED']);

                return;
            }
            AiBudget::reserve();
            $runId = $existing->id ?? DB::table('ai_analysis_runs')->insertGetId($identity + ['status' => 'RUNNING', 'started_at' => now()]);
            $attemptId = DB::table('ai_analysis_attempts')->insertGetId(['analysis_run_id' => $runId, 'status' => 'RUNNING', 'started_at' => now()]);
            $start = microtime(true);
            try {
                // No identity, photo or coordinates are sent to the provider.
                $text = ReportText::minimize($report->description);
                $output = $this->provider->analyze($text);
                $expected = ['hazard', 'summary', 'place', 'observation_time', 'water_depth_cm', 'road_access'];
                if (count($output) !== count($expected) || array_diff($expected, array_keys($output))) {
                    throw new \RuntimeException('INVALID_SCHEMA');
                }
                foreach ($output as $field => $suggestion) {
                    if (! is_array($suggestion) || ! array_key_exists('value', $suggestion) || ! array_key_exists('evidence', $suggestion)) {
                        throw new \RuntimeException('INVALID_SCHEMA');
                    }
                    $value = $suggestion['value'];
                    $evidence = $suggestion['evidence'];
                    if (($value === null && $evidence !== null) || ($value !== null && (! is_string($evidence) || $evidence === '' || ! str_contains($text, $evidence) || ! str_contains($report->description, $evidence)))) {
                        throw new \RuntimeException('INVALID_EVIDENCE');
                    }
                    if ($value !== null && ($field === 'water_depth_cm' ? (! is_numeric($value) || (float) $value < 0) : ! is_string($value))) {
                        throw new \RuntimeException('INVALID_SCHEMA');
                    }
                    if ($field === 'hazard' && $value !== null && ! in_array($value, ['flood', 'earthquake', 'tsunami', 'volcano', 'landslide', 'extreme_weather', 'other'], true)) {
                        throw new \RuntimeException('INVALID_HAZARD');
                    }
                    if ($field === 'water_depth_cm' && $value !== null && (! preg_match('/\b(\d+(?:[.,]\d+)?)\s*cm\b/iu', $evidence, $depth) || (float) str_replace(',', '.', $depth[1]) !== (float) $value)) {
                        throw new \RuntimeException('INVALID_MEASUREMENT_EVIDENCE');
                    }
                }
                DB::transaction(function () use ($runId, $output, $start, $report, $attemptId) {
                    foreach ($output as $field => $suggestion) {
                        DB::table('ai_report_suggestions')->updateOrInsert(['analysis_run_id' => $runId, 'field_name' => $field], [
                            'suggested_value_json' => json_encode($suggestion['value'], JSON_THROW_ON_ERROR), 'evidence_span' => $suggestion['evidence'],
                        ]);
                    }
                    DB::table('ai_analysis_runs')->where('id', $runId)->update(['status' => 'COMPLETED', 'output_json' => json_encode($output, JSON_THROW_ON_ERROR), 'completed_at' => now(), 'error_code' => null, 'latency_ms' => (int) ((microtime(true) - $start) * 1000), 'token_usage' => $this->provider instanceof HttpAiProvider ? $this->provider->analysisTokens() : 0]);
                    $report->update(['analysis_status' => 'COMPLETED']);
                    DB::table('ai_analysis_attempts')->where('id', $attemptId)->update(['status' => 'COMPLETED', 'completed_at' => now()]);
                });
            } catch (\Throwable) {
                DB::table('ai_analysis_runs')->where('id', $runId)->update(['status' => 'FAILED', 'error_code' => 'PROVIDER_OR_SCHEMA_FAILURE', 'completed_at' => now()]);
                $report->update(['analysis_status' => 'FAILED']);
                DB::table('ai_analysis_attempts')->where('id', $attemptId)->update(['status' => 'FAILED', 'error_code' => 'PROVIDER_OR_SCHEMA_FAILURE', 'completed_at' => now()]);
                Cache::put('ai-circuit-open', true, 30);
                throw new \RuntimeException('AI_ANALYSIS_FAILED');
            }
        });
    }
}
