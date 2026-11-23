import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import type { GeoJSONSource, LngLatBoundsLike } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { Feature, FeatureCollection, Geometry, Point } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Action, Status } from '@/components/disaster/ui';
import {
    dateTime,
    forecastTime,
    recordLink,
    stringValue,
} from '@/lib/disaster';
import type { OfficialRecord } from '@/types/disaster';
import type { MapPanelProps } from './map-panel';

setWorkerUrl(workerUrl);

const indonesia: LngLatBoundsLike = [
    [95, -11],
    [142, 7],
];
const earthquakeRings = [
    { id: 'earthquake-ring-14', radius: 14, opacity: 0.72 },
    { id: 'earthquake-ring-21', radius: 21, opacity: 0.4 },
];

type MapRecord = OfficialRecord & { weatherIcon?: string; rainLevel?: number };
type MapFeature = Feature<Geometry, MapRecord> & { weather_point?: Point };
type MapData = Omit<FeatureCollection<Geometry, MapRecord>, 'features'> & {
    features: MapFeature[];
    truncated: boolean;
};
const empty: MapData = {
    type: 'FeatureCollection',
    features: [],
    truncated: false,
};

const weatherIcons = {
    cloud: 'M7 16a4 4 0 1 1 .9-7.9 5.5 5.5 0 0 1 10.4 1.2A3.4 3.4 0 0 1 18 16H7Z',
    rain: 'M7 14a4 4 0 1 1 .9-7.9 5.5 5.5 0 0 1 10.4 1.2A3.4 3.4 0 0 1 18 14H7ZM8 17l-1 2m5-2-1 2m5-2-1 2',
    thunder:
        'M8 14H7a4 4 0 1 1 .9-7.9 5.5 5.5 0 0 1 10.4 1.2A3.4 3.4 0 0 1 18 14h-2m-3-3-3 6h4l-3 5',
    sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-4v1m0 14v1M4 12h1m14 0h1M6 6l1 1m10 10 1 1M6 18l1-1M17 7l1-1',
    partly: 'M5 9a4 4 0 1 1 7-4M5 4 4 3m4 0V2M3 8H2m7 10a4 4 0 1 1 .9-7.9 5.5 5.5 0 0 1 10.4 1.2A3.4 3.4 0 0 1 20 18H9Z',
    fog: 'M5 10a4 4 0 1 1 7.8-1.2A3 3 0 1 1 17 13H7m-3 3h16m-13 3h10',
};

function addWeatherIcons(map: Map) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    context.scale(2, 2);
    for (const [name, path] of Object.entries(weatherIcons)) {
        context.clearRect(0, 0, 32, 32);
        context.beginPath();
        context.arc(16, 16, 15, 0, Math.PI * 2);
        context.fillStyle = '#eff6ff';
        context.fill();
        context.strokeStyle = '#2563a5';
        context.lineWidth = 1.5;
        context.stroke();
        context.save();
        context.translate(4, 4);
        context.strokeStyle = '#123c68';
        context.lineWidth = 1.65;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.stroke(new Path2D(path));
        context.restore();
        map.addImage(name, context.getImageData(0, 0, 64, 64), {
            pixelRatio: 2,
        });
    }
}

function mapWeather(record: OfficialRecord): MapRecord {
    const title = record.title.toLowerCase();
    if (record.kind === 'forecast') {
        const weatherIcon = /petir|guntur/.test(title)
            ? 'thunder'
            : /hujan/.test(title)
              ? 'rain'
              : /kabut|asap/.test(title)
                ? 'fog'
                : /cerah berawan/.test(title)
                  ? 'partly'
                  : /cerah/.test(title)
                    ? 'sun'
                    : 'cloud';
        return { ...record, weatherIcon };
    }
    if (record.kind !== 'alert') return record;
    const text = (title + ' ' + (record.message ?? '')).toLowerCase();
    const intensity =
        text.match(
            /hujan\s+(?:(?:dengan\s+)?intensitas\s+)?(sangat\s+lebat|lebat|deras|sedang|ringan)(?:\s*(?:hingga|sampai|–|-)\s*(sangat\s+lebat|lebat|deras|sedang|ringan))?/g,
        ) ?? [];
    const rainLevel = intensity.some((value) => /lebat|deras/.test(value))
        ? 3
        : intensity.some((value) => /sedang/.test(value))
          ? 2
          : intensity.length
            ? 1
            : 0;
    const weatherIcon = /petir|guntur/.test(title)
        ? 'thunder'
        : /hujan/.test(title)
          ? 'rain'
          : undefined;
    return { ...record, rainLevel, weatherIcon };
}

export default function HazardMap({
    kind = 'event',
    hazard = '',
    combined = false,
    hazardMarkers = combined,
    weatherRegions,
    region,
    activeOnly,
    eventDays,
    revision = 0,
    historicalTiles,
}: MapPanelProps) {
    const weatherRegionKey = weatherRegions?.join(',') ?? '';
    const container = useRef<HTMLDivElement>(null);
    const selectionTitle = useRef<HTMLElement>(null);
    const resultTrigger = useRef<HTMLButtonElement | null>(null);
    const lastLoadedLayers = useRef<(MapData | undefined)[]>([]);
    const [map, setMap] = useState<Map | null>(null);
    const [data, setData] = useState<MapData>(empty);
    const [selected, setSelected] = useState<OfficialRecord | null>(null);
    const [renderError, setRenderError] = useState('');
    const [dataError, setDataError] = useState('');
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    const [requestAttempt, setRequestAttempt] = useState(0);
    const hasEarthquakes = data.features.some(
        ({ properties }) => properties.kind === 'event',
    );

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
                ...(hazardMarkers
                    ? {
                          layout: {
                              'fill-sort-key': [
                                  'coalesce',
                                  ['get', 'rainLevel'],
                                  0,
                              ],
                          },
                      }
                    : {}),
                paint: {
                    'fill-color': hazardMarkers
                        ? [
                              'match',
                              ['get', 'rainLevel'],
                              3,
                              '#1e3a8a',
                              2,
                              '#3b82f6',
                              1,
                              '#93c5fd',
                              '#bfdbfe',
                          ]
                        : [
                              'case',
                              ['==', ['get', 'alert_state'], 'ACTIVE'],
                              '#d97706',
                              '#667970',
                          ],
                    'fill-opacity': hazardMarkers ? 0.48 : 0.34,
                    'fill-outline-color': hazardMarkers ? '#2563a5' : '#825214',
                },
            });
            if (hazardMarkers) {
                for (const { id, radius, opacity } of earthquakeRings) {
                    instance.addLayer({
                        id,
                        type: 'circle',
                        source: 'official',
                        filter: [
                            'all',
                            ['==', ['geometry-type'], 'Point'],
                            ['==', ['get', 'kind'], 'event'],
                            ['==', ['get', 'latestEvent'], true],
                        ],
                        paint: {
                            'circle-radius': radius,
                            'circle-color': '#be3d28',
                            'circle-opacity': 0,
                            'circle-stroke-color': '#be3d28',
                            'circle-stroke-opacity': opacity,
                            'circle-stroke-width': 1.5,
                            'circle-radius-transition': { duration: 0 },
                            'circle-stroke-opacity-transition': { duration: 0 },
                        },
                    });
                }
            }
            instance.addLayer({
                id: 'official-points',
                type: 'circle',
                source: 'official',
                filter: hazardMarkers
                    ? [
                          'all',
                          ['==', ['geometry-type'], 'Point'],
                          ['==', ['get', 'kind'], 'event'],
                      ]
                    : ['==', ['geometry-type'], 'Point'],
                paint: {
                    'circle-color': [
                        'match',
                        ['get', 'kind'],
                        'forecast',
                        '#226781',
                        'alert',
                        '#ad6306',
                        hazardMarkers ? '#aa3022' : '#13604b',
                    ],
                    'circle-radius': 7,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                },
            });
            if (hazardMarkers) {
                addWeatherIcons(instance);
                instance.addLayer({
                    id: 'weather-icons',
                    type: 'symbol',
                    source: 'official',
                    filter: [
                        'all',
                        ['==', ['geometry-type'], 'Point'],
                        ['has', 'weatherIcon'],
                    ],
                    layout: {
                        'icon-image': ['get', 'weatherIcon'],
                        'symbol-sort-key': [
                            'case',
                            ['==', ['get', 'kind'], 'forecast'],
                            0,
                            1,
                        ],
                        'icon-size': [
                            'case',
                            ['==', ['get', 'kind'], 'forecast'],
                            1,
                            0.8,
                        ],
                    },
                });
            }
            setMap(instance);
        });
        return () => {
            clearTimeout(timeout);
            instance.remove();
        };
    }, [attempt, hazardMarkers]);

    useEffect(() => {
        if (!map || !hazardMarkers || historicalTiles || !hasEarthquakes)
            return;

        const reducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );
        const duration = 2800;
        let frame = 0;
        let lastPaint = -Infinity;

        function animate(now: number) {
            if (now - lastPaint >= 32) {
                earthquakeRings.forEach(({ id }, index) => {
                    const progress =
                        (now / duration + index / earthquakeRings.length) % 1;
                    map?.setPaintProperty(
                        id,
                        'circle-radius',
                        9 + 16 * progress,
                    );
                    map?.setPaintProperty(
                        id,
                        'circle-stroke-opacity',
                        0.74 * (1 - progress),
                    );
                });
                lastPaint = now;
            }
            frame = window.requestAnimationFrame(animate);
        }

        function syncMotion() {
            window.cancelAnimationFrame(frame);
            if (reducedMotion.matches) {
                for (const { id, radius, opacity } of earthquakeRings) {
                    map?.setPaintProperty(id, 'circle-radius', radius);
                    map?.setPaintProperty(id, 'circle-stroke-opacity', opacity);
                }
            } else if (!document.hidden) {
                frame = window.requestAnimationFrame(animate);
            }
        }

        syncMotion();
        reducedMotion.addEventListener('change', syncMotion);
        document.addEventListener('visibilitychange', syncMotion);
        return () => {
            window.cancelAnimationFrame(frame);
            reducedMotion.removeEventListener('change', syncMotion);
            document.removeEventListener('visibilitychange', syncMotion);
        };
    }, [map, hazardMarkers, historicalTiles, hasEarthquakes]);

    useEffect(() => {
        if (!map || historicalTiles) return;
        lastLoadedLayers.current = [];
        setSelected(null);
        setData(empty);
        const source = map.getSource('official') as GeoJSONSource;
        void source.setData(empty).catch(() => undefined);
    }, [
        map,
        kind,
        hazard,
        region,
        activeOnly,
        eventDays,
        historicalTiles,
        combined,
        hazardMarkers,
        weatherRegionKey,
    ]);

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
                        const layers = combined
                            ? [
                                  { kind: 'event', region: undefined },
                                  { kind: 'alert', region: undefined },
                                  ...weatherRegionKey
                                      .split(',')
                                      .filter(Boolean)
                                      .map((region) => ({
                                          kind: 'forecast',
                                          region,
                                      })),
                              ]
                            : [{ kind, region }];
                        const responses = await Promise.allSettled(
                            layers.map(async (layer) => {
                                const query = new URLSearchParams({
                                    kind: layer.kind,
                                    limit: '100',
                                });
                                bbox.forEach((value) =>
                                    query.append('bbox[]', String(value)),
                                );
                                if (hazard) query.set('hazard', hazard);
                                if (layer.kind === 'event' && eventDays)
                                    query.set('event_days', String(eventDays));
                                if (layer.kind === 'alert' && activeOnly)
                                    query.set('status', 'active');
                                if (hazardMarkers && layer.kind === 'alert')
                                    query.set('weather_points', '1');
                                if (layer.kind === 'forecast' && layer.region)
                                    query.set('region', layer.region);
                                const response = await fetch(
                                    '/data/map?' + query,
                                    {
                                        signal: request.signal,
                                        headers: { Accept: 'application/json' },
                                    },
                                );
                                if (!response.ok)
                                    throw new Error('Map data request failed');
                                return (await response.json()) as MapData;
                            }),
                        );
                        if (request.signal.aborted) return;
                        const failures = responses.filter(
                            (response) => response.status === 'rejected',
                        ).length;
                        if (failures === layers.length)
                            throw new Error('Map data request failed');
                        if (failures)
                            setDataError(
                                'Sebagian lapisan BMKG gagal diperbarui. Data terakhir tetap ditampilkan jika tersedia.',
                            );
                        lastLoadedLayers.current = responses.map(
                            (response, index) =>
                                response.status === 'fulfilled'
                                    ? response.value
                                    : lastLoadedLayers.current[index],
                        );
                        const loaded = lastLoadedLayers.current.filter(
                            (layer) => layer !== undefined,
                        );
                        result = {
                            type: 'FeatureCollection',
                            features: loaded.flatMap(({ features }) =>
                                features.map((feature) =>
                                    hazardMarkers
                                        ? {
                                              ...feature,
                                              properties: mapWeather(
                                                  feature.properties,
                                              ),
                                          }
                                        : feature,
                                ),
                            ),
                            truncated: loaded.some((layer) => layer.truncated),
                        };
                    }
                    if (request.signal.aborted) return;
                    const latestEvent =
                        result.features.reduce<MapRecord | null>(
                            (latest, { properties }) => {
                                if (properties.kind !== 'event') return latest;
                                return !latest ||
                                    Date.parse(properties.source_time) >
                                        Date.parse(latest.source_time)
                                    ? properties
                                    : latest;
                            },
                            null,
                        );
                    const markers = result.features.map((feature) =>
                        feature.properties === latestEvent
                            ? {
                                  ...feature,
                                  properties: {
                                      ...feature.properties,
                                      latestEvent: true,
                                  },
                              }
                            : feature,
                    );
                    const weatherPoints = result.features.flatMap(
                        ({ weather_point, properties }) =>
                            weather_point && properties.weatherIcon
                                ? [
                                      {
                                          type: 'Feature' as const,
                                          geometry: weather_point,
                                          properties,
                                      },
                                  ]
                                : [],
                    );
                    await source.setData({
                        type: 'FeatureCollection',
                        features: [...markers, ...weatherPoints],
                    });
                    if (!request.signal.aborted) setData(result);
                } catch {
                    if (!request.signal.aborted) {
                        setDataError(
                            'Data BMKG gagal diperbarui. Data terakhir tetap ditampilkan jika tersedia.',
                        );
                    }
                } finally {
                    if (!request.signal.aborted) setLoading(false);
                }
            }, 300);
        };

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
        eventDays,
        revision,
        requestAttempt,
        historicalTiles,
        combined,
        hazardMarkers,
        weatherRegionKey,
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
        const layers = hazardMarkers
            ? [
                  'weather-icons',
                  'official-points',
                  ...earthquakeRings.map(({ id }) => id),
                  'official-areas',
              ]
            : ['official-points', 'official-areas'];
        const subscription = map.on('click', layers, (event) => {
            const hit = event.features?.[0]?.properties;
            setSelected(
                data.features.find(
                    ({ properties }) =>
                        properties.id === Number(hit?.id) &&
                        properties.kind === hit?.kind,
                )?.properties ?? null,
            );
        });
        const enter = map.on('mouseenter', layers, () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        const leave = map.on('mouseleave', layers, () => {
            map.getCanvas().style.cursor = '';
        });
        return () => {
            subscription.unsubscribe();
            enter.unsubscribe();
            leave.unsubscribe();
            map.getCanvas().style.cursor = '';
        };
    }, [data, map, historicalTiles, hazardMarkers]);

    useEffect(() => {
        if (selected && resultTrigger.current) selectionTitle.current?.focus();
    }, [selected]);

    const resultCounts = (['event', 'alert', 'forecast'] as const)
        .map((type) => {
            const count = data.features.filter(
                ({ properties }) => properties.kind === type,
            ).length;
            const label = {
                event: 'gempa',
                alert: 'peringatan',
                forecast: 'prakiraan',
            }[type];
            return count ? count + ' ' + label : '';
        })
        .filter(Boolean)
        .join(' · ');

    function retry() {
        setRenderError('');
        if (!map) {
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
                            <strong ref={selectionTitle} tabIndex={-1}>
                                {selected.title}
                            </strong>
                            <Action
                                variant="ghost"
                                onClick={() => {
                                    setSelected(null);
                                    resultTrigger.current?.focus();
                                    resultTrigger.current = null;
                                }}
                                aria-label="Tutup ringkasan"
                            >
                                ×
                            </Action>
                        </div>
                        <p className="dr-caption">
                            {selected.kind === 'forecast'
                                ? forecastTime(selected)
                                : dateTime(selected.source_time)}
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
                              ? data.features.length
                                  ? 'Memuat ulang data BMKG…'
                                  : 'Memuat peta dan data BMKG…'
                              : data.features.length
                                ? `${resultCounts}${data.truncated ? ' · Perbesar peta untuk melihat hasil lain' : ''}`
                                : kind === 'alert' && activeOnly && !combined
                                  ? 'Belum ada peringatan aktif dalam data BMKG untuk area ini.'
                                  : 'Tidak ada hasil BMKG untuk area dan filter ini.')}
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
                        Seluruh Indonesia
                    </Action>
                </div>
            </div>
            {data.features.length > 0 && (
                <details className="dr-map-results">
                    <summary>Lihat hasil peta</summary>
                    <ul>
                        {data.features.map(({ properties: record }) => (
                            <li key={record.kind + '-' + record.id}>
                                {record.kind === 'forecast' ? (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            resultTrigger.current =
                                                event.currentTarget;
                                            setSelected(record);
                                        }}
                                    >
                                        {record.title} · {forecastTime(record)}
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
