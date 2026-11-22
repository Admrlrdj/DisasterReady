import { Link } from '@inertiajs/react';
import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { figmaAssets } from '@/lib/figma-assets';
import { cn } from '@/lib/utils';
import { dateTime, recordLink, statusLabels } from '@/lib/disaster';
import type { Pagination } from '@/lib/disaster';
import type { OfficialRecord } from '@/types/disaster';

export function Brand({
    subtitle = true,
    landing = false,
}: {
    subtitle?: boolean;
    landing?: boolean;
}) {
    return (
        <Link
            href="/"
            className="dr-brand"
            aria-label="DisasterReady — beranda"
        >
            <span className="dr-brand-mark">
                <img
                    src={
                        landing
                            ? figmaAssets['15-58'].imgFrame
                            : figmaAssets['5-14'].imgFrame
                    }
                    alt=""
                />
            </span>
            <span>
                <strong>DisasterReady</strong>
                {subtitle && <small>MULTI-HAZARD · ID</small>}
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
            className={cn('dr-button', className)}
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
    return (
        <Card className={cn('dr-panel', className)}>
            {(title || aside) && (
                <div className="dr-panel-heading">
                    <div>
                        <h2>{title}</h2>
                        {subtitle && (
                            <p className="dr-muted dr-caption">{subtitle}</p>
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
    children,
}: {
    title: string;
    description?: string;
    children?: ReactNode;
}) {
    return (
        <header className="dr-page-heading">
            <div>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {children && <div className="dr-heading-actions">{children}</div>}
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
const icons = {
    verified: 'imgFrame',
    warning: 'imgFrame1',
    historical: 'imgFrame2',
    danger: 'imgFrame4',
    simulation: 'imgFrame5',
    neutral: 'imgFrame2',
} as const;
export function Status({
    children,
    value,
    tone,
}: {
    children?: ReactNode;
    value?: string;
    tone?: Tone;
}) {
    const resolved =
        tone ??
        (['VERIFIED', 'FRESH', 'COMPLETED'].includes(value ?? '')
            ? 'verified'
            : ['REJECTED', 'FAILED', 'CANCELLED'].includes(value ?? '')
              ? 'danger'
              : 'warning');
    return (
        <span className={cn('dr-badge', resolved)}>
            <img src={figmaAssets['14-163'][icons[resolved]]} alt="" />
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
    return (
        <div
            className={cn('dr-notice', danger && 'danger')}
            role={danger ? 'alert' : 'note'}
        >
            <img src={figmaAssets['15-58'].imgFrame1} alt="" />
            <div>{children}</div>
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
            <span className="dr-empty-symbol" aria-hidden="true">
                —
            </span>
            <h3>{title}</h3>
            <p>
                {children ??
                    'Data akan tampil setelah sumber tersedia dan berhasil disinkronkan.'}
            </p>
            {action}
        </div>
    );
}

export function RecordCard({ record }: { record: OfficialRecord }) {
    return (
        <Link href={recordLink(record)} className="dr-record">
            <div className="dr-row">
                <span className="dr-eyebrow">
                    {record.kind === 'alert' ? 'BMKG · CAP' : 'BMKG · GEMPA'}
                </span>
                <Status value={record.alert_state ?? record.source.freshness} />
            </div>
            <h3>{record.title}</h3>
            <p className="dr-muted dr-caption">
                {dateTime(record.source_time)}
            </p>
            <div className="dr-row dr-caption">
                <span>{record.source.attribution}</span>
                <span aria-hidden="true">↗</span>
            </div>
            {record.source.freshness !== 'FRESH' && (
                <span className="dr-caption dr-warning-text">
                    {statusLabels[record.source.freshness]}
                </span>
            )}
        </Link>
    );
}

export function Pager<T>({ page }: { page: Pagination<T> }) {
    return (
        <nav className="dr-pager" aria-label="Navigasi halaman">
            <span>
                {page.total} data · Halaman {page.current_page} dari{' '}
                {page.last_page}
            </span>
            <div className="dr-actions">
                <Action
                    variant="outline"
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
