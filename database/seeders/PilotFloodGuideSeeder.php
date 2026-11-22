<?php

namespace Database\Seeders;

use App\Services\Audit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PilotFloodGuideSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $hazard = DB::table('hazard_types')->where('slug', 'flood')->lockForUpdate()->first();
            if ($hazard === null) {
                throw new \RuntimeException('Jenis bahaya banjir belum tersedia. Jalankan migrasi terlebih dahulu.');
            }

            $title = 'Kesiapsiagaan banjir untuk keluarga di Jatinegara';
            $reference = 'https://bpbd.jakarta.go.id/perpustakaan/Y2NRQ0ZDUFBRalMrc3hmK0owd3YwZz09/kesiapsiagaan-menghadapi-banjir-bagi-masyarakat';
            if (DB::table('preparedness_guides')->where('hazard_type_id', $hazard->id)
                ->where(fn ($query) => $query->where('title', $title)->orWhere('official_reference', $reference))->exists()) {
                return;
            }

            $id = DB::table('preparedness_guides')->insertGetId([
                'hazard_type_id' => $hazard->id,
                'title' => $title,
                'content' => "Untuk keluarga di Kampung Melayu dan Bidara Cina. Pantau informasi banjir dan cuaca dari instansi resmi. Siapkan tas siaga dan jalur keluar rumah sejak dini. Ikuti arahan petugas dan konfirmasi titik evakuasi yang berlaku untuk wilayahmu.\n\nDalam keadaan darurat di Jakarta, hubungi Jakarta Siaga 112 dan sampaikan lokasi serta kondisi orang yang membutuhkan bantuan.",
                'official_reference' => $reference,
                'reviewed_at' => null,
                'published' => false,
                'checklist' => json_encode([
                    'Air minum dan makanan tahan simpan.',
                    'Obat pribadi, pakaian cadangan, dan salinan dokumen penting.',
                    'Simpan tas di lokasi yang mudah dijangkau saat keluar rumah.',
                ], JSON_THROW_ON_ERROR),
                'family_plan' => json_encode([
                    'Sepakati satu titik kumpul dan satu kontak keluarga.',
                    'Tentukan siapa yang membantu anggota keluarga yang membutuhkan pendamping.',
                    'Kenali cara keluar dari rumah dan konfirmasi tujuan evakuasi kepada petugas setempat.',
                ], JSON_THROW_ON_ERROR),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            Audit::record(null, 'preparedness_guide', $id, 'seed_pilot_draft', [], ['published' => false, 'official_reference' => $reference]);
        });
    }
}
