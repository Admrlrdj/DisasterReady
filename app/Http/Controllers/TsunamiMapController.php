<?php

namespace App\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TsunamiMapController extends Controller
{
    private const SOURCE = 'https://inatews.bmkg.go.id/web/tsunami';

    public function __invoke(): JsonResponse
    {
        try {
            $snapshot = Cache::remember('inatews:latest-tectonic-bulletin', 45, function (): array {
                $response = Http::connectTimeout(4)->timeout(8)->withoutRedirecting()
                    ->get('https://cdn.bmkg.go.id/last30tsunamievent.xml')->throw();
                abort_unless($response->successful() && strlen($response->body()) <= 1_000_000, 503);
                $xml = @simplexml_load_string($response->body(), \SimpleXMLElement::class, LIBXML_NONET);
                abort_unless($xml && $xml->getName() === 'alert' && (string) $xml->status === 'Actual', 503);

                $latest = null;
                foreach ($xml->info as $bulletin) {
                    $id = (string) $bulletin->eventid;
                    if (preg_match('/^\d{14}$/D', $id) && ($latest === null || $id > (string) $latest->eventid)) {
                        $latest = $bulletin;
                    }
                }
                abort_unless($latest, 503);
                $threat = false;
                foreach ($latest->wzarea as $area) {
                    if (in_array(strtoupper(trim((string) $area->level)), ['AWAS', 'SIAGA', 'WASPADA'], true)) {
                        $threat = true;
                        break;
                    }
                }

                return [
                    'id' => (string) $latest->eventid,
                    'stage' => trim((string) $latest->subject),
                    'coordinates' => explode(',', (string) $latest->point->coordinates),
                    'area' => trim((string) $latest->area),
                    'headline' => trim((string) $latest->headline),
                    'threat' => $threat,
                    'checked_at' => now()->toIso8601String(),
                ];
            });
        } catch (ConnectionException|RequestException) {
            abort(503, 'Buletin InaTEWS belum dapat dimuat.');
        }

        $time = CarbonImmutable::createFromFormat('!YmdHis', $snapshot['id'], 'Asia/Jakarta');
        abort_unless($time && $time->format('YmdHis') === $snapshot['id'] && $time <= now(), 503);

        $ended = $snapshot['stage'] === 'Warning Tsunami PD-4';
        $coordinates = array_map('trim', $snapshot['coordinates']);
        $recent = $time->greaterThan(now()->subHour());
        $features = [];
        $status = $ended
            ? 'Buletin tektonik terakhir menyatakan peringatan berakhir.'
            : 'Status peringatan tsunami terkini belum dapat dipastikan dari buletin yang tersedia.';

        if ($recent && $snapshot['threat'] && $snapshot['headline'] !== ''
            && ! str_contains(strtolower($snapshot['headline']), 'berakhir')
            && preg_match('/^Warning Tsunami PD-[123](?:\.\d+)?$/D', $snapshot['stage'])
            && count($coordinates) === 2 && is_numeric($coordinates[0]) && is_numeric($coordinates[1])
            && abs((float) $coordinates[0]) <= 180 && abs((float) $coordinates[1]) <= 90) {
            $features[] = [
                'type' => 'Feature',
                'geometry' => ['type' => 'Point', 'coordinates' => array_map('floatval', $coordinates)],
                'properties' => [
                    'id' => (int) $snapshot['id'], 'kind' => 'alert', 'title' => $snapshot['headline'],
                    'message' => $snapshot['area'], 'source_time' => $time->toIso8601String(),
                    'fetched_at' => $snapshot['checked_at'], 'expires_at' => null, 'external' => true,
                    'source_url' => self::SOURCE, 'source' => ['freshness' => 'FRESH'],
                ],
            ];
            $status = 'Buletin tektonik terbaru dari InaTEWS. Titik menunjukkan episentrum gempa.';
        }

        return response()->json(['type' => 'FeatureCollection', 'features' => $features, 'truncated' => false, 'message' => $status]);
    }
}
