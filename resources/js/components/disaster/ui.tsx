import { Link } from '@inertiajs/react';
import {
    AlertOctagon,
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Cpu,
    Info,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePageVariant } from '@/hooks/use-page-variant';
import {
    dateTime,
    recordLink,
    statusLabels,
    type Pagination,
} from '@/lib/disaster';
import { cn } from '@/lib/utils';
import type { OfficialRecord } from '@/types/disaster';
import {
    HazardChipBadge,
    inferRecordHazard,
    inferRecordSiagaTier,
} from './hazard-icons';

export function Brand({
    subtitle = true,
}: {
    subtitle?: boolean;
    landing?: boolean;
}) {
    return (
        <Link
            href="/"
            className="dr-brand group focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label="DisasterReady: Beranda"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs transition-transform duration-150 group-hover:scale-[1.02]">
                <AppLogoIcon
                    className="size-5"
                    beaconColor="var(--brand-accent-beacon)"
                />
            </span>
            <span className="min-w-0">
                <strong className="block truncate text-sm font-bold tracking-tight text-foreground">
                    DisasterReady
                </strong>
                {subtitle && (
                    <small className="block truncate text-[10px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                        HYDRO-COMMAND · ID
                    </small>
                )}
            </span>
        </Link>
    );
}

export function Action({
    className,
    variant = 'default',
    ...props
}: ComponentProps<typeof Button>) {
    return (
        <Button
            {...props}
            variant={variant}
            className={cn('dr-button cursor-pointer', className)}
        />
    );
}

export function Panel({
    children,
    title,
    subtitle,
    aside,
    className,
}: {
    children: ReactNode;
    title?: ReactNode;
    subtitle?: ReactNode;
    aside?: ReactNode;
    className?: string;
}) {
    const { variant } = usePageVariant();

    const variantSurface =
        variant === 'b'
            ? 'rounded-xl border-border bg-card/92 shadow-none'
            : variant === 'c'
              ? 'rounded-none border-x-0 border-t-2 border-b border-t-foreground/80 border-b-border bg-card/78 px-0 shadow-none sm:px-5'
              : 'rounded-2xl border-border/80 bg-card/84 shadow-xs backdrop-blur-md';

    return (
        <Card className={cn('dr-panel', variantSurface, className)}>
            {(title || aside) && (
                <div className="dr-panel-heading">
                    <div className="space-y-0.5">
                        <h2 className="heading-section text-base font-bold text-foreground">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {aside}
                </div>
            )}
            {children}
        </Card>
    );
}

export function PageHeading({
    title,
    description,
    eyebrow,
    children,
}: {
    title: string;
    description?: string;
    eyebrow?: string;
    children?: ReactNode;
}) {
    const { variant } = usePageVariant();

    return (
        <header
            className={cn(
                'dr-page-heading',
                variant === 'b' &&
                    'rounded-2xl border border-border/85 bg-card/88 p-4 backdrop-blur-md',
                variant === 'c' && 'border-b-2 border-foreground/85 pb-4',
            )}
        >
            <div className="space-y-1">
                {eyebrow && (
                    <p className="overline-label text-primary">{eyebrow}</p>
                )}
                <h1
                    className={cn(
                        'heading-display font-bold text-foreground',
                        variant === 'c'
                            ? 'text-2xl sm:text-3xl'
                            : 'text-xl sm:text-2xl',
                    )}
                >
                    {title}
                </h1>
                {description && (
                    <p className="prose-pretty max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="dr-heading-actions flex flex-wrap items-center gap-2">
                    {children}
                </div>
            )}
        </header>
    );
}

type Tone =
    | 'verified'
    | 'warning'
    | 'historical'
    | 'danger'
    | 'simulation'
    | 'neutral';

export function Status({
    children,
    value,
    tone,
}: {
    children?: ReactNode;
    value?: string;
    tone?: Tone;
}) {
    const resolved: Tone =
        tone ??
        (['VERIFIED', 'FRESH', 'COMPLETED', 'ACCEPTED'].includes(value ?? '')
            ? 'verified'
            : ['REJECTED', 'FAILED', 'CANCELLED', 'DISPATCH_FAILED'].includes(
                    value ?? '',
                )
              ? 'danger'
              : ['ACTIVE'].includes(value ?? '')
                ? 'warning'
                : ['SIMULATION', 'QUEUED'].includes(value ?? '')
                  ? 'simulation'
                  : 'historical');

    const ToneIcon =
        resolved === 'verified'
            ? CheckCircle2
            : resolved === 'danger'
              ? AlertOctagon
              : resolved === 'warning'
                ? AlertTriangle
                : resolved === 'simulation'
                  ? Cpu
                  : Clock;

    return (
        <span className={cn('dr-badge', resolved)}>
            <ToneIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{children ?? statusLabels[value ?? ''] ?? value}</span>
        </span>
    );
}

export function Notice({
    children,
    danger = false,
}: {
    children: ReactNode;
    danger?: boolean;
}) {
    const Icon = danger ? AlertOctagon : Info;
    return (
        <div
            className={cn('dr-notice', danger && 'danger')}
            role={danger ? 'alert' : 'note'}
        >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="text-xs leading-relaxed">{children}</div>
        </div>
    );
}

export function EmptyState({
    title = 'Belum ada data',
    children,
    action,
}: {
    title?: string;
    children?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="dr-empty">
            <span
                className="inline-flex size-10 items-center justify-center rounded-full bg-secondary text-primary"
                aria-hidden="true"
            >
                <Info className="size-4" />
            </span>
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
                {children ??
                    'Data akan tampil setelah sumber resmi tersedia dan berhasil disinkronkan oleh worker.'}
            </p>
            {action}
        </div>
    );
}

export function RecordCard({ record }: { record: OfficialRecord }) {
    const hazard = inferRecordHazard(record);
    const tier = inferRecordSiagaTier(record);

    return (
        <Link
            href={recordLink(record)}
            className="dr-record group transition-colors hover:border-primary/45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
            <div className="dr-row flex-wrap gap-2">
                <HazardChipBadge hazard={hazard} tier={tier} />
                <Status value={record.alert_state ?? record.source.freshness} />
            </div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-primary">
                {record.title}
            </h3>
            <p className="text-xs text-muted-foreground tabular-nums">
                {dateTime(record.source_time)}
                {record.expires_at
                    ? ` · Sampai ${dateTime(record.expires_at)}`
                    : ''}
            </p>
            <div className="dr-row text-xs text-muted-foreground">
                <span>{record.source.attribution}</span>
                <ArrowUpRight
                    className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                />
            </div>
            {record.source.freshness !== 'FRESH' && (
                <span className="text-[11px] font-semibold text-status-waspada-text">
                    {statusLabels[record.source.freshness]}
                </span>
            )}
        </Link>
    );
}

export function Pager<T>({ page }: { page: Pagination<T> }) {
    return (
        <nav className="dr-pager" aria-label="Navigasi halaman">
            <span className="text-xs text-muted-foreground tabular-nums">
                {page.total} data · Halaman {page.current_page} dari{' '}
                {page.last_page}
            </span>
            <div className="dr-actions">
                <Action
                    variant="outline"
                    size="sm"
                    disabled={!page.prev_page_url}
                    asChild={Boolean(page.prev_page_url)}
                >
                    {page.prev_page_url ? (
                        <Link href={page.prev_page_url} preserveScroll>
                            Sebelumnya
                        </Link>
                    ) : (
                        'Sebelumnya'
                    )}
                </Action>
                <Action
                    variant="outline"
                    size="sm"
                    disabled={!page.next_page_url}
                    asChild={Boolean(page.next_page_url)}
                >
                    {page.next_page_url ? (
                        <Link href={page.next_page_url} preserveScroll>
                            Berikutnya
                        </Link>
                    ) : (
                        'Berikutnya'
                    )}
                </Action>
            </div>
        </nav>
    );
}
