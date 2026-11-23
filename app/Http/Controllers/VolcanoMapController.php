<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Carbon\Exceptions\InvalidFormatException;
use DOMDocument;
use DOMXPath;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class VolcanoMapController extends Controller
{
    private const BASE = 'https://magma.esdm.go.id/v1/gunung-api/';

    public function __invoke(string $kind): JsonResponse
    {
        try {
            $data = Cache::remember('magma-map:v2:'.$kind, 300, fn () => $this->snapshot($kind));
        } catch (ConnectionException|RequestException) {
            abort(503, 'Data MAGMA PVMBG belum dapat dimuat.');
        }

        if ($kind === 'event') {
            $cutoff = now()->subDay()->timestamp;
            $data['features'] = array_values(array_filter($data['features'], fn (array $point) => strtotime($point['properties']['source_time']) > $cutoff));
        }

        return response()->json($data);
    }

    private function snapshot(string $kind): array
    {
        $status = $kind === 'alert';
        $page = $status ? 'tingkat-aktivitas' : 'informasi-letusan';
        $response = Http::connectTimeout(4)->timeout(8)->withoutRedirecting()->get(self::BASE.$page)->throw();
        abort_unless($response->successful() && $response->body() !== '' && strlen($response->body()) < 2_000_000, 503);
        $xpath = $this->xpath($response->body());
        $rows = $status ? $this->activity($xpath) : $this->eruptions($xpath);
        $coordinates = [];
        $missing = [];
        foreach ($rows as $name => $row) {
            $point = Cache::get($this->coordinateKey($name));
            if ($point) {
                $coordinates[$name] = $point;
            } else {
                $missing[$name] = $row['url'];
            }
        }

        if ($missing) {
            $details = Http::pool(function (Pool $pool) use ($missing) {
                foreach ($missing as $name => $url) {
                    $pool->as($name)->connectTimeout(4)->timeout(8)->withoutRedirecting()->get($url);
                }
            }, concurrency: 5);
            foreach ($details as $name => $detail) {
                if ($detail instanceof Response && $detail->successful()
                    && strlen($detail->body()) < 2_000_000
                    && preg_match('/L\.marker\(\[\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s*\]/', $detail->body(), $match)
                    && abs((float) $match[1]) <= 90 && abs((float) $match[2]) <= 180) {
                    $coordinates[$name] = [(float) $match[2], (float) $match[1]];
                    Cache::put($this->coordinateKey($name), $coordinates[$name], now()->addDays(30));
                }
            }
        }

        abort_if($rows && ! $coordinates, 503, 'Koordinat MAGMA PVMBG belum dapat dimuat.');
        $features = [];
        $checked = now()->toIso8601String();
        foreach ($rows as $name => $row) {
            if (! isset($coordinates[$name])) {
                continue;
            }
            $features[] = [
                'type' => 'Feature',
                'geometry' => ['type' => 'Point', 'coordinates' => $coordinates[$name]],
                'properties' => [
                    'id' => crc32($name), 'kind' => $kind, 'title' => $row['title'],
                    'source_time' => $row['time'] ?? $checked, 'fetched_at' => $checked,
                    'expires_at' => null, 'external' => true, 'source_url' => $row['url'],
                    'volcanoLevel' => $row['level'] ?? 0,
                ],
            ];
        }

        return [
            'type' => 'FeatureCollection', 'features' => $features, 'truncated' => false,
            'message' => count($coordinates) < count($rows) ? 'Sebagian lokasi gunung api tidak dapat dimuat. Lihat daftar lengkap di MAGMA.' : null,
        ];
    }

    private function coordinateKey(string $name): string
    {
        return 'magma-coordinate:'.hash('sha256', mb_strtolower($name));
    }

    private function xpath(string $html): DOMXPath
    {
        $document = new DOMDocument;
        @$document->loadHTML($html, LIBXML_NONET);

        return new DOMXPath($document);
    }

    private function activity(DOMXPath $xpath): array
    {
        $levels = [];
        $level = null;
        $rows = [];
        foreach ($xpath->query('//table/tbody/tr') as $row) {
            $heading = trim($xpath->evaluate('string(./td[@rowspan]/a)', $row));
            if (preg_match('/^Level (IV|III|II|I) \((Awas|Siaga|Waspada|Normal)\)$/', $heading, $match)) {
                $level = $match[1];
                $levels[$level] = $match[0];
            }
            $link = $xpath->query('./td/a[contains(@href, "/gunung-api/laporan/")]', $row)->item(0);
            if (! $link || $level === null || $level === 'I') {
                continue;
            }
            $url = $link->getAttribute('href');
            $name = trim(explode(' - ', trim(preg_replace('/\s+/', ' ', str_replace($link->textContent, '', $link->parentNode->textContent))), 2)[0]);
            if ($name !== '' && preg_match('~^https://magma\.esdm\.go\.id/v1/gunung-api/laporan/\d+\?signature=[a-f0-9]+$~D', $url)) {
                $rows[$name] = [
                    'title' => $name.' · '.$levels[$level],
                    'url' => $url,
                    'level' => ['II' => 2, 'III' => 3, 'IV' => 4][$level],
                ];
            }
        }
        abort_unless(count($levels) === 4, 503, 'Daftar tingkat aktivitas MAGMA berubah.');

        return $rows;
    }

    private function eruptions(DOMXPath $xpath): array
    {
        $items = $xpath->query('//div[contains(concat(" ", normalize-space(@class), " "), " timeline-item ")]');
        abort_unless($items->length > 0, 503, 'Daftar letusan MAGMA berubah.');
        $rows = [];
        foreach ($items as $item) {
            $name = trim($xpath->evaluate('string(.//p[@class="timeline-title"]/a)', $item));
            $body = trim($xpath->evaluate('string(.//p[@class="timeline-text"])', $item));
            $url = $xpath->evaluate('string(.//a[contains(@href, "/informasi-letusan/") and contains(@href, "/show")]/@href)', $item);
            if ($name === '' || ! preg_match('~^https://magma\.esdm\.go\.id/v1/gunung-api/informasi-letusan/[a-f0-9-]{36}/show$~D', $url)
                || ! preg_match('/Terjadi (?:erupsi|letusan).*?(\d{1,2} \p{L}+ \d{4}), pukul (\d{2}:\d{2}) (WITA|WIT|WIB)\b/iu', $body, $match)) {
                continue;
            }
            $zone = ['WIB' => 'Asia/Jakarta', 'WITA' => 'Asia/Makassar', 'WIT' => 'Asia/Jayapura'][strtoupper($match[3])];
            try {
                $time = CarbonImmutable::createFromLocaleFormat('!j F Y H:i', 'id', $match[1].' '.$match[2], $zone);
            } catch (InvalidFormatException) {
                continue;
            }
            if ($time && $time <= now() && $time > now()->subDay()
                && (! isset($rows[$name]) || $time->timestamp > strtotime($rows[$name]['time']))) {
                $rows[$name] = ['title' => 'Erupsi '.$name, 'url' => $url, 'time' => $time->toIso8601String()];
            }
        }

        return $rows;
    }
}
