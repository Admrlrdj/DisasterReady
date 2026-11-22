import { Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    BellRing,
    Droplets,
    ExternalLink,
    FilePlus2,
    Layers,
    MapPin,
    Shield,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import {
    HazardChipBadge,
    HazardSvgIcon,
    inferRecordHazard,
    inferRecordSiagaTier,
} from '@/components/disaster/hazard-icons';
import MapPanel from '@/components/maps/map-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageVariant } from '@/hooks/use-page-variant';
import {
    dateTime,
    recordLink,
    statusLabels,
    stringValue,
} from '@/lib/disaster';
import type { Freshness } from '@/types/disaster';
import {
    FeedDegradedBanner,
    InspectorRowsSkeleton,
    PublicEmptyState,
} from '../components/resilience-states';
import { useDisaster } from '../disaster-context';

const INARISK_WEBGIS = 'https://inarisk.bnpb.go.id/webgis/';
const INARISK_JAKARTA = 'https://inarisk.bnpb.go.id/dashboard_jakarta/';

function freshnessBadgeClass(freshness: Freshness): string {
    switch (freshness) {
        case 'FRESH':
            return 'bg-verified-soft text-foreground';
        case 'PARTIAL':
        case 'STALE':
            return 'bg-alert-amber-soft text-alert-amber-text';
        case 'FAILED':
            return 'bg-danger-soft text-destructive';
        default:
            return 'bg-muted text-muted-foreground';
    }
}

export function NationalOverview() {
    const {
        overview,
        pendingReports,
        selectedRegionCode,
        selectedRegionName,
        feedState,
        isReloading,
        retryFeed,
        mapRevision,
        setActiveView,
        setWaterLevelOpen,
        setEvacuationOpen,
        setRegionPickerOpen,
    } = useDisaster();
    const { variant } = usePageVariant();
    const [layerId, setLayerId] = useState<number | null>(null);

    const sources = overview?.sources ?? [];
    const events = overview?.events ?? [];
    const alerts = overview?.alerts ?? [];
    const forecasts = (overview?.forecasts ?? []).filter((f) => !f.expired);
    const nextForecast = forecasts[0] ?? null;
    const nextForecastData = (nextForecast?.data ?? {}) as Record<
        string,
        unknown
    >;
    const layers = overview?.layers ?? [];
    const activeLayer = layers.find(
        (entry) => entry.id === layerId && entry.tile_template,
    );
    const activeAlertsCount = overview?.active_alert_count ?? 0;

    return (
        <div className="space-y-5">
            {/* Command Center Header */}
            <div
                className={
                    variant === 'b'
                        ? 'flex flex-col gap-3 rounded-2xl border border-border/90 bg-card/90 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between'
                        : variant === 'c'
                          ? 'flex flex-col gap-3 border-b-2 border-foreground pb-4 sm:flex-row sm:items-end sm:justify-between'
                          : 'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'
                }
            >
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="heading-display text-2xl font-bold text-foreground sm:text-[1.7rem]">
                            Pusat Komando & Peta Multi-Bencana Nasional
                        </h1>
                        <Badge className="bg-primary text-primary-foreground">
                            Peta Terpadu · {sources.length} Adapter
                        </Badge>
                    </div>
                    <p className="prose-pretty text-sm text-muted-foreground">
                        Satu kanvas komando terpadu untuk seluruh jenis bencana
                        (Banjir, Gempa, Gunung Api, Longsor, Cuaca Ekstrem,
                        Tsunami, Karhutla), kajian historis BNPB InaRISK, dan
                        triase laporan warga.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setRegionPickerOpen(true)}
                        className="rounded-full bg-card/80 font-semibold"
                    >
                        <MapPin
                            className="size-3.5 text-primary"
                            aria-hidden="true"
                        />
                        <span>{selectedRegionName}</span>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setWaterLevelOpen(true)}
                        className="rounded-full bg-card/80 font-semibold"
                    >
                        <Droplets
                            className="size-3.5 text-brand-tidal"
                            aria-hidden="true"
                        />
                        <span>Rujukan TMA</span>
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEvacuationOpen(true)}
                        className="rounded-full bg-card/80 font-semibold"
                    >
                        <ShieldCheck
                            className="size-3.5 text-status-normal-text"
                            aria-hidden="true"
                        />
                        <span>Panduan Siaga</span>
                    </Button>
                    <Button
                        asChild
                        size="sm"
                        className="rounded-full px-4 font-semibold"
                    >
                        <Link href="/reports/create">
                            <FilePlus2
                                className="size-3.5"
                                aria-hidden="true"
                            />
                            <span>Buat Laporan</span>
                        </Link>
                    </Button>
                </div>
            </div>

            <FeedDegradedBanner
                feedState={feedState}
                onRetry={retryFeed}
                sources={sources}
            />

            {/* Version B Tactical Top Metric Strip */}
            {variant === 'b' && (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <button
                        type="button"
                        onClick={() => setActiveView('alerts')}
                        className="pressable flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card/90 p-3.5 text-left"
                    >
                        <div>
                            <span className="text-xs text-muted-foreground">
                                Peringatan CAP Aktif
                            </span>
                            <p className="mt-0.5 text-2xl font-bold text-foreground tabular-nums">
                                {String(activeAlertsCount).padStart(2, '0')}
                            </p>
                        </div>
                        <Shield
                            className="size-5 text-primary"
                            aria-hidden="true"
                        />
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveView('hazards')}
                        className="pressable flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card/90 p-3.5 text-left"
                    >
                        <div>
                            <span className="text-xs text-muted-foreground">
                                Gempa BMKG Tercatat
                            </span>
                            <p className="mt-0.5 text-2xl font-bold text-alert-amber-text tabular-nums">
                                {String(events.length).padStart(2, '0')}
                            </p>
                        </div>
                        <HazardSvgIcon
                            hazard="earthquake"
                            className="size-5 text-status-siaga-text"
                        />
                    </button>
                    <button
                        type="button"
                        onClick={() => setWaterLevelOpen(true)}
                        className="pressable flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card/90 p-3.5 text-left"
                    >
                        <div>
                            <span className="text-xs text-muted-foreground">
                                Cuaca Pilot ({selectedRegionName})
                            </span>
                            <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">
                                {nextForecast
                                    ? `${stringValue(nextForecastData.t, '-')} °C`
                                    : 'Belum sinkron'}
                            </p>
                        </div>
                        <HazardSvgIcon
                            hazard="extreme_weather"
                            className="size-5 text-brand-tidal"
                        />
                    </button>
                    <Link
                        href={
                            pendingReports !== null
                                ? '/admin/reports'
                                : '/volcanoes'
                        }
                        className="pressable flex items-center justify-between rounded-xl border border-border bg-card/90 p-3.5 text-left"
                    >
                        <div>
                            <span className="text-xs text-muted-foreground">
                                {pendingReports !== null
                                    ? 'Antrean Moderasi'
                                    : 'Gunung Api PVMBG'}
                            </span>
                            <p className="mt-0.5 text-2xl font-bold text-foreground tabular-nums">
                                {pendingReports !== null
                                    ? String(pendingReports).padStart(2, '0')
                                    : '03'}
                            </p>
                        </div>
                        <HazardSvgIcon
                            hazard="volcano"
                            className="size-5 text-status-awas-text"
                        />
                    </Link>
                </div>
            )}

            {/* Main Unified Map + Operational Rail */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                {/* Unified MapLibre Multi-Hazard Canvas */}
                <div
                    className={
                        variant === 'c'
                            ? 'space-y-3 border-2 border-foreground/85 bg-card/85 p-3 backdrop-blur-md xl:col-span-8'
                            : 'matted-frame flex flex-col gap-2.5 xl:col-span-8'
                    }
                >
                    {activeLayer && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-bronze-text/30 bg-brand-bronze-soft px-3 py-2 text-xs text-brand-bronze-text">
                            <span className="font-semibold">
                                Mode Kajian Historis Aktif: {activeLayer.name}
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setLayerId(null)}
                                className="h-7 rounded-full text-xs"
                            >
                                Kembali ke Peta Multi-Bencana Live
                            </Button>
                        </div>
                    )}

                    <div className="matted-inner overflow-hidden border border-border/75 bg-card/88 p-2.5 backdrop-blur-md">
                        <MapPanel
                            kind="all"
                            region={selectedRegionCode}
                            revision={mapRevision}
                            historicalTiles={
                                activeLayer?.tile_template ?? undefined
                            }
                            overview={overview}
                        />
                    </div>
                </div>

                {/* Right Operational Inspector & InaRISK / Shelter Rail */}
                <div className="flex flex-col gap-4 xl:col-span-4">
                    {variant !== 'b' && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveView('alerts')}
                                className="pressable surface-card surface-card-interactive flex cursor-pointer flex-col justify-between gap-3 rounded-2xl bg-verified-soft p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex size-8 items-center justify-center rounded-lg bg-card text-primary shadow-xs">
                                        <Shield
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <ArrowUpRight
                                        className="size-4 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold tracking-[-0.03em] text-foreground tabular-nums">
                                        {String(activeAlertsCount).padStart(
                                            2,
                                            '0',
                                        )}
                                    </p>
                                    <p className="mt-0.5 text-xs font-semibold text-foreground/90">
                                        Peringatan CAP Aktif
                                    </p>
                                </div>
                            </button>

                            {pendingReports !== null ? (
                                <Link
                                    href="/admin/reports"
                                    className="pressable surface-card surface-card-interactive flex flex-col justify-between gap-3 rounded-2xl bg-alert-amber-soft p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex size-8 items-center justify-center rounded-lg bg-card text-alert-amber-text shadow-xs">
                                            <AlertTriangle
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <ArrowUpRight
                                            className="size-4 text-alert-amber-text"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold tracking-[-0.03em] text-foreground tabular-nums">
                                            {String(pendingReports).padStart(
                                                2,
                                                '0',
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-xs font-semibold text-alert-amber-text">
                                            Antrean Moderasi
                                        </p>
                                    </div>
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setActiveView('hazards')}
                                    className="pressable surface-card surface-card-interactive flex cursor-pointer flex-col justify-between gap-3 rounded-2xl bg-alert-amber-soft p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="flex size-8 items-center justify-center rounded-lg bg-card text-alert-amber-text shadow-xs">
                                            <Activity
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <ArrowUpRight
                                            className="size-4 text-alert-amber-text"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-bold tracking-[-0.03em] text-foreground tabular-nums">
                                            {String(events.length).padStart(
                                                2,
                                                '0',
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-xs font-semibold text-alert-amber-text">
                                            Gempa BMKG Tercatat
                                        </p>
                                    </div>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Wilayah Pilot & Source SLA Inspector */}
                    <Card className="gap-3.5 bg-card/88 py-4 backdrop-blur-md">
                        <CardHeader className="px-4 pb-0">
                            <p className="overline-label text-muted-foreground">
                                Inspektor Wilayah & Kesegaran Adapter
                            </p>
                            <CardTitle className="heading-section text-lg font-bold text-foreground">
                                {selectedRegionName}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground tabular-nums">
                                Jatinegara · adm4 {selectedRegionCode}
                            </p>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-3 px-4">
                            {isReloading ? (
                                <InspectorRowsSkeleton />
                            ) : (
                                <>
                                    <div className="divide-y divide-border/60 text-xs">
                                        {sources.length > 0 ? (
                                            sources.map((src) => (
                                                <div
                                                    key={src.id}
                                                    className="flex items-center justify-between gap-2 py-2"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-foreground">
                                                            {src.name}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground tabular-nums">
                                                            {src.agency} ·{' '}
                                                            {src.last_success_at
                                                                ? dateTime(
                                                                      src.last_success_at,
                                                                      true,
                                                                  )
                                                                : 'Belum sinkron'}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        className={`shrink-0 text-[11px] ${freshnessBadgeClass(src.freshness)}`}
                                                    >
                                                        {statusLabels[
                                                            src.freshness
                                                        ] ?? src.freshness}
                                                    </Badge>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="py-2 text-muted-foreground">
                                                Belum ada sumber terdaftar di
                                                database.
                                            </p>
                                        )}
                                    </div>

                                    <dl className="space-y-2 border-t border-border pt-3 text-xs">
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-muted-foreground">
                                                Cuaca Terdekat
                                            </dt>
                                            <dd className="text-right font-semibold text-foreground tabular-nums">
                                                {nextForecast
                                                    ? `${stringValue(nextForecastData.weather_desc, nextForecast.title)} · ${stringValue(nextForecastData.t, '-')} °C`
                                                    : 'Belum tersedia'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-muted-foreground">
                                                Gunung Api Terpantau
                                            </dt>
                                            <dd className="font-semibold text-foreground">
                                                <Link
                                                    href="/volcanoes"
                                                    className="text-primary underline"
                                                >
                                                    3 arsip PVMBG MAGMA
                                                </Link>
                                            </dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-muted-foreground">
                                                Shelter & Rute Evakuasi
                                            </dt>
                                            <dd className="font-semibold text-brand-bronze-text">
                                                <Link
                                                    href="/shelters"
                                                    className="underline"
                                                >
                                                    Belum tersedia (P1/P2)
                                                </Link>
                                            </dd>
                                        </div>
                                    </dl>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* BNPB InaRISK Historical Hazard Layer Card (Merged from Peta Multi-Bencana) */}
                    <Card className="gap-3 bg-card/88 py-4 backdrop-blur-md">
                        <CardHeader className="px-4 pb-0">
                            <p className="overline-label text-brand-bronze-text">
                                Kajian Historis · Non-Live (FR-06)
                            </p>
                            <CardTitle className="heading-section flex items-center gap-2 text-base font-bold">
                                <Layers
                                    className="size-4 text-brand-bronze-text"
                                    aria-hidden="true"
                                />
                                <span>Peta Risiko BNPB InaRISK</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 px-4 text-xs">
                            {layers.length > 0 ? (
                                layers.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="space-y-2 rounded-xl border border-border bg-muted/35 p-3"
                                    >
                                        <p className="font-semibold text-foreground">
                                            {entry.name}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {entry.limitations}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {entry.tile_template && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setLayerId(
                                                            layerId === entry.id
                                                                ? null
                                                                : entry.id,
                                                        )
                                                    }
                                                    className="h-7 rounded-full text-xs"
                                                >
                                                    {layerId === entry.id
                                                        ? 'Sembunyikan Layer'
                                                        : 'Tampilkan di Peta'}
                                                </Button>
                                            )}
                                            <a
                                                href={entry.layer_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 font-semibold underline"
                                            >
                                                <span>Metadata</span>
                                                <ExternalLink
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                            </a>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground">
                                    Layer raster InaRISK menunggu persetujuan
                                    publikasi izin BNPB. Peta kajian resmi dapat
                                    dibuka langsung melalui WebGIS BNPB.
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    asChild
                                    size="sm"
                                    className="rounded-xl font-semibold"
                                >
                                    <a
                                        href={INARISK_WEBGIS}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <span>WebGIS InaRISK</span>
                                        <ExternalLink
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </a>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl"
                                >
                                    <a
                                        href={INARISK_JAKARTA}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <span>InaRISK DKI</span>
                                        <ExternalLink
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {feedState === 'empty' && (
                <PublicEmptyState
                    title="Belum ada catatan live BMKG tersimpan di database lokal"
                    description="Peta di atas tetap menampilkan titik referensi resmi Gunung Api PVMBG MAGMA dan Kelurahan Pilot Jatinegara. Aktifkan worker sinkronisasi BMKG untuk memuat gempa dan CAP XML terbaru."
                    secondaryNote="Ketiadaan data live tidak pernah berarti wilayah bebas bahaya."
                    actionLabel="Muat Ulang Data Server"
                    onAction={retryFeed}
                />
            )}

            {/* Real Recent Official Records Ledger */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Card className="gap-3 bg-card/88 py-4 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 pb-0">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-sm font-bold">
                                <HazardSvgIcon
                                    hazard="earthquake"
                                    className="size-4 text-status-siaga-text"
                                />
                                <span>Gempa Bumi Terbaru (BMKG)</span>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Gabungan feed autogempa, M5+, dan gempa
                                dirasakan
                            </p>
                        </div>
                        <Link
                            href="/earthquakes"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                            <span>Semua</span>
                            <ArrowUpRight
                                className="size-3.5"
                                aria-hidden="true"
                            />
                        </Link>
                    </CardHeader>
                    <CardContent className="px-4">
                        {events.length > 0 ? (
                            <div className="divide-y divide-border/70">
                                {events.slice(0, 4).map((event) => {
                                    const data = event.data as Record<
                                        string,
                                        unknown
                                    >;
                                    const tier = inferRecordSiagaTier(event);
                                    return (
                                        <Link
                                            key={event.id}
                                            href={recordLink(event)}
                                            className="flex items-start justify-between gap-3 py-2.5 text-xs hover:text-primary"
                                        >
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="truncate font-semibold text-foreground">
                                                    {event.title}
                                                </p>
                                                <p className="text-muted-foreground tabular-nums">
                                                    Kedalaman{' '}
                                                    {stringValue(
                                                        data.Kedalaman,
                                                        '-',
                                                    )}{' '}
                                                    ·{' '}
                                                    {dateTime(
                                                        event.source_time,
                                                    )}
                                                </p>
                                            </div>
                                            <HazardChipBadge
                                                hazard="earthquake"
                                                tier={tier}
                                                className="shrink-0"
                                            />
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="rounded-xl bg-muted/45 p-4 text-xs text-muted-foreground">
                                Belum ada catatan gempa BMKG tersimpan.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="gap-3 bg-card/88 py-4 backdrop-blur-md">
                    <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 pb-0">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-sm font-bold">
                                <BellRing
                                    className="size-4 text-alert-amber-text"
                                    aria-hidden="true"
                                />
                                <span>Peringatan Dini Cuaca (CAP XML)</span>
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Menampilkan status aktif, kedaluwarsa, dan
                                dibatalkan
                            </p>
                        </div>
                        <Link
                            href="/weather"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                            <span>Semua</span>
                            <ArrowUpRight
                                className="size-3.5"
                                aria-hidden="true"
                            />
                        </Link>
                    </CardHeader>
                    <CardContent className="px-4">
                        {alerts.length > 0 ? (
                            <div className="divide-y divide-border/70">
                                {alerts.slice(0, 4).map((alert) => {
                                    const hz = inferRecordHazard(alert);
                                    const tier = inferRecordSiagaTier(alert);
                                    return (
                                        <Link
                                            key={alert.id}
                                            href={recordLink(alert)}
                                            className="flex items-start justify-between gap-3 py-2.5 text-xs hover:text-primary"
                                        >
                                            <div className="min-w-0 space-y-0.5">
                                                <p className="truncate font-semibold text-foreground">
                                                    {alert.title}
                                                </p>
                                                <p className="text-muted-foreground tabular-nums">
                                                    Terbit{' '}
                                                    {dateTime(
                                                        alert.source_time,
                                                    )}{' '}
                                                    · Sampai{' '}
                                                    {dateTime(alert.expires_at)}
                                                </p>
                                            </div>
                                            <HazardChipBadge
                                                hazard={hz}
                                                tier={tier}
                                                className="shrink-0"
                                            />
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="rounded-xl bg-muted/45 p-4 text-xs text-muted-foreground">
                                Belum ada catatan peringatan CAP BMKG tersimpan.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
