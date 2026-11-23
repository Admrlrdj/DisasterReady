import { Head, Link, router, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import {
    Action,
    Notice,
    PageHeading,
    Panel,
    RecordCard,
    Status,
} from '@/components/disaster/ui';
import WeatherLocation from '@/components/disaster/weather-location';
import MapPanel from '@/components/maps/map-panel';
import { dateTime, forecastTime, type Overview } from '@/lib/disaster';

export default function Dashboard({ overview }: { overview: Overview }) {
    const { url } = usePage();
    const region = new URLSearchParams(url.split('?')[1]).has('region')
        ? overview.region
        : undefined;
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [lastRequested, setLastRequested] = useState<string>();

    const selectRegion = useCallback((next: string) => {
        setLastRequested(next);
        setBusy(true);
        setError(false);
        router.get(
            '/dashboard',
            { region: next },
            {
                only: ['overview'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
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
    }, []);

    const source = overview.sources.find((entry) =>
        entry.name.includes('BMKG CAP'),
    );
    const activeAlerts = overview.alerts.filter(
        (record) => record.alert_state === 'ACTIVE' && !record.synthetic,
    );
    const latestEvents = overview.events
        .filter((record) => !record.synthetic)
        .slice(0, 3);
    const forecast = region
        ? overview.forecasts.find(
              (record) => !record.synthetic && !record.expired,
          )
        : undefined;
    const query = region ? '?region=' + encodeURIComponent(region) : '';

    return (
        <>
            <Head title="Kondisi Sekitar" />
            <PageHeading
                title="Kondisi Sekitar"
                description="Pilih wilayah, cek informasi resmi, lalu temukan tindakan yang kamu perlukan."
            />
            <section
                className="dr-response-location"
                aria-labelledby="response-location-title"
            >
                <h2
                    id="response-location-title"
                    className="text-lg font-semibold"
                >
                    {region ? overview.region_name : 'Lokasi belum dipilih'}
                </h2>
                <WeatherLocation
                    autoLocate={!region}
                    overview={
                        region
                            ? overview
                            : { region_name: 'Cari nama atau kode wilayah' }
                    }
                    onSelect={selectRegion}
                    disabled={busy}
                />
                {busy && (
                    <p role="status" className="dr-caption dr-muted">
                        Memuat wilayah pilihan…
                    </p>
                )}
                {error && lastRequested && (
                    <Notice danger>
                        Wilayah belum dapat diperbarui.{' '}
                        <Action
                            variant="outline"
                            onClick={() => selectRegion(lastRequested)}
                        >
                            Coba lagi
                        </Action>
                    </Notice>
                )}
            </section>

            <div className="dr-response-grid">
                <div className="dr-stack dr-response-actions">
                    <Panel title="Apa yang kamu butuhkan?">
                        <Action variant="outline" asChild>
                            <Link href={'/bantuan' + query}>Cari Bantuan</Link>
                        </Action>
                        <Action asChild>
                            <Link href="/reports/create">
                                Laporkan Kejadian
                            </Link>
                        </Action>
                        <p className="dr-caption dr-muted">
                            Laporan masuk ke moderator. Untuk pertolongan
                            segera, hubungi layanan darurat.
                        </p>
                        <Action variant="outline" asChild>
                            <Link href="/preparedness">Buka Panduan Siaga</Link>
                        </Action>
                        <Link
                            className="dr-caption underline"
                            href="/my/reports"
                        >
                            Lihat status laporan saya
                        </Link>
                    </Panel>
                    <Panel title="Prakiraan Wilayah">
                        {forecast ? (
                            <p className="text-sm">
                                <strong>{forecast.title}</strong> ·{' '}
                                {forecastTime(forecast)}
                            </p>
                        ) : (
                            <p className="dr-caption dr-muted">
                                {region
                                    ? 'Prakiraan terbaru belum tersedia untuk wilayah ini.'
                                    : 'Pilih wilayah untuk melihat prakiraan setempat.'}
                            </p>
                        )}
                        <Link
                            className="dr-caption underline"
                            href={'/weather' + query}
                        >
                            Buka prakiraan lengkap
                        </Link>
                    </Panel>
                </div>
                <div className="dr-stack dr-response-situation">
                    <Panel title="Peringatan Resmi di Indonesia">
                        <div className="dr-row">
                            <p className="dr-caption dr-muted">
                                Sinkronisasi BMKG:{' '}
                                {dateTime(source?.last_success_at)}
                            </p>
                            <Status
                                value={source?.freshness ?? 'UNAVAILABLE'}
                            />
                        </div>
                        <p className="dr-caption dr-muted">
                            Periksa cakupan wilayah dan masa berlaku pada detail
                            peringatan.
                        </p>
                        {activeAlerts.length ? (
                            activeAlerts
                                .slice(0, 3)
                                .map((record) => (
                                    <RecordCard
                                        key={record.id}
                                        record={record}
                                    />
                                ))
                        ) : (
                            <p className="text-sm">
                                {source?.freshness === 'FRESH'
                                    ? 'Belum ada peringatan aktif di daftar BMKG yang dimuat.'
                                    : 'Data terkini belum tersedia. Periksa informasi langsung dari BMKG.'}
                            </p>
                        )}
                        <Link
                            className="dr-caption underline"
                            href={'/weather' + query + '#peringatan'}
                        >
                            Buka daftar peringatan BMKG
                        </Link>
                        {activeAlerts.length > 0 && (
                            <Link
                                className="dr-caption underline"
                                href="/preparedness/extreme_weather"
                            >
                                Buka panduan cuaca ekstrem
                            </Link>
                        )}
                    </Panel>
                    <Panel
                        title="Peta Situasi Indonesia"
                        aside={
                            <Link className="dr-caption underline" href="/map">
                                Buka peta lengkap
                            </Link>
                        }
                    >
                        <p className="dr-caption dr-muted">
                            Titik merah: gempa. Area biru: peringatan cuaca.
                        </p>
                        <MapPanel combined activeOnly />
                        <details className="dr-source-fold">
                            <summary>Daftar gempa terbaru</summary>
                            {latestEvents.length ? (
                                latestEvents.map((record) => (
                                    <RecordCard
                                        key={record.id}
                                        record={record}
                                    />
                                ))
                            ) : (
                                <p className="dr-caption dr-muted">
                                    Belum ada data gempa yang bisa ditampilkan.
                                </p>
                            )}
                            <Link
                                className="dr-caption underline"
                                href="/earthquakes"
                            >
                                Lihat semua data gempa
                            </Link>
                        </details>
                    </Panel>
                </div>
            </div>

            <details className="dr-source-fold">
                <summary>Status sumber data</summary>
                {overview.sources.map((entry) => (
                    <div key={entry.id} className="dr-row py-2">
                        <a
                            className="underline"
                            href={entry.source_url}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {entry.name}
                        </a>
                        <Status value={entry.freshness} />
                        <span className="dr-caption dr-muted">
                            {dateTime(entry.last_success_at)}
                        </span>
                    </div>
                ))}
            </details>
        </>
    );
}
