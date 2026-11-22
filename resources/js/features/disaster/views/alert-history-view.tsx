import { Link } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    ChevronRight,
    CloudLightning,
    ExternalLink,
    Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    dateTime,
    recordLink,
    statusLabels,
    stringValue,
} from '@/lib/disaster';
import type { OfficialRecord } from '@/types/disaster';
import {
    FeedDegradedBanner,
    PublicEmptyState,
} from '../components/resilience-states';
import { useDisaster } from '../disaster-context';

type StateFilter =
    | 'all'
    | 'ACTIVE'
    | 'EXPIRED'
    | 'CANCELLED'
    | 'SUPERSEDED'
    | 'UPCOMING';

type KindFilter = 'all' | 'alert' | 'event';

const STATE_FILTER_LABELS: Record<StateFilter, string> = {
    all: 'Semua Status',
    ACTIVE: 'Aktif',
    EXPIRED: 'Kedaluwarsa',
    CANCELLED: 'Dibatalkan',
    SUPERSEDED: 'Digantikan',
    UPCOMING: 'Belum Berlaku',
};

const KIND_FILTER_LABELS: Record<KindFilter, string> = {
    all: 'Semua Jenis',
    alert: 'Peringatan CAP',
    event: 'Kejadian Gempa',
};

export function AlertHistoryView() {
    const { overview, feedState, retryFeed, setEvacuationOpen } = useDisaster();
    const [stateFilter, setStateFilter] = useState<StateFilter>('all');
    const [kindFilter, setKindFilter] = useState<KindFilter>('all');
    const [query, setQuery] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<OfficialRecord | null>(
        null,
    );

    const combinedRecords = useMemo(() => {
        const list: OfficialRecord[] = [
            ...(overview?.alerts ?? []),
            ...(overview?.events ?? []),
        ];
        return list.sort(
            (a, b) =>
                new Date(b.source_time).getTime() -
                new Date(a.source_time).getTime(),
        );
    }, [overview?.alerts, overview?.events]);

    const filteredRecords = useMemo(() => {
        return combinedRecords.filter((item) => {
            if (kindFilter !== 'all' && item.kind !== kindFilter) {
                return false;
            }
            if (stateFilter !== 'all') {
                if (item.kind !== 'alert' || item.alert_state !== stateFilter) {
                    return false;
                }
            }
            if (query.trim().length > 0) {
                const q = query.toLowerCase();
                const data = item.data as Record<string, unknown>;
                const wilayah =
                    typeof data.Wilayah === 'string'
                        ? data.Wilayah.toLowerCase()
                        : '';
                return (
                    item.title.toLowerCase().includes(q) ||
                    (item.message ?? '').toLowerCase().includes(q) ||
                    item.source.agency.toLowerCase().includes(q) ||
                    wilayah.includes(q)
                );
            }
            return true;
        });
    }, [combinedRecords, kindFilter, stateFilter, query]);

    const resetFilters = () => {
        setStateFilter('all');
        setKindFilter('all');
        setQuery('');
    };

    const selectedData = (selectedRecord?.data ?? {}) as Record<
        string,
        unknown
    >;

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h1 className="heading-display text-2xl font-bold text-foreground sm:text-[1.65rem]">
                        Riwayat Peringatan & Arsip Resmi BMKG
                    </h1>
                    <p className="prose-pretty text-sm text-muted-foreground">
                        Arsip peringatan CAP aktif, kedaluwarsa, dibatalkan,
                        digantikan, serta catatan kejadian gempa dari server
                        lengkap dengan tautan resmi.
                    </p>
                </div>
                <Badge variant="outline" className="w-fit border-input">
                    Total Tercatat: {combinedRecords.length}
                </Badge>
            </div>

            <FeedDegradedBanner
                feedState={feedState}
                onRetry={retryFeed}
                sources={overview?.sources ?? []}
            />

            <Card className="gap-3.5 py-4">
                <CardContent className="space-y-3 px-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="relative max-w-md flex-1">
                            <Search
                                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                                aria-hidden="true"
                            />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari wilayah, judul peringatan, atau gempa..."
                                aria-label="Cari riwayat peringatan dan kejadian resmi"
                                className="h-10 rounded-full pl-10 text-base sm:text-sm"
                            />
                        </div>

                        <div
                            className="segmented-track overflow-x-auto"
                            role="group"
                            aria-label="Filter jenis catatan resmi"
                        >
                            {(['all', 'alert', 'event'] as const).map((k) => {
                                const active = kindFilter === k;
                                return (
                                    <button
                                        key={k}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => setKindFilter(k)}
                                        className={`pressable rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                                            active
                                                ? 'bg-card text-foreground shadow-xs'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {KIND_FILTER_LABELS[k]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div
                        className="flex flex-wrap items-center gap-1.5"
                        role="group"
                        aria-label="Filter status masa berlaku peringatan CAP"
                    >
                        {(
                            [
                                'all',
                                'ACTIVE',
                                'EXPIRED',
                                'CANCELLED',
                                'SUPERSEDED',
                                'UPCOMING',
                            ] as const
                        ).map((st) => {
                            const active = stateFilter === st;
                            return (
                                <button
                                    key={st}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setStateFilter(st)}
                                    className={`pressable rounded-full border px-3 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                                        active
                                            ? 'border-primary bg-primary font-semibold text-primary-foreground'
                                            : 'border-input bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                    }`}
                                >
                                    {STATE_FILTER_LABELS[st]}
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {filteredRecords.length === 0 ? (
                <PublicEmptyState
                    title={
                        combinedRecords.length === 0
                            ? 'Belum ada arsip peringatan atau gempa di server'
                            : 'Tidak ada catatan yang cocok dengan filter'
                    }
                    description={
                        query
                            ? `Tidak ditemukan hasil untuk "${query}" pada kombinasi filter saat ini.`
                            : combinedRecords.length === 0
                              ? 'Jalankan sinkronisasi sumber BMKG atau muat ulang dari server.'
                              : 'Ubah filter jenis atau status masa berlaku untuk melihat arsip lainnya.'
                    }
                    actionLabel={
                        combinedRecords.length === 0
                            ? 'Muat Ulang Server'
                            : 'Reset Filter'
                    }
                    onAction={
                        combinedRecords.length === 0 ? retryFeed : resetFilters
                    }
                />
            ) : (
                <div className="space-y-2.5">
                    {filteredRecords.map((record) => {
                        const stateKey =
                            record.alert_state ?? record.source.freshness;
                        const statusClass =
                            record.alert_state === 'ACTIVE'
                                ? 'bg-alert-amber text-forest-fixed font-bold'
                                : record.alert_state === 'CANCELLED' ||
                                    record.alert_state === 'SUPERSEDED'
                                  ? 'bg-brand-bronze-soft text-brand-bronze-text'
                                  : record.kind === 'event'
                                    ? 'bg-verified-soft text-foreground'
                                    : 'bg-muted text-muted-foreground';

                        const KindIcon =
                            record.kind === 'event' ? Activity : CloudLightning;

                        const data = record.data as Record<string, unknown>;

                        return (
                            <button
                                key={`${record.kind}-${record.id}`}
                                type="button"
                                onClick={() => setSelectedRecord(record)}
                                className="pressable surface-card surface-card-interactive group flex w-full flex-col gap-3 rounded-2xl bg-card p-4 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex min-w-0 items-start gap-3.5">
                                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-brand-sage-strong">
                                        <KindIcon
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge className={statusClass}>
                                                {statusLabels[stateKey] ??
                                                    stateKey}
                                            </Badge>
                                            {typeof data.severity ===
                                                'string' && (
                                                <span className="text-xs font-semibold text-foreground/80">
                                                    {data.severity}
                                                    {typeof data.certainty ===
                                                    'string'
                                                        ? ` · ${data.certainty}`
                                                        : ''}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground">
                                                {record.source.agency}
                                            </span>
                                            {record.synthetic && (
                                                <Badge variant="outline">
                                                    Sintetis
                                                </Badge>
                                            )}
                                        </div>
                                        <h2 className="truncate text-base font-semibold text-foreground">
                                            {record.title}
                                        </h2>
                                        <p className="text-xs text-muted-foreground tabular-nums">
                                            Waktu sumber{' '}
                                            {dateTime(record.source_time)}
                                            {record.expires_at
                                                ? ` · Berlaku sampai ${dateTime(record.expires_at)}`
                                                : ''}
                                        </p>
                                    </div>
                                </div>

                                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                                    <span>Detail</span>
                                    <ChevronRight
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            <Sheet
                open={selectedRecord !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedRecord(null);
                    }
                }}
            >
                <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-lg">
                    {selectedRecord && (
                        <>
                            <SheetHeader className="border-b border-border pb-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                        className={
                                            selectedRecord.alert_state ===
                                            'ACTIVE'
                                                ? 'bg-alert-amber font-bold text-forest-fixed'
                                                : 'bg-muted text-muted-foreground'
                                        }
                                    >
                                        {statusLabels[
                                            selectedRecord.alert_state ??
                                                selectedRecord.source.freshness
                                        ] ??
                                            selectedRecord.alert_state ??
                                            selectedRecord.source.freshness}
                                    </Badge>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {selectedRecord.kind === 'event'
                                            ? 'Detail Kejadian Gempa BMKG'
                                            : 'Detail Peringatan CAP XML'}
                                    </span>
                                </div>
                                <SheetTitle className="heading-section text-lg">
                                    {selectedRecord.title}
                                </SheetTitle>
                                <SheetDescription>
                                    {selectedRecord.source.attribution}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="space-y-4 p-4">
                                {selectedRecord.kind === 'event' && (
                                    <div className="rounded-2xl bg-forest-fixed p-4 text-white">
                                        <p className="overline-label text-alert-amber">
                                            Parameter Resmi BMKG
                                        </p>
                                        <dl className="mt-3 space-y-2 text-xs">
                                            <div className="flex justify-between gap-2 border-b border-white/15 pb-1.5">
                                                <dt className="text-white/80">
                                                    Magnitudo & Kedalaman
                                                </dt>
                                                <dd className="font-semibold tabular-nums">
                                                    M
                                                    {stringValue(
                                                        selectedData.Magnitude,
                                                        '-',
                                                    )}{' '}
                                                    ·{' '}
                                                    {stringValue(
                                                        selectedData.Kedalaman,
                                                        '-',
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between gap-2 border-b border-white/15 pb-1.5">
                                                <dt className="text-white/80">
                                                    Wilayah
                                                </dt>
                                                <dd className="text-right font-semibold">
                                                    {stringValue(
                                                        selectedData.Wilayah,
                                                        '-',
                                                    )}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between gap-2 border-b border-white/15 pb-1.5">
                                                <dt className="text-white/80">
                                                    Potensi
                                                </dt>
                                                <dd className="text-right font-semibold">
                                                    {stringValue(
                                                        selectedData.Potensi,
                                                        '-',
                                                    )}
                                                </dd>
                                            </div>
                                            {typeof selectedData.Dirasakan ===
                                                'string' &&
                                                selectedData.Dirasakan.trim() !==
                                                    '' && (
                                                    <div className="flex justify-between gap-2">
                                                        <dt className="text-white/80">
                                                            Dirasakan
                                                        </dt>
                                                        <dd className="text-right font-semibold">
                                                            {
                                                                selectedData.Dirasakan
                                                            }
                                                        </dd>
                                                    </div>
                                                )}
                                        </dl>
                                    </div>
                                )}

                                <dl className="surface-card space-y-2 rounded-2xl bg-card p-4 text-xs">
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">
                                            Penerbit
                                        </dt>
                                        <dd className="text-right font-semibold text-foreground">
                                            {selectedRecord.source.attribution}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">
                                            Waktu Sumber
                                        </dt>
                                        <dd className="font-semibold text-foreground tabular-nums">
                                            {dateTime(
                                                selectedRecord.source_time,
                                            )}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">
                                            Diambil Sistem
                                        </dt>
                                        <dd className="font-semibold text-foreground tabular-nums">
                                            {dateTime(
                                                selectedRecord.fetched_at,
                                            )}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between gap-2">
                                        <dt className="text-muted-foreground">
                                            Berlaku Sampai
                                        </dt>
                                        <dd className="font-semibold text-foreground tabular-nums">
                                            {dateTime(
                                                selectedRecord.expires_at,
                                            )}
                                        </dd>
                                    </div>
                                </dl>

                                {selectedRecord.message && (
                                    <div className="space-y-1.5">
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Pesan & Rincian Resmi
                                        </h3>
                                        <p className="prose-pretty text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                            {selectedRecord.message}
                                        </p>
                                    </div>
                                )}

                                {(selectedRecord.expired ||
                                    selectedRecord.source.freshness !==
                                        'FRESH') && (
                                    <div className="flex items-start gap-2.5 rounded-xl bg-alert-amber-soft p-3.5 text-xs text-alert-amber-text">
                                        <AlertTriangle
                                            className="mt-0.5 size-4 shrink-0"
                                            aria-hidden="true"
                                        />
                                        <p>
                                            Informasi ini kedaluwarsa atau
                                            sumber belum terbarui. Periksa
                                            sumber resmi sebelum mengambil
                                            keputusan.
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="rounded-full font-semibold"
                                    >
                                        <Link
                                            href={recordLink(selectedRecord)}
                                            onClick={() =>
                                                setSelectedRecord(null)
                                            }
                                        >
                                            Buka Halaman Detail
                                        </Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedRecord(null);
                                            setEvacuationOpen(true);
                                        }}
                                        className="rounded-full"
                                    >
                                        Panduan Siaga
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="rounded-full"
                                    >
                                        <a
                                            href={selectedRecord.source_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <span>Sumber Resmi</span>
                                            <ExternalLink
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
