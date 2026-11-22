<?php

namespace App\Services\Integrations;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class BmkgAdapter
{
    /** @return list<array<string, mixed>> */
    public function fetch(string $slug, ?string $region = null): array
    {
        return match ($slug) {
            'bmkg-earthquake' => $this->earthquake($this->get('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')),
            'bmkg-weather' => $this->weather($this->get('https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4='.urlencode($region ?? ''))),
            'bmkg-cap' => $this->alerts(),
            default => throw new \InvalidArgumentException('UNKNOWN_SOURCE'),
        };
    }

    private function get(string $url): string
    {
        if (RateLimiter::tooManyAttempts('bmkg-http', 45)) {
            throw new \RuntimeException('SOURCE_RATE_LIMIT');
        }
        RateLimiter::hit('bmkg-http', 60);
        $response = Http::connectTimeout(5)->timeout(15)->withOptions(['allow_redirects' => false])->get($url)->throw();
        if (strlen($response->body()) > 5_000_000) {
            throw new \RuntimeException('PAYLOAD_TOO_LARGE');
        }

        return $response->body();
    }

    /** @return array{records: list<array<string, mixed>>, partial: bool} */
    public function earthquakes(): array
    {
        $records = [];
        $failures = 0;
        foreach (['gempaterkini.json', 'gempadirasakan.json', 'autogempa.json'] as $feed) {
            try {
                foreach ($this->earthquake($this->get('https://data.bmkg.go.id/DataMKG/TEWS/'.$feed)) as $record) {
                    $key = $record['external_id'];
                    if (isset($records[$key])) {
                        $record['payload_json'] += $records[$key]['payload_json'];
                        $record['message'] ??= $records[$key]['message'];
                    }
                    $records[$key] = $record;
                }
            } catch (\Throwable) {
                $failures++;
            }
        }
        if ($failures === 3) {
            throw new \RuntimeException('EARTHQUAKE_FEEDS_UNAVAILABLE');
        }

        return ['records' => array_values($records), 'partial' => $failures > 0];
    }

    /** @return list<array<string, mixed>> */
    public function earthquake(string $json): array
    {
        $payload = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        $entries = $payload['Infogempa']['gempa'] ?? null;
        if (! is_array($entries)) {
            throw new \UnexpectedValueException('INVALID_EARTHQUAKE_FEED');
        }

        return array_map($this->earthquakeRecord(...), array_is_list($entries) ? $entries : [$entries]);
    }

    /** @param array<string, mixed> $gempa
     * @return array<string, mixed>
     */
    private function earthquakeRecord(array $gempa): array
    {
        Validator::make($gempa, ['DateTime' => 'required|date', 'Coordinates' => 'required|string', 'Wilayah' => 'required|string', 'Magnitude' => 'required|numeric'])->validate();
        $coords = explode(',', $gempa['Coordinates']);
        Validator::make(['lat' => $coords[0], 'lon' => $coords[1] ?? null], ['lat' => 'required|numeric|between:-90,90', 'lon' => 'required|numeric|between:-180,180'])->validate();

        $time = CarbonImmutable::parse($gempa['DateTime'])->utc();

        return [
            'kind' => 'event', 'hazard' => 'earthquake', 'external_id' => hash('sha256', $time->toIso8601String().'|'.sprintf('%.6F,%.6F', (float) $coords[0], (float) $coords[1])),
            'title' => 'Gempa M'.$gempa['Magnitude'].' — '.$gempa['Wilayah'], 'message' => $gempa['Potensi'] ?? null,
            'source_url' => 'https://data.bmkg.go.id/gempabumi/', 'source_time' => $time,
            'latitude' => (float) $coords[0], 'longitude' => (float) $coords[1], 'payload_json' => $gempa,
        ];
    }

    /** @return list<array<string, mixed>> */
    public function weather(string $json): array
    {
        $payload = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        Validator::make($payload, ['data' => 'required|array', 'data.*.lokasi.adm4' => 'required|string', 'data.*.cuaca' => 'required|array'])->validate();
        $rows = [];
        foreach ($payload['data'] as $location) {
            foreach ($location['cuaca'] as $day) {
                foreach ($day as $forecast) {
                    Validator::make($forecast, ['utc_datetime' => 'required|date', 'analysis_date' => 'required|date', 'weather_desc' => 'required|string'])->validate();
                    $region = $location['lokasi']['adm4'];
                    $rows[] = ['kind' => 'forecast', 'hazard' => null, 'external_id' => $region.'|'.$forecast['utc_datetime'],
                        'region_code' => $region, 'forecast_at' => CarbonImmutable::parse($forecast['utc_datetime'], 'UTC'),
                        'title' => $forecast['weather_desc'], 'source_time' => CarbonImmutable::parse($forecast['analysis_date'], 'UTC'),
                        'source_url' => 'https://data.bmkg.go.id/prakiraan-cuaca/', 'payload_json' => $forecast,
                        'expires_at' => CarbonImmutable::parse($forecast['utc_datetime'], 'UTC')->addHours(3),
                        'latitude' => $location['lokasi']['lat'] ?? null, 'longitude' => $location['lokasi']['lon'] ?? null];
                }
            }
        }

        return $rows;
    }

    /** @return list<array<string, mixed>> */
    private function alerts(): array
    {
        $rss = $this->xml($this->get('https://www.bmkg.go.id/alerts/nowcast/id'));
        if ($rss->getName() !== 'rss' || ! isset($rss->channel)) {
            throw new \RuntimeException('INVALID_RSS');
        }
        $rows = [];
        foreach ($rss->channel->item as $item) {
            $url = (string) $item->link;
            if (! preg_match('~^https://www\.bmkg\.go\.id/alerts/nowcast/id/[A-Za-z0-9_.-]+_alert\.xml$~D', $url)) {
                throw new \RuntimeException('UNTRUSTED_CAP_URL');
            }
            $rows = array_merge($rows, $this->cap($this->get($url), $url));
        }

        return $rows;
    }

    /** @return list<array<string, mixed>> */
    public function cap(string $xml, string $url): array
    {
        $root = $this->xml($xml);
        if ($root->getName() !== 'alert' || ! isset($root->status, $root->scope)) {
            throw new \RuntimeException('INVALID_CAP');
        }
        $root->registerXPathNamespace('cap', 'urn:oasis:names:tc:emergency:cap:1.2');
        if ((string) $root->status !== 'Actual' || (string) $root->scope !== 'Public') {
            return [];
        }
        $header = ['identifier' => (string) $root->identifier, 'sent' => (string) $root->sent, 'message_type' => (string) $root->msgType];
        Validator::make($header, ['identifier' => 'required|string', 'sent' => 'required|date', 'message_type' => 'required|in:Alert,Update,Cancel'])->validate();
        $references = [];
        foreach (preg_split('/\s+/', trim((string) $root->references), -1, PREG_SPLIT_NO_EMPTY) ?: [] as $reference) {
            $parts = explode(',', $reference);
            if (count($parts) !== 3) {
                throw new \RuntimeException('INVALID_CAP_REFERENCE');
            }
            $references[] = $parts[1];
        }
        if ($header['message_type'] === 'Cancel') {
            if (! $references) {
                throw new \RuntimeException('MISSING_CAP_REFERENCE');
            }
            $sent = CarbonImmutable::parse($header['sent'])->utc();

            return [['kind' => 'alert', 'hazard' => 'extreme_weather', 'external_id' => $header['identifier'], 'title' => 'Pembatalan peringatan resmi (CAP)', 'message' => null,
                'source_url' => $url, 'source_time' => $sent, 'effective_at' => $sent, 'expires_at' => $sent, 'severity' => 'Unknown', 'certainty' => 'Unknown',
                'message_type' => 'Cancel', 'references_json' => $references, 'payload_json' => $header + ['references' => (string) $root->references]]];
        }
        $infos = $root->xpath('cap:info') ?: [];
        $info = null;
        foreach ($infos as $candidate) {
            if (str_starts_with(strtolower((string) $candidate->language), 'id')) {
                $info = $candidate;
                break;
            }
        }
        $info ??= $infos[0] ?? null;
        if ($info === null) {
            throw new \RuntimeException('INVALID_CAP');
        }
        $data = ['identifier' => (string) $root->identifier, 'sent' => (string) $root->sent, 'effective' => (string) $info->effective, 'expires' => (string) $info->expires, 'severity' => (string) $info->severity, 'certainty' => (string) $info->certainty, 'headline' => (string) $info->headline];
        Validator::make($data, ['identifier' => 'required|string', 'sent' => 'required|date', 'effective' => 'required|date', 'expires' => 'required|date|after:effective', 'severity' => 'required|string', 'certainty' => 'required|string', 'headline' => 'required|string'])->validate();
        $polygons = [];
        foreach ($info->area as $area) {
            foreach ($area->polygon as $polygon) {
                $ring = [];
                foreach (preg_split('/\s+/', trim((string) $polygon)) ?: [] as $pair) {
                    $coord = explode(',', $pair);
                    Validator::make(['lat' => $coord[0], 'lon' => $coord[1] ?? null], ['lat' => 'required|numeric|between:-90,90', 'lon' => 'required|numeric|between:-180,180'])->validate();
                    $ring[] = [(float) $coord[1], (float) $coord[0]];
                }
                if (count($ring) < 4 || $ring[0] !== end($ring)) {
                    throw new \RuntimeException('INVALID_CAP_POLYGON');
                }
                $polygons[] = [$ring];
            }
        }

        return [['kind' => 'alert', 'hazard' => 'extreme_weather', 'external_id' => $data['identifier'], 'title' => $data['headline'], 'message' => (string) $info->description,
            'source_url' => $url, 'source_time' => CarbonImmutable::parse($data['sent'])->utc(), 'effective_at' => CarbonImmutable::parse($data['effective'])->utc(), 'expires_at' => CarbonImmutable::parse($data['expires'])->utc(),
            'severity' => $data['severity'], 'certainty' => $data['certainty'], 'message_type' => $header['message_type'], 'references_json' => $references, 'geometry_json' => $polygons ? ['type' => 'MultiPolygon', 'coordinates' => $polygons] : null,
            'payload_json' => $data + ['msg_type' => (string) $root->msgType, 'references' => (string) $root->references]]];
    }

    private function xml(string $xml): \SimpleXMLElement
    {
        if (preg_match('/<!DOCTYPE|<!ENTITY/i', $xml)) {
            throw new \RuntimeException('UNSAFE_XML');
        }
        $previous = libxml_use_internal_errors(true);
        try {
            $result = simplexml_load_string($xml, \SimpleXMLElement::class, LIBXML_NONET);
            if ($result === false) {
                throw new \RuntimeException('INVALID_XML');
            }

            return $result;
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }
    }
}
