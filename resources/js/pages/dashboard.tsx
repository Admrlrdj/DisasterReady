import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import OfficialList from '@/components/disaster/official-list';
import MapPanel from '@/components/maps/map-panel';
import {
    dateTime,
    stringValue,
    type Overview,
    type Region,
} from '@/lib/disaster';

export default function Dashboard({ overview }: { overview: Overview }) {
    const { auth, pending_reports: pending } = usePage().props;
    const [kind, setKind] = useState<'event' | 'alert' | 'forecast'>('event');
    const [activeOnly, setActiveOnly] = useState(true);
    const [revision, setRevision] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [announcement, setAnnouncement] = useState('');

    function refresh(region: Region = overview.region) {
        setBusy(true);
        setError(false);
        setAnnouncement('');
        router.get(
            '/dashboard',
            { region },
            {
                only: ['overview', 'pending_reports'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onSuccess: () => {
                    setRevision((value) => value + 1);
                    setAnnouncement('Tampilan data diperbarui.');
                },
                onError: () => setError(true),
                onHttpException: () => {
                    setError(true);
                    return false;
                },
                onNetworkError: () => {
                    setError(true);
                    return false;
                },
                onFinish: () => setBusy(false),
            },
        );
    }

    const alertSource = overview.sources.find(
        (source) => source.name === 'Peringatan cuaca BMKG CAP',
    );

    return (
        <>
            <Head title="Dashboard Nasional" />
            <PageHeading
                title="Dashboard Nasional"
                description="Pantau kejadian dan peringatan resmi di Indonesia."
            >
                <Action
                    variant="outline"
                    disabled={busy}
                    onClick={() => refresh()}
                >
                    <RefreshCw aria-hidden="true" />
                    {busy ? 'Memuat…' : 'Perbarui Data'}
                </Action>
                <Action variant="outline" asChild>
                    <Link href="/map">Buka Peta</Link>
                </Action>
                <Action asChild>
                    <Link href="/reports/create">Buat Laporan</Link>
                </Action>
            </PageHeading>
            <span className="sr-only" role="status">
                {announcement}
            </span>
            {error && (
                <Notice danger>
                    Data belum dapat diperbarui. Tampilan sebelumnya masih
                    tersedia.
                </Notice>
            )}
            <div className="dr-dashboard-main">
                <section
                    className="dr-dashboard-map"
                    aria-labelledby="dashboard-map-title"
                >
                    <h2 id="dashboard-map-title">
                        Peta Multi-Bahaya Indonesia
                    </h2>
                    <div className="dr-map-toolbar">
                        <div
                            className="dr-choices"
                            role="group"
                            aria-label="Lapisan peta"
                        >
                            {(
                                [
                                    ['event', 'Gempa'],
                                    ['alert', 'Peringatan Cuaca'],
                                    ['forecast', 'Prakiraan'],
                                ] as const
                            ).map(([value, label]) => (
                                <button
                                    type="button"
                                    key={value}
                                    aria-pressed={kind === value}
                                    className={`dr-choice ${kind === value ? 'active' : ''}`}
                                    onClick={() => setKind(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        {kind === 'alert' && (
                            <label className="dr-inline-field">
                                <input
                                    type="checkbox"
                                    checked={!activeOnly}
                                    onChange={(event) =>
                                        setActiveOnly(!event.target.checked)
                                    }
                                />
                                Sertakan riwayat
                            </label>
                        )}
                        {kind === 'forecast' && (
                            <label className="dr-inline-field">
                                Wilayah
                                <select
                                    className="dr-select"
                                    value={overview.region}
                                    disabled={busy}
                                    onChange={(event) =>
                                        refresh(event.target.value as Region)
                                    }
                                >
                                    {Object.entries(overview.regions).map(
                                        ([code, name]) => (
                                            <option key={code} value={code}>
                                                {name}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </label>
                        )}
                    </div>
                    <MapPanel
                        kind={kind}
                        region={
                            kind === 'forecast' ? overview.region : undefined
                        }
                        activeOnly={activeOnly}
                        revision={revision}
                    />
                    <div className="dr-map-legend">
                        <span>
                            {kind === 'event'
                                ? 'Titik gempa BMKG'
                                : kind === 'alert'
                                  ? 'Area peringatan CAP BMKG'
                                  : 'Titik prakiraan kelurahan · BMKG'}
                        </span>
                        <span>
                            Data dimuat {dateTime(overview.generated_at)}
                        </span>
                    </div>
                    {kind === 'forecast' && (
                        <div className="dr-dashboard-forecast">
                            {overview.forecasts.length ? (
                                overview.forecasts.slice(0, 4).map((record) => {
                                    const temperature = (
                                        record.data as Record<string, unknown>
                                    ).t;
                                    return (
                                        <article
                                            className="dr-weather-slot"
                                            key={record.id}
                                        >
                                            <small>
                                                {dateTime(record.forecast_at)}
                                            </small>
                                            <strong>{record.title}</strong>
                                            <span>
                                                {stringValue(
                                                    temperature,
                                                    'Suhu belum tersedia',
                                                )}
                                                {temperature != null
                                                    ? ' °C'
                                                    : ''}
                                            </span>
                                            <Status
                                                value={record.source.freshness}
                                            />
                                        </article>
                                    );
                                })
                            ) : (
                                <EmptyState title="Prakiraan berlaku belum tersedia" />
                            )}
                            <Link
                                className="dr-caption underline"
                                href={`/weather?region=${overview.region}`}
                            >
                                Lihat prakiraan lengkap
                            </Link>
                        </div>
                    )}
                </section>
                <div className="dr-stack dr-dashboard-aside">
                    <Panel title="Peringatan Resmi">
                        <div className="dr-row">
                            <button
                                type="button"
                                className="dr-metric-button"
                                aria-label="Tampilkan peringatan aktif pada peta"
                                disabled={alertSource?.last_success_at == null}
                                onClick={() => {
                                    setKind('alert');
                                    setActiveOnly(true);
                                    document
                                        .getElementById('dashboard-map-title')
                                        ?.scrollIntoView({ block: 'nearest' });
                                }}
                            >
                                {alertSource?.last_success_at
                                    ? overview.active_alert_count
                                    : '…'}
                            </button>
                            <Status
                                value={alertSource?.freshness ?? 'UNAVAILABLE'}
                            />
                        </div>
                        <p className="dr-caption dr-muted">
                            Peringatan aktif menurut masa berlaku data BMKG yang
                            tersimpan.
                        </p>
                        <Link href="/weather" className="dr-caption underline">
                            Lihat peringatan cuaca
                        </Link>
                    </Panel>
                    <Panel title="Laporan Warga">
                        {typeof pending === 'number' && (
                            <strong className="text-3xl font-bold">
                                {pending}
                            </strong>
                        )}
                        <p className="dr-caption dr-muted">
                            {typeof pending === 'number'
                                ? 'Laporan menunggu pemeriksaan moderator.'
                                : auth.user
                                  ? 'Lihat status laporan yang kamu kirim.'
                                  : 'Masuk untuk melihat laporan milikmu.'}
                        </p>
                        <Link
                            className="dr-caption underline"
                            href={
                                typeof pending === 'number'
                                    ? '/admin/reports'
                                    : '/my/reports'
                            }
                        >
                            {typeof pending === 'number'
                                ? 'Buka Antrean Review'
                                : 'Laporan Saya'}
                        </Link>
                    </Panel>
                    <Panel title="Status Sumber Data">
                        {overview.sources.map((source) => (
                            <details
                                className="dr-source-detail"
                                key={source.id}
                            >
                                <summary>
                                    <span>{source.name}</span>
                                    <Status value={source.freshness} />
                                </summary>
                                <p>
                                    Wilayah:{' '}
                                    {source.agency === 'BNPB'
                                        ? 'Indonesia'
                                        : source.name.includes('Prakiraan')
                                          ? Object.values(
                                                overview.regions,
                                            ).join(', ')
                                          : 'Indonesia'}
                                </p>
                                <p>
                                    Sinkronisasi:{' '}
                                    {dateTime(source.last_success_at)}
                                </p>
                                <a
                                    href={source.source_url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Buka sumber resmi ↗
                                </a>
                            </details>
                        ))}
                    </Panel>
                </div>
            </div>
            <div className="dr-dashboard-lower">
                <Panel
                    title="Kejadian Gempa Terbaru"
                    aside={
                        <Link
                            href="/earthquakes"
                            className="dr-caption underline"
                        >
                            Lihat feed
                        </Link>
                    }
                >
                    <OfficialList
                        key={`events-${revision}`}
                        endpoint="/data/events?per_page=5"
                    />
                </Panel>
                <Panel
                    title="Peringatan Cuaca Resmi"
                    aside={
                        <Link href="/weather" className="dr-caption underline">
                            Lihat feed
                        </Link>
                    }
                >
                    <OfficialList
                        key={`alerts-${activeOnly}-${revision}`}
                        endpoint={`/data/alerts?per_page=5${activeOnly ? '&status=active' : ''}`}
                    />
                </Panel>
            </div>
        </>
    );
}
