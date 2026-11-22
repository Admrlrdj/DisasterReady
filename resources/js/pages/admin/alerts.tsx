import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, BellRing, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HazardChipBadge } from '@/components/disaster/hazard-icons';
import {
    EmptyState,
    PageHeading,
    Pager,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { usePageVariant } from '@/hooks/use-page-variant';
import { dateTime, type Pagination } from '@/lib/disaster';
import { cn } from '@/lib/utils';

type Alert = {
    id: number;
    title: string;
    source_time: string;
    expires_at: string | null;
    alert_state?: string;
};

export default function Alerts({ payload }: { payload: Pagination<Alert> }) {
    const { variant } = usePageVariant();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return payload.data;
        return payload.data.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                String(item.id).includes(q),
        );
    }, [payload.data, query]);

    return (
        <>
            <Head title="Arsip Peringatan Resmi Database" />
            <PageHeading
                eyebrow="FR-12 · Inspeksi Read-Only Tabel official_alerts"
                title="Arsip Peringatan Resmi (CAP XML)"
                description="Peringatan di halaman ini berasal langsung dari ingestion sumber resmi BMKG dan tidak pernah dimodifikasi oleh moderator maupun AI."
            />

            <Panel
                title={`Tabel Peringatan Resmi (${payload.total} tercatat)`}
                subtitle="Klik salah satu peringatan untuk melihat detail poligon dan provenance"
                aside={
                    <div className="relative min-w-[210px]">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Cari judul atau ID peringatan..."
                            aria-label="Cari peringatan resmi"
                            className="dr-input h-9 rounded-full !pl-9 text-xs"
                        />
                    </div>
                }
            >
                {filtered.length > 0 ? (
                    variant === 'c' ? (
                        <div className="dr-table-wrap">
                            <table className="dr-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Kategori</th>
                                        <th>Judul Peringatan</th>
                                        <th>Terbit</th>
                                        <th>Berlaku Sampai</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((alert) => (
                                        <tr key={alert.id}>
                                            <td className="font-bold tabular-nums">
                                                #{alert.id}
                                            </td>
                                            <td>
                                                <HazardChipBadge
                                                    hazard="extreme_weather"
                                                    showTier={false}
                                                />
                                            </td>
                                            <td>
                                                <Link
                                                    href={`/alerts/${alert.id}`}
                                                    className="font-bold text-foreground hover:text-primary hover:underline"
                                                >
                                                    {alert.title}
                                                </Link>
                                            </td>
                                            <td className="tabular-nums">
                                                {dateTime(alert.source_time)}
                                            </td>
                                            <td className="tabular-nums">
                                                {dateTime(alert.expires_at)}
                                            </td>
                                            <td>
                                                <Status tone="verified">
                                                    Sumber resmi
                                                </Status>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div
                            className={cn(
                                'grid grid-cols-1 gap-3',
                                variant === 'b' && 'md:grid-cols-2',
                            )}
                        >
                            {filtered.map((alert) => (
                                <Link
                                    key={alert.id}
                                    className="dr-record group transition-colors hover:border-primary/45"
                                    href={`/alerts/${alert.id}`}
                                >
                                    <div className="dr-row">
                                        <div className="flex items-center gap-2">
                                            <BellRing
                                                className="size-4 text-status-waspada-text"
                                                aria-hidden="true"
                                            />
                                            <strong className="text-sm font-bold text-foreground group-hover:text-primary">
                                                {alert.title}
                                            </strong>
                                        </div>
                                        <Status tone="verified">
                                            Sumber resmi
                                        </Status>
                                    </div>
                                    <div className="dr-row text-xs text-muted-foreground">
                                        <span className="tabular-nums">
                                            Terbit {dateTime(alert.source_time)}{' '}
                                            · Berlaku sampai{' '}
                                            {dateTime(alert.expires_at)}
                                        </span>
                                        <ArrowUpRight
                                            className="size-3.5 shrink-0"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                ) : (
                    <EmptyState title="Belum ada peringatan resmi tercatat" />
                )}
                <Pager page={payload} />
            </Panel>
        </>
    );
}
