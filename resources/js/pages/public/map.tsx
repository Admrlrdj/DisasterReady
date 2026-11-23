import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    Action,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import MapPanel from '@/components/maps/map-panel';
import { dateTime, hazardLabels, type Overview } from '@/lib/disaster';

const inariskWebgis = 'https://inarisk.bnpb.go.id/webgis/';
const inariskJakarta = 'https://inarisk.bnpb.go.id/dashboard_jakarta/';

export default function MapPage({ overview }: { overview: Overview }) {
    const [kind, setKind] = useState<'event' | 'alert'>('event');
    const [hazard, setHazard] = useState('');
    const [layerId, setLayerId] = useState<number | null>(null);
    const layer = overview.layers.find(
        (entry) => entry.id === layerId && entry.tile_template,
    );
    return (
        <>
            <Head title="Peta Situasi" />
            <PageHeading
                title="Peta Situasi"
                description="Lihat kejadian resmi, wilayah peringatan aktif, dan kajian risiko BNPB."
            />
            <div className="dr-two-col">
                <Panel title="Eksplorasi Wilayah">
                    {layer ? (
                        <div className="dr-map-toolbar">
                            <strong>{layer.name}</strong>
                            <Action
                                variant="outline"
                                onClick={() => setLayerId(null)}
                            >
                                Kembali ke peta BMKG
                            </Action>
                        </div>
                    ) : (
                        <div className="dr-actions">
                            <select
                                aria-label="Jenis informasi"
                                className="dr-select"
                                value={kind}
                                onChange={(event) =>
                                    setKind(event.target.value as typeof kind)
                                }
                            >
                                <option value="event">Kejadian resmi</option>
                                <option value="alert">Peringatan aktif</option>
                            </select>
                            <select
                                aria-label="Jenis bahaya"
                                className="dr-select"
                                value={hazard}
                                onChange={(event) =>
                                    setHazard(event.target.value)
                                }
                            >
                                <option value="">Semua bahaya</option>
                                {overview.hazards.map((item) => (
                                    <option key={item.slug} value={item.slug}>
                                        {hazardLabels[item.slug]}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <MapPanel
                        kind={kind}
                        hazardMarkers
                        activeOnly
                        hazard={hazard}
                        historicalTiles={layer?.tile_template ?? undefined}
                    />
                    <div className="dr-map-legend">
                        {layer ? (
                            <Status tone="historical">
                                Kajian bahaya · BNPB InaRISK
                            </Status>
                        ) : (
                            <Status tone="verified">Sumber resmi BMKG</Status>
                        )}
                    </div>
                    <p className="dr-caption dr-muted">
                        {layer
                            ? layer.limitations
                            : 'Klik titik atau area untuk membuka ringkasan. Maksimal 100 fitur per tampilan.'}
                    </p>
                </Panel>
                <div className="dr-stack">
                    <Panel title="Peta Risiko InaRISK">
                        <p className="dr-caption dr-muted">
                            Kajian BNPB menunjukkan indeks bahaya dan risiko
                            wilayah. Untuk kondisi terkini, lihat kejadian dan
                            peringatan resmi.
                        </p>
                        {overview.layers.length ? (
                            overview.layers.map((entry) => (
                                <div className="dr-record" key={entry.id}>
                                    <strong>{entry.name}</strong>
                                    <p className="dr-caption">
                                        {entry.limitations}
                                    </p>
                                    {entry.reviewed_at && (
                                        <p className="dr-caption dr-muted">
                                            Metadata ditinjau{' '}
                                            {dateTime(entry.reviewed_at)}
                                        </p>
                                    )}
                                    {entry.tile_template && (
                                        <Action
                                            variant="outline"
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
                                                ? 'Sembunyikan layer'
                                                : 'Tampilkan di peta'}
                                        </Action>
                                    )}
                                    <a
                                        className="dr-caption underline"
                                        href={entry.layer_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Buka metadata layer ↗
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p className="dr-caption dr-muted">
                                Sambil menunggu izin penggunaan layer, buka peta
                                resmi untuk seluruh Indonesia di WebGIS BNPB.
                            </p>
                        )}
                        <Action asChild>
                            <a
                                href={inariskWebgis}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Buka WebGIS Nasional InaRISK ↗
                            </a>
                        </Action>
                        <a
                            href={inariskJakarta}
                            target="_blank"
                            rel="noreferrer"
                            className="dr-caption underline"
                        >
                            Buka peta InaRISK untuk DKI Jakarta ↗
                        </a>
                    </Panel>
                    <Panel title="Shelter & Rute Evakuasi">
                        <Status tone="historical">Belum tersedia</Status>
                        <p className="dr-caption dr-muted">
                            Belum ada lokasi pengungsian yang terverifikasi
                            operasional. Simulasi rute belum diaktifkan.
                        </p>
                        <Action variant="outline" asChild>
                            <Link href="/preparedness">
                                Lihat Panduan Siaga
                            </Link>
                        </Action>
                    </Panel>
                    <Notice>
                        Ikuti rekomendasi petugas. Ketiadaan data pada peta
                        tidak berarti wilayah bebas bahaya.
                    </Notice>
                </div>
            </div>
        </>
    );
}
