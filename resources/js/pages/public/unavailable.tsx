import { Head, Link } from '@inertiajs/react';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
export default function Unavailable({ feature }: { feature: string }) {
    const roads = feature.includes('road');
    const title = roads ? 'Pembatasan Ruas & Simulasi' : 'Kandidat Shelter';
    return (
        <>
            <Head title={title} />
            <PageHeading
                title={title}
                description="Ketersediaan data dan verifikasi ditampilkan secara eksplisit."
            />
            <div className="dr-two-col">
                <Panel
                    title={
                        roads ? 'Ruas Jalan & Penutupan' : 'Lokasi Pengungsian'
                    }
                >
                    <Status tone="historical">
                        {roads ? 'P2' : 'P1'} · Belum tersedia
                    </Status>
                    <EmptyState
                        title={
                            roads
                                ? 'Belum ada data pembatasan yang terverifikasi'
                                : 'Belum ada shelter terverifikasi operasional'
                        }
                    >
                        Lokasi historis tidak otomatis aktif. Kapasitas, akses,
                        dan status harus dikonfirmasi oleh petugas.
                    </EmptyState>
                </Panel>
                <div className="dr-stack">
                    <Panel title="Verifikasi & Provenance">
                        <Notice>
                            Data tidak tersedia bukan berarti kondisi aman.
                            Ikuti informasi resmi dan arahan petugas setempat.
                        </Notice>
                        <p className="dr-muted dr-caption">
                            Modul ini belum menerima sumber operasional yang
                            disetujui. Tidak ada status, koordinat shelter, atau
                            rute yang dibuat sebagai contoh.
                        </p>
                        <Action disabled>
                            {roads ? 'Simulasikan Rute' : 'Navigasi ke Shelter'}
                        </Action>
                    </Panel>
                    <Panel
                        className="forest"
                        title="Siapkan langkah yang bisa dilakukan"
                    >
                        <Link href="/preparedness">
                            Baca panduan kesiapsiagaan ↗
                        </Link>
                        <Link href="/map">Periksa data resmi pada peta ↗</Link>
                    </Panel>
                </div>
            </div>
        </>
    );
}
