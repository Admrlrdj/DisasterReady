import { Head, Link } from '@inertiajs/react';
import {
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    RecordCard,
} from '@/components/disaster/ui';
import type { Overview } from '@/lib/disaster';

export default function Feed({ overview }: { overview: Overview }) {
    return (
        <>
            <Head title="Gempa Bumi" />
            <PageHeading
                title="Informasi Gempa Bumi"
                description="Informasi BMKG. Periksa waktu sumber dan masa berlaku."
            />
            <div className="dr-choices">
                <Link className="dr-choice active" href="/earthquakes">
                    Gempa Bumi
                </Link>
                <Link className="dr-choice" href="/weather">
                    Prakiraan Cuaca
                </Link>
            </div>
            <Panel title="Kejadian Gempa Terbaru">
                <Notice>
                    Informasi kedaluwarsa tetap dapat dibaca sebagai riwayat,
                    bukan peringatan aktif.
                </Notice>
                <div className="dr-dashboard-lower">
                    {overview.events.map((record) => (
                        <RecordCard key={record.id} record={record} />
                    ))}
                </div>
                {!overview.events.length && <EmptyState />}
            </Panel>
        </>
    );
}
