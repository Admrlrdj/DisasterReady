import { router } from '@inertiajs/react';
import { useEffect, useId, useState } from 'react';
import { dateTime, type Overview } from '@/lib/disaster';

type RegionResult = { code: string; name: string; area: string };

export function RegionPicker({
    overview,
    onSelect,
    disabled,
}: {
    overview: Overview;
    onSelect: (region: string) => void;
    disabled?: boolean;
}) {
    const id = useId();
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState<{
        query: string;
        data: RegionResult[] | null;
    }>();
    const needle = query.trim();
    const results = search?.query === needle ? search.data : undefined;

    useEffect(() => {
        if (needle.length < 2) return;
        const request = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                const response = await fetch(
                    '/data/regions?' + new URLSearchParams({ q: needle }),
                    {
                        headers: { Accept: 'application/json' },
                        signal: request.signal,
                    },
                );
                if (!response.ok) throw new Error('Region search failed');
                const { data } = (await response.json()) as {
                    data: RegionResult[];
                };
                setSearch({ query: needle, data });
            } catch {
                if (!request.signal.aborted)
                    setSearch({ query: needle, data: null });
            }
        }, 300);
        return () => {
            window.clearTimeout(timer);
            request.abort();
        };
    }, [needle]);

    return (
        <div className="dr-region-picker">
            <label htmlFor={id}>Desa atau kelurahan</label>
            <input
                id={id}
                className="dr-select"
                type="search"
                placeholder={overview.region_name}
                value={query}
                maxLength={100}
                onChange={(event) => setQuery(event.target.value)}
            />
            {needle.length >= 2 && (
                <>
                    <span className="dr-caption" role="status">
                        {results === undefined
                            ? 'Mencari wilayah...'
                            : results === null
                              ? 'Pencarian belum tersedia.'
                              : results.length === 0
                                ? 'Wilayah tidak ditemukan.'
                                : `${results.length} hasil. Persempit pencarian dengan nama kecamatan atau provinsi.`}
                    </span>
                    {!!results?.length && (
                        <ul
                            aria-label="Hasil pencarian wilayah"
                            className="dr-region-results"
                        >
                            {results.map(({ code, name, area }) => (
                                <li key={code}>
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                            setQuery('');
                                            onSelect(code);
                                        }}
                                    >
                                        <strong>{name}</strong>
                                        <small>
                                            {area} · {code}
                                        </small>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}

const weatherStates: Record<string, string> = {
    QUEUED: 'Prakiraan sedang diminta ke BMKG.',
    BUSY: 'Antrean prakiraan penuh. Coba perbarui sebentar lagi.',
    FAILED: 'Prakiraan gagal disinkronkan. Coba perbarui nanti.',
    STALE: 'Prakiraan tersimpan sudah lama. Periksa waktu sumber.',
    UNAVAILABLE: 'Prakiraan untuk wilayah ini belum tersedia.',
};

export function RegionWeatherStatus({ overview }: { overview: Overview }) {
    const { state, fetched_at: fetchedAt } = overview.weather_status;
    const { region } = overview;
    useEffect(() => {
        if (state !== 'QUEUED') return;
        const refresh = () => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['overview'], showProgress: false });
            }
        };
        const timers = [4000, 8000, 16000, 30000, 60000].map((delay) =>
            window.setTimeout(refresh, delay),
        );
        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, [state, region]);

    return (
        <p className="dr-caption dr-muted" role="status">
            <strong>{overview.region_name}</strong>
            {weatherStates[state] && ` · ${weatherStates[state]}`}
            {fetchedAt && ` · Sinkronisasi ${dateTime(fetchedAt)}`}
        </p>
    );
}
