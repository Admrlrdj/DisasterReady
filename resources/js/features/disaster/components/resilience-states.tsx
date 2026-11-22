import {
    AlertTriangle,
    Clock,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    WifiOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dateTime } from '@/lib/disaster';
import type { SourceHealth } from '@/types/disaster';
import type { FeedState } from '../types';

export function FeedDegradedBanner({
    feedState,
    onRetry,
    sources = [],
}: {
    feedState: FeedState;
    onRetry: () => void;
    sources?: SourceHealth[];
}) {
    if (
        feedState === 'normal' ||
        feedState === 'loading' ||
        feedState === 'empty'
    ) {
        return null;
    }

    const degradedSources = sources.filter(
        (s) =>
            s.agency === 'BMKG' &&
            (s.freshness === 'STALE' ||
                s.freshness === 'PARTIAL' ||
                s.freshness === 'FAILED'),
    );
    const affectedNames = degradedSources.map((s) => s.name).join(', ');
    const lastSuccess = degradedSources
        .map((s) => s.last_success_at)
        .filter((v): v is string => Boolean(v))
        .sort()
        .at(-1);

    const config = {
        stale: {
            badge: 'SUMBER TERTUNDA / PARSIAL',
            title: affectedNames
                ? `Sebagian feed BMKG tertunda atau parsial: ${affectedNames}.`
                : 'Sebagian feed BMKG melewati batas kesegaran (SLA).',
            body: lastSuccess
                ? `Sinkronisasi sukses terakhir tercatat ${dateTime(lastSuccess)}. Sistem tidak pernah melabel kondisi aman saat sumber tertunda.`
                : 'Menampilkan catatan tersimpan terakhir di server. Periksa pembaruan langsung pada portal resmi BMKG.',
            icon: Clock,
            tone: 'border-alert-amber-text/30 bg-alert-amber-soft text-alert-amber-text',
        },
        error: {
            badge: 'SINKRONISASI SUMBER GAGAL',
            title: 'Permintaan data resmi BMKG gagal atau tidak tersedia.',
            body: 'Menampilkan catatan terakhir yang tersimpan serta tautan instansi resmi. Buka portal BMKG atau hubungi BNPB 117 / DKI 112 bila kondisi darurat.',
            icon: AlertTriangle,
            tone: 'border-destructive/40 bg-danger-soft text-destructive',
        },
        'rate-limited': {
            badge: 'BATAS PERMINTAAN TERCAPAI',
            title: 'Batas permintaan sementara tercapai.',
            body: 'Tunggu jeda singkat sebelum memuat ulang data resmi dari server.',
            icon: Clock,
            tone: 'border-brand-bronze-text/35 bg-brand-bronze-soft text-brand-bronze-text',
        },
        offline: {
            badge: 'KONEKSI TERPUTUS',
            title: 'Koneksi jaringan tidak terdeteksi.',
            body: 'Pembaruan data resmi dijeda. Rencana Keluarga dan checklist lokal tetap dapat diakses di perangkat ini.',
            icon: WifiOff,
            tone: 'border-border bg-muted text-foreground',
        },
    }[feedState];

    const Icon = config.icon;

    return (
        <div
            role="alert"
            className={`surface-card flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${config.tone}`}
        >
            <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div className="space-y-1">
                    <Badge
                        variant="outline"
                        className="border-current/40 text-xs font-semibold text-current"
                    >
                        {config.badge}
                    </Badge>
                    <p className="text-sm font-semibold">{config.title}</p>
                    <p className="text-xs leading-relaxed opacity-90">
                        {config.body}
                    </p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <Button
                    type="button"
                    size="sm"
                    onClick={onRetry}
                    className="font-semibold"
                >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    <span>Muat Ulang</span>
                </Button>
                <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-current/30 bg-card text-foreground"
                >
                    <a
                        href="https://data.bmkg.go.id/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <span>Portal BMKG</span>
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                </Button>
            </div>
        </div>
    );
}

export function BmkgPartialSkeleton({ label }: { label: string }) {
    return (
        <div
            role="status"
            aria-busy="true"
            aria-label={label}
            className="space-y-3"
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                    {label}
                </span>
                <Badge className="bg-alert-amber-soft text-alert-amber-text">
                    Memuat data BMKG...
                </Badge>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, idx) => (
                    <div
                        key={idx}
                        className="space-y-2 rounded-xl border border-border bg-muted/40 p-3.5"
                    >
                        <Skeleton className="h-3.5 w-16" />
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function InspectorRowsSkeleton() {
    return (
        <div
            role="status"
            aria-busy="true"
            aria-label="Memuat status sumber data BMKG dan instansi resmi"
            className="space-y-2.5"
        >
            {Array.from({ length: 4 }).map((_, idx) => (
                <div
                    key={idx}
                    className="flex items-center justify-between gap-3 py-1"
                >
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            ))}
        </div>
    );
}

export function PublicEmptyState({
    title,
    description,
    actionLabel,
    onAction,
    secondaryNote,
}: {
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
    secondaryNote?: string;
}) {
    return (
        <Card className="border-dashed border-input bg-card">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-verified-soft text-brand-sage-strong">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-foreground">
                    {title}
                </h3>
                <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                    {description}
                </p>
                {secondaryNote && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {secondaryNote}
                    </p>
                )}
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAction}
                    className="mt-4 border-input font-semibold"
                >
                    {actionLabel}
                </Button>
            </CardContent>
        </Card>
    );
}
