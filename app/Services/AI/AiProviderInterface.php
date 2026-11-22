<?php

namespace App\Services\AI;

interface AiProviderInterface
{
    public function model(): string;

    /** @return array<string, mixed> Untrusted provider output; validated by AnalysisService. */
    public function analyze(string $text): array;

    public function similarity(string $left, string $right): float;
}
