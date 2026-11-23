import { Head, Link } from '@inertiajs/react';
import { lazy, Suspense } from 'react';
import {
    Action,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { dateTime, stringValue } from '@/lib/disaster';
import type { OfficialRecord } from '@/types/disaster';
import MapPanel from '@/components/maps/map-panel';

const ReportLocationMap = lazy(
    () => import('@/components/maps/report-location-map'),
);

export default function Detail({
    record,
    eventPosition,
}: {
    record: OfficialRecord;
    eventPosition: [number, number] | null;
}) {
    const data = record.data as Record<string, unknown>;
    return (
        <>
            <Head title={record.title} />
            <PageHeading
                title={
                    record.kind === 'alert'
                        ? 'Detail Peringatan Resmi'
                        : 'Detail Kejadian Gempa'
                }
                description={record.title}
            >
                <Action variant="outline" asChild>
                    <Link
                        href={
                            record.kind === 'alert'
                                ? '/weather'
                                : '/earthquakes'
                        }
                    >
                        ← Kembali
                    </Link>
                </Action>
            </PageHeading>
            <div className="dr-two-col">
                <div className="dr-stack">
                    <Panel
                        title={
                            record.kind === 'event'
                                ? 'Episentrum Gempa'
                                : 'Konteks Peta Resmi'
                        }
                    >
                        {record.kind === 'alert' ? (
                            <>
                                <MapPanel kind="alert" />
                                <p className="dr-caption dr-muted">
                                    Klik fitur pada peta nasional untuk melihat
                                    ringkasan dan sumbernya.
                                </p>
                            </>
                        ) : eventPosition ? (
                            <>
                                <Suspense
                                    fallback={
                                        <div
                                            className="dr-live-map dr-map-preview dr-empty"
                                            role="status"
                                        >
                                            Memuat peta episentrum…
                                        </div>
                                    }
                                >
                                    <ReportLocationMap
                                        key={record.id}
                                        position={eventPosition}
                                        label={`Peta episentrum ${record.title}`}
                                    />
                                </Suspense>
                                <p className="dr-caption dr-muted">
                                    Lintang {eventPosition[1].toFixed(4)}° ·
                                    Bujur {eventPosition[0].toFixed(4)}°
                                </p>
                            </>
                        ) : (
                            <Notice>
                                Koordinat episentrum belum tersedia untuk
                                kejadian ini.
                            </Notice>
                        )}
                    </Panel>
                    <Panel title={record.title}>
                        <div className="dr-actions">
                            <Status tone="verified">
                                Sumber resmi · {record.source.agency}
                            </Status>
                            <Status
                                value={
                                    record.alert_state ??
                                    record.source.freshness
                                }
                            />
                            {record.synthetic && (
                                <Status tone="simulation">Sintetis</Status>
                            )}
                        </div>
                        <p className="whitespace-pre-wrap">
                            {record.message ??
                                stringValue(
                                    data.Wilayah,
                                    'Lihat rincian pada sumber resmi.',
                                )}
                        </p>
                        {record.kind === 'event' && (
                            <div className="dr-kpis">
                                {[
                                    ['Magnitudo', data.Magnitude],
                                    ['Kedalaman', data.Kedalaman],
                                    ['Wilayah', data.Wilayah],
                                    ['Potensi', data.Potensi],
                                ].map(([label, value]) => (
                                    <div className="dr-kpi" key={String(label)}>
                                        <small>{String(label)}</small>
                                        <span>{stringValue(value)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {record.kind === 'event' &&
                            typeof data.Dirasakan === 'string' &&
                            data.Dirasakan.trim() && (
                                <p className="whitespace-pre-wrap">
                                    <strong>
                                        Wilayah yang merasakan gempa
                                    </strong>
                                    <br />
                                    {data.Dirasakan}
                                </p>
                            )}
                        {(record.expired ||
                            record.source.freshness !== 'FRESH') && (
                            <Notice>
                                Informasi kedaluwarsa atau sumber belum
                                terbarui. Periksa pembaruan resmi sebelum
                                mengambil keputusan.
                            </Notice>
                        )}
                        <Action asChild>
                            <a
                                href={record.source_url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Buka Sumber Resmi ↗
                            </a>
                        </Action>
                    </Panel>
                    <Panel title="Langkah Kesiapsiagaan">
                        <p>
                            Ikuti arahan petugas dan rekomendasi pada pesan
                            resmi. Jangan menyimpulkan status bahaya dari
                            tampilan peta saja.
                        </p>
                        <Action variant="outline" asChild>
                            <Link
                                href={`/preparedness/${record.kind === 'alert' ? 'extreme_weather' : 'earthquake'}`}
                            >
                                Buka Panduan Siaga
                            </Link>
                        </Action>
                    </Panel>
                </div>
                <div className="dr-stack">
                    <Panel title="Provenance & Waktu">
                        <dl className="dr-stack">
                            {[
                                ['Penerbit', record.source.attribution],
                                ['Waktu sumber', dateTime(record.source_time)],
                                ['Diambil sistem', dateTime(record.fetched_at)],
                                ['Berlaku sampai', dateTime(record.expires_at)],
                                [
                                    'Sinkronisasi terakhir',
                                    dateTime(record.source.last_success_at),
                                ],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <dt className="dr-eyebrow">{label}</dt>
                                    <dd>{value}</dd>
                                </div>
                            ))}
                        </dl>
                        <Status value={record.source.freshness} />
                    </Panel>
                    <Panel
                        className="forest"
                        title="Informasi yang bisa ditelusuri"
                    >
                        <p>
                            AI tidak menerbitkan peringatan dan tidak mengubah
                            masa berlaku informasi.
                        </p>
                        <Link href="/map">Lihat peta multi-bahaya ↗</Link>
                    </Panel>
                </div>
            </div>
        </>
    );
}
