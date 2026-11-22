import { Head, Link } from '@inertiajs/react';
import {
    Action,
    EmptyState,
    PageHeading,
    Pager,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { dateTime, type Pagination } from '@/lib/disaster';
import type { IncidentReport } from '@/types/disaster';
export default function Reports({
    payload,
}: {
    payload: Pagination<IncidentReport>;
}) {
    return (
        <>
            <Head title="Laporan Saya" />
            <PageHeading
                title="Riwayat Laporan Saya"
                description="Lihat status review dan tambahkan bukti jika diminta moderator."
            >
                <Action asChild>
                    <Link href="/reports/create">+ Buat Laporan</Link>
                </Action>
            </PageHeading>
            <Panel>
                {payload.data.length ? (
                    payload.data.map((report) => (
                        <Link
                            key={report.id}
                            href={`/my/reports/${report.id}`}
                            className="dr-record"
                        >
                            <div className="dr-row">
                                <strong>Laporan #{report.id}</strong>
                                <Status value={report.status} />
                            </div>
                            <p>{report.description}</p>
                            <span className="dr-caption dr-muted">
                                {dateTime(report.created_at)}
                            </span>
                        </Link>
                    ))
                ) : (
                    <EmptyState title="Belum ada laporan" />
                )}
                <Pager page={payload} />
            </Panel>
        </>
    );
}
