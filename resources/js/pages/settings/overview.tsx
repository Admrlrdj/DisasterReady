import { Head, Link } from '@inertiajs/react';
import { Action, PageHeading, Panel, Status } from '@/components/disaster/ui';
import { useAppearance } from '@/hooks/use-appearance';
export default function Settings() {
    const { appearance, updateAppearance } = useAppearance();
    return (
        <>
            <Head title="Pengaturan" />
            <PageHeading
                title="Pengaturan"
                description="Sesuaikan tampilan dan kelola keamanan akun."
            />
            <div className="dr-two-col">
                <Panel title="Preferensi Tampilan">
                    <fieldset className="dr-field">
                        <legend>Tema aplikasi</legend>
                        <div className="dr-choices">
                            {(['light', 'dark', 'system'] as const).map(
                                (mode) => (
                                    <button
                                        type="button"
                                        aria-pressed={appearance === mode}
                                        key={mode}
                                        className={`dr-choice ${appearance === mode ? 'active' : ''}`}
                                        onClick={() => updateAppearance(mode)}
                                    >
                                        {mode === 'light'
                                            ? 'Terang'
                                            : mode === 'dark'
                                              ? 'Gelap'
                                              : 'Ikuti Perangkat'}
                                    </button>
                                ),
                            )}
                        </div>
                    </fieldset>
                    <p className="dr-caption dr-muted">
                        Tema disimpan pada perangkat ini. Wilayah prakiraan
                        dipilih langsung pada halaman cuaca.
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
                    <Status tone="simulation">
                        AI deterministik · simulasi
                    </Status>
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
