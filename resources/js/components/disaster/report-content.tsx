import { ExternalLink, MapPin, ShieldCheck } from 'lucide-react';
import { HazardChipBadge } from '@/components/disaster/hazard-icons';
import { dateTime, hazardLabels } from '@/lib/disaster';
import type { Hazard, ReportDetail } from '@/types/disaster';
import { Status } from './ui';

export default function ReportContent({ report }: { report: ReportDetail }) {
    const hazardSlug =
        report.category && report.category in hazardLabels
            ? (report.category as Hazard)
            : undefined;

    return (
        <div className="dr-stack">
            <div className="dr-row flex-wrap gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-base font-bold text-foreground">
                        Laporan #{report.id}
                    </strong>
                    {hazardSlug && (
                        <HazardChipBadge hazard={hazardSlug} showTier={false} />
                    )}
                </div>
                <Status value={report.status} />
            </div>

            <div className="rounded-xl border border-border/80 bg-background/75 p-3.5">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {report.description}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-2 rounded-xl border border-border/70 bg-secondary/45 p-3 text-xs sm:grid-cols-2">
                <div>
                    <span className="block text-[11px] text-muted-foreground">
                        Waktu Pengamatan & Versi
                    </span>
                    <strong className="text-foreground tabular-nums">
                        {dateTime(report.observed_at)} · Versi {report.version}
                    </strong>
                </div>
                <div>
                    <span className="block text-[11px] text-muted-foreground">
                        Koordinat Privat (Terlindungi)
                    </span>
                    <strong className="inline-flex items-center gap-1 text-foreground tabular-nums">
                        <MapPin
                            className="size-3.5 text-primary"
                            aria-hidden="true"
                        />
                        <span>
                            {report.latitude}, {report.longitude}
                        </span>
                    </strong>
                </div>
            </div>

            {report.evidence.length > 0 && (
                <div className="space-y-2">
                    <p className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <ShieldCheck
                            className="size-3.5 text-status-normal-text"
                            aria-hidden="true"
                        />
                        <span>
                            Foto Bukti Privat ({report.evidence.length} berkas ·
                            EXIF dihapus server)
                        </span>
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {report.evidence.map((file) => (
                            <a
                                key={file.id}
                                href={`/reports/${report.id}/evidence/${file.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="group relative block overflow-hidden rounded-xl border border-border bg-background/80 p-2"
                            >
                                <img
                                    src={`/reports/${report.id}/evidence/${file.id}`}
                                    alt={`Bukti laporan ${report.id}`}
                                    width={640}
                                    height={360}
                                    className="max-h-64 w-full rounded-lg object-contain outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
                                />
                                <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                                    <span>Buka Ukuran Penuh</span>
                                    <ExternalLink
                                        className="size-3"
                                        aria-hidden="true"
                                    />
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {report.follow_ups.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-foreground">
                        Riwayat Bukti Tambahan ({report.follow_ups.length})
                    </p>
                    {report.follow_ups.map((item) => (
                        <div key={item.id} className="dr-record space-y-1">
                            <span className="dr-eyebrow">
                                BUKTI TAMBAHAN · {dateTime(item.created_at)}
                            </span>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                                {item.description ?? 'Foto bukti tambahan'}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
