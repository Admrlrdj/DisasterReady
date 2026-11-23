import { Head, router, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Cloud,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSun,
    Compass,
    Droplets,
    MapPin,
    Moon,
    Sun,
    Wind,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RegionWeatherStatus } from '@/components/disaster/region-picker';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    RecordCard,
} from '@/components/disaster/ui';
import WeatherLocation from '@/components/disaster/weather-location';
import { forecastTime, type Overview } from '@/lib/disaster';
import type { OfficialRecord } from '@/types/disaster';

const bmkg = 'https://data.bmkg.go.id/prakiraan-cuaca/';
const directions: Record<string, string> = {
    N: 'Utara',
    NE: 'Timur laut',
    E: 'Timur',
    SE: 'Tenggara',
    S: 'Selatan',
    SW: 'Barat daya',
    W: 'Barat',
    NW: 'Barat laut',
    CALM: 'Tenang',
};
const localDay = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
});

function details(record: OfficialRecord) {
    return Array.isArray(record.data) ? {} : record.data;
}

function localParts(record: OfficialRecord) {
    const local = details(record).local_datetime;
    const match =
        typeof local === 'string' &&
        /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}):\d{2}$/.exec(local);
    return match ? { day: match[1], time: match[2] } : null;
}

function dayLabel(day: string) {
    const date = new Date(day + 'T00:00:00Z');
    return Number.isNaN(date.getTime())
        ? 'Waktu prakiraan'
        : localDay.format(date);
}

function weatherIcon(record: OfficialRecord) {
    const { title } = record;
    if (/petir|guntur/i.test(title)) return CloudLightning;
    if (/hujan/i.test(title)) return CloudRain;
    if (/kabut|asap/i.test(title)) return CloudFog;
    if (/cerah berawan/i.test(title)) return CloudSun;
    if (/cerah/i.test(title)) {
        const time = localParts(record)?.time;
        return time && (time < '06:00' || time >= '18:00') ? Moon : Sun;
    }
    return Cloud;
}

function measurement(value: unknown, unit: string): string {
    return typeof value === 'number' ||
        (typeof value === 'string' &&
            value.trim() &&
            Number.isFinite(Number(value)))
        ? value + unit
        : '—';
}

function ForecastTimeline({ records }: { records: OfficialRecord[] }) {
    const scroll = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ start: true, end: true });

    const updateEdges = useCallback(() => {
        const list = scroll.current;
        if (!list) return;
        const start = list.scrollLeft < 2;
        const end = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
        setEdges((old) =>
            old.start === start && old.end === end ? old : { start, end },
        );
    }, []);

    useEffect(() => {
        const list = scroll.current;
        if (!list) return;
        const resize = new ResizeObserver(updateEdges);
        resize.observe(list);
        if (list.firstElementChild) resize.observe(list.firstElementChild);
        return () => resize.disconnect();
    }, [updateEdges]);

    function move(direction: number) {
        const list = scroll.current;
        if (!list) return;
        list.scrollBy({
            left: direction * list.clientWidth * 0.8,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 'instant'
                : 'smooth',
        });
    }

    const groups = new Map<string, OfficialRecord[]>();
    for (const record of records) {
        const day = localParts(record)?.day ?? '';
        const group = groups.get(day) ?? [];
        group.push(record);
        groups.set(day, group);
    }

    return (
        <section aria-labelledby="timeline-title" className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold" id="timeline-title">
                        Prakiraan 3 Jam-an
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Waktu setempat · Suhu dan kelembapan
                    </p>
                </div>
                <div className="flex gap-2">
                    <Action
                        variant="outline"
                        className="size-11"
                        aria-label="Lihat jam sebelumnya"
                        disabled={edges.start}
                        onClick={() => move(-1)}
                    >
                        <ChevronLeft aria-hidden="true" />
                    </Action>
                    <Action
                        variant="outline"
                        className="size-11"
                        aria-label="Lihat jam berikutnya"
                        disabled={edges.end}
                        onClick={() => move(1)}
                    >
                        <ChevronRight aria-hidden="true" />
                    </Action>
                </div>
            </div>
            <div
                ref={scroll}
                onScroll={updateEdges}
                tabIndex={0}
                role="region"
                aria-label="Linimasa prakiraan cuaca, dapat digeser"
                className="max-w-full overflow-x-auto rounded-xl border bg-card focus-visible:outline-2 focus-visible:outline-ring"
            >
                <div className="flex w-max min-w-full divide-x">
                    {[...groups].map(([day, slots]) => (
                        <section className="grow" key={day}>
                            <h3 className="border-b bg-muted px-3 py-2 text-sm font-semibold capitalize">
                                {day ? dayLabel(day) : 'Waktu prakiraan'}
                            </h3>
                            <ul className="flex divide-x">
                                {slots.map((record) => {
                                    const Icon = weatherIcon(record);
                                    const data = details(record);
                                    return (
                                        <li
                                            key={record.id}
                                            className="grid w-28 shrink-0 grid-rows-[auto_auto_minmax(2rem,auto)_auto_auto] justify-items-center gap-2 px-2 py-3 text-center"
                                        >
                                            <time
                                                dateTime={
                                                    record.forecast_at ??
                                                    undefined
                                                }
                                                className="text-sm font-semibold tabular-nums"
                                            >
                                                {localParts(record)?.time ??
                                                    forecastTime(record)}
                                            </time>
                                            <Icon
                                                className="size-7 text-primary"
                                                aria-hidden="true"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {record.title}
                                            </span>
                                            <strong className="text-lg tabular-nums">
                                                {measurement(data.t, ' °C')}
                                            </strong>
                                            <span className="text-xs text-muted-foreground tabular-nums">
                                                {measurement(data.hu, '%')}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function Weather({ overview }: { overview: Overview }) {
    const { url } = usePage();
    const autoLocate = !new URLSearchParams(url.split('?')[1]).has('region');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const [lastRequested, setLastRequested] = useState(overview.region);
    const [clock, setClock] = useState(() => Date.parse(overview.generated_at));
    useEffect(() => {
        const update = () => setClock(Date.now());
        const timer = window.setInterval(update, 30_000);
        window.addEventListener('focus', update);
        return () => {
            window.clearInterval(timer);
            window.removeEventListener('focus', update);
        };
    }, []);
    const selectRegion = useCallback((region: string) => {
        setLastRequested(region);
        setBusy(true);
        setError(false);
        router.get(
            '/weather',
            { region },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only: ['overview'],
                onError: () => setError(true),
                onNetworkError: () => {
                    setError(true);
                    return false;
                },
                onHttpException: () => {
                    setError(true);
                    return false;
                },
                onFinish: () => setBusy(false),
            },
        );
    }, []);

    const now = Math.max(clock, Date.parse(overview.generated_at));
    const records = autoLocate
        ? []
        : overview.forecasts.filter(
              (record) =>
                  !record.expired &&
                  (!record.expires_at || Date.parse(record.expires_at) > now),
          );
    const current = records.findLast(
        (record) => record.forecast_at && Date.parse(record.forecast_at) <= now,
    );
    const featured = current ?? records[0];
    const Icon = featured ? weatherIcon(featured) : Cloud;
    const data = featured ? details(featured) : {};
    const windDirection =
        typeof data.wd === 'string' && data.wd.trim()
            ? (directions[data.wd.toUpperCase()] ?? data.wd)
            : '—';

    return (
        <>
            <Head title="Prakiraan Cuaca" />
            <PageHeading
                title="Prakiraan Cuaca"
                description="Cek prakiraan BMKG untuk desa atau kelurahan di Indonesia."
            />
            <WeatherLocation
                key={autoLocate ? 'automatic' : 'selected'}
                autoLocate={autoLocate}
                overview={
                    autoLocate
                        ? { region_name: 'Contoh: nama kelurahan' }
                        : overview
                }
                onSelect={selectRegion}
            />
            {busy && (
                <p role="status" className="dr-caption dr-muted">
                    Memuat prakiraan wilayah terpilih…
                </p>
            )}
            {error && (
                <Notice danger>
                    Prakiraan wilayah belum dapat dimuat.{' '}
                    <Action
                        variant="outline"
                        disabled={busy}
                        onClick={() => selectRegion(lastRequested)}
                    >
                        Coba lagi
                    </Action>
                </Notice>
            )}
            <section
                aria-label="Ringkasan prakiraan"
                className="grid items-center gap-5 rounded-2xl border bg-(--verified-soft) p-5 sm:grid-cols-[auto_1fr] sm:p-8"
            >
                <div className="grid size-20 place-items-center rounded-full border border-primary/25 text-primary sm:size-28">
                    <Icon
                        className="size-12 sm:size-16"
                        strokeWidth={1.4}
                        aria-hidden="true"
                    />
                </div>
                <div className="min-w-0 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <MapPin
                            className="size-4 shrink-0 text-primary"
                            aria-hidden="true"
                        />
                        {autoLocate
                            ? 'Lokasi belum dipilih'
                            : overview.region_name}
                    </div>
                    {featured ? (
                        <>
                            <p className="text-sm text-muted-foreground">
                                {current
                                    ? 'Prakiraan saat ini'
                                    : 'Prakiraan berikutnya'}{' '}
                                · {forecastTime(featured)}
                            </p>
                            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                                <strong className="text-5xl font-semibold tracking-tight tabular-nums">
                                    {measurement(data.t, ' °C')}
                                </strong>
                                <span className="text-lg font-medium">
                                    {featured.title}
                                </span>
                            </div>
                            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Droplets
                                        className="size-4 text-primary"
                                        aria-hidden="true"
                                    />
                                    <dt>Kelembapan</dt>
                                    <dd className="font-semibold">
                                        {measurement(data.hu, '%')}
                                    </dd>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Wind
                                        className="size-4 text-primary"
                                        aria-hidden="true"
                                    />
                                    <dt>Angin</dt>
                                    <dd className="font-semibold">
                                        {measurement(data.ws, ' km/jam')}
                                    </dd>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Compass
                                        className="size-4 text-primary"
                                        aria-hidden="true"
                                    />
                                    <dt>Dari</dt>
                                    <dd className="font-semibold">
                                        {windDirection}
                                    </dd>
                                </div>
                            </dl>
                        </>
                    ) : (
                        <h2 className="text-xl font-semibold">
                            {autoLocate
                                ? 'Pilih lokasi untuk melihat prakiraan'
                                : 'Prakiraan berlaku belum tersedia'}
                        </h2>
                    )}
                </div>
            </section>
            <div className="flex flex-wrap items-center justify-between gap-2">
                {!autoLocate && <RegionWeatherStatus overview={overview} />}
                {!autoLocate &&
                    !error &&
                    ['FAILED', 'BUSY', 'STALE', 'UNAVAILABLE'].includes(
                        overview.weather_status.state,
                    ) && (
                        <Action
                            variant="outline"
                            disabled={busy}
                            onClick={() => selectRegion(overview.region)}
                        >
                            Coba lagi
                        </Action>
                    )}
                <a
                    className="dr-caption underline"
                    href={bmkg}
                    target="_blank"
                    rel="noreferrer"
                >
                    Sumber data BMKG ↗
                </a>
            </div>
            {!!records.length && (
                <ForecastTimeline key={overview.region} records={records} />
            )}
            <section
                id="peringatan"
                className="scroll-mt-24"
                aria-label="Peringatan dini cuaca"
            >
                <Panel title="Peringatan Dini Cuaca">
                    <Notice>
                        Periksa masa berlaku peringatan BMKG. Peringatan
                        kedaluwarsa ditampilkan sebagai riwayat.
                    </Notice>
                    <div className="dr-dashboard-lower">
                        {overview.alerts.map((record) => (
                            <RecordCard key={record.id} record={record} />
                        ))}
                    </div>
                    {!overview.alerts.length && <EmptyState />}
                </Panel>
            </section>
        </>
    );
}
