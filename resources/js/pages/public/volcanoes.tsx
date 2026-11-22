import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Map, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import {
    HazardChipBadge,
    HazardSvgIcon,
    SIAGA_TIERS,
    type SiagaTier,
} from '@/components/disaster/hazard-icons';
import { Action, Notice, PageHeading, Panel } from '@/components/disaster/ui';
import { usePageVariant } from '@/hooks/use-page-variant';
import { dateTime } from '@/lib/disaster';
import { cn } from '@/lib/utils';

type VolcanoReport = {
    name: string;
    region: string;
    level: 1 | 2 | 3 | 4;
    observed_from: string;
    observed_until: string;
    source_url: string;
};

const LEVEL_TO_TIER: Record<1 | 2 | 3 | 4, SiagaTier> = {
    1: 'normal',
    2: 'waspada',
    3: 'siaga',
    4: 'awas',
};

const LEVEL_LABELS: Record<1 | 2 | 3 | 4, string> = {
    1: 'Level I · Normal',
    2: 'Level II · Waspada',
    3: 'Level III · Siaga',
    4: 'Level IV · Awas',
};

export default function Volcanoes({
    reports,
    selected,
    statusUrl,
}: {
    reports: Record<string, VolcanoReport>;
    selected: string | null;
    statusUrl: string;
}) {
    const { variant } = usePageVariant();
    const [levelFilter, setLevelFilter] = useState<number | null>(null);
    const title = selected
        ? reports[selected].name
        : 'Pemantauan Gunung Api PVMBG MAGMA';

    const entries = Object.entries(reports).filter(([, report]) =>
        levelFilter ? report.level === levelFilter : true,
    );

    return (
        <>
            <Head title={title} />
            <PageHeading
                eyebrow="FR-07 · Vulkanologi & Arsip Pengamatan Resmi PVMBG"
                title={title}
                description="Ringkasan laporan pengamatan resmi PVMBG MAGMA Indonesia dilengkapi tingkat aktivitas 4 level (Normal, Waspada, Siaga, Awas)."
            >
                {selected && (
                    <Action variant="outline" size="sm" asChild>
                        <Link href="/volcanoes">
                            <ArrowLeft
                                className="size-3.5"
                                aria-hidden="true"
                            />
                            <span>Kembali ke Daftar Gunung Api</span>
                        </Link>
                    </Action>
                )}
                <Action variant="outline" size="sm" asChild>
                    <Link href="/dashboard">
                        <Map className="size-3.5" aria-hidden="true" />
                        <span>Lihat di Peta Komando</span>
                    </Link>
                </Action>
                <Action size="sm" asChild>
                    <a href={statusUrl} target="_blank" rel="noreferrer">
                        <span>Status Terkini di MAGMA</span>
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                </Action>
            </PageHeading>

            {/* Level Activity Filter Bar */}
            {!selected && (
                <div
                    role="group"
                    aria-label="Filter tingkat aktivitas gunung api"
                    className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/80 bg-card/85 p-3 backdrop-blur-md"
                >
                    <span className="text-xs font-bold text-foreground">
                        Filter Tingkat Aktivitas PVMBG:
                    </span>
                    <button
                        type="button"
                        aria-pressed={levelFilter === null}
                        onClick={() => setLevelFilter(null)}
                        className={cn(
                            'pressable min-h-8 cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                            levelFilter === null
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background/70 text-muted-foreground hover:text-foreground',
                        )}
                    >
                        Semua Level ({Object.keys(reports).length})
                    </button>
                    {([4, 3, 2, 1] as const).map((lvl) => {
                        const tier = LEVEL_TO_TIER[lvl];
                        const tierMeta = SIAGA_TIERS[tier];
                        const active = levelFilter === lvl;
                        return (
                            <button
                                key={lvl}
                                type="button"
                                aria-pressed={active}
                                onClick={() =>
                                    setLevelFilter(active ? null : lvl)
                                }
                                className={cn(
                                    'pressable inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                                    active
                                        ? tierMeta.badgeClass
                                        : 'border-border bg-background/70 text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <span
                                    className={cn(
                                        'size-2 rounded-full',
                                        tierMeta.dotClass,
                                    )}
                                    aria-hidden="true"
                                />
                                <span>{LEVEL_LABELS[lvl]}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="dr-two-col">
                <Panel
                    title={
                        selected
                            ? `Detail Laporan Pengamatan · ${reports[selected].name}`
                            : 'Arsip Laporan Pengamatan PVMBG MAGMA'
                    }
                    subtitle="Sumber: config/pvmbg.php · Badan Geologi Kementerian ESDM"
                >
                    <Notice>
                        Arsip laporan pengamatan bertanggal. Periksa portal
                        resmi MAGMA Indonesia untuk status aktivitas dan radius
                        bahaya detik ini.
                    </Notice>

                    <div
                        className={cn(
                            'grid grid-cols-1 gap-3',
                            variant === 'b' && !selected && 'md:grid-cols-2',
                        )}
                    >
                        {entries.map(([id, report]) => {
                            const tier = LEVEL_TO_TIER[report.level];
                            const tierMeta = SIAGA_TIERS[tier];
                            return (
                                <article
                                    className={cn(
                                        'dr-record space-y-2.5 transition-colors hover:border-primary/45',
                                        variant === 'c' &&
                                            'rounded-none border-x-0 border-t-2 border-t-foreground',
                                    )}
                                    key={id}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <span
                                                className={cn(
                                                    'flex size-10 shrink-0 items-center justify-center rounded-xl border',
                                                    tierMeta.badgeClass,
                                                )}
                                            >
                                                <HazardSvgIcon
                                                    hazard="volcano"
                                                    className="size-5"
                                                />
                                            </span>
                                            <div>
                                                <h3 className="text-base font-bold text-foreground">
                                                    {selected ? (
                                                        report.name
                                                    ) : (
                                                        <Link
                                                            className="hover:text-primary hover:underline"
                                                            href={`/volcanoes/${id}`}
                                                        >
                                                            {report.name}
                                                        </Link>
                                                    )}
                                                </h3>
                                                <p className="text-xs font-medium text-muted-foreground">
                                                    {report.region}
                                                </p>
                                            </div>
                                        </div>

                                        <HazardChipBadge
                                            hazard="volcano"
                                            tier={tier}
                                        />
                                    </div>

                                    <div className="rounded-xl border border-border/70 bg-background/70 p-3 text-xs">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-bold text-foreground">
                                                {LEVEL_LABELS[report.level]}{' '}
                                                (Saat Laporan)
                                            </span>
                                            <span className="text-muted-foreground tabular-nums">
                                                {dateTime(report.observed_from)}{' '}
                                                s/d{' '}
                                                {dateTime(
                                                    report.observed_until,
                                                )}
                                            </span>
                                        </div>
                                        <p className="mt-1.5 text-muted-foreground">
                                            {tierMeta.actionHint}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                        {!selected && (
                                            <Action
                                                variant="outline"
                                                size="sm"
                                                asChild
                                            >
                                                <Link href={`/volcanoes/${id}`}>
                                                    Buka Rincian Gunung
                                                </Link>
                                            </Action>
                                        )}
                                        <a
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
                                            href={report.source_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <span>
                                                Buka Laporan & Rekomendasi PVMBG
                                            </span>
                                            <ExternalLink
                                                className="size-3"
                                                aria-hidden="true"
                                            />
                                        </a>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </Panel>

                <div className="dr-stack">
                    <Panel
                        title="Sumber & Batas Interpretasi PVMBG"
                        subtitle="Pemisahan tingkat aktivitas vulkanik dari indikator cuaca"
                    >
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            PVMBG menerbitkan tingkat aktivitas dan rekomendasi
                            zona bahaya melalui MAGMA Indonesia. Sistem tidak
                            pernah menyimpulkan kenaikan status gunung api dari
                            curah hujan atau laporan warga tanpa ketetapan resmi
                            PVMBG.
                        </p>
                        <div className="flex flex-col gap-2 pt-1">
                            <Action size="sm" asChild>
                                <a
                                    href={statusUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span>Daftar Nasional di MAGMA</span>
                                    <ExternalLink
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                </a>
                            </Action>
                            <Action variant="outline" size="sm" asChild>
                                <a
                                    href="https://magma.esdm.go.id/v1/gunung-api/peta-kawasan-rawan-bencana"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span>
                                        Peta Kawasan Rawan Bencana (KRB)
                                    </span>
                                    <ExternalLink
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                </a>
                            </Action>
                        </div>
                    </Panel>

                    <Panel
                        className="forest"
                        title="Kesiapsiagaan Erupsi & Abu Vulkanik"
                    >
                        <p className="text-xs leading-relaxed">
                            Siapkan masker respirator N95, kacamata pelindung
                            abu vulkanik, serta patuhi radius larangan kawah
                            aktif yang ditetapkan PVMBG.
                        </p>
                        <Action variant="secondary" size="sm" asChild>
                            <Link href="/preparedness/volcano">
                                <ShieldCheck
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                <span>Buka Panduan Siaga Gunung Api</span>
                            </Link>
                        </Action>
                    </Panel>
                </div>
            </div>
        </>
    );
}
