import { router, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowUpRight,
    BellRing,
    BookOpen,
    ClipboardList,
    FilePlus2,
    FileText,
    Layers,
    Map as MapIcon,
    Moon,
    PhoneCall,
    Search,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
    Sun,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAppearance } from '@/hooks/use-appearance';
import {
    PAGE_VARIANTS,
    usePageVariant,
    type PageVariant,
} from '@/hooks/use-page-variant';
import type { Contact } from '@/lib/disaster';
import { cn } from '@/lib/utils';
import type { Hazard } from '@/types/disaster';
import {
    HAZARD_META,
    HazardSvgIcon,
    SIAGA_TIERS,
    type SiagaTier,
} from './hazard-icons';

type CommandActionItem = {
    id: string;
    group: string;
    title: string;
    subtitle: string;
    keywords: string;
    icon: React.ReactNode;
    badge?: string;
    onSelect: () => void;
};

export function CommandPaletteModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { props } = usePage<{
        auth?: {
            user?: { name: string; role: string; status?: string } | null;
        };
        emergency_contacts?: Contact[];
    }>();
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { variant, setVariant, auroraPaused, toggleAuroraPaused } =
        usePageVariant();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const user = props.auth?.user;
    const isActive =
        user && (user.status === undefined || user.status === 'active');
    const role = isActive ? user?.role : undefined;
    const canModerate = role === 'moderator' || role === 'admin';
    const canAdminister = role === 'admin';

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onOpenChange]);

    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIndex(0);
        }
    }, [open]);

    const actions = useMemo<CommandActionItem[]>(() => {
        const go = (url: string) => {
            onOpenChange(false);
            router.visit(url);
        };
        const switchVar = (v: PageVariant) => {
            setVariant(v);
            onOpenChange(false);
        };

        const list: CommandActionItem[] = [
            {
                id: 'nav-command-center',
                group: 'Navigasi Utama (FR-01 & FR-02)',
                title: 'Pusat Komando & Peta Multi-Bencana Nasional',
                subtitle:
                    'Peta terpadu seluruh jenis bencana, pantauan nasional, & layer InaRISK',
                keywords:
                    'dashboard peta map pantauan nasional komando inarisk',
                badge: 'Terpadu',
                icon: (
                    <MapIcon
                        className="size-4 text-primary"
                        aria-hidden="true"
                    />
                ),
                onSelect: () => go('/dashboard'),
            },
            {
                id: 'nav-map-direct',
                group: 'Navigasi Utama (FR-01 & FR-02)',
                title: 'Eksplorasi Peta Multi-Bahaya Penuh',
                subtitle:
                    'Fokus kanvas peta PostGIS, filter 7 bahaya, dan drawer inspeksi marker',
                keywords: 'map peta penuh geojson postgis marker',
                icon: (
                    <Layers
                        className="size-4 text-brand-tidal"
                        aria-hidden="true"
                    />
                ),
                onSelect: () => go('/map'),
            },
            {
                id: 'nav-earthquakes',
                group: 'Navigasi Utama (FR-03, FR-04, FR-05)',
                title: 'Feed Gempa Bumi BMKG',
                subtitle: 'Autogempa, gempa M5.0+, dan gempa dirasakan',
                keywords: 'gempa earthquake seismik bmkg',
                icon: (
                    <HazardSvgIcon
                        hazard="earthquake"
                        className="size-4 text-status-siaga-text"
                    />
                ),
                onSelect: () => go('/earthquakes'),
            },
            {
                id: 'nav-weather',
                group: 'Navigasi Utama (FR-03, FR-04, FR-05)',
                title: 'Prakiraan Cuaca & Peringatan Dini CAP XML',
                subtitle:
                    'Prakiraan kelurahan pilot Jatinegara & arsip peringatan CAP BMKG',
                keywords: 'cuaca weather hujan cap peringatan bmkg jatinegara',
                icon: (
                    <HazardSvgIcon
                        hazard="extreme_weather"
                        className="size-4 text-brand-tidal"
                    />
                ),
                onSelect: () => go('/weather'),
            },
            {
                id: 'nav-volcanoes',
                group: 'Navigasi Utama (FR-07)',
                title: 'Pemantauan Gunung Api PVMBG MAGMA',
                subtitle:
                    'Arsip laporan pengamatan Anak Krakatau, Merapi, dan Semeru',
                keywords:
                    'gunung api volcano erupsi magma pvmbg merapi semeru krakatau',
                icon: (
                    <HazardSvgIcon
                        hazard="volcano"
                        className="size-4 text-status-awas-text"
                    />
                ),
                onSelect: () => go('/volcanoes'),
            },
            {
                id: 'nav-preparedness',
                group: 'Navigasi Utama (FR-08)',
                title: 'Pusat Kesiapsiagaan & Rencana Keluarga',
                subtitle:
                    'Panduan resmi terverifikasi, checklist Tas Siaga 72 jam, & cetak PDF',
                keywords: 'siaga panduan preparedness tas keluarga evakuasi',
                icon: (
                    <ShieldCheck
                        className="size-4 text-status-normal-text"
                        aria-hidden="true"
                    />
                ),
                onSelect: () => go('/preparedness'),
            },
            {
                id: 'nav-report-create',
                group: 'Pelaporan Warga (FR-09)',
                title: 'Buat Laporan Kejadian Warga',
                subtitle:
                    'Kirim laporan lapangan privat dengan foto tanpa metadata EXIF',
                keywords: 'lapor buat report warga foto bukti',
                badge: 'Privat',
                icon: (
                    <FilePlus2
                        className="size-4 text-primary"
                        aria-hidden="true"
                    />
                ),
                onSelect: () => go('/reports/create'),
            },
            {
                id: 'nav-my-reports',
                group: 'Pelaporan Warga (FR-09)',
                title: 'Riwayat Laporan Saya',
                subtitle:
                    'Pantau status verifikasi moderator dan kirim bukti tambahan',
                keywords: 'riwayat laporan saya my reports status',
                icon: (
                    <FileText
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                    />
                ),
                onSelect: () => go('/my/reports'),
            },
        ];

        if (canModerate) {
            list.push({
                id: 'nav-mod-queue',
                group: 'Moderasi & Tata Kelola (FR-10, AI-01, AI-02)',
                title: 'Workspace Moderasi Laporan & Triase AI',
                subtitle:
                    'Tinjau laporan warga, saran ekstraksi AI-01, dan kandidat duplikat AI-02',
                keywords: 'moderasi admin queue review ai-01 ai-02 duplikat',
                badge: 'Moderator',
                icon: (
                    <ShieldAlert
                        className="size-4 text-status-waspada-text"
                        aria-hidden="true"
                    />
                ),
                onSelect: () => go('/admin/reports'),
            });
        }

        if (canAdminister) {
            list.push(
                {
                    id: 'nav-admin-sources',
                    group: 'Moderasi & Tata Kelola (FR-11, FR-12)',
                    title: 'Adapter Sumber Resmi & AI Health',
                    subtitle:
                        'Kelola sinkronisasi BMKG, SLA kesegaran, dan kill-switch AI',
                    keywords:
                        'admin sources adapter bmkg ai health kill switch',
                    badge: 'Admin',
                    icon: (
                        <Activity
                            className="size-4 text-primary"
                            aria-hidden="true"
                        />
                    ),
                    onSelect: () => go('/admin/sources'),
                },
                {
                    id: 'nav-admin-alerts',
                    group: 'Moderasi & Tata Kelola (FR-11, FR-12)',
                    title: 'Arsip Peringatan Resmi Database',
                    subtitle:
                        'Inspeksi tabel official_alerts hasil ingestion CAP',
                    keywords: 'admin alerts peringatan resmi database',
                    badge: 'Admin',
                    icon: (
                        <BellRing
                            className="size-4 text-status-waspada-text"
                            aria-hidden="true"
                        />
                    ),
                    onSelect: () => go('/admin/alerts'),
                },
                {
                    id: 'nav-admin-guides',
                    group: 'Moderasi & Tata Kelola (FR-08)',
                    title: 'Editor Panduan & Korpus Kesiapsiagaan',
                    subtitle:
                        'Tinjau dan terbitkan panduan resmi ber-rujukan HTTPS',
                    keywords: 'admin guides panduan korpus rag',
                    badge: 'Admin',
                    icon: (
                        <BookOpen
                            className="size-4 text-status-normal-text"
                            aria-hidden="true"
                        />
                    ),
                    onSelect: () => go('/admin/guides'),
                },
                {
                    id: 'nav-admin-audit',
                    group: 'Moderasi & Tata Kelola (FR-10)',
                    title: 'Jejak Audit Log Sistem',
                    subtitle:
                        'Periksa histori perubahan keputusan moderator dan konfigurasi',
                    keywords: 'admin audit log jejak perubahan json',
                    badge: 'Admin',
                    icon: (
                        <ClipboardList
                            className="size-4 text-muted-foreground"
                            aria-hidden="true"
                        />
                    ),
                    onSelect: () => go('/admin/audit-logs'),
                },
            );
        }

        for (const v of PAGE_VARIANTS) {
            list.push({
                id: `variant-${v.id}`,
                group: 'Pilih Versi Tampilan Halaman (3 Model)',
                title: `Aktifkan ${v.shortLabel} · ${v.name}`,
                subtitle: v.summary,
                keywords: `versi model variant ${v.id} ${v.name.toLowerCase()}`,
                badge: variant === v.id ? 'Aktif' : undefined,
                icon: (
                    <SlidersHorizontal
                        className="size-4 text-primary"
                        aria-hidden="true"
                    />
                ),
                onSelect: () => switchVar(v.id),
            });
        }

        list.push(
            {
                id: 'theme-toggle',
                group: 'Preferensi Visual & Aksesibilitas',
                title:
                    resolvedAppearance === 'dark'
                        ? 'Beralih ke Tema Terang (Field Daylight)'
                        : 'Beralih ke Tema Gelap (Night-Watch Posko)',
                subtitle:
                    'Ubah kontras permukaan sesuai kondisi cahaya ruangan',
                keywords: 'tema theme dark light terang gelap',
                icon:
                    resolvedAppearance === 'dark' ? (
                        <Sun
                            className="size-4 text-status-waspada-text"
                            aria-hidden="true"
                        />
                    ) : (
                        <Moon
                            className="size-4 text-primary"
                            aria-hidden="true"
                        />
                    ),
                onSelect: () => {
                    updateAppearance(
                        resolvedAppearance === 'dark' ? 'light' : 'dark',
                    );
                    onOpenChange(false);
                },
            },
            {
                id: 'aurora-toggle',
                group: 'Preferensi Visual & Aksesibilitas',
                title: auroraPaused
                    ? 'Putar Kembali Animasi Latar Hydro-Aurora'
                    : 'Jedakan Animasi Latar Hydro-Aurora',
                subtitle:
                    'Kontrol gerak latar belakang sesuai standar WCAG 2.2.2',
                keywords: 'aurora shader animasi pause jeda gerak motion',
                icon: (
                    <Activity
                        className="size-4 text-brand-tidal"
                        aria-hidden="true"
                    />
                ),
                onSelect: () => {
                    toggleAuroraPaused();
                    onOpenChange(false);
                },
            },
        );

        return list;
    }, [
        auroraPaused,
        canAdminister,
        canModerate,
        onOpenChange,
        resolvedAppearance,
        setVariant,
        toggleAuroraPaused,
        updateAppearance,
        variant,
    ]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return actions;
        return actions.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                item.subtitle.toLowerCase().includes(q) ||
                item.keywords.includes(q) ||
                item.group.toLowerCase().includes(q),
        );
    }, [actions, query]);

    const grouped = useMemo(() => {
        const map = new Map<string, CommandActionItem[]>();
        for (const item of filtered) {
            const arr = map.get(item.group) ?? [];
            arr.push(item);
            map.set(item.group, arr);
        }
        return Array.from(map.entries());
    }, [filtered]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl gap-0 overflow-hidden rounded-2xl border-border/90 bg-card/95 p-0 shadow-2xl backdrop-blur-xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>
                        Navigasi Cepat & Komando DisasterReady
                    </DialogTitle>
                    <DialogDescription>
                        Cari halaman kebencanaan, ganti versi UI (A/B/C), atau
                        akses kontak darurat resmi.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3">
                    <Search
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <input
                        ref={inputRef}
                        type="search"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                setActiveIndex((i) =>
                                    filtered.length
                                        ? (i + 1) % filtered.length
                                        : 0,
                                );
                            } else if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                setActiveIndex((i) =>
                                    filtered.length
                                        ? (i - 1 + filtered.length) %
                                          filtered.length
                                        : 0,
                                );
                            } else if (
                                e.key === 'Enter' &&
                                filtered[activeIndex]
                            ) {
                                e.preventDefault();
                                filtered[activeIndex].onSelect();
                            }
                        }}
                        placeholder="Cari halaman, jenis bencana, atau ketik 'Versi A / B / C'..."
                        aria-label="Cari perintah atau halaman"
                        className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-sm"
                    />
                    <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground sm:inline-block">
                        ESC
                    </kbd>
                </div>

                <div className="max-h-[62vh] space-y-4 overflow-y-auto overscroll-contain p-3">
                    {grouped.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                            Tidak ditemukan perintah untuk "{query}".
                        </div>
                    ) : (
                        grouped.map(([groupName, items]) => (
                            <div key={groupName} className="space-y-1">
                                <p className="overline-label px-2.5 text-muted-foreground">
                                    {groupName}
                                </p>
                                <div className="space-y-1">
                                    {items.map((item) => {
                                        const flatIdx = filtered.findIndex(
                                            (f) => f.id === item.id,
                                        );
                                        const isSelected =
                                            flatIdx === activeIndex;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={item.onSelect}
                                                onMouseEnter={() =>
                                                    setActiveIndex(flatIdx)
                                                }
                                                className={cn(
                                                    'flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                                    isSelected
                                                        ? 'bg-secondary text-foreground'
                                                        : 'text-foreground/90 hover:bg-muted/60',
                                                )}
                                            >
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card shadow-2xs">
                                                        {item.icon}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="truncate text-xs font-semibold text-foreground">
                                                                {item.title}
                                                            </span>
                                                            {item.badge && (
                                                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="truncate text-[11px] text-muted-foreground">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ArrowUpRight
                                                    className="size-3.5 shrink-0 text-muted-foreground"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/80 bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                            <PhoneCall
                                className="size-3 text-status-waspada-text"
                                aria-hidden="true"
                            />
                            Darurat Resmi:
                        </span>
                        <a
                            href="tel:117"
                            className="font-semibold underline hover:text-foreground"
                        >
                            BNPB 117
                        </a>
                        <a
                            href="tel:115"
                            className="font-semibold underline hover:text-foreground"
                        >
                            Basarnas 115
                        </a>
                        <a
                            href="tel:112"
                            className="font-semibold underline hover:text-foreground"
                        >
                            DKI 112
                        </a>
                    </div>
                    <span>Navigasi panah ↑↓ · Enter untuk buka</span>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Superdesign-inspired interactive 4-Tier Siaga & 7-Hazard matrix explorer
 * Makes the interface alive, interactive, and educational for citizens and operators.
 */
export function InteractiveSiagaMatrix({ className }: { className?: string }) {
    const [activeTier, setActiveTier] = useState<SiagaTier>('waspada');
    const [activeHazard, setActiveHazard] = useState<Hazard>('flood');

    const tierMeta = SIAGA_TIERS[activeTier];
    const hazardMeta = HAZARD_META[activeHazard];

    return (
        <div
            className={cn(
                'rounded-2xl border border-border/85 bg-card/88 p-5 shadow-xs backdrop-blur-md',
                className,
            )}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                    <h3 className="heading-section text-base font-bold text-foreground">
                        Simulasi Interaktif Standar Siaga & Karakteristik 7
                        Bahaya
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Klik tingkat status siaga dan ikon bencana untuk
                        memeriksa protokol respons resmi serta instansi rujukan.
                    </p>
                </div>

                {/* 4-Tier Siaga Switcher */}
                <div
                    role="group"
                    aria-label="Pilih tingkat status siaga bencana"
                    className="flex flex-wrap items-center gap-1.5"
                >
                    {(
                        ['normal', 'waspada', 'siaga', 'awas'] as SiagaTier[]
                    ).map((tierKey) => {
                        const t = SIAGA_TIERS[tierKey];
                        const selected = activeTier === tierKey;
                        return (
                            <button
                                key={tierKey}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setActiveTier(tierKey)}
                                className={cn(
                                    'pressable inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    selected
                                        ? t.badgeClass
                                        : 'border-border bg-background/70 text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <span
                                    className={cn(
                                        'size-2 rounded-full',
                                        t.dotClass,
                                    )}
                                    aria-hidden="true"
                                />
                                <span>
                                    Lv.{t.levelNumber} {t.shortLabel}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 7 Custom SVG Hazard Selector */}
            <div
                role="group"
                aria-label="Pilih jenis bencana"
                className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
            >
                {(Object.keys(HAZARD_META) as Hazard[]).map((slug) => {
                    const h = HAZARD_META[slug];
                    const selected = activeHazard === slug;
                    return (
                        <button
                            key={slug}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setActiveHazard(slug)}
                            className={cn(
                                'pressable flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                selected
                                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                    : 'border-border/80 bg-background/65 text-foreground hover:bg-secondary/70',
                            )}
                        >
                            <HazardSvgIcon
                                hazard={slug}
                                className="size-4 shrink-0"
                            />
                            <span className="truncate">{h.shortLabel}</span>
                        </button>
                    );
                })}
            </div>

            {/* Live Combined Readout */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-border/80 bg-background/75 p-4 lg:grid-cols-12 lg:items-center">
                <div className="flex items-start gap-3.5 lg:col-span-7">
                    <span
                        className={cn(
                            'flex size-12 shrink-0 items-center justify-center rounded-2xl border ring-4',
                            tierMeta.badgeClass,
                            tierMeta.ringClass,
                        )}
                    >
                        <HazardSvgIcon
                            hazard={activeHazard}
                            className="size-6"
                        />
                    </span>
                    <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className={cn(
                                    'rounded-full border px-2.5 py-0.5 text-[11px] font-bold',
                                    tierMeta.badgeClass,
                                )}
                            >
                                {tierMeta.code}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                                {hazardMeta.label} · {hazardMeta.agency}
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                            {tierMeta.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {hazardMeta.description}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-card p-3.5 text-xs lg:col-span-5">
                    <span className="font-bold text-foreground">
                        Tindakan Kesiapsiagaan Disarankan:
                    </span>
                    <p className="text-muted-foreground">
                        {tierMeta.actionHint}
                    </p>
                </div>
            </div>
        </div>
    );
}
