import { Link, usePage } from '@inertiajs/react';
import { PhoneCall, ShieldCheck } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    GlobalAuroraBackdrop,
    PageVariantSwitcherBar,
} from '@/components/disaster/global-aurora-backdrop';
import { usePageVariant } from '@/hooks/use-page-variant';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const ACCESS_HIGHLIGHTS = [
    {
        title: 'Sumber Resmi Terpisah',
        desc: 'BMKG Open Data, CAP XML, BNPB InaRISK, dan PVMBG MAGMA tampil dengan atribusi serta masa berlaku jelas.',
    },
    {
        title: 'Pelaporan Warga Terverifikasi',
        desc: 'Laporan lapangan masuk antrean moderasi dan tidak pernah menggantikan peringatan dini resmi pemerintah.',
    },
    {
        title: 'Autentikasi Aman',
        desc: 'Mendukung sesi server-side Laravel Fortify, autentikasi dua faktor, serta login cepat dengan Passkey.',
    },
] as const;

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;
    const { variant } = usePageVariant();

    return (
        <div
            data-ui-variant={variant}
            className="relative grid min-h-dvh flex-col items-center justify-center bg-transparent px-4 py-6 sm:px-6 lg:max-w-none lg:grid-cols-2 lg:px-0 lg:py-0"
        >
            <GlobalAuroraBackdrop intensity="landing" />

            {/* Left Brand & Emergency Panel */}
            <div
                className={cn(
                    'relative hidden h-full flex-col justify-between overflow-hidden p-10 text-white lg:flex dark:border-r dark:border-border',
                    variant === 'b'
                        ? 'bg-forest-fixed/96'
                        : variant === 'c'
                          ? 'border-r-2 border-r-foreground bg-forest-fixed/92'
                          : 'bg-forest-fixed/88 backdrop-blur-md',
                )}
            >
                {/* Domain-authentic hydrological contour motif */}
                <svg
                    viewBox="0 0 600 800"
                    fill="none"
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 size-full opacity-20"
                >
                    <path
                        d="M-40 160 C120 120, 260 220, 420 170 C520 140, 580 180, 650 150"
                        stroke="#45BEBD"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M-40 230 C130 190, 270 280, 440 230 C540 200, 590 245, 650 220"
                        stroke="#45BEBD"
                        strokeWidth="1.2"
                    />
                    <path
                        d="M-40 620 C140 570, 290 670, 460 610 C550 580, 600 625, 650 590"
                        stroke="#7FC1F0"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M-40 690 C150 640, 300 735, 475 680 C560 655, 600 695, 650 665"
                        stroke="#7FC1F0"
                        strokeWidth="1.2"
                    />
                </svg>

                <Link
                    href={home()}
                    className="relative z-20 flex w-fit items-center gap-2.5 rounded-lg text-base font-bold tracking-tight focus-visible:ring-2 focus-visible:ring-alert-amber focus-visible:outline-none"
                >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-white/12">
                        <AppLogoIcon
                            className="size-5 text-white"
                            beaconColor="var(--tidal-400)"
                        />
                    </span>
                    <span>{name || 'DisasterReady'}</span>
                </Link>

                <div className="relative z-20 max-w-md space-y-6">
                    <div className="space-y-2.5">
                        <h2 className="heading-display text-3xl font-bold">
                            Akses ruang pantauan dan kesiapsiagaan kebencanaan.
                        </h2>
                        <p className="prose-pretty text-sm leading-relaxed text-forest-muted">
                            Masuk untuk memantau peringatan multi-bahaya,
                            menyimpan rencana darurat keluarga, dan melaporkan
                            kondisi lapangan secara bertanggung jawab.
                        </p>
                    </div>

                    <ul className="space-y-3 rounded-2xl border border-white/15 bg-white/7 p-5">
                        {ACCESS_HIGHLIGHTS.map((item) => (
                            <li
                                key={item.title}
                                className="flex items-start gap-2.5 text-xs"
                            >
                                <ShieldCheck
                                    className="mt-0.5 size-4 shrink-0 text-alert-amber"
                                    aria-hidden="true"
                                />
                                <div>
                                    <p className="font-semibold text-white">
                                        {item.title}
                                    </p>
                                    <p className="mt-0.5 leading-relaxed text-forest-muted">
                                        {item.desc}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative z-20 flex items-center gap-2 text-xs font-semibold text-alert-amber tabular-nums">
                    <PhoneCall className="size-3.5" aria-hidden="true" />
                    <span>
                        Kontak darurat resmi: BNPB 117 · Basarnas 115 · DKI 112
                    </span>
                </div>
            </div>

            {/* Right Form Stage with 3-Version Variant Switcher */}
            <div className="w-full space-y-4 lg:p-8">
                <div className="mx-auto w-full max-w-md">
                    <PageVariantSwitcherBar pageLabel="Autentikasi" compact />
                </div>

                <div
                    className={cn(
                        'mx-auto w-full max-w-md',
                        variant === 'a' && 'matted-frame',
                    )}
                >
                    <div
                        className={cn(
                            'flex flex-col justify-center space-y-6 p-6 sm:p-8',
                            variant === 'a' &&
                                'matted-inner border border-border/70 bg-card/88 backdrop-blur-md',
                            variant === 'b' &&
                                'rounded-xl border-2 border-primary/35 bg-card/94 shadow-lg backdrop-blur-md',
                            variant === 'c' &&
                                'rounded-none border-t-4 border-b border-t-foreground border-b-border bg-card/86 backdrop-blur-md',
                        )}
                    >
                        <Link
                            href={home()}
                            className="relative z-20 flex items-center justify-center gap-2 font-bold text-foreground lg:hidden"
                        >
                            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                <AppLogoIcon className="size-5" />
                            </span>
                            <span>{name || 'DisasterReady'}</span>
                        </Link>
                        <div className="flex flex-col items-start gap-1.5 text-left">
                            <h1 className="heading-section text-xl font-bold text-foreground">
                                {title}
                            </h1>
                            <p className="prose-pretty text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
