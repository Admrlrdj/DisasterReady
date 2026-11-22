import { Head } from '@inertiajs/react';
import {
    EmptyState,
    PageHeading,
    Pager,
    Panel,
} from '@/components/disaster/ui';
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
    return (
        <>
            <Head title="Audit Log" />
            <PageHeading
                title="Audit Log"
                description="Jejak keputusan, perubahan sumber, dan operasi sistem. Akses khusus admin."
            />
            <Panel title="Riwayat Aktivitas">
                <div className="dr-table-wrap">
                    <table className="dr-table">
                        <thead>
                            <tr>
                                <th>Waktu</th>
                                <th>Aktor</th>
                                <th>Objek</th>
                                <th>Aksi & Perubahan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payload.data.map((row) => (
                                <tr key={row.id}>
                                    <td>{dateTime(row.created_at)}</td>
                                    <td>{row.actor_id ?? 'Sistem'}</td>
                                    <td>
                                        {row.entity_type} #{row.entity_id}
                                    </td>
                                    <td>
                                        <details>
                                            <summary>{row.action}</summary>
                                            <pre className="max-w-xl overflow-auto text-xs whitespace-pre-wrap">
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
                {!payload.data.length && (
                    <EmptyState title="Belum ada aktivitas" />
                )}
                <Pager page={payload} />
            </Panel>
        </>
    );
}
