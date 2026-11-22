<?php

namespace App\Jobs;

use App\Services\Integrations\IngestSource;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class IngestSourceJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(public int $sourceId) {}

    /** @return list<int> */
    public function backoff(): array
    {
        return [60, 300, 900];
    }

    public function handle(IngestSource $service): void
    {
        $service->handle($this->sourceId);
    }
}
