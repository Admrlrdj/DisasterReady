import { Head, Link } from '@inertiajs/react';
import {
    Action,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { dateTime } from '@/lib/disaster';

type VolcanoReport = {
    name: string;
    region: string;
    level: 1 | 2 | 3 | 4;
    observed_from: string;
    observed_until: string;
    source_url: string;
};

const levels = {
    1: 'Level I · Normal',
    2: 'Level II · Waspada',
    3: 'Level III · Siaga',
    4: 'Level IV · Awas',
};

export default function Volcanoes({
    reports,
    selected,
    statusUrl,
}: {
    reports: Record<string, VolcanoReport>;
    selected: string | null;
    statusUrl: string;
}) {
    const title = selected ? reports[selected].name : 'Informasi Gunung Api';

    return (
        <>
            <Head title={title} />
            <PageHeading
                title={title}
                description="Ringkasan laporan pengamatan resmi PVMBG."
            >
                {selected && (
                    <Action variant="outline" asChild>
                        <Link href="/volcanoes">Kembali ke daftar</Link>
                    </Action>
                )}
                <Action asChild>
                    <a href={statusUrl} target="_blank" rel="noreferrer">
                        Cek Status Terkini di MAGMA ↗
                    </a>
                </Action>
            </PageHeading>
            <div className="dr-two-col">
                <Panel
                    title={
                        selected
                            ? 'Laporan pengamatan'
                            : 'Laporan terpilih dari MAGMA'
                    }
                >
                    <Notice>
                        Arsip bertanggal. Periksa MAGMA untuk status dan
                        rekomendasi terkini.
                    </Notice>
                    {Object.entries(reports).map(([id, report]) => (
                        <article className="dr-record" key={id}>
                            <div className="dr-row">
                                <h3>
                                    {selected ? (
                                        report.name
                                    ) : (
                                        <Link
                                            className="underline"
                                            href={`/volcanoes/${id}`}
                                        >
                                            {report.name}
                                        </Link>
                                    )}
                                </h3>
                                <Status tone="historical">
                                    {levels[report.level]} saat laporan
                                </Status>
                            </div>
                            <p>{report.region}</p>
                            <p className="dr-caption dr-muted">
                                Pengamatan {dateTime(report.observed_from)}{' '}
                                sampai {dateTime(report.observed_until)}
                            </p>
                            <a
                                className="dr-caption underline"
                                href={report.source_url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Buka laporan dan rekomendasi PVMBG ↗
                            </a>
                        </article>
                    ))}
                </Panel>
                <div className="dr-stack">
                    <Panel title="Sumber dan cakupan">
                        <p>
                            PVMBG menerbitkan tingkat aktivitas dan rekomendasi
                            melalui MAGMA Indonesia. Laporan di sini mencakup
                            Anak Krakatau, Merapi, dan Semeru pada periode yang
                            dicantumkan.
                        </p>
                        <a
                            className="underline"
                            href={statusUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Lihat daftar nasional di MAGMA ↗
                        </a>
                        <a
                            className="underline"
                            href="https://magma.esdm.go.id/v1/gunung-api/peta-kawasan-rawan-bencana"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Buka peta kawasan rawan bencana ↗
                        </a>
                    </Panel>
                    <Panel title="Kesiapsiagaan">
                        <Link
                            className="underline"
                            href="/preparedness/volcano"
                        >
                            Panduan kesiapsiagaan gunung api
                        </Link>
                    </Panel>
                </div>
            </div>
        </>
    );
}
