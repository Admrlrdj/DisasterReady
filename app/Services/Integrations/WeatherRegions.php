<?php

namespace App\Services\Integrations;

final class WeatherRegions
{
    public const DEFAULT_REGION = '31.75.03.1001';

    public const RULE = 'regex:/^\d{2}\.\d{2}\.\d{2}\.\d{4}$/D';

    /** @return list<array{code: string, name: string, area: string}> */
    public function search(string $query, int $limit = 20): array
    {
        $file = resource_path('data/adm4-2022.tsv.gz');
        if (! function_exists('gzopen') || ! is_file($file) || ($input = gzopen($file, 'rb')) === false) {
            return [];
        }
        $terms = preg_split('/[\s,]+/u', trim($query), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if ($terms === []) {
            gzclose($input);

            return [];
        }
        $matches = [];
        try {
            while (count($matches) < $limit && ($line = gzgets($input)) !== false) {
                [$code, $name, $area] = str_getcsv(rtrim($line, "\r\n"), "\t", '"', '');
                if (is_string($code) && is_string($name) && is_string($area)
                    && self::matches($code.' '.$name.' '.$area, $terms)) {
                    $matches[] = ['code' => $code, 'name' => $name, 'area' => $area];
                }
            }
        } finally {
            gzclose($input);
        }

        return $matches;
    }

    /** @param list<string> $terms */
    private static function matches(string $text, array $terms): bool
    {
        foreach ($terms as $term) {
            if (mb_stripos($text, $term) === false) {
                return false;
            }
        }

        return true;
    }
}
