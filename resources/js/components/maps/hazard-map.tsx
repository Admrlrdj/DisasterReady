import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import type { GeoJSONSource, LngLatBoundsLike } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { FeatureCollection, Geometry } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Action, Status } from '@/components/disaster/ui';
import { dateTime, recordLink, stringValue } from '@/lib/disaster';
import type { OfficialRecord } from '@/types/disaster';
import type { MapPanelProps } from './map-panel';

setWorkerUrl(workerUrl);

const indonesia: LngLatBoundsLike = [
    [95, -11],
    [142, 7],
];
type MapData = FeatureCollection<Geometry, OfficialRecord> & {
    truncated: boolean;
};
const empty: MapData = {
    type: 'FeatureCollection',
    features: [],
    truncated: false,
};

export default function HazardMap({
    kind = 'event',
    hazard = '',
    region,
    activeOnly,
    revision = 0,
    historicalTiles,
}: MapPanelProps) {
    const container = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<Map | null>(null);
    const [data, setData] = useState<MapData>(empty);
    const [selected, setSelected] = useState<OfficialRecord | null>(null);
    const [renderError, setRenderError] = useState('');
    const [dataError, setDataError] = useState('');
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    const [requestAttempt, setRequestAttempt] = useState(0);

    useEffect(() => {
        if (!container.current) return;
        let instance: Map;
        try {
            instance = new Map({
                container: container.current,
                style:
                    import.meta.env.VITE_MAP_STYLE_URL ||
                    'https://tiles.openfreemap.org/styles/positron',
                center: [117, -2],
                zoom: 3,
                minZoom: 1,
                maxBounds: [
                    [80, -40],
                    [165, 40],
                ],
                attributionControl: { compact: true },
                cooperativeGestures: true,
            });
        } catch {
            setRenderError('Peta tidak dapat dibuka di perangkat ini.');
            return;
        }
        instance.addControl(
            new NavigationControl({ showCompass: false }),
            'top-right',
        );
        let ready = false;
        const timeout = setTimeout(() => {
            if (!ready) setRenderError('Peta dasar belum dapat dimuat.');
        }, 12000);
        instance.on('error', (event) => {
            if ('sourceId' in event && event.sourceId === 'inarisk') {
                setDataError(
                    'Layer InaRISK belum dapat dimuat. Buka WebGIS BNPB untuk melihat peta sumber.',
                );
            } else {
                setRenderError('Sebagian peta dasar belum dapat dimuat.');
            }
        });
        instance.on('load', () => {
            ready = true;
            clearTimeout(timeout);
            instance.fitBounds(indonesia, { padding: 24, duration: 0 });
            instance.addSource('official', { type: 'geojson', data: empty });
            instance.addLayer({
                id: 'official-areas',
                type: 'fill',
                source: 'official',
                filter: ['==', ['geometry-type'], 'Polygon'],
                paint: {
                    'fill-color': [
                        'case',
                        ['==', ['get', 'alert_state'], 'ACTIVE'],
                        '#d97706',
                        '#667970',
                    ],
                    'fill-opacity': 0.34,
                    'fill-outline-color': '#825214',
                },
            });
            instance.addLayer({
                id: 'official-points',
                type: 'circle',
                source: 'official',
                filter: ['==', ['geometry-type'], 'Point'],
                paint: {
                    'circle-color': [
                        'match',
                        ['get', 'kind'],
                        'forecast',
                        '#226781',
                        'alert',
                        '#ad6306',
                        '#13604b',
                    ],
                    'circle-radius': 7,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                },
            });
            setMap(instance);
        });
        return () => {
            clearTimeout(timeout);
            instance.remove();
        };
    }, [attempt]);

    useEffect(() => {
        if (!map || historicalTiles) return;
        const source = map.getSource('official') as GeoJSONSource;
        let timer: ReturnType<typeof setTimeout>;
        let pending: AbortController | undefined;

        const refresh = () => {
            clearTimeout(timer);
            pending?.abort();
            timer = setTimeout(async () => {
                const request = new AbortController();
                pending = request;
                setLoading(true);
                setDataError('');
                try {
                    const bounds = map.getBounds();
                    const bbox = [
                        Math.max(90, bounds.getWest()),
                        Math.max(-20, bounds.getSouth()),
                        Math.min(150, bounds.getEast()),
                        Math.min(20, bounds.getNorth()),
                    ];
                    let result = empty;
                    if (bbox[0] < bbox[2] && bbox[1] < bbox[3]) {
                        const query = new URLSearchParams({
                            kind,
                            limit: '100',
                        });
                        bbox.forEach((value) =>
                            query.append('bbox[]', String(value)),
                        );
                        if (hazard) query.set('hazard', hazard);
                        if (kind === 'alert' && activeOnly)
                            query.set('status', 'active');
                        if (kind === 'forecast' && region)
                            query.set('region', region);
                        const response = await fetch(`/data/map?${query}`, {
                            signal: request.signal,
                            headers: { Accept: 'application/json' },
                        });
                        if (!response.ok)
                            throw new Error('Map data request failed');
                        result = (await response.json()) as MapData;
                    }
                    if (request.signal.aborted) return;
                    await source.setData(result);
                    if (!request.signal.aborted) setData(result);
                } catch {
                    if (!request.signal.aborted) {
                        setDataError(
                            'Data BMKG untuk area ini belum dapat dimuat.',
                        );
                    }
                } finally {
                    if (!request.signal.aborted) setLoading(false);
                }
            }, 300);
        };

        setSelected(null);
        setData(empty);
        setLoading(true);
        void source.setData(empty).catch(() => undefined);
        refresh();
        map.on('moveend', refresh);
        return () => {
            clearTimeout(timer);
            pending?.abort();
            map.off('moveend', refresh);
        };
    }, [
        map,
        kind,
        hazard,
        region,
        activeOnly,
        revision,
        requestAttempt,
        historicalTiles,
    ]);

    useEffect(() => {
        if (!map || !historicalTiles) return;
        setData(empty);
        setSelected(null);
        setDataError('');
        setLoading(true);
        map.setLayoutProperty('official-points', 'visibility', 'none');
        map.setLayoutProperty('official-areas', 'visibility', 'none');
        const onIdle = map.on('idle', () => setLoading(false));
        map.addSource('inarisk', {
            type: 'raster',
            tiles: [historicalTiles],
            tileSize: 256,
            maxzoom: 13,
            bounds: [95, -11, 142, 7],
            attribution: 'BNPB InaRISK',
        });
        map.addLayer({
            id: 'inarisk',
            type: 'raster',
            source: 'inarisk',
            paint: { 'raster-opacity': 0.72 },
        });
        return () => {
            onIdle.unsubscribe();
            if (!map.getStyle() || !map.getLayer('inarisk')) return;
            map.removeLayer('inarisk');
            map.removeSource('inarisk');
            map.setLayoutProperty('official-points', 'visibility', 'visible');
            map.setLayoutProperty('official-areas', 'visibility', 'visible');
        };
    }, [map, historicalTiles, requestAttempt]);

    useEffect(() => {
        if (!map || historicalTiles) return;
        const subscription = map.on(
            'click',
            ['official-points', 'official-areas'],
            (event) => {
                const id = Number(event.features?.[0]?.properties?.id);
                setSelected(
                    data.features.find(
                        (feature) => feature.properties.id === id,
                    )?.properties ?? null,
                );
            },
        );
        const enter = map.on(
            'mouseenter',
            ['official-points', 'official-areas'],
            () => {
                map.getCanvas().style.cursor = 'pointer';
            },
        );
        const leave = map.on(
            'mouseleave',
            ['official-points', 'official-areas'],
            () => {
                map.getCanvas().style.cursor = '';
            },
        );
        return () => {
            subscription.unsubscribe();
            enter.unsubscribe();
            leave.unsubscribe();
            map.getCanvas().style.cursor = '';
        };
    }, [data, map, historicalTiles]);

    function retry() {
        if (renderError) {
            setMap(null);
            setSelected(null);
            setData(empty);
            setRenderError('');
            setLoading(true);
            setAttempt((value) => value + 1);
        } else {
            setRequestAttempt((value) => value + 1);
        }
    }

    return (
        <div className="dr-map-frame">
            <div className="dr-live-map">
                <div
                    ref={container}
                    className="maplibregl-map"
                    aria-label="Peta data resmi Indonesia"
                />
                {selected && (
                    <div
                        className="dr-map-selection"
                        aria-label="Ringkasan pilihan peta"
                    >
                        <div className="dr-row">
                            <strong>{selected.title}</strong>
                            <Action
                                variant="ghost"
                                onClick={() => setSelected(null)}
                                aria-label="Tutup ringkasan"
                            >
                                ×
                            </Action>
                        </div>
                        <p className="dr-caption">
                            {dateTime(
                                selected.forecast_at ?? selected.source_time,
                            )}
                        </p>
                        {selected.expires_at && (
                            <p className="dr-caption">
                                Berlaku sampai {dateTime(selected.expires_at)}
                            </p>
                        )}
                        <div className="dr-actions">
                            <Status
                                value={
                                    selected.alert_state ??
                                    selected.source.freshness
                                }
                            />
                            {selected.alert_state &&
                                selected.source.freshness !== 'FRESH' && (
                                    <Status value={selected.source.freshness} />
                                )}
                        </div>
                        {selected.kind === 'forecast' ? (
                            <p>
                                {stringValue(
                                    (selected.data as Record<string, unknown>)
                                        .t,
                                    'Suhu belum tersedia',
                                )}
                                {typeof (
                                    selected.data as Record<string, unknown>
                                ).t === 'number'
                                    ? ' °C'
                                    : ''}{' '}
                                · <a href={selected.source_url}>BMKG ↗</a>
                            </p>
                        ) : (
                            <Link
                                href={recordLink(selected)}
                                className="underline"
                            >
                                Buka detail
                            </Link>
                        )}
                    </div>
                )}
            </div>
            <div className="dr-map-tools">
                <p role="status" className="dr-caption dr-muted">
                    {renderError ||
                        dataError ||
                        (historicalTiles
                            ? loading
                                ? 'Memuat layer kajian InaRISK…'
                                : 'Layer kajian historis · BNPB InaRISK'
                            : loading
                              ? 'Memuat peta dan data BMKG…'
                              : data.features.length
                                ? `${data.features.length} fitur BMKG${data.truncated ? ' · Perbesar peta untuk melihat hasil lain' : ''}`
                                : 'Belum ada data BMKG pada area ini.')}
                </p>
                <div className="dr-actions">
                    {(dataError || renderError) && (
                        <Action variant="outline" onClick={retry}>
                            Coba lagi
                        </Action>
                    )}
                    <Action
                        variant="outline"
                        disabled={!map}
                        onClick={() =>
                            map?.fitBounds(indonesia, {
                                padding: 24,
                                duration: 0,
                            })
                        }
                    >
                        Indonesia
                    </Action>
                </div>
            </div>
            {data.features.length > 0 && (
                <details className="dr-map-results">
                    <summary>Lihat hasil peta</summary>
                    <ul>
                        {data.features.map(({ properties: record }) => (
                            <li key={record.id}>
                                {record.kind === 'forecast' ? (
                                    <button
                                        type="button"
                                        onClick={() => setSelected(record)}
                                    >
                                        {record.title} ·{' '}
                                        {dateTime(record.forecast_at)}
                                    </button>
                                ) : (
                                    <Link href={recordLink(record)}>
                                        {record.title} ·{' '}
                                        {dateTime(record.source_time)}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </div>
    );
}
