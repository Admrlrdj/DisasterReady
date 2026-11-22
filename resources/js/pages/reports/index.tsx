import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, FilePlus2, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HazardChipBadge } from '@/components/disaster/hazard-icons';
import {
    Action,
    EmptyState,
    PageHeading,
    Pager,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { usePageVariant } from '@/hooks/use-page-variant';
import { dateTime, hazardLabels, type Pagination } from '@/lib/disaster';
import { cn } from '@/lib/utils';
import type { Hazard, IncidentReport } from '@/types/disaster';

const STATUS_FILTERS = [
    ['ALL', 'Semua Status'],
    ['PENDING', 'Menunggu Review'],
    ['NEEDS_EVIDENCE', 'Butuh Bukti'],
    ['VERIFIED', 'Terverifikasi'],
    ['REJECTED', 'Ditolak'],
] as const;

export default function Reports({
    payload,
}: {
    payload: Pagination<IncidentReport>;
}) {
    const { variant } = usePageVariant();
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        return payload.data.filter((item) => {
            if (statusFilter !== 'ALL' && item.status !== statusFilter) {
                return false;
            }
            const q = query.trim().toLowerCase();
            if (!q) return true;
            return (
                String(item.id).includes(q) ||
                item.description.toLowerCase().includes(q) ||
                (item.category ?? '').toLowerCase().includes(q)
            );
        });
    }, [payload.data, query, statusFilter]);

    return (
        <>
            <Head title="Riwayat Laporan Saya" />
            <PageHeading
                eyebrow="FR-09 · Pelacakan Status Laporan Warga"
                title="Riwayat Laporan Saya"
                description="Pantau status peninjauan moderator dan tambahkan bukti tindak lanjut jika diminta (NEEDS_EVIDENCE)."
            >
                <Action size="sm" asChild>
                    <Link href="/reports/create">
                        <FilePlus2 className="size-4" aria-hidden="true" />
                        <span>Buat Laporan Baru</span>
                    </Link>
                </Action>
            </PageHeading>

            {/* Filter & Search Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/85 p-3.5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                <div
                    role="group"
                    aria-label="Filter status laporan saya"
                    className="flex flex-wrap items-center gap-1.5"
                >
                    {STATUS_FILTERS.map(([code, label]) => {
                        const active = statusFilter === code;
                        return (
                            <button
                                key={code}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setStatusFilter(code)}
                                className={cn(
                                    'pressable min-h-8 cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                                    active
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border/80 bg-background/70 text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div className="relative min-w-[200px] sm:max-w-xs">
                    <Search
                        className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari nomor atau isi laporan..."
                        aria-label="Cari laporan saya"
                        className="dr-input h-9 rounded-full !pl-9 text-xs"
                    />
                </div>
            </div>

            <Panel
                title={`Daftar Laporan Terkirim (${filtered.length})`}
                subtitle="Klik laporan untuk melihat riwayat review moderator dan mengunggah bukti tambahan."
            >
                {filtered.length ? (
                    variant === 'c' ? (
                        <div className="dr-table-wrap">
                            <table className="dr-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Kategori</th>
                                        <th>Deskripsi</th>
                                        <th>Status Review</th>
                                        <th>Waktu Kirim</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((report) => {
                                        const hz =
                                            report.category &&
                                            report.category in hazardLabels
                                                ? (report.category as Hazard)
                                                : undefined;
                                        return (
                                            <tr key={report.id}>
                                                <td>
                                                    <Link
                                                        href={`/my/reports/${report.id}`}
                                                        className="font-bold text-primary underline"
                                                    >
                                                        #{report.id}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {hz ? (
                                                        <HazardChipBadge
                                                            hazard={hz}
                                                            showTier={false}
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            Umum
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="max-w-md truncate">
                                                    {report.description}
                                                </td>
                                                <td>
                                                    <Status
                                                        value={report.status}
                                                    />
                                                </td>
                                                <td className="tabular-nums">
                                                    {dateTime(
                                                        report.created_at,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                            {filtered.map((report) => {
                                const hz =
                                    report.category &&
                                    report.category in hazardLabels
                                        ? (report.category as Hazard)
                                        : undefined;
                                return (
                                    <Link
                                        key={report.id}
                                        href={`/my/reports/${report.id}`}
                                        className="dr-record group transition-colors hover:border-primary/45"
                                    >
                                        <div className="dr-row flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <strong className="text-sm font-bold text-foreground group-hover:text-primary">
                                                    Laporan #{report.id}
                                                </strong>
                                                {hz && (
                                                    <HazardChipBadge
                                                        hazard={hz}
                                                        showTier={false}
                                                    />
                                                )}
                                            </div>
                                            <Status value={report.status} />
                                        </div>
                                        <p className="line-clamp-2 text-xs leading-relaxed text-foreground/90">
                                            {report.description}
                                        </p>
                                        <div className="dr-row text-xs text-muted-foreground">
                                            <span className="tabular-nums">
                                                {dateTime(report.created_at)}
                                            </span>
                                            <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                                <span>Detail</span>
                                                <ArrowUpRight
                                                    className="size-3.5"
                                                    aria-hidden="true"
                                                />
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )
                ) : (
                    <EmptyState
                        title={
                            payload.data.length === 0
                                ? 'Belum ada laporan warga yang Anda kirim'
                                : 'Tidak ada laporan pada filter ini'
                        }
                        action={
                            payload.data.length === 0 ? (
                                <Action size="sm" asChild>
                                    <Link href="/reports/create">
                                        Buat Laporan Pertama
                                    </Link>
                                </Action>
                            ) : (
                                <Action
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setStatusFilter('ALL');
                                        setQuery('');
                                    }}
                                >
                                    Reset Filter
                                </Action>
                            )
                        }
                    />
                )}
                <Pager page={payload} />
            </Panel>
        </>
    );
}
