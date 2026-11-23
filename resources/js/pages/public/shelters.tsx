import { Head, Link } from '@inertiajs/react';
import { LocateFixed, Navigation } from 'lucide-react';
import {
    LngLatBounds,
    Map,
    Marker,
    NavigationControl,
    setWorkerUrl,
} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Action, Notice, PageHeading, Panel } from '@/components/disaster/ui';

setWorkerUrl(workerUrl);

const shelters = [
    {
        id: 'a',
        label: 'Titik A',
        area: 'Jakarta Timur',
        lng: 106.881,
        lat: -6.239,
    },
    {
        id: 'b',
        label: 'Titik B',
        area: 'Jakarta Selatan',
        lng: 106.82,
        lat: -6.258,
    },
    {
        id: 'c',
        label: 'Titik C',
        area: 'Jakarta Pusat',
        lng: 106.847,
        lat: -6.169,
    },
] as const;
type Shelter = (typeof shelters)[number];

export default function Shelters() {
    const container = useRef<HTMLDivElement>(null);
    const pins = useRef<HTMLButtonElement[]>([]);
    const [selected, setSelected] = useState<Shelter>(shelters[0]);
    const [origin, setOrigin] = useState<string>();
    const [locating, setLocating] = useState(false);
    const [locationStatus, setLocationStatus] = useState('');
    const [mapError, setMapError] = useState(false);

    useEffect(() => {
        if (!container.current) return;
        let map: Map;
        try {
            map = new Map({
                container: container.current,
                style:
                    import.meta.env.VITE_MAP_STYLE_URL ||
                    'https://tiles.openfreemap.org/styles/positron',
                attributionControl: { compact: true },
                cooperativeGestures: true,
            });
        } catch {
            setMapError(true);
            return;
        }
        map.addControl(new NavigationControl({ showCompass: false }));
        const bounds = new LngLatBounds();
        const markers = shelters.map((shelter) => {
            const pin = document.createElement('button');
            pin.type = 'button';
            pin.textContent = shelter.id.toUpperCase();
            pin.className =
                'grid size-11 place-items-center rounded-full border-2 border-white bg-primary font-bold text-primary-foreground shadow aria-pressed:ring-4 aria-pressed:ring-primary/40';
            pin.setAttribute(
                'aria-label',
                shelter.label + ' simulasi, ' + shelter.area,
            );
            pin.dataset.shelter = shelter.id;
            pin.onclick = () => setSelected(shelter);
            pins.current.push(pin);
            bounds.extend([shelter.lng, shelter.lat]);
            return new Marker({ element: pin })
                .setLngLat([shelter.lng, shelter.lat])
                .addTo(map);
        });
        map.fitBounds(bounds, { padding: 50, duration: 0 });
        const timeout = window.setTimeout(() => setMapError(true), 12_000);
        map.once('load', () => window.clearTimeout(timeout));
        return () => {
            window.clearTimeout(timeout);
            markers.forEach((marker) => marker.remove());
            pins.current = [];
            map.remove();
        };
    }, []);

    useEffect(() => {
        for (const pin of pins.current) {
            pin.setAttribute(
                'aria-pressed',
                String(pin.dataset.shelter === selected.id),
            );
        }
    }, [selected]);

    function locate() {
        if (!navigator.geolocation) {
            setLocationStatus(
                'Lokasi perangkat tidak tersedia. Pilih titik awal di Google Maps.',
            );
            return;
        }
        setLocating(true);
        setLocationStatus('');
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setOrigin(
                    coords.latitude.toFixed(5) +
                        ',' +
                        coords.longitude.toFixed(5),
                );
                setLocationStatus(
                    'Lokasi perangkat siap dipakai sebagai titik awal.',
                );
                setLocating(false);
            },
            () => {
                setOrigin(undefined);
                setLocationStatus(
                    'Lokasi tidak tersedia. Pilih titik awal di Google Maps.',
                );
                setLocating(false);
            },
            { timeout: 10_000, maximumAge: 30_000 },
        );
    }

    const directions = new URLSearchParams({
        api: '1',
        destination: selected.lat + ',' + selected.lng,
        travelmode: 'walking',
    });
    if (origin) directions.set('origin', origin);

    return (
        <>
            <Head title="Simulasi Shelter" />
            <PageHeading
                title="Simulasi Shelter"
                description="Pilih titik di peta atau daftar untuk mencoba rute."
            >
                <Action asChild variant="outline">
                    <Link href="/bantuan">Informasi Bantuan</Link>
                </Action>
            </PageHeading>
            <Notice>
                Semua titik di halaman ini adalah simulasi. Jangan gunakan untuk
                evakuasi sungguhan.
            </Notice>
            <div className="dr-two-col">
                <Panel title="Peta Shelter Simulasi">
                    {mapError && (
                        <p role="status" className="dr-caption">
                            Peta belum tersedia. Titik simulasi masih bisa
                            dipilih dari daftar.
                        </p>
                    )}
                    <div
                        ref={container}
                        className="h-72 min-w-0 overflow-hidden rounded-lg border md:h-96"
                        aria-label="Peta titik shelter simulasi Jakarta"
                    />
                </Panel>
                <Panel title="Tujuan Rute Demo">
                    <div
                        className="grid gap-2"
                        aria-label="Daftar titik simulasi"
                        role="group"
                    >
                        {shelters.map((shelter) => (
                            <Action
                                key={shelter.id}
                                type="button"
                                variant={
                                    selected.id === shelter.id
                                        ? 'default'
                                        : 'outline'
                                }
                                aria-pressed={selected.id === shelter.id}
                                onClick={() => setSelected(shelter)}
                            >
                                {shelter.label} · {shelter.area}
                            </Action>
                        ))}
                    </div>
                    <Action
                        type="button"
                        variant="outline"
                        disabled={locating}
                        onClick={locate}
                    >
                        <LocateFixed aria-hidden="true" />
                        {locating
                            ? 'Mencari lokasi…'
                            : 'Gunakan Lokasi Perangkat'}
                    </Action>
                    {locationStatus && (
                        <p role="status" className="dr-caption">
                            {locationStatus}
                        </p>
                    )}
                    <Action asChild>
                        <a
                            href={
                                'https://www.google.com/maps/dir/?' + directions
                            }
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Navigation aria-hidden="true" />
                            Buka Rute ke {selected.label} di Google Maps
                        </a>
                    </Action>
                    <p className="dr-caption dr-muted">
                        Google Maps membuka rute jalan kaki. Kalau lokasi
                        perangkat belum dipilih, masukkan titik awal di Google
                        Maps.
                    </p>
                </Panel>
            </div>
        </>
    );
}
