import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
    CloudRain,
    Droplets,
    ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { dateTime, statusLabels, stringValue } from '@/lib/disaster';
import { useDisaster } from '../disaster-context';

const OFFICIAL_WATER_PORTALS = [
    {
        id: 'bpbd-tma',
        name: 'Pantauan Tinggi Muka Air (TMA) BPBD DKI',
        agency: 'BPBD Provinsi DKI Jakarta',
        description:
            'Status resmi pintu air Manggarai, Katulampa, Depok, dan Karet langsung dari halaman pemantauan BPBD DKI.',
        url: 'https://bpbd.jakarta.go.id/waterlevel/',
    },
    {
        id: 'pantau-banjir',
        name: 'Pantau Banjir Jakarta',
        agency: 'Pemprov DKI Jakarta',
        description:
            'Peta genangan tingkat RT, histori banjir, dan informasi lintas instansi Jakarta.',
        url: 'https://pantaubanjir.jakarta.go.id/',
    },
    {
        id: 'dsda-jakarta',
        name: 'Layanan Pemantauan Air Dinas SDA',
        agency: 'Dinas Sumber Daya Air DKI Jakarta',
        description:
            'Informasi saluran, pompa pengendali banjir, dan pemantauan muka air resmi.',
        url: 'https://dsda.jakarta.go.id/layanan',
    },
];

export function RegionWaterLevelDrawer() {
    const {
        overview,
        waterLevelOpen,
        setWaterLevelOpen,
        selectedRegionCode,
        selectedRegionName,
        setActiveView,
        setEvacuationOpen,
    } = useDisaster();

    const nextForecast = (overview?.forecasts ?? []).find((f) => !f.expired);
    const forecastData = (nextForecast?.data ?? {}) as Record<string, unknown>;

    return (
        <Sheet open={waterLevelOpen} onOpenChange={setWaterLevelOpen}>
            <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-lg">
                <SheetHeader className="border-b border-border pb-4">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand-sage-strong uppercase">
                        <Droplets className="size-3.5" aria-hidden="true" />
                        <span>Rujukan Pintu Air (TMA) & Cuaca Wilayah</span>
                    </div>
                    <SheetTitle className="text-lg">
                        {selectedRegionName}
                    </SheetTitle>
                    <SheetDescription>
                        Jatinegara, Jakarta Timur · Kode adm4{' '}
                        {selectedRegionCode}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 p-4">
                    <div className="flex items-start gap-2 rounded-xl border border-brand-bronze-text/30 bg-brand-bronze-soft p-3 text-xs text-brand-bronze-text">
                        <AlertTriangle
                            className="mt-0.5 size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <p>
                            <strong>Keterbatasan Integrasi TMA:</strong> Backend
                            belum memiliki adapter API live Tinggi Muka Air
                            (Pintu Air). Sistem tidak menampilkan angka TMA
                            rekaan; gunakan tautan portal resmi BPBD DKI dan
                            Dinas SDA di bawah ini.
                        </p>
                    </div>

                    <div className="surface-card space-y-2 rounded-2xl bg-card p-4">
                        <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                                <CloudRain
                                    className="size-4 text-brand-sage-strong"
                                    aria-hidden="true"
                                />
                                <span>Prakiraan Cuaca BMKG Terdekat</span>
                            </span>
                            {nextForecast && (
                                <Badge variant="secondary">
                                    {statusLabels[
                                        nextForecast.source.freshness
                                    ] ?? nextForecast.source.freshness}
                                </Badge>
                            )}
                        </div>
                        {nextForecast ? (
                            <div className="space-y-1 text-xs">
                                <p className="text-base font-bold text-foreground">
                                    {stringValue(
                                        forecastData.weather_desc,
                                        nextForecast.title,
                                    )}{' '}
                                    · {stringValue(forecastData.t, '-')} °C
                                </p>
                                <p className="text-muted-foreground tabular-nums">
                                    Kelembapan{' '}
                                    {stringValue(forecastData.hu, '-')}% · Slot{' '}
                                    {dateTime(
                                        nextForecast.forecast_at ??
                                            nextForecast.source_time,
                                    )}
                                </p>
                                <p className="text-muted-foreground">
                                    Prakiraan hujan adalah indikator
                                    meteorologi, bukan penentu banjir otomatis.
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground">
                                Prakiraan cuaca berlaku untuk{' '}
                                {selectedRegionName} belum tersedia di server.
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        {OFFICIAL_WATER_PORTALS.map((portal) => (
                            <div
                                key={portal.id}
                                className="surface-card space-y-2 rounded-2xl bg-card p-4"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground">
                                            {portal.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {portal.agency}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="shrink-0"
                                    >
                                        Rujukan Resmi
                                    </Badge>
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    {portal.description}
                                </p>
                                <div className="pt-1">
                                    <a
                                        href={portal.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-foreground underline underline-offset-4 hover:text-brand-sage-strong"
                                    >
                                        <span>Buka Portal Resmi</span>
                                        <ExternalLink
                                            className="size-3"
                                            aria-hidden="true"
                                        />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                            type="button"
                            size="sm"
                            className="flex-1 font-semibold"
                            onClick={() => {
                                setWaterLevelOpen(false);
                                setActiveView('map');
                            }}
                        >
                            <span>Buka Peta Multi-Bahaya</span>
                            <ArrowUpRight
                                className="size-4"
                                aria-hidden="true"
                            />
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-input font-semibold"
                            onClick={() => {
                                setWaterLevelOpen(false);
                                setEvacuationOpen(true);
                            }}
                        >
                            Panduan Siaga
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="w-full border-input font-semibold"
                        >
                            <Link
                                href="/reports/create"
                                onClick={() => setWaterLevelOpen(false)}
                            >
                                Laporkan Kondisi Lapangan (Privat)
                            </Link>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
