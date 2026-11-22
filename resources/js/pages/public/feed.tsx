import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    RecordCard,
    Status,
} from '@/components/disaster/ui';
import { dateTime, stringValue, type Overview } from '@/lib/disaster';
export default function Feed({ overview }: { overview: Overview }) {
    const weather = usePage().url.startsWith('/weather');
    const forecasts = overview.forecasts.filter((record) => !record.expired);
    return (
        <>
            <Head title={weather ? 'Cuaca & Peringatan' : 'Gempa Bumi'} />
            <PageHeading
                title={
                    weather ? 'Cuaca & Peringatan Dini' : 'Informasi Gempa Bumi'
                }
                description="Informasi BMKG. Periksa waktu sumber dan masa berlaku."
            />
            <div className="dr-choices">
                <Link
                    className={`dr-choice ${!weather ? 'active' : ''}`}
                    href="/earthquakes"
                >
                    Gempa Bumi
                </Link>
                <Link
                    className={`dr-choice ${weather ? 'active' : ''}`}
                    href="/weather"
                >
                    Cuaca & Peringatan
                </Link>
            </div>
            {weather && (
                <Panel
                    title="Prakiraan Cuaca"
                    aside={
                        <select
                            className="dr-select"
                            aria-label="Wilayah prakiraan"
                            value={overview.region}
                            onChange={(event) =>
                                router.get(
                                    '/weather',
                                    { region: event.target.value },
                                    { preserveScroll: true },
                                )
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
                    }
                >
                    <p className="dr-caption dr-muted">
                        Cakupan saat ini: dua kelurahan pilot Jatinegara.
                        Prakiraan hujan tidak otomatis berarti banjir.
                    </p>
                    {forecasts.length ? (
                        <div className="dr-weather">
                            {forecasts.map((record) => {
                                const data = record.data as Record<
                                    string,
                                    unknown
                                >;
                                return (
                                    <div
                                        className="dr-weather-slot"
                                        key={record.id}
                                    >
                                        <small>
                                            {dateTime(
                                                stringValue(
                                                    record.forecast_at,
                                                    record.source_time,
                                                ),
                                            )}
                                        </small>
                                        <strong>
                                            {stringValue(
                                                data.weather_desc,
                                                record.title,
                                            )}
                                        </strong>
                                        <span>{stringValue(data.t)} °C</span>
                                        <small>
                                            Kelembapan {stringValue(data.hu)}%
                                        </small>
                                        <Status
                                            value={record.source.freshness}
                                        />
                                        <a
                                            href={record.source_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="dr-caption"
                                        >
                                            BMKG ↗
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState title="Prakiraan berlaku belum tersedia" />
                    )}
                </Panel>
            )}
            <Panel
                title={
                    weather
                        ? 'Peringatan Dini Cuaca · CAP'
                        : 'Kejadian Gempa Terbaru'
                }
            >
                <Notice>
                    Informasi kedaluwarsa tetap dapat dibaca sebagai riwayat,
                    bukan peringatan aktif.
                </Notice>
                <div className="dr-dashboard-lower">
                    {(weather ? overview.alerts : overview.events).map(
                        (record) => (
                            <RecordCard key={record.id} record={record} />
                        ),
                    )}
                </div>
                {!(weather ? overview.alerts : overview.events).length && (
                    <EmptyState />
                )}
            </Panel>
        </>
    );
}
