import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ExternalLink, Map, ShieldCheck } from 'lucide-react';
import {
    HazardChipBadge,
    inferRecordHazard,
    inferRecordSiagaTier,
    SIAGA_TIERS,
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
import { dateTime, stringValue } from '@/lib/disaster';
import type { OfficialRecord } from '@/types/disaster';

export default function Detail({ record }: { record: OfficialRecord }) {
    const { variant } = usePageVariant();
    const data = record.data as Record<string, unknown>;
    const hazard = inferRecordHazard(record);
    const tier = inferRecordSiagaTier(record);
    const tierMeta = SIAGA_TIERS[tier];

    return (
        <>
            <Head title={record.title} />
            <PageHeading
                eyebrow={
                    record.kind === 'alert'
                        ? 'FR-05 · Detail Peringatan Dini CAP XML BMKG'
                        : 'FR-03 · Detail Kejadian Seismik BMKG'
                }
                title={
                    record.kind === 'alert'
                        ? 'Detail Peringatan Resmi'
                        : 'Detail Kejadian Gempa Bumi'
                }
                description={record.title}
            >
                <HazardChipBadge hazard={hazard} tier={tier} />
                <Action variant="outline" size="sm" asChild>
                    <Link
                        href={
                            record.kind === 'alert'
                                ? '/weather'
                                : '/earthquakes'
                        }
                    >
                        <ArrowLeft className="size-3.5" aria-hidden="true" />
                        <span>Kembali ke Daftar</span>
                    </Link>
                </Action>
            </PageHeading>

            <div
                className={
                    variant === 'b'
                        ? 'grid grid-cols-1 gap-4 lg:grid-cols-12'
                        : 'dr-two-col'
                }
            >
                <div
                    className={
                        variant === 'b' ? 'space-y-4 lg:col-span-8' : 'dr-stack'
                    }
                >
                    <Panel
                        title={record.title}
                        subtitle={`Tingkat Status: ${tierMeta.code} · ${tierMeta.description}`}
                    >
                        <div className="dr-actions">
                            <HazardChipBadge hazard={hazard} tier={tier} />
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

                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
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
                                        <span className="font-bold tabular-nums">
                                            {stringValue(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {record.kind === 'event' &&
                            typeof data.Dirasakan === 'string' &&
                            data.Dirasakan.trim() && (
                                <div className="rounded-xl border border-border/80 bg-secondary/50 p-3.5 text-xs">
                                    <strong className="block text-foreground">
                                        Wilayah yang merasakan gempa (Skala MMI)
                                    </strong>
                                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                        {data.Dirasakan}
                                    </p>
                                </div>
                            )}

                        {(record.expired ||
                            record.source.freshness !== 'FRESH') && (
                            <Notice>
                                Informasi kedaluwarsa atau sumber belum
                                terbarui. Periksa pembaruan resmi sebelum
                                mengambil keputusan.
                            </Notice>
                        )}

                        <div className="flex flex-wrap gap-2 pt-1">
                            <Action size="sm" asChild>
                                <a
                                    href={record.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span>Buka Sumber Resmi</span>
                                    <ExternalLink
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                </a>
                            </Action>
                            <Action variant="outline" size="sm" asChild>
                                <Link href={`/preparedness/${hazard}`}>
                                    <ShieldCheck
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>Panduan Kesiapsiagaan</span>
                                </Link>
                            </Action>
                        </div>
                    </Panel>

                    <Panel
                        title="Konteks Peta Komando Multi-Bencana"
                        subtitle="Titik dan area kejadian resmi ditampilkan bersama referensi multi-bencana nasional."
                    >
                        <MapPanel
                            kind={record.kind === 'alert' ? 'alert' : 'all'}
                            showControls={false}
                        />
                    </Panel>
                </div>

                <div
                    className={
                        variant === 'b' ? 'space-y-4 lg:col-span-4' : 'dr-stack'
                    }
                >
                    <Panel
                        title="Provenance & Jejak Waktu"
                        subtitle="Audit sumber dan masa berlaku informasi"
                    >
                        <dl className="space-y-2.5 text-xs">
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
                                <div
                                    key={label}
                                    className="flex items-start justify-between gap-2 border-b border-border/60 pb-2"
                                >
                                    <dt className="font-medium text-muted-foreground">
                                        {label}
                                    </dt>
                                    <dd className="text-right font-semibold text-foreground tabular-nums">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <Status value={record.source.freshness} />
                    </Panel>

                    <Panel title="Langkah Kesiapsiagaan Disarankan">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            {tierMeta.actionHint} Ikuti arahan petugas dan
                            rekomendasi pada pesan resmi. Jangan menyimpulkan
                            status bahaya dari tampilan peta saja.
                        </p>
                        <Action variant="outline" size="sm" asChild>
                            <Link href={`/preparedness/${hazard}`}>
                                <ShieldCheck
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                <span>Buka Panduan Siaga</span>
                            </Link>
                        </Action>
                    </Panel>

                    <Panel
                        className="forest"
                        title="Tata Kelola & Batas Peran AI"
                    >
                        <p className="text-xs leading-relaxed">
                            AI tidak pernah menerbitkan peringatan resmi dan
                            tidak mengubah masa berlaku informasi BMKG.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1 text-xs font-bold underline"
                        >
                            <Map className="size-3.5" aria-hidden="true" />
                            <span>Buka Pusat Komando & Peta Terpadu</span>
                        </Link>
                    </Panel>
                </div>
            </div>
        </>
    );
}
