<?php

namespace App\Services;

use Carbon\CarbonImmutable;

/**
 * @phpstan-type Report array{id: string, observed_from: string, observed_until: string, timezone: 'WIB'|'WITA'|'WIT', summary: string}
 * @phpstan-type Volcano array{slug: string, name: string, region: string, level: 1|2|3|4, source_url: string, report: Report|null}
 * @phpstan-type Snapshot array{checked_at: string, status_url: string, reports_url: string, volcanoes: list<Volcano>}
 */
final class VolcanoSnapshot
{
    /** @return Snapshot */
    public function snapshot(): array
    {
        $file = resource_path('data/pvmbg-snapshot.json');
        $contents = file_get_contents($file);
        if ($contents === false) {
            throw new \RuntimeException('PVMBG_SNAPSHOT_UNAVAILABLE');
        }

        /** @var Snapshot $snapshot */
        $snapshot = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);

        return $snapshot;
    }

    public function isArchived(string $checkedAt): bool
    {
        return CarbonImmutable::parse($checkedAt)->lte(now()->subDay());
    }
}
