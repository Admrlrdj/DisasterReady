<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DisasterSourceSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['bmkg-earthquake', 'Gempa BMKG', 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json', 600],
            ['bmkg-weather', 'Prakiraan cuaca BMKG', 'https://api.bmkg.go.id/publik/prakiraan-cuaca', 86400],
            ['bmkg-cap', 'Peringatan cuaca BMKG CAP', 'https://www.bmkg.go.id/alerts/nowcast/id', 600],
        ] as [$slug, $name, $url, $sla]) {
            DB::table('sources')->insertOrIgnore(['slug' => $slug, 'agency' => 'BMKG', 'name' => $name, 'endpoint' => $url, 'attribution' => 'BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)', 'license' => 'Atribusi wajib; lihat data.bmkg.go.id', 'freshness_sla' => $sla, 'created_at' => now(), 'updated_at' => now()]);
        }
        DB::table('sources')->insertOrIgnore(['slug' => 'inarisk', 'agency' => 'BNPB', 'name' => 'InaRISK BNPB', 'endpoint' => 'https://gis.bnpb.go.id/server/rest/services/inarisk', 'attribution' => 'BNPB InaRISK', 'freshness_sla' => 2592000, 'created_at' => now(), 'updated_at' => now()]);
        $source = DB::table('sources')->where('slug', 'inarisk')->value('id');
        if (! DB::table('hazard_layers')->where('source_id', $source)->exists()) {
            DB::table('hazard_layers')->insert(['source_id' => $source, 'hazard_type_id' => DB::table('hazard_types')->where('slug', 'flood')->value('id'), 'name' => 'Indeks bahaya banjir (model historis)', 'layer_url' => 'https://gis.bnpb.go.id/server/rest/services/inarisk/INDEKS_BAHAYA_BANJIR/ImageServer', 'legend' => json_encode(['status' => 'unverified'], JSON_THROW_ON_ERROR), 'crs' => 'EPSG:3395', 'limitations' => 'Raster 100 m menurut metadata; legenda, lisensi dan tanggal model belum diverifikasi. Bukan peringatan aktif.', 'publication_approved' => false]);
        }
    }
}
