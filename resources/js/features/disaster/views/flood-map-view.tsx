import { Link } from '@inertiajs/react';
import { AlertTriangle, ExternalLink, Layers, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import MapPanel from '@/components/maps/map-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dateTime, hazardLabels } from '@/lib/disaster';
import { FeedDegradedBanner } from '../components/resilience-states';
import { useDisaster } from '../disaster-context';

const INARISK_WEBGIS = 'https://inarisk.bnpb.go.id/webgis/';
const INARISK_JAKARTA = 'https://inarisk.bnpb.go.id/dashboard_jakarta/';

export function FloodMapView() {
    const {
        overview,
        feedState,
        retryFeed,
        selectedRegionCode,
        mapRevision,
        setEvacuationOpen,
        setWaterLevelOpen,
    } = useDisaster();

    const [kind, setKind] = useState<'event' | 'alert' | 'forecast'>('event');
    const [hazard, setHazard] = useState('');
    const [layerId, setLayerId] = useState<number | null>(null);

    const layers = overview?.layers ?? [];
    const activeLayer = layers.find(
        (entry) => entry.id === layerId && entry.tile_template,
    );

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="heading-display text-2xl font-bold text-foreground sm:text-[1.65rem]">
                            Peta Multi-Bahaya & Kajian Risiko InaRISK
                        </h1>
                        <Badge className="bg-primary text-primary-foreground">
                            GeoJSON PostGIS · Sumber Resmi
                        </Badge>
                    </div>
                    <p className="prose-pretty text-sm text-muted-foreground">
                        Pisahkan kejadian resmi, peringatan CAP, prakiraan cuaca
                        wilayah, dan kajian bahaya historis BNPB InaRISK. Lokasi
                        presisi pelapor warga tetap privat.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setWaterLevelOpen(true)}
                        className="rounded-full font-semibold"
                    >
                        Rujukan TMA
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setEvacuationOpen(true)}
                        className="rounded-full font-semibold"
                    >
                        Panduan Siaga
                    </Button>
                </div>
            </div>

            <div
                role="note"
                className="flex flex-col gap-2 rounded-2xl border border-alert-amber-text/25 bg-alert-amber-soft px-4 py-3 text-xs text-alert-amber-text sm:flex-row sm:items-center sm:justify-between"
            >
                <div className="flex items-start gap-2.5">
                    <AlertTriangle
                        className="mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                    />
                    <p>
                        <strong>Batas Interpretasi Peta:</strong> Layer kajian
                        historis InaRISK bukan peringatan darurat aktif, dan
                        ketiadaan titik pada peta tidak berarti wilayah bebas
                        bahaya. Ikuti arahan resmi petugas (BNPB 117 / DKI 112).
                    </p>
                </div>
                <span className="shrink-0 font-semibold">
                    BMKG · BNPB InaRISK · OSM
                </span>
            </div>

            <FeedDegradedBanner
                feedState={feedState}
                onRetry={retryFeed}
                sources={overview?.sources ?? []}
            />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <div className="matted-frame space-y-2.5 xl:col-span-8">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-0.5">
                        {activeLayer ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="bg-brand-bronze-soft text-brand-bronze-text">
                                    Kajian Historis · {activeLayer.name}
                                </Badge>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setLayerId(null)}
                                    className="h-8 rounded-full text-xs"
                                >
                                    Kembali ke Data BMKG
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    aria-label="Jenis informasi peta"
                                    value={kind}
                                    onChange={(e) =>
                                        setKind(e.target.value as typeof kind)
                                    }
                                    className="h-8 rounded-full border border-input bg-card px-3 text-xs font-semibold text-foreground"
                                >
                                    <option value="event">
                                        Kejadian Gempa Resmi
                                    </option>
                                    <option value="alert">
                                        Peringatan CAP Resmi
                                    </option>
                                    <option value="forecast">
                                        Prakiraan Cuaca Wilayah
                                    </option>
                                </select>

                                <select
                                    aria-label="Filter jenis bahaya"
                                    value={hazard}
                                    onChange={(e) => setHazard(e.target.value)}
                                    className="h-8 rounded-full border border-input bg-card px-3 text-xs font-semibold text-foreground"
                                >
                                    <option value="">Semua bahaya</option>
                                    {(overview?.hazards ?? []).map((item) => (
                                        <option
                                            key={item.slug}
                                            value={item.slug}
                                        >
                                            {hazardLabels[item.slug] ??
                                                item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="matted-inner overflow-hidden border border-border/70 bg-card p-2">
                        <MapPanel
                            kind={kind}
                            hazard={hazard}
                            region={
                                kind === 'forecast'
                                    ? selectedRegionCode
                                    : undefined
                            }
                            revision={mapRevision}
                            historicalTiles={
                                activeLayer?.tile_template ?? undefined
                            }
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4 xl:col-span-4">
                    <Card className="gap-3 py-4">
                        <CardHeader className="px-4 pb-0">
                            <p className="overline-label text-brand-bronze-text">
                                Kajian Historis · Non-Live
                            </p>
                            <CardTitle className="heading-section flex items-center gap-2 text-base font-bold">
                                <Layers
                                    className="size-4 text-brand-bronze-text"
                                    aria-hidden="true"
                                />
                                <span>Peta Bahaya BNPB InaRISK</span>
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
                                        {entry.reviewed_at && (
                                            <p className="text-[11px] text-muted-foreground tabular-nums">
                                                Ditinjau{' '}
                                                {dateTime(entry.reviewed_at)}
                                            </p>
                                        )}
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

                            <div className="flex flex-col gap-2 pt-1">
                                <Button
                                    asChild
                                    size="sm"
                                    className="w-full rounded-xl font-semibold"
                                >
                                    <a
                                        href={INARISK_WEBGIS}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <span>Buka WebGIS InaRISK</span>
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
                                    className="w-full rounded-xl"
                                >
                                    <a
                                        href={INARISK_JAKARTA}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <span>InaRISK DKI Jakarta</span>
                                        <ExternalLink
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-3 py-4">
                        <CardHeader className="px-4 pb-0">
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle className="heading-section text-base font-bold">
                                    Shelter & Simulasi Rute
                                </CardTitle>
                                <Badge className="bg-brand-bronze-soft text-brand-bronze-text">
                                    Belum Tersedia
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 px-4 text-xs">
                            <p className="leading-relaxed text-muted-foreground">
                                Belum ada data shelter terverifikasi operasional
                                maupun pembatasan ruas jalan aktif di backend.
                                Sistem tidak membuat koordinat shelter atau rute
                                evakuasi fiktif.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl"
                                >
                                    <Link href="/shelters">
                                        Status Kandidat Shelter
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl"
                                >
                                    <Link href="/preparedness">
                                        <ShieldCheck
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span>Panduan Siaga</span>
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
