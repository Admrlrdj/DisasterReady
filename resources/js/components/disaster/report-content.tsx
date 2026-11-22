import { dateTime } from '@/lib/disaster';
import { Status } from './ui';
import type { ReportDetail } from '@/types/disaster';
export default function ReportContent({ report }: { report: ReportDetail }) {
    return (
        <div className="dr-stack">
            <div className="dr-row">
                <strong>Laporan #{report.id}</strong>
                <Status value={report.status} />
            </div>
            <p className="whitespace-pre-wrap">{report.description}</p>
            <p className="dr-caption dr-muted">
                Diamati: {dateTime(report.observed_at)} · Versi {report.version}
            </p>
            <p className="dr-caption">
                Lokasi privat: {report.latitude}, {report.longitude}
            </p>
            {report.evidence.map((file) => (
                <a
                    key={file.id}
                    href={`/reports/${report.id}/evidence/${file.id}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    <img
                        src={`/reports/${report.id}/evidence/${file.id}`}
                        alt={`Bukti laporan ${report.id}`}
                        className="max-h-64 rounded-xl object-contain"
                    />
                </a>
            ))}
            {report.follow_ups.map((item) => (
                <div key={item.id} className="dr-record">
                    <span className="dr-eyebrow">
                        BUKTI TAMBAHAN · {dateTime(item.created_at)}
                    </span>
                    <p className="whitespace-pre-wrap">
                        {item.description ?? 'Foto tambahan'}
                    </p>
                </div>
            ))}
        </div>
    );
}
