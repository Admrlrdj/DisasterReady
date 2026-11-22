<?php

namespace Database\Seeders;

use App\Services\Audit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class NationalPreparednessSeeder extends Seeder
{
    public function run(): void
    {
        $reference = 'https://www.bnpb.go.id/buku/buku-saku-bencana';
        $drafts = [
            'flood' => [
                'Kesiapsiagaan banjir untuk keluarga',
                'Pantau pemberitahuan dari BMKG dan BPBD setempat. Siapkan tas siaga dan kenali rute menuju tempat aman. Ikuti arahan petugas saat evakuasi.',
                ['Simpan obat pribadi, dokumen penting, air minum, dan alat penerangan di tas siaga.'],
            ],
            'earthquake' => [
                'Kesiapsiagaan gempa bumi untuk keluarga',
                'Kenali tempat berlindung di setiap ruangan dan rencanakan jalan keluar. Saat guncangan, lindungi kepala dari benda jatuh. Setelah guncangan reda, menuju tempat terbuka jika dapat keluar dengan aman.',
                ['Kenali tempat berlindung dan jauhkan benda berat dari rak tinggi.'],
            ],
            'tsunami' => [
                'Kesiapsiagaan tsunami untuk keluarga di pesisir',
                'Pelajari rute evakuasi resmi di daerahmu. Jika terjadi gempa kuat atau lama di pesisir, segera evakuasi ke tempat tinggi setelah guncangan memungkinkan. Ikuti informasi resmi sebelum kembali.',
                ['Kenali rambu dan tujuan evakuasi yang ditetapkan pemerintah daerah.'],
            ],
        ];

        DB::transaction(function () use ($reference, $drafts): void {
            foreach ($drafts as $slug => [$title, $content, $checklist]) {
                $hazard = DB::table('hazard_types')->where('slug', $slug)->lockForUpdate()->first();
                if ($hazard === null) {
                    throw new \RuntimeException('HAZARD_TYPES_NOT_SEEDED');
                }
                if (DB::table('preparedness_guides')->where('hazard_type_id', $hazard->id)->where('official_reference', $reference)->exists()) {
                    continue;
                }
                $id = DB::table('preparedness_guides')->insertGetId([
                    'hazard_type_id' => $hazard->id,
                    'title' => $title,
                    'content' => $content,
                    'official_reference' => $reference,
                    'checklist' => json_encode($checklist, JSON_THROW_ON_ERROR),
                    'published' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                Audit::record(null, 'preparedness_guide', $id, 'seed_national_draft', [], ['published' => false, 'official_reference' => $reference]);
            }
        });
    }
}
