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

    /** @return array{name: string, districts: list<array{code: string, locality: string, name: string}>}|null */
    public function province(string $region): ?array
    {
        $file = resource_path('data/adm4-2022.tsv.gz');
        if (! function_exists('gzopen') || ! is_file($file) || ($input = gzopen($file, 'rb')) === false) {
            return null;
        }

        $prefix = substr($region, 0, 2).'.';
        $province = null;
        $districts = [];
        try {
            while (($line = gzgets($input)) !== false) {
                if (! str_starts_with($line, $prefix)) {
                    continue;
                }
                [$code, $locality, $area] = str_getcsv(rtrim($line, "
"), "	", '"', '');
                $parts = array_map('trim', explode(',', $area));
                $district = substr($code, 0, 5);
                if (count($parts) < 3 || (isset($districts[$district]) && $code !== $region)) {
                    continue;
                }
                $province ??= self::displayName($parts[count($parts) - 1]);
                $districts[$district] = ['code' => $code, 'locality' => $locality, 'name' => self::displayName($parts[count($parts) - 2])];
            }
        } finally {
            gzclose($input);
        }

        return $province === null ? null : ['name' => $province, 'districts' => array_values($districts)];
    }

    private static function displayName(string $name): string
    {
        return str_replace(['Dki ', 'Di ', 'Kab. '], ['DKI ', 'DI ', 'Kabupaten '], mb_convert_case($name, MB_CASE_TITLE, 'UTF-8'));
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
