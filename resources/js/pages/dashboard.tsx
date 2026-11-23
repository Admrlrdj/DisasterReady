import { Head, Link, router, usePage } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { CloudLightning, CloudRain, RefreshCw } from 'lucide-react';
import {
    Action,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import OfficialList from '@/components/disaster/official-list';
import ProvinceForecast from '@/components/disaster/province-forecast';
import WeatherLocation from '@/components/disaster/weather-location';
import MapPanel from '@/components/maps/map-panel';
import { dateTime, type Overview, type Region } from '@/lib/disaster';

export default function Dashboard({ overview }: { overview: Overview }) {
    const {
        props: { auth, pending_reports: pending },
        url,
    } = usePage();
    const selectedRegion = new URLSearchParams(url.split('?')[1]).has('region')
        ? overview.region
        : undefined;
    const weatherRegions = useMemo(
        () => [
            ...new Set(
                selectedRegion
                    ? [selectedRegion, ...overview.map_weather_regions]
                    : overview.map_weather_regions,
            ),
        ],
        [selectedRegion, overview.map_weather_regions],
    );
    const [eventDays, setEventDays] = useState<1 | 7>();
    const [activeOnly, setActiveOnly] = useState(true);
    const [revision, setRevision] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [announcement, setAnnouncement] = useState('');

    const refresh = useCallback((region?: Region) => {
        setBusy(true);
        setError(false);
        setAnnouncement('');
        router.get('/dashboard', region ? { region } : {}, {
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
        });
    }, []);

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
                    onClick={() => refresh(selectedRegion)}
                >
                    <RefreshCw aria-hidden="true" />
                    {busy ? 'Memuat…' : 'Muat Ulang'}
                </Action>
                <Action variant="outline" asChild>
                    <Link href="/map">Buka Peta Lengkap</Link>
                </Action>
                <Action variant="outline" asChild>
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
            <section
                className="dr-alert-strip"
                aria-label="Kondisi peringatan cuaca"
            >
                <div>
                    <Status value={alertSource?.freshness ?? 'UNAVAILABLE'} />
                    <h2>
                        {alertSource?.freshness === 'FRESH' &&
                        overview.active_alert_count === 0
                            ? 'Tidak ada peringatan aktif dalam data BMKG'
                            : alertSource?.last_success_at
                              ? overview.active_alert_count +
                                ' peringatan aktif dalam data tersimpan'
                              : 'Status peringatan belum tersedia'}
                    </h2>
                    <p>
                        Terakhir diterima dari BMKG:{' '}
                        {dateTime(alertSource?.last_success_at ?? null)}
                    </p>
                </div>
                <Action asChild>
                    <Link href="/weather#peringatan">Lihat Peringatan</Link>
                </Action>
            </section>
            <div className="dr-dashboard-main">
                <section
                    className="dr-dashboard-map"
                    aria-labelledby="dashboard-map-title"
                >
                    <h2 id="dashboard-map-title">
                        Peta Multi-Bahaya Indonesia
                    </h2>
                    <div className="dr-map-toolbar">
                        <label className="dr-inline-field">
                            Rentang gempa
                            <select
                                className="dr-select"
                                value={eventDays ?? ''}
                                onChange={(event) =>
                                    setEventDays(
                                        event.target.value === '1'
                                            ? 1
                                            : event.target.value === '7'
                                              ? 7
                                              : undefined,
                                    )
                                }
                            >
                                <option value="">Semua data terbaru</option>
                                <option value="1">24 jam terakhir</option>
                                <option value="7">7 hari terakhir</option>
                            </select>
                        </label>
                        <label className="dr-inline-field">
                            <input
                                type="checkbox"
                                checked={!activeOnly}
                                onChange={(event) =>
                                    setActiveOnly(!event.target.checked)
                                }
                            />
                            Sertakan riwayat peringatan
                        </label>
                    </div>
                    <div className="dr-map-legend" aria-label="Legenda peta">
                        <span className="inline-flex items-center gap-2">
                            <span
                                className="mx-1 size-2 rounded-full bg-red-700 ring-2 ring-red-400 ring-offset-2"
                                aria-hidden="true"
                            />
                            Gempa · cincin pada kejadian terbaru
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <CloudRain size={16} aria-hidden="true" />
                            Hujan
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <CloudLightning size={16} aria-hidden="true" />
                            Petir
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="flex gap-0.5" aria-hidden="true">
                                {['#93c5fd', '#3b82f6', '#1e3a8a'].map(
                                    (color) => (
                                        <span
                                            key={color}
                                            className="size-3 rounded-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                    ),
                                )}
                            </span>
                            Area peringatan · intensitas lebih tinggi, biru
                            lebih gelap
                        </span>
                    </div>
                    <MapPanel
                        combined
                        eventDays={eventDays}
                        weatherRegions={weatherRegions}
                        activeOnly={activeOnly}
                        revision={
                            revision +
                            (overview.weather_status.fetched_at
                                ? Date.parse(overview.weather_status.fetched_at)
                                : 0)
                        }
                    />
                    <p className="dr-caption dr-muted">
                        Titik cuaca menunjukkan prakiraan di kelurahan yang
                        memiliki data.
                    </p>
                    <h3 className="font-semibold">Prakiraan Provinsi</h3>
                    <WeatherLocation
                        autoLocate={!selectedRegion}
                        overview={
                            selectedRegion
                                ? overview
                                : { region_name: 'Cari nama atau kode wilayah' }
                        }
                        onSelect={refresh}
                        disabled={busy}
                    />
                    {selectedRegion ? (
                        <ProvinceForecast
                            key={selectedRegion}
                            region={selectedRegion}
                        />
                    ) : (
                        <p className="dr-caption dr-muted">
                            Izinkan lokasi perangkat atau pilih desa atau
                            kelurahan untuk menentukan provinsi.
                        </p>
                    )}
                </section>
                <div className="dr-stack dr-dashboard-aside">
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
                    <details className="dr-source-fold">
                        <summary>Status sumber data</summary>
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
                                    {source.name.includes('Prakiraan')
                                        ? 'Indonesia · per desa atau kelurahan'
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
                    </details>
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
                            Lihat daftar
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
                        <Link
                            href="/weather#peringatan"
                            className="dr-caption underline"
                        >
                            Lihat daftar
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
