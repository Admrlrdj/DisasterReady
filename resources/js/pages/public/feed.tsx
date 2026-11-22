import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    ExternalLink,
    MapPin,
    Search,
    ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    HazardChipBadge,
    HazardSvgIcon,
    inferRecordHazard,
    inferRecordSiagaTier,
    SIAGA_TIERS,
    type SiagaTier,
} from '@/components/disaster/hazard-icons';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    RecordCard,
    Status,
} from '@/components/disaster/ui';
import { usePageVariant } from '@/hooks/use-page-variant';
import {
    dateTime,
    recordLink,
    stringValue,
    type Overview,
} from '@/lib/disaster';
import { cn } from '@/lib/utils';

export default function Feed({ overview }: { overview: Overview }) {
    const weather = usePage().url.startsWith('/weather');
    const { variant } = usePageVariant();
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState<'all' | SiagaTier>('all');

    const forecasts = overview.forecasts.filter((record) => !record.expired);
    const rawRecords = weather ? overview.alerts : overview.events;

    const filteredRecords = useMemo(() => {
        return rawRecords.filter((rec) => {
            const tier = inferRecordSiagaTier(rec);
            if (tierFilter !== 'all' && tier !== tierFilter) {
                return false;
            }
            const q = searchQuery.trim().toLowerCase();
            if (!q) return true;
            const data = (rec.data ?? {}) as Record<string, unknown>;
            const wilayah = stringValue(data.Wilayah, '').toLowerCase();
            return (
                rec.title.toLowerCase().includes(q) ||
                (rec.message ?? '').toLowerCase().includes(q) ||
                wilayah.includes(q)
            );
        });
    }, [rawRecords, searchQuery, tierFilter]);

    return (
        <>
            <Head
                title={
                    weather
                        ? 'Cuaca & Peringatan Dini BMKG'
                        : 'Seismologi & Gempa Bumi BMKG'
                }
            />
            <PageHeading
                eyebrow={
                    weather
                        ? 'FR-04 · FR-05 · Meteorologi & Peringatan CAP XML'
                        : 'FR-03 · Seismologi & Gempa Bumi Resmi BMKG'
                }
                title={
                    weather
                        ? 'Prakiraan Cuaca & Peringatan Dini CAP BMKG'
                        : 'Informasi Gempa Bumi BMKG'
                }
                description="Telemetri resmi BMKG dengan pemisahan waktu sumber, masa berlaku (expires_at), dan indikator status siaga 4 tingkat."
            >
                <Action variant="outline" size="sm" asChild>
                    <Link href="/dashboard">
                        <span>Buka Peta Komando</span>
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                </Action>
                <Action variant="outline" size="sm" asChild>
                    <Link
                        href={`/preparedness/${weather ? 'extreme_weather' : 'earthquake'}`}
                    >
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                        <span>Panduan Siaga</span>
                    </Link>
                </Action>
            </PageHeading>

            {/* Domain Mode Switcher + Search & Siaga Filter Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/85 p-3.5 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
                <div className="dr-choices">
                    <Link
                        className={cn(
                            'dr-choice inline-flex items-center gap-1.5',
                            !weather && 'active',
                        )}
                        href="/earthquakes"
                    >
                        <HazardSvgIcon hazard="earthquake" className="size-4" />
                        <span>Gempa Bumi ({overview.events.length})</span>
                    </Link>
                    <Link
                        className={cn(
                            'dr-choice inline-flex items-center gap-1.5',
                            weather && 'active',
                        )}
                        href="/weather"
                    >
                        <HazardSvgIcon
                            hazard="extreme_weather"
                            className="size-4"
                        />
                        <span>Cuaca & CAP ({overview.alerts.length})</span>
                    </Link>
                </div>

                <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                    <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={
                                weather
                                    ? 'Cari wilayah atau peringatan CAP...'
                                    : 'Cari wilayah atau magnitudo gempa...'
                            }
                            aria-label="Cari catatan BMKG"
                            className="dr-input h-9 rounded-full pl-8 text-xs"
                        />
                    </div>

                    <div
                        role="group"
                        aria-label="Filter tingkat siaga"
                        className="flex flex-wrap items-center gap-1"
                    >
                        {(
                            [
                                ['all', 'Semua'],
                                ['awas', 'Awas'],
                                ['siaga', 'Siaga'],
                                ['waspada', 'Waspada'],
                                ['normal', 'Normal'],
                            ] as const
                        ).map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={tierFilter === id}
                                onClick={() => setTierFilter(id)}
                                className={cn(
                                    'pressable min-h-8 cursor-pointer rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                                    tierFilter === id
                                        ? id !== 'all'
                                            ? SIAGA_TIERS[id].badgeClass
                                            : 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border/80 bg-background/70 text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {weather && (
                <Panel
                    title={`Prakiraan Cuaca 3 Jam BMKG · ${overview.regions[overview.region] ?? overview.region}`}
                    subtitle="Cakupan pilot Jatinegara (adm4). Prakiraan hujan adalah indikator meteorologi, bukan penentu banjir otomatis."
                    aside={
                        <div className="flex items-center gap-2">
                            <MapPin
                                className="size-4 text-primary"
                                aria-hidden="true"
                            />
                            <select
                                className="dr-select h-9 w-auto rounded-full px-3 text-xs font-semibold"
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
                                            {name} ({code})
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                    }
                >
                    {forecasts.length ? (
                        <div className="dr-weather">
                            {forecasts.map((record) => {
                                const data = record.data as Record<
                                    string,
                                    unknown
                                >;
                                const tier = inferRecordSiagaTier(record);
                                return (
                                    <div
                                        className="dr-weather-slot space-y-1.5"
                                        key={record.id}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <small className="text-xs font-semibold text-muted-foreground tabular-nums">
                                                {dateTime(
                                                    stringValue(
                                                        record.forecast_at,
                                                        record.source_time,
                                                    ),
                                                )}
                                            </small>
                                            <HazardChipBadge
                                                hazard="extreme_weather"
                                                tier={tier}
                                                showTier={false}
                                            />
                                        </div>
                                        <strong className="block text-sm font-bold text-foreground">
                                            {stringValue(
                                                data.weather_desc,
                                                record.title,
                                            )}
                                        </strong>
                                        <span className="block text-2xl font-bold tracking-tight text-primary tabular-nums">
                                            {stringValue(data.t)} °C
                                        </span>
                                        <small className="block text-xs text-muted-foreground tabular-nums">
                                            Kelembapan {stringValue(data.hu)}%
                                        </small>
                                        <div className="flex items-center justify-between gap-2 pt-1">
                                            <Status
                                                value={record.source.freshness}
                                            />
                                            <a
                                                href={record.source_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
                                            >
                                                <span>BMKG</span>
                                                <ExternalLink
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState title="Prakiraan berlaku belum tersedia">
                            Jalankan worker sinkronisasi cuaca BMKG atau periksa
                            kembali status adapter pada halaman admin.
                        </EmptyState>
                    )}
                </Panel>
            )}

            <Panel
                title={
                    weather
                        ? 'Peringatan Dini Cuaca · CAP XML BMKG'
                        : 'Daftar Kejadian Gempa Bumi Terbaru'
                }
                subtitle={`Menampilkan ${filteredRecords.length} dari ${rawRecords.length} catatan tersimpan`}
            >
                <Notice>
                    Informasi kedaluwarsa tetap dapat dibaca sebagai riwayat
                    audit, bukan peringatan darurat aktif.
                </Notice>

                {filteredRecords.length > 0 ? (
                    variant === 'c' ? (
                        /* Version C: Editorial Tabular Ledger */
                        <div className="dr-table-wrap">
                            <table className="dr-table">
                                <thead>
                                    <tr>
                                        <th>Bencana & Siaga</th>
                                        <th>Judul & Wilayah</th>
                                        <th>Parameter</th>
                                        <th>Waktu Sumber</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map((rec) => {
                                        const hz = inferRecordHazard(rec);
                                        const tier = inferRecordSiagaTier(rec);
                                        const data = (rec.data ?? {}) as Record<
                                            string,
                                            unknown
                                        >;
                                        return (
                                            <tr key={rec.id}>
                                                <td>
                                                    <HazardChipBadge
                                                        hazard={hz}
                                                        tier={tier}
                                                    />
                                                </td>
                                                <td>
                                                    <Link
                                                        href={recordLink(rec)}
                                                        className="font-bold text-foreground hover:text-primary hover:underline"
                                                    >
                                                        {rec.title}
                                                    </Link>
                                                </td>
                                                <td className="tabular-nums">
                                                    {rec.kind === 'event'
                                                        ? `M${stringValue(data.Magnitude)} · ${stringValue(data.Kedalaman)}`
                                                        : stringValue(
                                                              data.severity,
                                                              'CAP XML',
                                                          )}
                                                </td>
                                                <td className="tabular-nums">
                                                    {dateTime(rec.source_time)}
                                                </td>
                                                <td>
                                                    <Status
                                                        value={
                                                            rec.alert_state ??
                                                            rec.source.freshness
                                                        }
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* Version A & B: Responsive Multi-Column Command Cards */
                        <div
                            className={cn(
                                'grid grid-cols-1 gap-3',
                                variant === 'b'
                                    ? 'md:grid-cols-2 xl:grid-cols-3'
                                    : 'md:grid-cols-2',
                            )}
                        >
                            {filteredRecords.map((record) => (
                                <RecordCard key={record.id} record={record} />
                            ))}
                        </div>
                    )
                ) : (
                    <EmptyState
                        title={
                            rawRecords.length === 0
                                ? 'Belum ada catatan BMKG di database'
                                : 'Tidak ada catatan yang cocok dengan filter'
                        }
                        action={
                            (searchQuery || tierFilter !== 'all') && (
                                <Action
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setTierFilter('all');
                                    }}
                                >
                                    Reset Filter
                                </Action>
                            )
                        }
                    />
                )}
            </Panel>
        </>
    );
}
