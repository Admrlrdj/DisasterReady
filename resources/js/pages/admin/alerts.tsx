import { Head, Link } from '@inertiajs/react';
import {
    EmptyState,
    PageHeading,
    Pager,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { dateTime, type Pagination } from '@/lib/disaster';
type Alert = {
    id: number;
    title: string;
    source_time: string;
    expires_at: string | null;
    alert_state?: string;
};
export default function Alerts({ payload }: { payload: Pagination<Alert> }) {
    return (
        <>
            <Head title="Peringatan Resmi" />
            <PageHeading
                title="Peringatan Resmi"
                description="Peringatan bersumber resmi; perubahan pesan dilakukan melalui ingestion sumber."
            />
            <Panel>
                {payload.data.map((alert) => (
                    <Link
                        key={alert.id}
                        className="dr-record"
                        href={`/alerts/${alert.id}`}
                    >
                        <div className="dr-row">
                            <strong>{alert.title}</strong>
                            <Status tone="verified">Sumber resmi</Status>
                        </div>
                        <p className="dr-caption">
                            Terbit {dateTime(alert.source_time)} · Berlaku
                            sampai {dateTime(alert.expires_at)}
                        </p>
                    </Link>
                ))}
                {!payload.data.length && <EmptyState />}
                <Pager page={payload} />
            </Panel>
        </>
    );
}
