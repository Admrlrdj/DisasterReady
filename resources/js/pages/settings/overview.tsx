import { Head, Link } from '@inertiajs/react';
import { Action, PageHeading, Panel } from '@/components/disaster/ui';
export default function Settings() {
    return (
        <>
            <Head title="Pengaturan" />
            <PageHeading
                title="Pengaturan"
                description="Sesuaikan tampilan dan kelola keamanan akun."
            />
            <div className="dr-two-col">
                <Panel title="Preferensi Tampilan">
                    <p className="dr-caption dr-muted">
                        DisasterReady sementara menggunakan tema terang.
                    </p>
                    <div className="dr-actions">
                        <Action asChild>
                            <Link href="/settings/profile">Kelola Profil</Link>
                        </Action>
                        <Action variant="outline" asChild>
                            <Link href="/settings/security">Keamanan Akun</Link>
                        </Action>
                    </div>
                </Panel>
                <Panel className="forest" title="Privasi & Kualitas Data">
                    <p>
                        Laporan dan foto ditinjau melalui akses privat.
                        Keputusan verifikasi tetap di tangan moderator.
                    </p>
                    <p className="dr-caption">
                        Kesegaran data mengikuti waktu sumber dan sinkronisasi,
                        bukan tema atau preferensi perangkat.
                    </p>
                </Panel>
            </div>
        </>
    );
}
