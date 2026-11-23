import { LocateFixed } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Action } from '@/components/disaster/ui';
import {
    RegionPicker,
    type RegionResult,
} from '@/components/disaster/region-picker';
import type { Overview } from '@/lib/disaster';

const boundaries =
    'https://geoservices.big.go.id/rbi/rest/services/BATASWILAYAH/BATAS_DESAKEL_AR/MapServer/0';
function devicePosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            maximumAge: 60_000,
            timeout: 10_000,
        });
    });
}

async function resolveRegion(
    { latitude, longitude }: GeolocationCoordinates,
    signal: AbortSignal,
): Promise<RegionResult | null> {
    const query = new URLSearchParams({
        f: 'json',
        geometry: longitude.toFixed(4) + ',' + latitude.toFixed(4),
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'KDEPUM,WADMKD,WADMKC,WADMKK',
        returnGeometry: 'false',
    });
    const response = await fetch(boundaries + '/query?' + query, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
        referrerPolicy: 'no-referrer',
    });
    if (!response.ok) throw new Error('Region lookup failed');
    const result: {
        error?: unknown;
        features?: { attributes: Record<string, unknown> }[];
    } = await response.json();
    if (result.error) throw new Error('Region lookup failed');
    const matches = new Map<string, RegionResult>();
    for (const { attributes } of result.features ?? []) {
        const { KDEPUM, WADMKD, WADMKC, WADMKK } = attributes;
        if (
            typeof KDEPUM === 'string' &&
            /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/.test(KDEPUM.trim()) &&
            typeof WADMKD === 'string' &&
            WADMKD.trim()
        ) {
            const code = KDEPUM.trim();
            matches.set(code, {
                code,
                name: WADMKD,
                area: [WADMKC, WADMKK]
                    .filter((value) => typeof value === 'string')
                    .join(', '),
            });
        }
    }
    return matches.size === 1 ? (matches.values().next().value ?? null) : null;
}

export default function WeatherLocation({
    autoLocate,
    disabled,
    overview,
    onSelect,
}: {
    autoLocate: boolean;
    disabled?: boolean;
    overview: Pick<Overview, 'region_name'>;
    onSelect: (region: string) => void;
}) {
    const [locating, setLocating] = useState(autoLocate);
    const [message, setMessage] = useState('');
    const location = useRef<AbortController | null>(null);

    const locate = useCallback(async () => {
        location.current?.abort();
        setMessage('');
        if (!navigator.geolocation) {
            setLocating(false);
            setMessage(
                'Lokasi perangkat tidak tersedia. Cari desa atau kelurahan secara manual.',
            );
            return;
        }
        const request = new AbortController();
        location.current = request;
        setLocating(true);
        try {
            const position = await devicePosition();
            if (request.signal.aborted) return;
            const match = await resolveRegion(position.coords, request.signal);
            if (request.signal.aborted) return;
            if (match) onSelect(match.code);
            else
                setMessage(
                    'Wilayah perangkat belum bisa dipastikan. Pilih desa atau kelurahan secara manual.',
                );
        } catch (error) {
            if (request.signal.aborted) return;
            setMessage(
                error &&
                    typeof error === 'object' &&
                    'code' in error &&
                    error.code === 1
                    ? 'Izin lokasi belum diberikan. Cari desa atau kelurahan secara manual.'
                    : 'Lokasi belum bisa ditentukan. Coba lagi atau cari wilayah secara manual.',
            );
        } finally {
            if (!request.signal.aborted) setLocating(false);
        }
    }, [onSelect]);

    useEffect(() => {
        if (!autoLocate) return;
        const timer = window.setTimeout(() => {
            if (window.location.hash === '#peringatan') setLocating(false);
            else void locate();
        }, 0);
        return () => window.clearTimeout(timer);
    }, [autoLocate, locate]);

    useEffect(() => () => location.current?.abort(), []);

    return (
        <div className="grid items-start gap-5 rounded-xl border bg-card p-4 sm:grid-cols-2 sm:p-5">
            <RegionPicker
                overview={overview}
                disabled={disabled}
                onSelect={(region) => {
                    location.current?.abort();
                    setLocating(false);
                    setMessage('');
                    onSelect(region);
                }}
            />
            <div className="grid gap-2">
                <Action
                    variant="outline"
                    className="min-h-11 justify-self-start"
                    disabled={locating || disabled}
                    onClick={() => void locate()}
                >
                    <LocateFixed aria-hidden="true" />
                    {locating ? 'Mencari lokasi…' : 'Gunakan lokasi perangkat'}
                </Action>
                {message && (
                    <p role="status" className="dr-caption dr-muted">
                        {message}
                    </p>
                )}
                <p className="dr-caption dr-muted">
                    Koordinat dibulatkan sebelum dikirim ke{' '}
                    <a
                        className="underline"
                        href={boundaries}
                        target="_blank"
                        rel="noreferrer"
                    >
                        BIG
                    </a>{' '}
                    untuk menentukan wilayah.
                </p>
            </div>
        </div>
    );
}
