<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

final class OfficialActivity
{
    public function __construct(private PublicData $data, private VolcanoSnapshot $volcanoes) {}

    /** @return list<array{id: string, kind: string, title: string, source_time: string, source: string, href: string}> */
    public function latest(): array
    {
        $now = now();
        $cutoff = $now->subDay();
        $items = [];
        $events = DB::table('disaster_events')->where('synthetic', false)
            ->where('source_id', DB::table('sources')->select('id')->where('slug', 'bmkg-earthquake'))
            ->whereBetween('source_time', [$cutoff, $now])
            ->orderByDesc('source_time')->orderByDesc('id')->limit(3)->get();
        $alerts = $this->data->activeAlerts(DB::table('official_alerts'))->where('synthetic', false)
            ->where('source_id', DB::table('sources')->select('id')->where('slug', 'bmkg-cap'))
            ->where('source_time', '<=', $now)
            ->orderByDesc('source_time')->orderByDesc('id')->limit(3)->get();
        foreach (['event' => $events, 'alert' => $alerts] as $kind => $rows) {
            foreach ($rows as $row) {
                $items[] = [
                    'id' => $kind.':'.$row->id,
                    'kind' => $kind,
                    'title' => $row->title,
                    'source_time' => CarbonImmutable::parse($row->source_time)->utc()->toIso8601String(),
                    'source' => 'BMKG',
                    'href' => route($kind === 'event' ? 'events.show' : 'alerts.show', ['id' => $row->id], false),
                ];
            }
        }
        foreach ($this->volcanoes->snapshot()['volcanoes'] as $volcano) {
            $report = $volcano['report'];
            if ($report === null) {
                continue;
            }
            $observed = CarbonImmutable::parse($report['observed_until']);
            if ($observed->lt($cutoff) || $observed->gt($now)) {
                continue;
            }
            $items[] = [
                'id' => 'volcano:'.$report['id'],
                'kind' => 'volcano',
                'title' => 'Laporan aktivitas '.$volcano['name'],
                'source_time' => $observed->utc()->toIso8601String(),
                'source' => 'PVMBG · MAGMA',
                'href' => route('volcanoes.show', ['id' => $volcano['slug']], false),
            ];
        }
        usort($items, fn (array $a, array $b) => [$b['source_time'], $b['id']] <=> [$a['source_time'], $a['id']]);

        return array_slice(array_values(array_column($items, null, 'id')), 0, 3);
    }
}
