import { Map, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

setWorkerUrl(workerUrl);

type Coordinates = [longitude: number, latitude: number];
const epicenterZoom = 8;

export default function ReportLocationMap({
    position,
    onSelect,
    label = 'Peta pemilihan lokasi kejadian',
}: {
    position: Coordinates | null;
    onSelect?: (position: Coordinates) => void;
    label?: string;
}) {
    const readOnly = onSelect === undefined;
    const container = useRef<HTMLDivElement>(null);
    const marker = useRef<Marker | null>(null);
    const selection = useRef(onSelect);
    const initialPosition = useRef(readOnly ? position : null);
    const [map, setMap] = useState<Map | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        selection.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        if (!container.current) return;
        let instance: Map;
        try {
            instance = new Map({
                container: container.current,
                style:
                    import.meta.env.VITE_MAP_STYLE_URL ||
                    'https://tiles.openfreemap.org/styles/positron',
                center: initialPosition.current ?? [118, -2],
                zoom: initialPosition.current ? epicenterZoom : 3,
                cooperativeGestures: true,
                attributionControl: { compact: true },
            });
        } catch {
            setError(true);
            return;
        }
        instance.addControl(new NavigationControl({ showCompass: false }));
        instance.on('load', () => {
            setError(false);
            setMap(instance);
        });
        instance.on('error', () => {
            if (!instance.isStyleLoaded()) setError(true);
        });
        if (!readOnly) {
            instance.on('click', ({ lngLat }) => {
                const point = lngLat.wrap();
                selection.current?.([point.lng, point.lat]);
            });
        }
        return () => {
            marker.current?.remove();
            marker.current = null;
            instance.remove();
        };
    }, [readOnly]);

    const [longitude, latitude] = position ?? [];
    useEffect(() => {
        if (!map || longitude === undefined || latitude === undefined) {
            marker.current?.remove();
            marker.current = null;
            return;
        }
        const point: Coordinates = [longitude, latitude];
        if (!marker.current) {
            const pin = new Marker({
                color: readOnly ? '#aa3022' : '#13604b',
                draggable: !readOnly,
            });
            pin.setLngLat(point).addTo(map);
            if (!readOnly) {
                pin.on('dragend', () => {
                    const { lng, lat } = pin.getLngLat().wrap();
                    selection.current?.([lng, lat]);
                });
            }
            marker.current = pin;
        } else {
            marker.current.setLngLat(point);
        }
        if (readOnly) {
            map.jumpTo({ center: point, zoom: epicenterZoom });
        } else if (!map.getBounds().contains(point)) {
            map.jumpTo({ center: point });
        }
    }, [map, longitude, latitude, readOnly]);

    return (
        <div>
            {error && (
                <p role="status" className="dr-caption">
                    {readOnly
                        ? 'Peta dasar belum dapat dimuat. Koordinat episentrum tersedia di bawah.'
                        : 'Peta dasar tidak tersedia. Gunakan lokasi perangkat atau isi koordinat.'}
                </p>
            )}
            <div
                ref={container}
                className={
                    readOnly
                        ? 'dr-live-map'
                        : 'h-64 w-full overflow-hidden rounded-lg border'
                }
                aria-label={label}
            />
        </div>
    );
}
