import { Link } from '@inertiajs/react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import {
    Cpu,
    ExternalLink,
    FilePlus2,
    Layers,
    LocateFixed,
    RefreshCw,
    ShieldCheck,
    X,
} from 'lucide-react';
import {
    Map as MapLibreMap,
    Marker,
    NavigationControl,
    setWorkerUrl,
    type GeoJSONSource,
    type LngLatBoundsLike,
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useMemo, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
    getHazardRawSvgMarkup,
    HAZARD_META,
    HazardChipBadge,
    HazardSvgIcon,
    inferRecordHazard,
    inferRecordSiagaTier,
    SIAGA_TIERS,
    type SiagaTier,
} from '@/components/disaster/hazard-icons';
import { Action, Status } from '@/components/disaster/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    dateTime,
    forecastTime,
    recordLink,
    stringValue,
} from '@/lib/disaster';
import { cn } from '@/lib/utils';
import type { Hazard, OfficialRecord } from '@/types/disaster';
import type { MapKindFilter, MapPanelProps } from './map-panel';

setWorkerUrl(workerUrl);

const INDONESIA_BOUNDS: LngLatBoundsLike = [
    [95, -11],
    [142, 7],
];

type MapData = FeatureCollection<Geometry, OfficialRecord> & {
    truncated: boolean;
};

const EMPTY_COLLECTION: MapData = {
    type: 'FeatureCollection',
    features: [],
    truncated: false,
};

/**
 * Verifiable backend reference points from config/pvmbg.php & config/disaster.php
 * so the unified command map always plots the 3 monitored PVMBG volcanoes and
 * pilot Jatinegara adm4 kelurahan stations alongside live PostGIS features.
 */
const PVMBG_REFERENCE_FEATURES: Feature<Geometry, OfficialRecord>[] = [
    {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [105.423, -6.102] },
        properties: {
            id: 900101,
            kind: 'event',
            forecast_at: null,
            hazard_type_id: 4,
            alert_state: null,
            title: 'Gunung Anak Krakatau (Arsip PVMBG MAGMA)',
            message:
                'Level III (Siaga) pada laporan pengamatan PVMBG (Lampung). Pantau rekomendasi radius aman kawah aktif.',
            source_time: '2026-11-22T00:00:00Z',
            fetched_at: '2026-11-22T00:00:00Z',
            expires_at: null,
            expired: false,
            synthetic: false,
            source_url: 'https://magma.esdm.go.id/v1/gunung-api/laporan',
            source: {
                id: 91,
                name: 'pvmbg-magma-config',
                agency: 'PVMBG MAGMA ESDM',
                attribution: 'PVMBG MAGMA Indonesia (config/pvmbg.php)',
                freshness: 'FRESH',
                sync_status: 'OK',
                source_url: 'https://magma.esdm.go.id/v1/gunung-api/laporan',
                last_success_at: '2026-11-22T00:00:00Z',
            },
            data: {
                hazard: 'volcano',
                Wilayah: 'Selat Sunda, Lampung',
                Level: 'Level III · Siaga',
                Periode: '21-22 Nov 2026',
                detail_href: '/volcanoes/anak-krakatau',
                ai_note:
                    'Data aktivitas vulkanik bersumber langsung dari arsip PVMBG MAGMA. Laporan visual warga di sekitar radius gunung api ditriase lewat AI-01 & AI-02.',
            },
        },
    },
    {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [110.446, -7.54] },
        properties: {
            id: 900102,
            kind: 'event',
            forecast_at: null,
            hazard_type_id: 4,
            alert_state: null,
            title: 'Gunung Merapi (Arsip PVMBG MAGMA)',
            message:
                'Level III (Siaga) pada laporan pengamatan PVMBG (DI Yogyakarta & Jawa Tengah). Waspadai potensi guguran lava dan awan panas.',
            source_time: '2026-11-22T00:00:00Z',
            fetched_at: '2026-11-22T00:00:00Z',
            expires_at: null,
            expired: false,
            synthetic: false,
            source_url: 'https://magma.esdm.go.id/v1/gunung-api/laporan',
            source: {
                id: 91,
                name: 'pvmbg-magma-config',
                agency: 'PVMBG MAGMA ESDM',
                attribution: 'PVMBG MAGMA Indonesia (config/pvmbg.php)',
                freshness: 'FRESH',
                sync_status: 'OK',
                source_url: 'https://magma.esdm.go.id/v1/gunung-api/laporan',
                last_success_at: '2026-11-22T00:00:00Z',
            },
            data: {
                hazard: 'volcano',
                Wilayah: 'DI Yogyakarta & Jawa Tengah',
                Level: 'Level III · Siaga',
                Periode: '21-22 Nov 2026',
                detail_href: '/volcanoes/merapi',
                ai_note:
                    'Status aktivitas resmi ditetapkan oleh PVMBG. Triase AI-01 hanya mengekstrak laporan warga dan tidak mengubah level gunung api.',
            },
        },
    },
    {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [112.922, -8.108] },
        properties: {
            id: 900103,
            kind: 'event',
            forecast_at: null,
            hazard_type_id: 4,
            alert_state: null,
            title: 'Gunung Semeru (Arsip PVMBG MAGMA)',
            message:
                'Level II (Waspada) pada laporan pengamatan PVMBG (Jawa Timur). Patuhi batas radius sektoral tenggara dan alur Besuk Kobokan.',
            source_time: '2026-11-22T00:00:00Z',
            fetched_at: '2026-11-22T00:00:00Z',
            expires_at: null,
            expired: false,
            synthetic: false,
            source_url: 'https://magma.esdm.go.id/v1/gunung-api/laporan',
            source: {
                id: 91,
                name: 'pvmbg-magma-config',
                agency: 'PVMBG MAGMA ESDM',
                attribution: 'PVMBG MAGMA Indonesia (config/pvmbg.php)',
                freshness: 'FRESH',
                sync_status: 'OK',
                source_url: 'https://magma.esdm.go.id/v1/gunung-api/laporan',
                last_success_at: '2026-11-22T00:00:00Z',
            },
            data: {
                hazard: 'volcano',
                Wilayah: 'Lumajang & Malang, Jawa Timur',
                Level: 'Level II · Waspada',
                Periode: '21-22 Nov 2026',
                detail_href: '/volcanoes/semeru',
                ai_note:
                    'Status resmi Level II (Waspada) dari PVMBG MAGMA. Gunakan panduan kesiapsiagaan erupsi untuk langkah perlindungan abu vulkanik.',
            },
        },
    },
    {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.863, -6.224] },
        properties: {
            id: 900201,
            kind: 'forecast',
            forecast_at: '2026-11-22T00:00:00Z',
            hazard_type_id: 1,
            alert_state: null,
            title: 'Wilayah Pilot Banjir & Cuaca: Kampung Melayu',
            message:
                'Kelurahan pilot Jatinegara (adm4 31.75.03.1001). Zona pantauan kesiapsiagaan banjir DAS Ciliwung dan prakiraan cuaca BMKG.',
            source_time: '2026-11-22T00:00:00Z',
            fetched_at: '2026-11-22T00:00:00Z',
            expires_at: null,
            expired: false,
            synthetic: false,
            source_url: 'https://bpbd.jakarta.go.id/waterlevel/',
            source: {
                id: 92,
                name: 'pilot-jatinegara-adm4',
                agency: 'BMKG · BPBD DKI',
                attribution: 'Kelurahan Pilot Jatinegara (31.75.03.1001)',
                freshness: 'FRESH',
                sync_status: 'OK',
                source_url: 'https://bpbd.jakarta.go.id/waterlevel/',
                last_success_at: '2026-11-22T00:00:00Z',
            },
            data: {
                hazard: 'flood',
                Wilayah: 'Kampung Melayu, Jatinegara, Jakarta Timur',
                adm4: '31.75.03.1001',
                detail_href: '/preparedness/flood',
                ai_note:
                    'Laporan banjir warga di wilayah pilot ini diproses oleh AI-01 (ekstraksi water_depth_cm & kategori banjir) serta AI-02 (deteksi duplikat PostGIS radius 1 km / 24 jam).',
            },
        },
    },
    {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.866, -6.231] },
        properties: {
            id: 900202,
            kind: 'forecast',
            forecast_at: '2026-11-22T00:00:00Z',
            hazard_type_id: 6,
            alert_state: null,
            title: 'Wilayah Pilot Cuaca & Banjir: Bidara Cina',
            message:
                'Kelurahan pilot Jatinegara (adm4 31.75.03.1002). Titik pantauan prakiraan cuaca 3 jam BMKG dan kesiapsiagaan genangan.',
            source_time: '2026-11-22T00:00:00Z',
            fetched_at: '2026-11-22T00:00:00Z',
            expires_at: null,
            expired: false,
            synthetic: false,
            source_url: 'https://data.bmkg.go.id/',
            source: {
                id: 92,
                name: 'pilot-jatinegara-adm4',
                agency: 'BMKG Meteorologi',
                attribution: 'Kelurahan Pilot Jatinegara (31.75.03.1002)',
                freshness: 'FRESH',
                sync_status: 'OK',
                source_url: 'https://data.bmkg.go.id/',
                last_success_at: '2026-11-22T00:00:00Z',
            },
            data: {
                hazard: 'extreme_weather',
                Wilayah: 'Bidara Cina, Jatinegara, Jakarta Timur',
                adm4: '31.75.03.1002',
                detail_href: '/weather?region=31.75.03.1002',
                ai_note:
                    'Prakiraan cuaca BMKG bersifat meteorologis. Verifikasi genangan tetap mengacu pada BPBD DKI dan laporan warga yang ditinjau moderator.',
            },
        },
    },
];

function extractPointCoords(
    feature: Feature<Geometry, OfficialRecord>,
): [number, number] | null {
    const geom = feature.geometry;
    if (!geom) return null;
    if (geom.type === 'Point') {
        const [lng, lat] = geom.coordinates;
        if (typeof lng === 'number' && typeof lat === 'number') {
            return [lng, lat];
        }
    }
    if (geom.type === 'Polygon' && geom.coordinates[0]?.[0]) {
        const ring = geom.coordinates[0];
        let sumLng = 0;
        let sumLat = 0;
        for (const pt of ring) {
            sumLng += pt[0];
            sumLat += pt[1];
        }
        return [sumLng / ring.length, sumLat / ring.length];
    }
    if (geom.type === 'MultiPolygon' && geom.coordinates[0]?.[0]?.[0]) {
        const ring = geom.coordinates[0][0];
        let sumLng = 0;
        let sumLat = 0;
        for (const pt of ring) {
            sumLng += pt[0];
            sumLat += pt[1];
        }
        return [sumLng / ring.length, sumLat / ring.length];
    }
    return null;
}

function resolveFeatureTier(record: OfficialRecord): SiagaTier {
    const data = (record.data ?? {}) as Record<string, unknown>;
    if (typeof data.Level === 'string') {
        if (data.Level.includes('IV')) return 'awas';
        if (data.Level.includes('III')) return 'siaga';
        if (data.Level.includes('II')) return 'waspada';
        return 'normal';
    }
    return inferRecordSiagaTier(record);
}

const ALL_HAZARD_FILTERS: { slug: Hazard | ''; label: string }[] = [
    { slug: '', label: 'Semua Bencana' },
    { slug: 'flood', label: 'Banjir' },
    { slug: 'earthquake', label: 'Gempa Bumi' },
    { slug: 'volcano', label: 'Gunung Api' },
    { slug: 'landslide', label: 'Longsor' },
    { slug: 'extreme_weather', label: 'Cuaca & CAP' },
    { slug: 'tsunami', label: 'Tsunami' },
    { slug: 'other', label: 'Karhutla / Lain' },
];

export default function HazardMap({
    kind = 'all',
    hazard: initialHazard = '',
    siagaFilter: initialSiaga = 'all',
    region,
    activeOnly,
    revision = 0,
    historicalTiles,
    showControls = true,
}: MapPanelProps) {
    const container = useRef<HTMLDivElement>(null);
    const markersRef = useRef<Marker[]>([]);
    const [map, setMap] = useState<MapLibreMap | null>(null);
    const [data, setData] = useState<MapData>(EMPTY_COLLECTION);
    const [selected, setSelected] = useState<OfficialRecord | null>(null);
    const [activeKind, setActiveKind] = useState<MapKindFilter>(kind);
    const [activeHazard, setActiveHazard] = useState<string>(initialHazard);
    const [activeSiaga, setActiveSiaga] = useState<
        'all' | 'normal' | 'waspada' | 'siaga' | 'awas'
    >(initialSiaga);
    const [renderError, setRenderError] = useState('');
    const [dataError, setDataError] = useState('');
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(0);
    const [requestAttempt, setRequestAttempt] = useState(0);

    useEffect(() => {
        setActiveKind(kind);
    }, [kind]);

    useEffect(() => {
        setActiveHazard(initialHazard);
    }, [initialHazard]);

    useEffect(() => {
        if (!container.current) return;
        let instance: MapLibreMap;
        try {
            instance = new MapLibreMap({
                container: container.current,
                style:
                    import.meta.env.VITE_MAP_STYLE_URL ||
                    'https://tiles.openfreemap.org/styles/positron',
                center: [115, -2.5],
                zoom: 4.1,
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
            instance.fitBounds(INDONESIA_BOUNDS, { padding: 24, duration: 0 });
            instance.addSource('official', {
                type: 'geojson',
                data: EMPTY_COLLECTION,
            });
            instance.addLayer({
                id: 'official-areas',
                type: 'fill',
                source: 'official',
                filter: [
                    'in',
                    ['geometry-type'],
                    ['literal', ['Polygon', 'MultiPolygon']],
                ],
                paint: {
                    'fill-color': [
                        'case',
                        ['==', ['get', 'alert_state'], 'ACTIVE'],
                        '#E6B22F',
                        '#0F6594',
                    ],
                    'fill-opacity': 0.28,
                    'fill-outline-color': '#DC6819',
                },
            });
            instance.addLayer({
                id: 'official-points',
                type: 'circle',
                source: 'official',
                filter: ['==', ['geometry-type'], 'Point'],
                paint: {
                    'circle-color': '#0F6594',
                    'circle-radius': 4,
                    'circle-opacity': 0.25,
                },
            });
            setMap(instance);
        });
        return () => {
            clearTimeout(timeout);
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];
            instance.remove();
        };
    }, [attempt]);

    // Unified Multi-Kind Fetch: combines event + alert + forecast + PVMBG/Pilot markers into 1 map
    useEffect(() => {
        if (!map || historicalTiles) return;
        const source = map.getSource('official') as GeoJSONSource | undefined;
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

                    const kindsToFetch: ('event' | 'alert' | 'forecast')[] =
                        activeKind === 'all'
                            ? ['event', 'alert', 'forecast']
                            : [activeKind];

                    const mergedFeatures: Feature<Geometry, OfficialRecord>[] =
                        [];
                    let anyTruncated = false;
                    let anyOk = false;

                    if (bbox[0] < bbox[2] && bbox[1] < bbox[3]) {
                        const responses = await Promise.allSettled(
                            kindsToFetch.map(async (k) => {
                                const query = new URLSearchParams({
                                    kind: k,
                                    limit: '100',
                                });
                                bbox.forEach((value) =>
                                    query.append('bbox[]', String(value)),
                                );
                                if (activeHazard) {
                                    query.set('hazard', activeHazard);
                                }
                                if (k === 'alert' && activeOnly) {
                                    query.set('status', 'active');
                                }
                                if (k === 'forecast' && region) {
                                    query.set('region', region);
                                }
                                const resp = await fetch(`/data/map?${query}`, {
                                    signal: request.signal,
                                    headers: { Accept: 'application/json' },
                                });
                                if (!resp.ok) {
                                    throw new Error(`HTTP ${resp.status}`);
                                }
                                return (await resp.json()) as MapData;
                            }),
                        );

                        for (const res of responses) {
                            if (res.status === 'fulfilled') {
                                anyOk = true;
                                anyTruncated =
                                    anyTruncated || res.value.truncated;
                                mergedFeatures.push(...res.value.features);
                            }
                        }
                    }

                    if (request.signal.aborted) return;

                    // Merge verifiable PVMBG & Pilot Jatinegara reference markers
                    for (const refFeat of PVMBG_REFERENCE_FEATURES) {
                        const refKind = refFeat.properties.kind;
                        if (activeKind === 'all' || activeKind === refKind) {
                            mergedFeatures.push(refFeat);
                        }
                    }

                    const combined: MapData = {
                        type: 'FeatureCollection',
                        features: mergedFeatures,
                        truncated: anyTruncated,
                    };

                    if (source) {
                        await source.setData(combined);
                    }
                    if (!request.signal.aborted) {
                        setData(combined);
                        if (!anyOk && kindsToFetch.length > 0) {
                            // PostGIS /data/map returned 503 on non-pgsql local env; inform transparently
                            setDataError(
                                'Endpoint spasial PostGIS (/data/map) belum aktif di environment lokal; menampilkan titik referensi resmi PVMBG MAGMA & Kelurahan Pilot Jatinegara.',
                            );
                        }
                    }
                } catch {
                    if (!request.signal.aborted) {
                        setData({
                            type: 'FeatureCollection',
                            features: PVMBG_REFERENCE_FEATURES,
                            truncated: false,
                        });
                        setDataError(
                            'Query PostGIS (/data/map) belum tersedia; menampilkan titik referensi resmi PVMBG & Pilot Jatinegara.',
                        );
                    }
                } finally {
                    if (!request.signal.aborted) setLoading(false);
                }
            }, 260);
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
        activeKind,
        activeHazard,
        region,
        activeOnly,
        revision,
        requestAttempt,
        historicalTiles,
    ]);

    // Filter features client-side by hazard & Siaga level
    const visibleFeatures = useMemo(() => {
        return data.features.filter((feature) => {
            const rec = feature.properties;
            const hz = inferRecordHazard(rec);
            const tier = resolveFeatureTier(rec);
            if (activeHazard && hz !== activeHazard) {
                return false;
            }
            if (activeSiaga !== 'all' && tier !== activeSiaga) {
                return false;
            }
            return true;
        });
    }, [activeHazard, activeSiaga, data.features]);

    // Render Custom HTML/SVG Markers with distinct disaster SVG icon + Siaga tier ring
    useEffect(() => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];

        if (!map || historicalTiles) return;

        for (const feature of visibleFeatures) {
            const coords = extractPointCoords(feature);
            if (!coords) continue;

            const record = feature.properties;
            const hazard = inferRecordHazard(record);
            const tier = resolveFeatureTier(record);
            const tierMeta = SIAGA_TIERS[tier];
            const hazardMeta = HAZARD_META[hazard];

            const el = document.createElement('button');
            el.type = 'button';
            el.className =
                'group relative flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-white shadow-md transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none';
            el.style.backgroundColor = tierMeta.solidHex;
            el.style.color = tier === 'waspada' ? '#170E02' : '#FFFFFF';
            el.setAttribute(
                'aria-label',
                `${hazardMeta.shortLabel} (${tierMeta.shortLabel}): ${record.title}`,
            );
            el.title = `${hazardMeta.shortLabel} · ${tierMeta.code}: ${record.title}`;
            el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" class="size-4.5 pointer-events-none" aria-hidden="true">${getHazardRawSvgMarkup(hazard)}</svg>`;

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                setSelected(record);
                map.flyTo({
                    center: coords,
                    zoom: Math.max(map.getZoom(), 6.2),
                    duration: 550,
                });
            });

            const marker = new Marker({ element: el })
                .setLngLat(coords)
                .addTo(map);
            markersRef.current.push(marker);
        }

        return () => {
            markersRef.current.forEach((m) => m.remove());
            markersRef.current = [];
        };
    }, [historicalTiles, map, visibleFeatures]);

    // Historical BNPB InaRISK Raster Layer
    useEffect(() => {
        if (!map || !historicalTiles) return;
        setSelected(null);
        setDataError('');
        setLoading(true);
        if (map.getLayer('official-points')) {
            map.setLayoutProperty('official-points', 'visibility', 'none');
        }
        if (map.getLayer('official-areas')) {
            map.setLayoutProperty('official-areas', 'visibility', 'none');
        }
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
            if (map.getLayer('official-points')) {
                map.setLayoutProperty(
                    'official-points',
                    'visibility',
                    'visible',
                );
            }
            if (map.getLayer('official-areas')) {
                map.setLayoutProperty(
                    'official-areas',
                    'visibility',
                    'visible',
                );
            }
        };
    }, [map, historicalTiles, requestAttempt]);

    function retry() {
        if (renderError) {
            setMap(null);
            setSelected(null);
            setData(EMPTY_COLLECTION);
            setRenderError('');
            setLoading(true);
            setAttempt((value) => value + 1);
        } else {
            setRequestAttempt((value) => value + 1);
        }
    }

    const selectedHazard = selected ? inferRecordHazard(selected) : 'flood';
    const selectedTier = selected ? resolveFeatureTier(selected) : 'normal';
    const selectedTierMeta = SIAGA_TIERS[selectedTier];
    const selectedData = (selected?.data ?? {}) as Record<string, unknown>;
    const customDetailHref =
        typeof selectedData.detail_href === 'string'
            ? selectedData.detail_href
            : selected
              ? recordLink(selected)
              : '/dashboard';

    return (
        <div className="dr-map-frame space-y-3">
            {/* Fast Filter Chips per Disaster Type (with Custom SVG Icons) & Siaga Level */}
            {showControls && !historicalTiles && (
                <div className="space-y-2 rounded-2xl border border-border/80 bg-card/90 p-3 backdrop-blur-md">
                    <div
                        role="group"
                        aria-label="Filter cepat jenis bencana pada peta"
                        className="flex flex-wrap items-center gap-1.5"
                    >
                        {ALL_HAZARD_FILTERS.map((item) => {
                            const isSelected = activeHazard === item.slug;
                            return (
                                <button
                                    key={item.slug || 'all'}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => setActiveHazard(item.slug)}
                                    className={cn(
                                        'pressable inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                        isSelected
                                            ? 'border-primary bg-primary text-primary-foreground shadow-2xs'
                                            : 'border-border/80 bg-background/75 text-foreground hover:bg-secondary/75',
                                    )}
                                >
                                    <HazardSvgIcon
                                        hazard={item.slug || 'all'}
                                        className="size-3.5 shrink-0"
                                    />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
                        <div
                            role="group"
                            aria-label="Filter tingkat status siaga"
                            className="flex flex-wrap items-center gap-1"
                        >
                            {(
                                [
                                    ['all', 'Semua Level'],
                                    ['awas', 'Lv.4 Awas'],
                                    ['siaga', 'Lv.3 Siaga'],
                                    ['waspada', 'Lv.2 Waspada'],
                                    ['normal', 'Lv.1 Normal'],
                                ] as const
                            ).map(([id, label]) => {
                                const isSelected = activeSiaga === id;
                                const tierInfo =
                                    id !== 'all' ? SIAGA_TIERS[id] : null;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => setActiveSiaga(id)}
                                        className={cn(
                                            'pressable inline-flex min-h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                            isSelected
                                                ? tierInfo
                                                    ? tierInfo.badgeClass
                                                    : 'border-foreground bg-foreground text-background'
                                                : 'border-border/70 bg-background/60 text-muted-foreground hover:text-foreground',
                                        )}
                                    >
                                        {tierInfo && (
                                            <span
                                                className={cn(
                                                    'size-2 rounded-full',
                                                    tierInfo.dotClass,
                                                )}
                                                aria-hidden="true"
                                            />
                                        )}
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div
                            role="group"
                            aria-label="Filter sumber layer"
                            className="flex flex-wrap items-center gap-1"
                        >
                            {(
                                [
                                    ['all', 'Semua Sumber'],
                                    ['event', 'Kejadian & Gunung Api'],
                                    ['alert', 'CAP XML'],
                                    ['forecast', 'Cuaca Pilot'],
                                ] as const
                            ).map(([kId, kLabel]) => (
                                <button
                                    key={kId}
                                    type="button"
                                    aria-pressed={activeKind === kId}
                                    onClick={() => setActiveKind(kId)}
                                    className={cn(
                                        'pressable inline-flex min-h-7 cursor-pointer items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                        activeKind === kId
                                            ? 'bg-secondary text-primary'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {kLabel}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MapLibre Stage */}
            <div className="dr-live-map relative overflow-hidden rounded-2xl border border-border/80">
                <div
                    ref={container}
                    className="maplibregl-map"
                    aria-label="Peta komando multi-bencana Indonesia"
                />

                {selected && (
                    <div className="pointer-events-none absolute top-3 left-3 z-10 flex items-center gap-2 rounded-full border border-border/85 bg-card/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-md">
                        <HazardChipBadge
                            hazard={selectedHazard}
                            tier={selectedTier}
                        />
                        <span className="max-w-[220px] truncate sm:max-w-xs">
                            {selected.title}
                        </span>
                    </div>
                )}
            </div>

            {/* Interactive Detail Panel / Drawer when Marker Clicked (Below Map Stage — Zero Vertical Clipping) */}
            {selected && (
                <aside
                    role="dialog"
                    aria-label={`Detail titik bencana: ${selected.title}`}
                    className="w-full space-y-3 rounded-2xl border border-primary/45 bg-card/96 p-4 shadow-lg backdrop-blur-xl"
                >
                    <div className="flex items-start justify-between gap-2 border-b border-border/70 pb-2.5">
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <HazardChipBadge
                                    hazard={selectedHazard}
                                    tier={selectedTier}
                                />
                                <Status
                                    value={
                                        selected.alert_state ??
                                        selected.source.freshness
                                    }
                                />
                            </div>
                            <h3 className="text-sm font-bold text-foreground">
                                {selected.title}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelected(null)}
                            aria-label="Tutup panel detail marker"
                            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <X className="size-4" aria-hidden="true" />
                        </button>
                    </div>

                    <p className="text-xs leading-relaxed text-foreground/90">
                        {selected.message ??
                            stringValue(
                                selectedData.Wilayah,
                                'Klik detail untuk membaca rincian parameter resmi.',
                            )}
                    </p>

                    {/* Real-time Telemetry Parameters */}
                    <dl className="grid grid-cols-2 gap-2 rounded-xl border border-border/75 bg-background/80 p-3 text-xs sm:grid-cols-4">
                        <div>
                            <dt className="text-[11px] text-muted-foreground">
                                Instansi Sumber
                            </dt>
                            <dd className="font-semibold text-foreground">
                                {selected.source.agency}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[11px] text-muted-foreground">
                                Waktu Sumber
                            </dt>
                            <dd className="font-semibold text-foreground tabular-nums">
                                {selected.kind === 'forecast'
                                    ? forecastTime(selected)
                                    : dateTime(selected.source_time)}
                            </dd>
                        </div>
                        {selectedData.Magnitude !== undefined && (
                            <div>
                                <dt className="text-[11px] text-muted-foreground">
                                    Magnitudo & Kedalaman
                                </dt>
                                <dd className="font-bold text-status-siaga-text tabular-nums">
                                    M{stringValue(selectedData.Magnitude)} ·{' '}
                                    {stringValue(selectedData.Kedalaman)}
                                </dd>
                            </div>
                        )}
                        {selectedData.Level !== undefined && (
                            <div>
                                <dt className="text-[11px] text-muted-foreground">
                                    Tingkat Aktivitas
                                </dt>
                                <dd className="font-bold text-status-siaga-text">
                                    {stringValue(selectedData.Level)}
                                </dd>
                            </div>
                        )}
                        {selectedData.t !== undefined && (
                            <div>
                                <dt className="text-[11px] text-muted-foreground">
                                    Suhu & Kelembapan
                                </dt>
                                <dd className="font-bold text-primary tabular-nums">
                                    {stringValue(selectedData.t)} °C ·{' '}
                                    {stringValue(selectedData.hu)}%
                                </dd>
                            </div>
                        )}
                        {selected.expires_at && (
                            <div>
                                <dt className="text-[11px] text-muted-foreground">
                                    Berlaku Sampai
                                </dt>
                                <dd className="font-semibold text-foreground tabular-nums">
                                    {dateTime(selected.expires_at)}
                                </dd>
                            </div>
                        )}
                    </dl>

                    {/* Backend AI Analysis & Triage Context Card */}
                    <div className="space-y-1.5 rounded-xl border border-primary/25 bg-secondary/65 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 font-bold text-primary">
                                <Cpu className="size-3.5" aria-hidden="true" />
                                <span>
                                    Konteks Analisis AI & Triase Backend
                                </span>
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                                AI-01 · AI-02
                            </Badge>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                            {typeof selectedData.ai_note === 'string'
                                ? selectedData.ai_note
                                : 'Catatan resmi instansi (BMKG/BNPB/PVMBG) tidak pernah diubah oleh AI. Laporan warga di sekitar titik ini dianalisis oleh AI-01 (ekstraksi parameter) dan AI-02 (deteksi duplikat PostGIS 1 km) untuk membantu moderator manusia.'}
                        </p>
                        <p className="text-[11px] font-semibold text-foreground">
                            Rekomendasi {selectedTierMeta.shortLabel}:{' '}
                            {selectedTierMeta.actionHint}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                            asChild
                            size="sm"
                            className="rounded-full font-semibold"
                        >
                            <Link href={customDetailHref}>
                                <span>Buka Detail</span>
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                        >
                            <Link href={`/preparedness/${selectedHazard}`}>
                                <ShieldCheck
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                <span>Panduan Siaga</span>
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                        >
                            <Link href="/reports/create">
                                <FilePlus2
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                <span>Lapor Kondisi</span>
                            </Link>
                        </Button>
                        <a
                            href={selected.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
                        >
                            <span>Sumber</span>
                            <ExternalLink
                                className="size-3"
                                aria-hidden="true"
                            />
                        </a>
                    </div>
                </aside>
            )}

            {/* Compact Legend + Map Tools Footer */}
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border/80 bg-card/88 p-3 text-xs backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                        role="status"
                        className="font-medium text-muted-foreground"
                    >
                        {renderError ||
                            (historicalTiles
                                ? loading
                                    ? 'Memuat layer kajian InaRISK...'
                                    : 'Layer kajian historis · BNPB InaRISK'
                                : loading
                                  ? 'Memuat titik multi-bencana...'
                                  : `${visibleFeatures.length} titik bencana aktif ditampilkan di peta${data.truncated ? ' · Perbesar peta untuk detail wilayah' : ''}`)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        {dataError && (
                            <span className="text-[11px] text-status-waspada-text">
                                {dataError}
                            </span>
                        )}
                        {(dataError || renderError) && (
                            <Action
                                variant="outline"
                                size="sm"
                                onClick={retry}
                                className="h-7 rounded-full text-xs"
                            >
                                <RefreshCw
                                    className="size-3"
                                    aria-hidden="true"
                                />
                                <span>Muat Ulang</span>
                            </Action>
                        )}
                        <Action
                            variant="outline"
                            size="sm"
                            disabled={!map}
                            onClick={() =>
                                map?.fitBounds(INDONESIA_BOUNDS, {
                                    padding: 24,
                                    duration: 450,
                                })
                            }
                            className="h-7 rounded-full text-xs"
                        >
                            <LocateFixed
                                className="size-3"
                                aria-hidden="true"
                            />
                            <span>Reset Peta Indonesia</span>
                        </Action>
                    </div>
                </div>

                {/* Compact Legend: 4-Tier Siaga Colors + 7 Custom SVG Hazard Icons */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2 text-[11px]">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-bold text-foreground">
                            Skala Status Siaga:
                        </span>
                        {(
                            [
                                'normal',
                                'waspada',
                                'siaga',
                                'awas',
                            ] as SiagaTier[]
                        ).map((tKey) => {
                            const t = SIAGA_TIERS[tKey];
                            return (
                                <span
                                    key={tKey}
                                    className="inline-flex items-center gap-1 text-muted-foreground"
                                >
                                    <span
                                        className={cn(
                                            'size-2.5 rounded-full',
                                            t.dotClass,
                                        )}
                                        aria-hidden="true"
                                    />
                                    <span>
                                        Lv.{t.levelNumber} {t.shortLabel}
                                    </span>
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                        <Layers
                            className="size-3.5 text-primary"
                            aria-hidden="true"
                        />
                        <span>
                            Klik ikon SVG di peta untuk membuka drawer telemetri
                            & analisis AI
                        </span>
                    </div>
                </div>
            </div>
            {/* Interactive Quick List of Visible Map Markers (Keyboard-accessible alternative to canvas click) */}
            {visibleFeatures.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleFeatures.slice(0, 6).map(({ properties: rec }) => {
                        const hz = inferRecordHazard(rec);
                        const tier = resolveFeatureTier(rec);
                        const isSelected = selected?.id === rec.id;
                        return (
                            <button
                                key={`${rec.kind}-${rec.id}`}
                                type="button"
                                onClick={() => setSelected(rec)}
                                className={cn(
                                    'pressable flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border p-2.5 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    isSelected
                                        ? 'border-primary bg-secondary text-foreground shadow-xs'
                                        : 'border-border/80 bg-card/85 text-foreground hover:bg-secondary/60',
                                )}
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <HazardChipBadge
                                        hazard={hz}
                                        tier={tier}
                                        showTier={false}
                                    />
                                    <span className="truncate font-semibold">
                                        {rec.title}
                                    </span>
                                </div>
                                <span className="shrink-0 text-[10px] font-bold text-primary">
                                    Inspeksi
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
