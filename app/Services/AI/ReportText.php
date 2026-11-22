<?php

namespace App\Services\AI;

final class ReportText
{
    public static function minimize(string $text): string
    {
        return preg_replace([
            '/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i',
            '/(?<!\w)(?:\+62|0)[\d\s-]{8,15}\d/',
            '/(?<![\d.])[+-]?\d{1,3}\.\d{3,}\s*[,;\/]\s*[+-]?\d{1,3}\.\d{3,}(?!\d)/',
            '/(?<!\d)\d{16}(?!\d)/',
        ], '[REDACTED]', $text) ?? '';
    }
}
