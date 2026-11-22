import { Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    CloudRain,
    ExternalLink,
    Mountain,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    dateTime,
    recordLink,
    statusLabels,
    stringValue,
    type Region,
} from '@/lib/disaster';
import {
    BmkgPartialSkeleton,
    FeedDegradedBanner,
    PublicEmptyState,
} from '../components/resilience-states';
import { useDisaster } from '../disaster-context';

type ModuleFilter = 'all' | 'weather' | 'earthquake' | 'volcano';

export function HazardsFeedView() {
    const {
        overview,
        feedState,
        isReloading,
        retryFeed,
        selectedRegionCode,
        selectedRegionName,
        regionOptions,
        setSelectedRegionCode,
        setActiveView,
    } = useDisaster();
    const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('all');

    const forecasts = (overview?.forecasts ?? []).filter((f) => !f.expired);
    const events = overview?.events ?? [];

    const showWeather = moduleFilter === 'all' || moduleFilter === 'weather';
    const showQuake = moduleFilter === 'all' || moduleFilter === 'earthquake';
    const showVolcano = moduleFilter === 'all' || moduleFilter === 'volcano';

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h1 className="heading-display text-2xl font-bold text-foreground sm:text-[1.65rem]">
                        Feed Multi-Bencana: Cuaca, Gempa & Gunung Api
                    </h1>
                    <p className="prose-pretty text-sm text-muted-foreground">
                        Setiap domain dipisahkan sumber dan batas
                        interpretasinya. Prakiraan hujan adalah indikator
                        meteorologi, bukan kategori bencana.
                    </p>
                </div>

                <div
                    className="segmented-track overflow-x-auto"
                    role="group"
                    aria-label="Filter modul multi-bencana"
                >
                    {(
                        [
                            ['all', 'Semua'],
                            ['weather', 'Cuaca BMKG'],
                            ['earthquake', 'Gempa'],
                            ['volcano', 'Gunung Api'],
                        ] as const
                    ).map(([id, label]) => {
                        const active = moduleFilter === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setModuleFilter(id)}
                                className={`pressable rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                                    active
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <FeedDegradedBanner
                feedState={feedState}
                onRetry={retryFeed}
                sources={overview?.sources ?? []}
            />

            {showWeather && (
                <Card className="gap-4 py-4">
                    <CardHeader className="flex flex-col gap-2 px-5 pb-0 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <CloudRain
                                    className="size-4 text-brand-sage-strong"
                                    aria-hidden="true"
                                />
                                <span>
                                    Prakiraan Cuaca BMKG ({selectedRegionName})
                                </span>
                            </CardTitle>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Kode adm4 {selectedRegionCode} · Cakupan pilot
                                Jatinegara. Hujan tidak otomatis berarti banjir.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                aria-label="Pilih kelurahan prakiraan BMKG"
                                value={selectedRegionCode}
                                onChange={(e) =>
                                    setSelectedRegionCode(
                                        e.target.value as Region,
                                    )
                                }
                                className="h-8 rounded-full border border-input bg-card px-3 text-xs font-semibold text-foreground"
                            >
                                {regionOptions.map((r) => (
                                    <option key={r.code} value={r.code}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                            <Badge className="w-fit bg-verified-soft text-foreground">
                                Atribusi: BMKG
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="px-5">
                        {isReloading ? (
                            <BmkgPartialSkeleton label="Memuat prakiraan kelurahan dari server..." />
                        ) : forecasts.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                {forecasts.slice(0, 10).map((slot) => {
                                    const data = slot.data as Record<
                                        string,
                                        unknown
                                    >;
                                    return (
                                        <div
                                            key={slot.id}
                                            className="rounded-xl border border-border/80 bg-muted/45 p-3.5 transition-colors duration-150 hover:bg-muted/75"
                                        >
                                            <p className="text-xs font-semibold text-muted-foreground tabular-nums">
                                                {dateTime(
                                                    slot.forecast_at ??
                                                        slot.source_time,
                                                )}
                                            </p>
                                            <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-foreground tabular-nums">
                                                {stringValue(data.t, '-')} °C
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-foreground">
                                                {stringValue(
                                                    data.weather_desc,
                                                    slot.title,
                                                )}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                                                Kelembapan{' '}
                                                {stringValue(data.hu, '-')}% ·{' '}
                                                {statusLabels[
                                                    slot.source.freshness
                                                ] ?? slot.source.freshness}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <PublicEmptyState
                                title="Prakiraan cuaca berlaku belum tersedia"
                                description={`Belum ada slot prakiraan BMKG aktif untuk ${selectedRegionName} (adm4 ${selectedRegionCode}).`}
                                actionLabel="Muat Ulang dari Server"
                                onAction={retryFeed}
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                {showQuake && (
                    <Card className="gap-3.5 py-4 xl:col-span-6">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 px-5 pb-0">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Activity
                                    className="size-4 text-brand-sage-strong"
                                    aria-hidden="true"
                                />
                                <span>Gempa Bumi BMKG ({events.length})</span>
                            </CardTitle>
                            <Link
                                href="/earthquakes"
                                className="text-xs font-semibold text-brand-sage-strong hover:underline"
                            >
                                Halaman Gempa →
                            </Link>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col gap-3 px-5">
                            {events.length === 0 ? (
                                <PublicEmptyState
                                    title="Belum ada kejadian gempa tersimpan"
                                    description="Tidak ditemukan catatan gempa BMKG di database saat ini."
                                    actionLabel="Muat Ulang Server"
                                    onAction={retryFeed}
                                />
                            ) : (
                                events.slice(0, 6).map((item) => {
                                    const data = item.data as Record<
                                        string,
                                        unknown
                                    >;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={recordLink(item)}
                                            className="rounded-xl border border-border/80 bg-muted/35 p-3.5 transition-colors hover:bg-muted/65"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-bold text-foreground">
                                                    {item.title}
                                                </p>
                                                <Badge className="bg-alert-amber-soft text-alert-amber-text tabular-nums">
                                                    M
                                                    {stringValue(
                                                        data.Magnitude,
                                                        '-',
                                                    )}{' '}
                                                    ·{' '}
                                                    {stringValue(
                                                        data.Kedalaman,
                                                        '-',
                                                    )}
                                                </Badge>
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {item.message ??
                                                    stringValue(
                                                        data.Wilayah,
                                                        'Lihat detail sumber resmi BMKG.',
                                                    )}
                                            </p>
                                            <p className="mt-2 text-xs text-muted-foreground tabular-nums">
                                                {dateTime(item.source_time)} ·{' '}
                                                {item.source.agency}
                                            </p>
                                        </Link>
                                    );
                                })
                            )}
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setActiveView('alerts')}
                                className="mt-auto w-full rounded-xl font-semibold"
                            >
                                Buka Arsip Lengkap CAP & Gempa
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {showVolcano && (
                    <Card className="gap-3.5 py-4 xl:col-span-6">
                        <CardHeader className="flex flex-row items-center justify-between gap-2 px-5 pb-0">
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Mountain
                                    className="size-4 text-brand-bronze-text"
                                    aria-hidden="true"
                                />
                                <span>Gunung Api (PVMBG MAGMA)</span>
                            </CardTitle>
                            <Badge className="bg-brand-bronze-soft text-brand-bronze-text">
                                Arsip Bertanggal
                            </Badge>
                        </CardHeader>

                        <CardContent className="flex flex-1 flex-col gap-3.5 px-5">
                            <div className="flex items-start gap-2.5 rounded-xl bg-alert-amber-soft p-3 text-xs text-alert-amber-text">
                                <AlertTriangle
                                    className="mt-0.5 size-4 shrink-0"
                                    aria-hidden="true"
                                />
                                <p>
                                    Integrasi otomatis MAGMA dibatasi kebijakan
                                    akses publik. Halaman khusus Gunung Api
                                    menampilkan arsip laporan resmi bertanggal
                                    dari backend (`config/pvmbg.php`) untuk Anak
                                    Krakatau, Merapi, dan Semeru disertai tautan
                                    langsung ke MAGMA Indonesia.
                                </p>
                            </div>

                            <div className="rounded-xl border border-border bg-muted/35 p-4 text-xs text-muted-foreground">
                                <p className="font-semibold text-foreground">
                                    Tingkat aktivitas resmi hanya bersumber dari
                                    PVMBG
                                </p>
                                <p className="mt-1 leading-relaxed">
                                    Sistem tidak pernah menurunkan status gunung
                                    api dari curah hujan atau laporan warga.
                                    Buka halaman arsip resmi di aplikasi atau
                                    cek status terbaru langsung di portal MAGMA
                                    ESDM.
                                </p>
                            </div>

                            <div className="mt-auto flex flex-wrap gap-2">
                                <Button
                                    asChild
                                    size="sm"
                                    className="flex-1 rounded-xl font-semibold"
                                >
                                    <Link href="/volcanoes">
                                        <span>Buka Halaman Gunung Api</span>
                                        <ArrowUpRight
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl"
                                >
                                    <a
                                        href="https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <span>Portal MAGMA</span>
                                        <ExternalLink
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </a>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
