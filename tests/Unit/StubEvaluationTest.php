<?php

namespace Tests\Unit;

use App\Services\AI\StubEvaluation;
use PHPUnit\Framework\TestCase;

class StubEvaluationTest extends TestCase
{
    public function test_synthetic_smoke_dataset_preserves_nulls_and_evidence(): void
    {
        $result = (new StubEvaluation)->run();
        $this->assertTrue($result['simulation_only']);
        $this->assertSame(100, $result['explicit_depth_correct']);
        $this->assertSame(100, $result['null_depth_correct']);
        $this->assertSame(200, $result['evidence_valid']);
    }
}
