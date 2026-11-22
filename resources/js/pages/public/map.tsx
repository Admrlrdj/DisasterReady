import { Head, Link } from '@inertiajs/react';
import { ExternalLink, FilePlus2, Layers, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import {
    HazardChipBadge,
    HazardSvgIcon,
    inferRecordHazard,
    inferRecordSiagaTier,
} from '@/components/disaster/hazard-icons';
import {
    Action,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import MapPanel from '@/components/maps/map-panel';
import { usePageVariant } from '@/hooks/use-page-variant';
import { dateTime, recordLink, type Overview } from '@/lib/disaster';

const inariskWebgis = 'https://inarisk.bnpb.go.id/webgis/';
const inariskJakarta = 'https://inarisk.bnpb.go.id/dashboard_jakarta/';

export default function MapPage({ overview }: { overview: Overview }) {
    const { variant } = usePageVariant();
    const [layerId, setLayerId] = useState<number | null>(null);
    const layer = overview.layers.find(
        (entry) => entry.id === layerId && entry.tile_template,
    );

    const activeAlerts = overview.alerts.filter(
        (a) => a.alert_state === 'ACTIVE',
    );
    const combinedFeed = [...activeAlerts, ...overview.events].slice(0, 6);

    return (
        <>
            <Head title="Pusat Komando & Peta Multi-Bencana" />
            <PageHeading
                eyebrow="FR-01 · FR-02 · FR-06 · Pusat Komando Spasial Terpadu"
                title="Pusat Komando & Peta Multi-Bencana Nasional"
                description="Satu peta terpadu untuk seluruh titik bencana (Banjir, Gempa Bumi, Gunung Api, Longsor, Cuaca Ekstrem, Tsunami, Karhutla), kajian historis BNPB InaRISK, serta triase AI."
            >
                <Action variant="outline" asChild>
                    <Link href="/preparedness">
                        <ShieldCheck className="size-4" aria-hidden="true" />
                        <span>Panduan Siaga</span>
                    </Link>
                </Action>
                <Action asChild>
                    <Link href="/reports/create">
                        <FilePlus2 className="size-4" aria-hidden="true" />
                        <span>Buat Laporan Warga</span>
                    </Link>
                </Action>
            </PageHeading>

            <div
                className={
                    variant === 'b' ? 'grid grid-cols-1 gap-4' : 'dr-two-col'
                }
            >
                <Panel
                    title="Kanvas Peta Multi-Bencana & Filter 7 Bahaya"
                    subtitle="Klik ikon SVG bencana di peta untuk membuka drawer telemetri real-time dan konteks analisis AI."
                    aside={
                        layer ? (
                            <Action
                                variant="outline"
                                size="sm"
                                onClick={() => setLayerId(null)}
                            >
                                Kembali ke Peta Multi-Bencana
                            </Action>
                        ) : (
                            <Status tone="verified">
                                PostGIS + Referensi Resmi
                            </Status>
                        )
                    }
                >
                    <MapPanel
                        kind="all"
                        region={overview.region}
                        historicalTiles={layer?.tile_template ?? undefined}
                        overview={overview}
                    />
                </Panel>

                <div
                    className={
                        variant === 'b'
                            ? 'grid grid-cols-1 gap-4 lg:grid-cols-3'
                            : 'dr-stack'
                    }
                >
                    <Panel
                        title="Pantauan Terbaru BMKG & CAP"
                        subtitle={`${overview.active_alert_count} CAP Aktif · ${overview.events.length} Gempa Tercatat`}
                    >
                        {combinedFeed.length > 0 ? (
                            <div className="space-y-2">
                                {combinedFeed.map((item) => {
                                    const hz = inferRecordHazard(item);
                                    const tier = inferRecordSiagaTier(item);
                                    return (
                                        <Link
                                            key={`${item.kind}-${item.id}`}
                                            href={recordLink(item)}
                                            className="dr-record flex flex-col gap-1.5 transition-colors hover:border-primary/45"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <HazardChipBadge
                                                    hazard={hz}
                                                    tier={tier}
                                                />
                                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                                    {dateTime(
                                                        item.source_time,
                                                        true,
                                                    )}
                                                </span>
                                            </div>
                                            <strong className="text-xs font-bold text-foreground">
                                                {item.title}
                                            </strong>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Belum ada catatan live BMKG tersimpan. Titik
                                referensi resmi Gunung Api PVMBG MAGMA dan
                                Kelurahan Pilot Jatinegara tetap aktif di peta.
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                            <Action variant="outline" size="sm" asChild>
                                <Link href="/earthquakes">
                                    <HazardSvgIcon
                                        hazard="earthquake"
                                        className="size-3.5"
                                    />
                                    <span>Feed Gempa</span>
                                </Link>
                            </Action>
                            <Action variant="outline" size="sm" asChild>
                                <Link href="/volcanoes">
                                    <HazardSvgIcon
                                        hazard="volcano"
                                        className="size-3.5"
                                    />
                                    <span>Gunung Api PVMBG</span>
                                </Link>
                            </Action>
                        </div>
                    </Panel>

                    <Panel
                        title="Peta Bahaya Historis BNPB InaRISK"
                        subtitle="Kajian indeks bahaya wilayah non-live (FR-06)"
                    >
                        {overview.layers.length ? (
                            overview.layers.map((entry) => (
                                <div className="dr-record" key={entry.id}>
                                    <div className="flex items-center gap-2">
                                        <Layers
                                            className="size-4 text-brand-bronze-text"
                                            aria-hidden="true"
                                        />
                                        <strong>{entry.name}</strong>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {entry.limitations}
                                    </p>
                                    {entry.reviewed_at && (
                                        <p className="text-[11px] text-muted-foreground tabular-nums">
                                            Metadata ditinjau{' '}
                                            {dateTime(entry.reviewed_at)}
                                        </p>
                                    )}
                                    {entry.tile_template && (
                                        <Action
                                            variant="outline"
                                            size="sm"
                                            aria-pressed={layerId === entry.id}
                                            onClick={() =>
                                                setLayerId(
                                                    layerId === entry.id
                                                        ? null
                                                        : entry.id,
                                                )
                                            }
                                        >
                                            {layerId === entry.id
                                                ? 'Sembunyikan Layer'
                                                : 'Tampilkan di Peta'}
                                        </Action>
                                    )}
                                    <a
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
                                        href={entry.layer_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <span>Buka Metadata Layer</span>
                                        <ExternalLink
                                            className="size-3"
                                            aria-hidden="true"
                                        />
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Layer raster menunggu persetujuan publikasi.
                                Peta resmi dapat dibuka langsung di WebGIS BNPB.
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            <Action size="sm" asChild>
                                <a
                                    href={inariskWebgis}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span>WebGIS InaRISK</span>
                                    <ExternalLink
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                </a>
                            </Action>
                            <Action variant="outline" size="sm" asChild>
                                <a
                                    href={inariskJakarta}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span>InaRISK DKI Jakarta</span>
                                    <ExternalLink
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                </a>
                            </Action>
                        </div>
                    </Panel>

                    <Panel
                        title="Shelter & Rute Evakuasi"
                        subtitle="Status modul operasional P1 & P2 (FR-13, FR-14)"
                    >
                        <Status tone="historical">Belum tersedia</Status>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            Belum ada lokasi pengungsian terverifikasi
                            operasional maupun pembatasan ruas jalan aktif di
                            database. Sistem tidak membuat koordinat shelter
                            atau rute fiktif.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Action disabled size="sm">
                                Simulasikan Rute
                            </Action>
                            <Action variant="outline" size="sm" asChild>
                                <Link href="/shelters">Status Shelter</Link>
                            </Action>
                        </div>
                    </Panel>
                </div>
            </div>

            <Notice>
                Ikuti rekomendasi petugas resmi (BNPB 117 / Basarnas 115 / DKI
                112). Ketiadaan titik pada peta tidak pernah berarti wilayah
                bebas bahaya.
            </Notice>
        </>
    );
}
