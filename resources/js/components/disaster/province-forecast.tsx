import { Link } from '@inertiajs/react';
import {
    Cloud,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSun,
    Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Action, Status } from '@/components/disaster/ui';
import { dateTime, forecastTime, stringValue } from '@/lib/disaster';
import type { OfficialRecord } from '@/types/disaster';

function forecastIcon(condition: string) {
    if (/petir|guntur/i.test(condition)) return CloudLightning;
    if (/hujan/i.test(condition)) return CloudRain;
    if (/kabut|asap/i.test(condition)) return CloudFog;
    if (/cerah berawan/i.test(condition)) return CloudSun;
    if (/cerah/i.test(condition)) return Sun;
    return Cloud;
}

type District = {
    name: string;
    locality: string;
    code: string;
    status: string;
    forecast: OfficialRecord | null;
};

type Province = {
    province: string;
    target_at: string;
    districts: District[];
};

export default function ProvinceForecast({ region }: { region: string }) {
    const [province, setProvince] = useState<Province>();
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const lifecycle = new AbortController();
        let timer: number | undefined;
        async function load() {
            try {
                if (document.hidden) return;
                const response = await fetch(
                    '/data/weather/province?' + new URLSearchParams({ region }),
                    {
                        signal: AbortSignal.any([
                            lifecycle.signal,
                            AbortSignal.timeout(15_000),
                        ]),
                        headers: { Accept: 'application/json' },
                    },
                );
                if (!response.ok)
                    throw new Error('Province forecast unavailable');
                const result: Province = await response.json();
                if (lifecycle.signal.aborted) return;
                setProvince(result);
                setError(false);
            } catch {
                if (!lifecycle.signal.aborted) setError(true);
            } finally {
                if (!lifecycle.signal.aborted)
                    timer = window.setTimeout(load, 30_000);
            }
        }
        void load();
        return () => {
            lifecycle.abort();
            window.clearTimeout(timer);
        };
    }, [region, attempt]);

    return (
        <section
            className="grid min-w-0 gap-3"
            aria-label="Ringkasan prakiraan provinsi"
        >
            {error && (
                <div className="flex flex-wrap items-center gap-3">
                    <p role="status" className="dr-caption">
                        Prakiraan provinsi belum dapat diperbarui.
                    </p>
                    <Action
                        variant="outline"
                        onClick={() => {
                            setError(false);
                            setAttempt((value) => value + 1);
                        }}
                    >
                        Coba lagi
                    </Action>
                </div>
            )}
            {!province && !error && (
                <p role="status" className="dr-caption dr-muted">
                    Memuat prakiraan provinsi…
                </p>
            )}
            {province && (
                <>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="text-lg font-semibold">
                            {province.province}
                        </h4>
                        <p className="dr-caption dr-muted">
                            Satu jam ke depan · {dateTime(province.target_at)}
                        </p>
                    </div>
                    <p className="dr-caption dr-muted">
                        Satu lokasi rujukan per kabupaten atau kota. Kondisi
                        diambil dari slot tiga jam BMKG yang mencakup waktu
                        tersebut.
                    </p>
                    <ul
                        className="grid gap-3 min-[900px]:grid-cols-2"
                        aria-label="Kabupaten dan kota"
                    >
                        {province.districts.map(
                            ({ code, locality, name, status, forecast }) => {
                                const Icon = forecastIcon(
                                    forecast?.title ?? '',
                                );
                                const temperature =
                                    forecast && !Array.isArray(forecast.data)
                                        ? forecast.data.t
                                        : undefined;
                                return (
                                    <li
                                        key={code}
                                        className="flex min-w-0 flex-wrap items-start justify-between gap-x-5 gap-y-2 rounded-lg border bg-card px-4 py-3"
                                    >
                                        <div>
                                            <Link
                                                href={'/weather?region=' + code}
                                                className="font-semibold underline-offset-4 hover:underline focus-visible:underline"
                                            >
                                                {name}
                                            </Link>
                                            <p className="dr-caption dr-muted">
                                                Rujukan · {locality}
                                            </p>
                                        </div>
                                        {forecast ? (
                                            <div className="flex min-w-0 items-start gap-2.5">
                                                <Icon
                                                    className="mt-0.5 size-6 shrink-0 text-primary"
                                                    aria-hidden="true"
                                                />
                                                <div>
                                                    <strong>
                                                        {forecast.title} ·{' '}
                                                        {temperature == null
                                                            ? 'Suhu belum tersedia'
                                                            : stringValue(
                                                                  temperature,
                                                              ) + ' °C'}
                                                    </strong>
                                                    <p className="dr-caption dr-muted">
                                                        Slot BMKG ·{' '}
                                                        {forecastTime(forecast)}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="dr-caption dr-muted">
                                                {status === 'QUEUED' ||
                                                status === 'BUSY'
                                                    ? 'Menunggu data BMKG'
                                                    : 'Belum ada slot yang mencakup waktu ini'}
                                            </p>
                                        )}
                                        {(status !== 'FRESH' || !forecast) && (
                                            <div className="w-full">
                                                <Status value={status} />
                                            </div>
                                        )}
                                    </li>
                                );
                            },
                        )}
                    </ul>
                </>
            )}
        </section>
    );
}
