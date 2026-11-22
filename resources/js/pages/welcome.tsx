import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    BellRing,
    CloudLightning,
    FilePlus2,
    Map,
    Moon,
    PhoneCall,
    RotateCcw,
    Search,
    Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    CommandPaletteModal,
    InteractiveSiagaMatrix,
} from '@/components/disaster/command-palette';
import {
    GlobalAuroraBackdrop,
    PageVariantSwitcherBar,
} from '@/components/disaster/global-aurora-backdrop';
import {
    HazardChipBadge,
    HazardSvgIcon,
    inferRecordHazard,
    inferRecordSiagaTier,
} from '@/components/disaster/hazard-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IntroScreen } from '@/features/disaster/components/intro-screen';
import { useAppearance } from '@/hooks/use-appearance';
import { usePageVariant } from '@/hooks/use-page-variant';
import {
    dateTime,
    recordLink,
    statusLabels,
    stringValue,
    type Contact,
    type Overview,
} from '@/lib/disaster';
import { dashboard, login, register } from '@/routes';
import type { Hazard } from '@/types/disaster';

const INTRO_SESSION_KEY = 'disasterready_intro_seen_v2';

const FALLBACK_CONTACTS: Contact[] = [
    {
        name: 'BNPB',
        phone: '117',
        source_url: 'https://www.bnpb.go.id/kontak',
        verified_at: '2026-11-22T00:00:00Z',
    },
    {
        name: 'Basarnas',
        phone: '115',
        source_url:
            'https://balikpapan.basarnas.go.id/berita/informasi-layanan-kontak-darurat-dan-hotline-basarnas-balikpapan',
        verified_at: '2026-11-22T00:00:00Z',
    },
    {
        name: 'Jakarta Siaga',
        phone: '112',
        source_url: 'https://www.jakarta.go.id/jakarta-siaga-112',
        verified_at: '2026-11-22T00:00:00Z',
    },
];

const CORE_MODULES = [
    {
        code: '01',
        fr: 'FR-01 · FR-02 · FR-06',
        title: 'Pusat Komando & Peta Multi-Bencana Terpadu',
        description:
            'Menyatukan pantauan nasional dan peta GeoJSON PostGIS dalam satu kanvas komando. Seluruh titik gempa, poligon CAP, prakiraan cuaca, dan gunung api tampil dengan ikon SVG khusus tiap bencana serta indikator status siaga.',
        href: '/dashboard',
        cta: 'Buka Pusat Komando',
        hazard: 'flood' as Hazard,
        badges: [
            'MapLibre + PostGIS',
            '7 Ikon SVG Bencana',
            'InaRISK: Kajian Historis',
        ],
        spanClass: 'lg:col-span-7',
    },
    {
        code: '02',
        fr: 'FR-03 · FR-04 · FR-05',
        title: 'Seismologi Gempa, Cuaca adm4 & Arsip CAP BMKG',
        description:
            'Menggabungkan feed gempa terkini, dirasakan, dan autogempa BMKG beserta prakiraan cuaca 3 jam kelurahan pilot Jatinegara dan riwayat peringatan dini CAP XML dengan status masa berlaku jelas.',
        href: '/earthquakes',
        cta: 'Buka Feed BMKG',
        hazard: 'earthquake' as Hazard,
        badges: ['effective_at · expires_at', 'Pilot Jatinegara adm4'],
        spanClass: 'lg:col-span-5',
    },
    {
        code: '03',
        fr: 'FR-09 · FR-10 · AI-01 · AI-02',
        title: 'Pelaporan Warga Privat, Triase AI & Moderasi Manusia',
        description:
            'Laporan warga disimpan berstatus PENDING dengan foto bukti privat tanpa metadata EXIF. Ekstraksi AI-01 dan deteksi duplikat PostGIS AI-02 hanya memberi saran kepada moderator manusia dan tidak pernah menerbitkan peringatan resmi.',
        href: '/reports/create',
        cta: 'Kirim Laporan Warga',
        hazard: 'landslide' as Hazard,
        badges: ['Strip EXIF Server', 'Audit Transaksional'],
        spanClass: 'lg:col-span-5',
    },
    {
        code: '04',
        fr: 'FR-07 · FR-08',
        title: 'Pusat Kesiapsiagaan, Gunung Api PVMBG & Rencana Keluarga',
        description:
            'Panduan kesiapsiagaan hanya tampil setelah ditinjau admin disertai rujukan HTTPS resmi. Dilengkapi arsip pengamatan PVMBG MAGMA (Anak Krakatau, Merapi, Semeru) serta checklist Tas Siaga lokal di perangkat.',
        href: '/preparedness',
        cta: 'Buka Kesiapsiagaan',
        hazard: 'volcano' as Hazard,
        badges: [
            'Ditinjau Manusia',
            'Arsip PVMBG MAGMA',
            'LocalStorage Offline',
        ],
        spanClass: 'lg:col-span-7',
    },
] as const;

export default function Welcome({ overview }: { overview?: Overview }) {
    const { auth, emergency_contacts } = usePage().props;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { variant } = usePageVariant();
    const [showIntro, setShowIntro] = useState(false);
    const [commandOpen, setCommandOpen] = useState(false);

    useEffect(() => {
        try {
            if (window.sessionStorage.getItem(INTRO_SESSION_KEY) !== '1') {
                setShowIntro(true);
            }
        } catch {
            setShowIntro(true);
        }
    }, []);

    const contacts =
        emergency_contacts && emergency_contacts.length > 0
            ? emergency_contacts
            : FALLBACK_CONTACTS;

    const liveActiveAlertsCount = overview?.active_alert_count ?? 0;
    const earthquakeCount = overview?.events.length ?? 0;
    const forecastCount = (overview?.forecasts ?? []).filter(
        (f) => !f.expired,
    ).length;
    const sources = overview?.sources ?? [];
    const freshSourcesCount = sources.filter(
        (s) => s.freshness === 'FRESH',
    ).length;
    const hasFailedSource = sources.some((s) => s.freshness === 'FAILED');

    const activeAlerts = (overview?.alerts ?? []).filter(
        (a) => a.alert_state === 'ACTIVE',
    );
    const previewRecords =
        activeAlerts.length > 0
            ? activeAlerts.slice(0, 4)
            : (overview?.events ?? []).slice(0, 4);

    const nextForecast =
        (overview?.forecasts ?? []).find((f) => !f.expired) ?? null;
    const nextForecastData = (nextForecast?.data ?? {}) as Record<
        string,
        unknown
    >;
    const pilotRegionName =
        overview?.regions?.[overview.region] ?? 'Kampung Melayu';

    const statusBadge =
        liveActiveAlertsCount > 0
            ? {
                  label: `${liveActiveAlertsCount} Peringatan CAP Aktif`,
                  className:
                      'bg-status-waspada-solid text-status-waspada-on-solid font-bold',
              }
            : hasFailedSource
              ? {
                    label: 'Sebagian Sumber Gagal',
                    className: 'bg-danger-soft text-destructive font-semibold',
                }
              : freshSourcesCount > 0
                ? {
                      label: `${freshSourcesCount}/${sources.length} Sumber Terbarui`,
                      className:
                          'bg-verified-soft text-foreground font-semibold',
                  }
                : {
                      label: 'Sumber Belum Sinkron',
                      className:
                          'bg-brand-bronze-soft text-brand-bronze-text font-semibold',
                  };

    const handleIntroComplete = () => {
        try {
            window.sessionStorage.setItem(INTRO_SESSION_KEY, '1');
        } catch {
            // Ignore restricted storage
        }
        setShowIntro(false);
    };

    const handleReplayIntro = () => {
        setShowIntro(true);
    };

    return (
        <>
            <Head title="Pantauan Multi-Bencana Indonesia" />

            {showIntro && <IntroScreen onComplete={handleIntroComplete} />}

            <div
                data-ui-variant={variant}
                className="relative min-h-screen bg-transparent text-foreground"
            >
                <GlobalAuroraBackdrop intensity="landing" />

                {/* 56px precision 3-zone header */}
                <header className="sticky top-0 z-30 h-14 border-b border-border/80 bg-background/85 backdrop-blur-md">
                    <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-1.5 px-3 sm:gap-4 sm:px-6">
                        <a
                            href="#top"
                            className="flex min-w-0 shrink-0 items-center gap-1.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:gap-2.5"
                        >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs sm:size-8">
                                <AppLogoIcon className="size-4 sm:size-4.5" />
                            </span>
                            <span className="text-[13px] font-bold tracking-tight sm:text-sm">
                                DisasterReady
                            </span>
                        </a>

                        <nav
                            aria-label="Navigasi bagian halaman"
                            className="hidden items-center gap-5 text-xs font-semibold text-muted-foreground md:flex"
                        >
                            <a
                                href="#ringkasan"
                                className="transition-colors duration-150 hover:text-foreground"
                            >
                                Ringkasan Pantauan
                            </a>
                            <a
                                href="#simulasi-siaga"
                                className="transition-colors duration-150 hover:text-foreground"
                            >
                                Standar Siaga & 7 Bahaya
                            </a>
                            <a
                                href="#modul"
                                className="transition-colors duration-150 hover:text-foreground"
                            >
                                Modul Sistem
                            </a>
                            <a
                                href="#darurat"
                                className="transition-colors duration-150 hover:text-foreground"
                            >
                                Kontak Darurat
                            </a>
                        </nav>

                        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                            <button
                                type="button"
                                onClick={() => setCommandOpen(true)}
                                aria-label="Buka pencarian cepat (Ctrl+K)"
                                title="Cari halaman & komando cepat (Ctrl+K)"
                                className="hidden h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:inline-flex"
                            >
                                <Search
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                <span>Komando</span>
                                <kbd className="rounded border border-border bg-muted px-1 text-[10px]">
                                    Ctrl+K
                                </kbd>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    updateAppearance(
                                        resolvedAppearance === 'dark'
                                            ? 'light'
                                            : 'dark',
                                    )
                                }
                                aria-label="Ubah tema tampilan"
                                title="Ubah tema terang / gelap"
                                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:size-9"
                            >
                                <Sun
                                    className="hidden size-4 dark:block"
                                    aria-hidden="true"
                                />
                                <Moon
                                    className="block size-4 dark:hidden"
                                    aria-hidden="true"
                                />
                            </button>

                            {auth.user ? (
                                <Button
                                    asChild
                                    size="sm"
                                    className="rounded-full px-3 font-semibold whitespace-nowrap sm:px-4"
                                >
                                    <Link href={dashboard()}>Buka Komando</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="ghost"
                                        className="rounded-full px-2 text-xs font-semibold whitespace-nowrap sm:px-3.5"
                                    >
                                        <Link href={login()}>Masuk</Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="rounded-full px-2.5 text-xs font-semibold whitespace-nowrap sm:px-4"
                                    >
                                        <Link href={register()}>
                                            Daftar
                                            <span className="hidden min-[400px]:inline">
                                                {' '}
                                                Warga
                                            </span>
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main
                    id="top"
                    className="mx-auto max-w-6xl space-y-12 px-4 py-6 sm:space-y-14 sm:px-6 sm:py-10"
                >
                    {/* 3-Version Selector Bar (Versi A / Versi B / Versi C) */}
                    <PageVariantSwitcherBar
                        pageLabel="Landing Page"
                        onReplayIntro={handleReplayIntro}
                    />

                    {/* =========================================================
                        VERSION A: ATMOSPHERIC CLEAN (Asymmetric 7/5 Glass Hero)
                       ========================================================= */}
                    {variant === 'a' && (
                        <section
                            id="ringkasan"
                            className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center lg:gap-10"
                        >
                            <div className="space-y-5 lg:col-span-7">
                                <h1 className="heading-display text-3xl font-bold text-foreground sm:text-[2.65rem]">
                                    Pusat komando multi-bencana dan peringatan
                                    dini resmi dalam satu peta terpadu.
                                </h1>
                                <p className="prose-pretty max-w-xl text-base leading-relaxed text-muted-foreground">
                                    DisasterReady menggabungkan peta
                                    multi-bahaya GeoJSON PostGIS, peringatan
                                    resmi BMKG CAP XML, laporan gunung api PVMBG
                                    MAGMA, kajian historis BNPB InaRISK, serta
                                    pelaporan warga bermoderasi manusia untuk
                                    pantauan nasional dan wilayah pilot
                                    Jatinegara.
                                </p>

                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="rounded-full px-6 font-semibold shadow-sm"
                                    >
                                        <Link href={dashboard()}>
                                            <span>
                                                Buka Pusat Komando & Peta
                                            </span>
                                            <ArrowRight
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="rounded-full bg-card/75 px-5 font-semibold backdrop-blur-xs"
                                    >
                                        <Link href="/reports/create">
                                            Kirim Laporan Warga
                                        </Link>
                                    </Button>
                                </div>

                                {/* Quick Hazard Jump Pills with Custom SVG Icons */}
                                <div className="flex flex-wrap items-center gap-2 border-t border-border/80 pt-4">
                                    {(
                                        [
                                            [
                                                'earthquake',
                                                'BMKG Gempa & CAP',
                                                '/earthquakes',
                                            ],
                                            [
                                                'flood',
                                                'Peta Multi-Bahaya',
                                                '/map',
                                            ],
                                            [
                                                'volcano',
                                                'PVMBG MAGMA',
                                                '/volcanoes',
                                            ],
                                            [
                                                'extreme_weather',
                                                'Cuaca & CAP XML',
                                                '/weather',
                                            ],
                                        ] as const
                                    ).map(([hz, label, href]) => (
                                        <Link
                                            key={href}
                                            href={href}
                                            className="pressable inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur-xs transition-colors hover:border-primary/50 hover:text-primary"
                                        >
                                            <HazardSvgIcon
                                                hazard={hz}
                                                className="size-3.5 text-primary"
                                            />
                                            <span>{label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="matted-frame lg:col-span-5">
                                <div className="matted-inner space-y-4 border border-border/75 bg-card/88 p-5 backdrop-blur-md">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="overline-label text-muted-foreground">
                                            Telemetri Server Real-Time
                                        </p>
                                        <Badge
                                            className={statusBadge.className}
                                        >
                                            {statusBadge.label}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2.5">
                                        <div className="rounded-xl bg-verified-soft p-3">
                                            <p className="text-[11px] font-medium text-muted-foreground">
                                                CAP Aktif
                                            </p>
                                            <p className="mt-1 text-2xl font-bold tracking-[-0.03em] text-foreground tabular-nums">
                                                {String(
                                                    liveActiveAlertsCount,
                                                ).padStart(2, '0')}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-alert-amber-soft p-3">
                                            <p className="text-[11px] font-medium text-alert-amber-text">
                                                Gempa BMKG
                                            </p>
                                            <p className="mt-1 text-2xl font-bold tracking-[-0.03em] text-alert-amber-text tabular-nums">
                                                {String(
                                                    earthquakeCount,
                                                ).padStart(2, '0')}
                                            </p>
                                        </div>
                                        <div className="rounded-xl bg-secondary p-3">
                                            <p className="text-[11px] font-medium text-muted-foreground">
                                                Slot Cuaca
                                            </p>
                                            <p className="mt-1 text-2xl font-bold tracking-[-0.03em] text-foreground tabular-nums">
                                                {String(forecastCount).padStart(
                                                    2,
                                                    '0',
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {previewRecords.length > 0 ? (
                                        <ul className="divide-y divide-border/70 border-t border-border pt-1 text-xs">
                                            {previewRecords.map((item) => {
                                                const hz =
                                                    inferRecordHazard(item);
                                                const tier =
                                                    inferRecordSiagaTier(item);
                                                return (
                                                    <li
                                                        key={`${item.kind}-${item.id}`}
                                                        className="py-2.5"
                                                    >
                                                        <Link
                                                            href={recordLink(
                                                                item,
                                                            )}
                                                            className="flex items-center justify-between gap-2 rounded-md hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                                        >
                                                            <span className="min-w-0 truncate font-semibold text-foreground">
                                                                {item.title}
                                                            </span>
                                                            <HazardChipBadge
                                                                hazard={hz}
                                                                tier={tier}
                                                                showTier={false}
                                                                className="shrink-0"
                                                            />
                                                        </Link>
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                                                            {item.source.agency}{' '}
                                                            ·{' '}
                                                            {dateTime(
                                                                item.source_time,
                                                            )}
                                                        </p>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-input bg-muted/40 p-3.5 text-xs text-muted-foreground">
                                            <p className="font-semibold text-foreground">
                                                Belum ada catatan BMKG tersimpan
                                                di server.
                                            </p>
                                            <p className="mt-1">
                                                Ketiadaan data bukan indikasi
                                                kondisi aman. Periksa portal
                                                resmi BMKG atau buka peta
                                                multi-bahaya.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-2 rounded-xl bg-muted/70 p-3 text-xs text-muted-foreground">
                                        <AlertTriangle
                                            className="mt-0.5 size-3.5 shrink-0 text-alert-amber-text"
                                            aria-hidden="true"
                                        />
                                        <p>
                                            Bukan pengganti peringatan resmi
                                            pemerintah. Data kedaluwarsa atau
                                            sumber nonaktif ditampilkan secara
                                            eksplisit.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* =========================================================
                        VERSION B: TACTICAL COMMAND (3-Column Operations Console)
                       ========================================================= */}
                    {variant === 'b' && (
                        <section
                            id="ringkasan"
                            className="space-y-4 rounded-2xl border border-border/90 bg-card/90 p-5 shadow-sm backdrop-blur-md sm:p-6"
                        >
                            {/* Top Telemetry Ribbon */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3.5 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={statusBadge.className}>
                                        {statusBadge.label}
                                    </Badge>
                                    <span className="font-semibold text-foreground">
                                        POSKO KOMANDO MULTI-BAHAYA · INDONESIA
                                    </span>
                                </div>
                                <span className="text-muted-foreground tabular-nums">
                                    Pilot Wilayah: {pilotRegionName} (adm4{' '}
                                    {overview?.region ?? '31.75.03.1001'})
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                                {/* Col 1: Tactical Headline & Dispatch */}
                                <div className="flex flex-col justify-between gap-4 lg:col-span-5">
                                    <div className="space-y-3">
                                        <h1 className="heading-display text-2xl font-bold text-foreground sm:text-3xl">
                                            Konsol Terpadu Pemantauan Bencana,
                                            Peta PostGIS, dan Triase Laporan.
                                        </h1>
                                        <p className="text-sm leading-relaxed text-muted-foreground">
                                            Memisahkan telemetri resmi BMKG
                                            (gempa, CAP XML, cuaca), kajian
                                            risiko BNPB InaRISK, dan arsip PVMBG
                                            MAGMA dari laporan warga yang wajib
                                            melewati verifikasi moderator.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <Button
                                            asChild
                                            className="rounded-xl font-semibold"
                                        >
                                            <Link href={dashboard()}>
                                                <Map
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                                <span>
                                                    Pusat Komando & Peta
                                                </span>
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="rounded-xl font-semibold"
                                        >
                                            <Link href="/reports/create">
                                                <FilePlus2
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                                <span>Lapor Kejadian</span>
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                {/* Col 2: Live Metrics & Latest Feed */}
                                <div className="space-y-3 rounded-xl border border-border bg-background/75 p-4 lg:col-span-4">
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="rounded-lg border border-border/70 bg-card p-2.5">
                                            <span className="block text-xl font-bold text-foreground tabular-nums">
                                                {String(
                                                    liveActiveAlertsCount,
                                                ).padStart(2, '0')}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                CAP Aktif
                                            </span>
                                        </div>
                                        <div className="rounded-lg border border-border/70 bg-card p-2.5">
                                            <span className="block text-xl font-bold text-alert-amber-text tabular-nums">
                                                {String(
                                                    earthquakeCount,
                                                ).padStart(2, '0')}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                Gempa
                                            </span>
                                        </div>
                                        <div className="rounded-lg border border-border/70 bg-card p-2.5">
                                            <span className="block text-xl font-bold text-primary tabular-nums">
                                                {String(
                                                    sources.length,
                                                ).padStart(2, '0')}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">
                                                Adapter
                                            </span>
                                        </div>
                                    </div>

                                    {previewRecords.length > 0 ? (
                                        <div className="divide-y divide-border/70 text-xs">
                                            {previewRecords
                                                .slice(0, 3)
                                                .map((rec) => (
                                                    <Link
                                                        key={`${rec.kind}-${rec.id}`}
                                                        href={recordLink(rec)}
                                                        className="flex items-center justify-between gap-2 py-2 hover:text-primary"
                                                    >
                                                        <span className="truncate font-semibold">
                                                            {rec.title}
                                                        </span>
                                                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                                                            {dateTime(
                                                                rec.source_time,
                                                                true,
                                                            )}
                                                        </span>
                                                    </Link>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                                            Belum ada catatan BMKG di database.
                                            Ketiadaan data bukan kondisi aman.
                                        </p>
                                    )}
                                </div>

                                {/* Col 3: Source Health & Pilot Weather */}
                                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-background/75 p-4 text-xs lg:col-span-3">
                                    <div className="space-y-2">
                                        <p className="overline-label text-muted-foreground">
                                            Status Adapter Sumber
                                        </p>
                                        {sources.length > 0 ? (
                                            sources.map((src) => (
                                                <div
                                                    key={src.id}
                                                    className="flex items-center justify-between gap-2"
                                                >
                                                    <span className="truncate font-medium text-foreground">
                                                        {src.name}
                                                    </span>
                                                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                                        {statusLabels[
                                                            src.freshness
                                                        ] ?? src.freshness}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground">
                                                Adapter menunggu konfigurasi
                                                database.
                                            </p>
                                        )}
                                    </div>

                                    <div className="border-t border-border pt-2.5">
                                        <span className="block text-[11px] text-muted-foreground">
                                            Cuaca Pilot ({pilotRegionName}):
                                        </span>
                                        <strong className="text-sm text-foreground tabular-nums">
                                            {nextForecast
                                                ? `${stringValue(nextForecastData.weather_desc, nextForecast.title)} · ${stringValue(nextForecastData.t, '-')} °C`
                                                : 'Menunggu sinkronisasi BMKG'}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* =========================================================
                        VERSION C: EDITORIAL MINIMALIST (Swiss Architectural Index)
                       ========================================================= */}
                    {variant === 'c' && (
                        <section
                            id="ringkasan"
                            className="space-y-8 border-t-2 border-b border-t-foreground border-b-border bg-card/78 px-4 py-8 backdrop-blur-md sm:px-6"
                        >
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
                                <div className="space-y-3 lg:col-span-8">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge
                                            className={statusBadge.className}
                                        >
                                            {statusBadge.label}
                                        </Badge>
                                        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                                            BMKG · BNPB InaRISK · PVMBG MAGMA
                                        </span>
                                    </div>
                                    <h1 className="heading-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
                                        Sistem Informasi Kebencanaan Terbuka &
                                        Peta Multi-Bahaya Indonesia.
                                    </h1>
                                </div>

                                <div className="space-y-4 lg:col-span-4">
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Setiap peringatan resmi, kajian risiko
                                        historis, dan laporan warga dipisahkan
                                        secara transparan dengan waktu sumber
                                        serta atribusi yang dapat diaudit.
                                    </p>
                                    <div className="flex flex-wrap gap-2.5">
                                        <Button
                                            asChild
                                            className="rounded-none px-5 font-semibold"
                                        >
                                            <Link href={dashboard()}>
                                                <span>Buka Pusat Komando</span>
                                                <ArrowRight
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="rounded-none px-4 font-semibold"
                                        >
                                            <Link href="/reports/create">
                                                Lapor Kejadian
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Architectural Ledger Bar */}
                            <div className="grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
                                <div>
                                    <span className="text-xs text-muted-foreground">
                                        Peringatan CAP Aktif
                                    </span>
                                    <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
                                        {String(liveActiveAlertsCount).padStart(
                                            2,
                                            '0',
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">
                                        Kejadian Gempa BMKG
                                    </span>
                                    <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
                                        {String(earthquakeCount).padStart(
                                            2,
                                            '0',
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">
                                        Slot Prakiraan Pilot
                                    </span>
                                    <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
                                        {String(forecastCount).padStart(2, '0')}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-muted-foreground">
                                        Adapter Sumber Resmi
                                    </span>
                                    <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
                                        {freshSourcesCount}/
                                        {sources.length || 4}
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* =========================================================
                        SUPERDESIGN INTERACTIVE COMPONENT:
                        4-Tier Siaga & 7 Custom SVG Hazard Matrix Simulator
                       ========================================================= */}
                    <section id="simulasi-siaga" className="space-y-3">
                        <InteractiveSiagaMatrix />
                    </section>

                    {/* =========================================================
                        CORE MODULES SECTION (Adapts layout across Versi A / B / C)
                       ========================================================= */}
                    <section id="modul" className="space-y-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="heading-section text-2xl font-bold text-foreground">
                                    Arsitektur Modul yang Memisahkan Data Resmi,
                                    Kajian Historis, dan Laporan Warga
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Seluruh halaman terhubung ke kontrak backend
                                    nyata tanpa angka atau peringatan fiktif.
                                </p>
                            </div>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                            >
                                <span>Buka Pusat Komando Terpadu</span>
                                <ArrowUpRight
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>

                        {variant === 'c' ? (
                            /* Version C: Editorial Numbered Index Table */
                            <div className="divide-y divide-border border-t-2 border-b border-t-foreground border-b-border bg-card/82 backdrop-blur-md">
                                {CORE_MODULES.map((mod) => (
                                    <Link
                                        key={mod.code}
                                        href={mod.href}
                                        className="group grid grid-cols-1 gap-4 p-5 transition-colors hover:bg-secondary/45 sm:grid-cols-12 sm:items-center"
                                    >
                                        <div className="flex items-center gap-3 sm:col-span-2">
                                            <span className="text-lg font-bold text-muted-foreground tabular-nums">
                                                {mod.code}
                                            </span>
                                            <span className="flex size-9 items-center justify-center border border-border bg-background text-primary">
                                                <HazardSvgIcon
                                                    hazard={mod.hazard}
                                                    className="size-4.5"
                                                />
                                            </span>
                                        </div>
                                        <div className="space-y-1 sm:col-span-7">
                                            <span className="text-[11px] font-semibold text-primary tabular-nums">
                                                {mod.fr}
                                            </span>
                                            <h3 className="text-base font-bold text-foreground group-hover:text-primary">
                                                {mod.title}
                                            </h3>
                                            <p className="text-xs leading-relaxed text-muted-foreground">
                                                {mod.description}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-3 sm:justify-end">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground group-hover:text-primary">
                                                <span>{mod.cta}</span>
                                                <ArrowUpRight
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            /* Version A & B: Asymmetric 12-Column Command Grid (7+5, 5+7) */
                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                                {CORE_MODULES.map((mod) => (
                                    <Link
                                        key={mod.code}
                                        href={mod.href}
                                        className={`surface-card surface-card-interactive group flex flex-col justify-between gap-5 bg-card/86 p-6 backdrop-blur-md ${
                                            variant === 'b'
                                                ? 'rounded-xl border border-border'
                                                : 'rounded-2xl'
                                        } ${mod.spanClass}`}
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="flex size-10 items-center justify-center rounded-xl bg-verified-soft text-primary">
                                                    <HazardSvgIcon
                                                        hazard={mod.hazard}
                                                        className="size-5"
                                                    />
                                                </span>
                                                <span className="rounded-full border border-border/80 bg-background/70 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                                                    {mod.fr}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary">
                                                {mod.title}
                                            </h3>
                                            <p className="prose-pretty max-w-xl text-sm leading-relaxed text-muted-foreground">
                                                {mod.description}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                            <div className="flex flex-wrap gap-1.5">
                                                {mod.badges.map((b) => (
                                                    <Badge
                                                        key={b}
                                                        variant="secondary"
                                                    >
                                                        {b}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                                                <span>{mod.cta}</span>
                                                <ArrowUpRight
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Hydro-Command Emergency Footer Bar */}
                    <section
                        id="darurat"
                        className="rounded-2xl bg-forest-fixed p-6 text-white shadow-md sm:p-8"
                    >
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-lg space-y-1.5">
                                <p className="overline-label flex items-center gap-2 text-alert-amber">
                                    <CloudLightning
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>Kontak Darurat Resmi Indonesia</span>
                                </p>
                                <h2 className="heading-section text-xl font-bold text-white">
                                    Dalam bahaya langsung, hubungi instansi
                                    resmi terlebih dahulu.
                                </h2>
                                <p className="text-sm text-forest-muted">
                                    DisasterReady membantu kesiapsiagaan dan
                                    agregasi sumber terbuka, bukan pengganti
                                    sistem peringatan dini resmi pemerintah.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                {contacts.map((c) => (
                                    <a
                                        key={c.phone}
                                        href={`tel:${c.phone}`}
                                        title={`Sumber resmi: ${c.source_url}`}
                                        className="pressable flex flex-col rounded-xl bg-white/10 px-4 py-3 text-xs hover:bg-white/18 focus-visible:ring-2 focus-visible:ring-alert-amber focus-visible:outline-none"
                                    >
                                        <span className="text-forest-muted">
                                            {c.name}
                                        </span>
                                        <span className="mt-1 inline-flex items-center gap-1.5 text-base font-bold text-alert-amber tabular-nums">
                                            <PhoneCall
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                            {c.phone}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-border/80 bg-background/80 py-6 backdrop-blur-xs">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
                        <p>
                            DisasterReady · Sumber rujukan terbuka: BMKG, BNPB
                            InaRISK, PVMBG MAGMA, OpenStreetMap (ODbL).
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                            <Link
                                href="/weather"
                                className="inline-flex min-h-11 items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
                            >
                                <BellRing
                                    className="size-3"
                                    aria-hidden="true"
                                />
                                <span>Peringatan CAP</span>
                            </Link>
                            <button
                                type="button"
                                onClick={handleReplayIntro}
                                className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-sm px-2 font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                <RotateCcw
                                    className="size-3"
                                    aria-hidden="true"
                                />
                                <span>Putar Intro</span>
                            </button>
                            <span className="tabular-nums">
                                © 2026 DisasterReady
                            </span>
                        </div>
                    </div>
                </footer>
            </div>

            <CommandPaletteModal
                open={commandOpen}
                onOpenChange={setCommandOpen}
            />
        </>
    );
}
