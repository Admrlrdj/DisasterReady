import { Head, Link } from '@inertiajs/react';
import { Layers, Lock, Pause, Play, ShieldCheck, User } from 'lucide-react';
import { Action, PageHeading, Panel, Status } from '@/components/disaster/ui';
import { useAppearance } from '@/hooks/use-appearance';
import {
    PAGE_VARIANTS,
    usePageVariant,
    type PageVariant,
} from '@/hooks/use-page-variant';
import { cn } from '@/lib/utils';

export default function Settings() {
    const { appearance, updateAppearance } = useAppearance();
    const { variant, setVariant, auroraPaused, toggleAuroraPaused } =
        usePageVariant();

    return (
        <>
            <Head title="Pengaturan & Preferensi" />
            <PageHeading
                eyebrow="FR-16 · Konfigurasi Perangkat & Akun"
                title="Pengaturan Akun & Model Tampilan"
                description="Sesuaikan tema warna, pilih model tata letak halaman (Versi A, B, atau C), dan kelola keamanan akun Anda."
            >
                <Action variant="outline" size="sm" asChild>
                    <Link href="/settings/profile">
                        <User className="size-3.5" aria-hidden="true" />
                        <span>Profil Akun</span>
                    </Link>
                </Action>
                <Action size="sm" asChild>
                    <Link href="/settings/security">
                        <Lock className="size-3.5" aria-hidden="true" />
                        <span>Keamanan, 2FA & Passkey</span>
                    </Link>
                </Action>
            </PageHeading>

            <div className="dr-two-col">
                <Panel
                    title="Preferensi Tampilan & Model UI (3 Versi)"
                    subtitle="Pilihan disimpan secara lokal pada perangkat ini."
                >
                    <fieldset className="dr-field">
                        <legend className="text-xs font-bold text-foreground">
                            Tema Warna Aplikasi
                        </legend>
                        <div className="dr-choices pt-1">
                            {(['light', 'dark', 'system'] as const).map(
                                (mode) => (
                                    <button
                                        type="button"
                                        aria-pressed={appearance === mode}
                                        key={mode}
                                        className={cn(
                                            'dr-choice cursor-pointer',
                                            appearance === mode && 'active',
                                        )}
                                        onClick={() => updateAppearance(mode)}
                                    >
                                        {mode === 'light'
                                            ? 'Terang (Field Daylight)'
                                            : mode === 'dark'
                                              ? 'Gelap (Night-Watch Posko)'
                                              : 'Ikuti Perangkat'}
                                    </button>
                                ),
                            )}
                        </div>
                    </fieldset>

                    <fieldset className="dr-field">
                        <legend className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <Layers
                                className="size-3.5 text-primary"
                                aria-hidden="true"
                            />
                            <span>
                                Model Tata Letak Halaman (3 Versi Pilihan)
                            </span>
                        </legend>
                        <div className="grid grid-cols-1 gap-2.5 pt-1">
                            {PAGE_VARIANTS.map((item) => {
                                const active = variant === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() =>
                                            setVariant(item.id as PageVariant)
                                        }
                                        className={cn(
                                            'pressable flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                            active
                                                ? 'border-primary bg-secondary text-foreground shadow-xs'
                                                : 'border-border/80 bg-background/70 text-foreground hover:bg-secondary/50',
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <strong className="text-xs font-bold">
                                                {item.shortLabel} · {item.name}
                                            </strong>
                                            {active && (
                                                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                                                    Aktif
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {item.summary}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/70 p-3 text-xs">
                        <div>
                            <strong className="block text-foreground">
                                Animasi Latar Hydro-Aurora (WCAG 2.2.2)
                            </strong>
                            <span className="text-muted-foreground">
                                Status saat ini:{' '}
                                {auroraPaused ? 'Dijeda (Statis)' : 'Aktif'}
                            </span>
                        </div>
                        <Action
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={toggleAuroraPaused}
                        >
                            {auroraPaused ? (
                                <>
                                    <Play
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>Putar Aurora</span>
                                </>
                            ) : (
                                <>
                                    <Pause
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>Jedakan Aurora</span>
                                </>
                            )}
                        </Action>
                    </div>
                </Panel>
                <div className="dr-stack">
                    <Panel
                        title="Profil & Keamanan Akun"
                        subtitle="Autentikasi Laravel Fortify, 2FA TOTP, dan Passkey"
                    >
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            Amankan akun pelapor atau moderator Anda dengan
                            autentikasi dua faktor (2FA) dan kunci sandi
                            biometrik (Passkey WebAuthn).
                        </p>
                        <div className="dr-actions">
                            <Action size="sm" asChild>
                                <Link href="/settings/profile">
                                    Kelola Profil
                                </Link>
                            </Action>
                            <Action variant="outline" size="sm" asChild>
                                <Link href="/settings/security">
                                    Keamanan & Passkey
                                </Link>
                            </Action>
                        </div>
                    </Panel>

                    <Panel
                        className="forest"
                        title="Privasi & Tata Kelola Data"
                    >
                        <div className="flex items-center gap-2">
                            <ShieldCheck
                                className="size-4 text-alert-amber"
                                aria-hidden="true"
                            />
                            <Status tone="simulation">
                                Triase Terkawal · Audit Penuh
                            </Status>
                        </div>
                        <p className="text-xs leading-relaxed text-forest-muted">
                            Laporan warga dan foto bukti ditinjau melalui akses
                            privat. Keputusan verifikasi tetap di tangan
                            moderator manusia dan dicatat dalam audit log.
                            Kesegaran data mengikuti waktu sumber dan
                            sinkronisasi, bukan preferensi perangkat.
                        </p>
                    </Panel>
                </div>
            </div>
        </>
    );
}
