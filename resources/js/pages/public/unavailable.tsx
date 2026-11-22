import { Head, Link } from '@inertiajs/react';
import { FilePlus2, Home, Map, Route, ShieldCheck } from 'lucide-react';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { usePageVariant } from '@/hooks/use-page-variant';

export default function Unavailable({ feature }: { feature: string }) {
    const { variant } = usePageVariant();
    const roads = feature.includes('road');
    const title = roads
        ? 'Pembatasan Ruas Jalan & Simulasi Rute'
        : 'Kandidat Shelter & Lokasi Pengungsian';

    return (
        <>
            <Head title={title} />
            <PageHeading
                eyebrow={
                    roads
                        ? 'FR-14 · Modul Prioritas P2 (Belum Diaktifkan di Backend)'
                        : 'FR-13 · Modul Prioritas P1 (Menunggu Verifikasi Operasional)'
                }
                title={title}
                description="Ketersediaan data operasional dan status verifikasi lapangan ditampilkan secara jujur tanpa koordinat atau rute fiktif."
            >
                <Action variant="outline" size="sm" asChild>
                    <Link href="/dashboard">
                        <Map className="size-3.5" aria-hidden="true" />
                        <span>Buka Peta Komando</span>
                    </Link>
                </Action>
            </PageHeading>

            <div
                className={
                    variant === 'b'
                        ? 'grid grid-cols-1 gap-4 lg:grid-cols-12'
                        : 'dr-two-col'
                }
            >
                <Panel
                    className={variant === 'b' ? 'lg:col-span-7' : undefined}
                    title={
                        roads
                            ? 'Status Ruas Jalan & Penutupan Darurat'
                            : 'Daftar Lokasi Pengungsian Terverifikasi'
                    }
                    aside={
                        <Status tone="historical">
                            {roads ? 'P2' : 'P1'} · Belum tersedia
                        </Status>
                    }
                >
                    <EmptyState
                        title={
                            roads
                                ? 'Belum ada data pembatasan ruas jalan yang terverifikasi'
                                : 'Belum ada shelter pengungsian berstatus terverifikasi operasional'
                        }
                    >
                        {roads
                            ? 'Engine pgRouting dan tabel pembatasan jalan darurat belum diaktifkan pada backend saat ini. Sistem menolak menampilkan rute evakuasi otomatis yang belum diverifikasi petugas.'
                            : 'Titik bangunan historis tidak otomatis menjadi shelter aktif saat bencana. Kapasitas, logistik, dan keamanan struktur wajib dikonfirmasi oleh petugas BPBD/Dinas Sosial.'}
                    </EmptyState>
                </Panel>

                <div
                    className={
                        variant === 'b' ? 'space-y-4 lg:col-span-5' : 'dr-stack'
                    }
                >
                    <Panel
                        title="Kebijakan Keselamatan & Provenance"
                        subtitle="Mengapa sistem tidak menampilkan data contoh pada modul ini?"
                    >
                        <Notice>
                            Data tidak tersedia bukan berarti kondisi aman.
                            Ikuti informasi resmi dan arahan petugas setempat
                            (BNPB 117 / Basarnas 115 / DKI 112).
                        </Notice>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            Dalam situasi darurat bencana, mengarahkan warga ke
                            lokasi shelter atau rute jalan yang belum
                            terverifikasi dapat membahayakan keselamatan jiwa.
                            Oleh karena itu tombol navigasi di bawah dikunci
                            sampai feed operasional resmi aktif.
                        </p>
                        <Action disabled className="w-fit">
                            {roads ? (
                                <>
                                    <Route
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    <span>Simulasikan Rute Evakuasi</span>
                                </>
                            ) : (
                                <>
                                    <Home
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    <span>Navigasi ke Shelter</span>
                                </>
                            )}
                        </Action>
                    </Panel>

                    <Panel
                        className="forest"
                        title="Langkah Kesiapsiagaan yang Dapat Dilakukan Sekarang"
                    >
                        <p className="text-xs leading-relaxed text-forest-muted">
                            Siapkan titik kumpul keluarga mandiri pada halaman
                            Pusat Kesiapsiagaan dan pantau peringatan resmi BMKG
                            pada peta komando.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <Action variant="secondary" size="sm" asChild>
                                <Link href="/preparedness">
                                    <ShieldCheck
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>Pusat Kesiapsiagaan</span>
                                </Link>
                            </Action>
                            <Action variant="outline" size="sm" asChild>
                                <Link href="/reports/create">
                                    <FilePlus2
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>Lapor Kondisi Lapangan</span>
                                </Link>
                            </Action>
                        </div>
                    </Panel>
                </div>
            </div>
        </>
    );
}
