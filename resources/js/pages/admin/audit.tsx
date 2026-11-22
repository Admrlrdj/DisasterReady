import { Head } from '@inertiajs/react';
import { ClipboardList, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    EmptyState,
    PageHeading,
    Pager,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { usePageVariant } from '@/hooks/use-page-variant';
import { dateTime, type Pagination } from '@/lib/disaster';

type Audit = {
    id: number;
    actor_id: number | null;
    entity_type: string;
    entity_id: number;
    action: string;
    before_json: string;
    after_json: string;
    created_at: string;
};

export default function AuditPage({ payload }: { payload: Pagination<Audit> }) {
    const { variant } = usePageVariant();
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return payload.data;
        return payload.data.filter(
            (row) =>
                row.action.toLowerCase().includes(q) ||
                row.entity_type.toLowerCase().includes(q) ||
                String(row.entity_id).includes(q) ||
                String(row.actor_id ?? 'sistem').includes(q),
        );
    }, [payload.data, query]);

    return (
        <>
            <Head title="Audit Log Sistem" />
            <PageHeading
                eyebrow="FR-10 · Jejak Audit Keputusan & Operasi Sistem"
                title="Audit Log Sistem"
                description="Catatan transaksional yang tidak dapat diubah untuk setiap keputusan verifikasi moderator, perubahan status adapter, dan pengaturan AI."
            />

            <Panel
                title={`Riwayat Aktivitas Audit (${payload.total} entri)`}
                subtitle="Klik baris aksi untuk memeriksa perbandingan state JSON sebelum dan sesudah perubahan"
                aside={
                    <div className="relative min-w-[220px]">
                        <Search
                            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                            aria-hidden="true"
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Filter aksi, objek, atau aktor..."
                            aria-label="Filter log audit"
                            className="dr-input h-9 rounded-full !pl-9 text-xs"
                        />
                    </div>
                }
            >
                {filtered.length > 0 ? (
                    variant === 'b' ? (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {filtered.map((row) => (
                                <div
                                    key={row.id}
                                    className="dr-record space-y-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                                            <ClipboardList
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                            <span>{row.action}</span>
                                        </span>
                                        <small className="text-[11px] text-muted-foreground tabular-nums">
                                            {dateTime(row.created_at)}
                                        </small>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span>
                                            Objek:{' '}
                                            <strong>
                                                {row.entity_type} #
                                                {row.entity_id}
                                            </strong>
                                        </span>
                                        <Status tone="neutral">
                                            Aktor:{' '}
                                            {row.actor_id
                                                ? `User #${row.actor_id}`
                                                : 'Sistem'}
                                        </Status>
                                    </div>
                                    <details className="rounded-lg border border-border/70 bg-background/70 p-2 text-xs">
                                        <summary className="cursor-pointer font-semibold text-foreground">
                                            Inspeksi Payload JSON
                                        </summary>
                                        <pre className="mt-2 max-h-48 overflow-auto text-[11px] whitespace-pre-wrap text-muted-foreground">
                                            {JSON.stringify(
                                                {
                                                    before: row.before_json,
                                                    after: row.after_json,
                                                },
                                                null,
                                                2,
                                            )}
                                        </pre>
                                    </details>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="dr-table-wrap">
                            <table className="dr-table">
                                <thead>
                                    <tr>
                                        <th>Waktu</th>
                                        <th>Aktor</th>
                                        <th>Objek</th>
                                        <th>Aksi & Perubahan JSON</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => (
                                        <tr key={row.id}>
                                            <td className="tabular-nums">
                                                {dateTime(row.created_at)}
                                            </td>
                                            <td className="tabular-nums">
                                                {row.actor_id
                                                    ? `User #${row.actor_id}`
                                                    : 'Sistem'}
                                            </td>
                                            <td className="font-semibold">
                                                {row.entity_type} #
                                                {row.entity_id}
                                            </td>
                                            <td>
                                                <details>
                                                    <summary className="cursor-pointer font-semibold text-primary">
                                                        {row.action}
                                                    </summary>
                                                    <pre className="mt-1.5 max-w-xl overflow-auto rounded-lg bg-background/80 p-2.5 text-xs whitespace-pre-wrap">
                                                        {JSON.stringify(
                                                            {
                                                                before: row.before_json,
                                                                after: row.after_json,
                                                            },
                                                            null,
                                                            2,
                                                        )}
                                                    </pre>
                                                </details>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    <EmptyState title="Belum ada aktivitas audit yang cocok" />
                )}
                <Pager page={payload} />
            </Panel>
        </>
    );
}
