import { Head, router } from '@inertiajs/react';
import { Activity, Cpu, Power, RefreshCw, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { usePageVariant } from '@/hooks/use-page-variant';
import { api, dateTime } from '@/lib/disaster';
import { cn } from '@/lib/utils';

type Source = {
    id: number;
    name: string;
    agency: string;
    enabled: boolean;
    freshness_sla: number;
    sync_status: string;
    last_success_at: string | null;
};

type Run = {
    id: number;
    source_id: number;
    status: string;
    started_at: string;
    error_code: string | null;
};

type Health = {
    enabled: boolean;
    provider: string;
    model_version: string;
    pending_jobs: number;
    failed_jobs: number;
    estimated_cost: number;
    token_usage: number;
    circuit_open: boolean;
    runs: { status: string; count: number }[];
    feedback: { decision: string; count: number }[];
};

export default function Sources({
    payload,
    health,
}: {
    payload: { data?: Source[]; recent_runs?: Run[] };
    health: Health;
}) {
    const { variant } = usePageVariant();
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [reportId, setReportId] = useState('');

    const act = async (url: string, data: Record<string, unknown>) => {
        setBusy(true);
        setMessage('');
        try {
            await api(url, data);
            setMessage(
                'Perubahan diterima server. Job sinkronisasi/antrean memerlukan queue worker aktif.',
            );
            router.reload();
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : 'Operasi gagal.',
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <Head title="Adapter Sumber & AI Health" />
            <PageHeading
                eyebrow="FR-11 · Tata Kelola Adapter Sumber Resmi & Kill-Switch AI"
                title="Adapter Sumber Resmi & AI Health"
                description="Kelola status aktivasi adapter BMKG/InaRISK, batas kesegaran (SLA), antrean job, dan sakelar pengaman (kill-switch) pipeline AI."
            >
                <Action
                    variant="outline"
                    size="sm"
                    onClick={() => router.reload()}
                >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    <span>Muat Ulang Status</span>
                </Action>
            </PageHeading>

            <div className="dr-kpis">
                {[
                    ['Sumber Terdaftar', payload.data?.length ?? 0],
                    ['Job Antrean AI', health.pending_jobs],
                    ['Job Gagal', health.failed_jobs],
                    ['Token Stub', health.token_usage],
                ].map(([label, value]) => (
                    <div className="dr-kpi" key={String(label)}>
                        <small>{label}</small>
                        <strong className="tabular-nums">{value}</strong>
                    </div>
                ))}
            </div>

            {message && <Notice>{message}</Notice>}

            <div
                className={
                    variant === 'b'
                        ? 'grid grid-cols-1 gap-4 lg:grid-cols-12'
                        : 'dr-two-col'
                }
            >
                <div
                    className={
                        variant === 'b' ? 'space-y-4 lg:col-span-7' : 'dr-stack'
                    }
                >
                    <Panel
                        title="Adapter Sumber Resmi (BMKG & BNPB InaRISK)"
                        subtitle="Aktifkan adapter lalu jalankan sinkronisasi ulang melalui worker."
                    >
                        <div
                            className={cn(
                                'grid grid-cols-1 gap-3',
                                variant === 'b' && 'md:grid-cols-2',
                            )}
                        >
                            {payload.data?.map((source) => (
                                <div
                                    key={source.id}
                                    className="dr-record space-y-2.5"
                                >
                                    <div className="dr-row">
                                        <div>
                                            <strong className="text-sm font-bold text-foreground">
                                                {source.name}
                                            </strong>
                                            <p className="text-xs text-muted-foreground tabular-nums">
                                                {source.agency} · Sukses:{' '}
                                                {dateTime(
                                                    source.last_success_at,
                                                )}
                                            </p>
                                        </div>
                                        <Status
                                            value={
                                                source.sync_status === 'OK'
                                                    ? 'COMPLETED'
                                                    : source.sync_status
                                            }
                                        />
                                    </div>
                                    <div className="dr-actions">
                                        <Action
                                            disabled={busy || !source.enabled}
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                void act(
                                                    `/admin/sources/${source.id}/retry`,
                                                    {},
                                                )
                                            }
                                        >
                                            <RotateCcw
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                            <span>Sinkronkan Ulang</span>
                                        </Action>
                                        <Action
                                            disabled={busy}
                                            variant={
                                                source.enabled
                                                    ? 'outline'
                                                    : 'default'
                                            }
                                            size="sm"
                                            onClick={() =>
                                                void act(
                                                    `/admin/sources/${source.id}`,
                                                    {
                                                        enabled:
                                                            !source.enabled,
                                                        freshness_sla:
                                                            source.freshness_sla,
                                                    },
                                                )
                                            }
                                        >
                                            <Power
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                            <span>
                                                {source.enabled
                                                    ? 'Nonaktifkan'
                                                    : 'Aktifkan'}{' '}
                                                Adapter
                                            </span>
                                        </Action>
                                    </div>
                                    <span className="block text-[11px] text-muted-foreground tabular-nums">
                                        Batas kesegaran (SLA):{' '}
                                        {source.freshness_sla} detik
                                    </span>
                                </div>
                            ))}
                        </div>
                        {!payload.data?.length && (
                            <EmptyState title="Tidak ada sumber pada tampilan ini" />
                        )}
                    </Panel>

                    <Panel
                        title="Riwayat Eksekusi Sinkronisasi (Ingestion Runs)"
                        subtitle="Log eksekusi terbaru IngestSourceJob"
                    >
                        <div className="dr-table-wrap">
                            <table className="dr-table">
                                <thead>
                                    <tr>
                                        <th>Run</th>
                                        <th>ID Sumber</th>
                                        <th>Status</th>
                                        <th>Waktu Mulai</th>
                                        <th>Kode Kegagalan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payload.recent_runs?.map((run) => (
                                        <tr key={run.id}>
                                            <td className="font-bold tabular-nums">
                                                #{run.id}
                                            </td>
                                            <td className="tabular-nums">
                                                Sumber #{run.source_id}
                                            </td>
                                            <td>
                                                <Status value={run.status} />
                                            </td>
                                            <td className="tabular-nums">
                                                {dateTime(run.started_at)}
                                            </td>
                                            <td className="tabular-nums">
                                                {run.error_code ?? '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!payload.recent_runs?.length && (
                            <EmptyState title="Belum ada riwayat sinkronisasi" />
                        )}
                    </Panel>
                </div>

                <div
                    className={
                        variant === 'b' ? 'space-y-4 lg:col-span-5' : 'dr-stack'
                    }
                >
                    <Panel
                        title="Telemetri Pipeline AI"
                        subtitle={`Model: ${health.model_version}`}
                        aside={
                            <Status tone="simulation">
                                <Cpu className="size-3.5" aria-hidden="true" />
                                <span>Provider Stub</span>
                            </Status>
                        }
                    >
                        <div className="dr-source-line">
                            <span className="text-xs font-semibold">
                                AI-01 Ekstraksi Laporan (Incident Analyzer)
                            </span>
                            <Status
                                value={
                                    health.enabled ? 'COMPLETED' : 'DISABLED'
                                }
                            />
                        </div>
                        <div className="dr-source-line">
                            <span className="text-xs font-semibold">
                                AI-02 Kandidat Duplikat (PostGIS + Jaccard)
                            </span>
                            <Status tone="simulation">Stub + PostGIS</Status>
                        </div>
                        <div className="dr-source-line">
                            <span className="text-xs font-semibold">
                                AI-03 RAG / AI-04 Vision
                            </span>
                            <Status value="UNAVAILABLE" />
                        </div>

                        <div className="rounded-xl border border-border/75 bg-background/70 p-3 text-xs">
                            <p className="text-muted-foreground tabular-nums">
                                Biaya tercatat: {health.estimated_cost} ·
                                Circuit Breaker:{' '}
                                <strong className="text-foreground">
                                    {health.circuit_open
                                        ? 'Terbuka (Trip)'
                                        : 'Tertutup (Normal)'}
                                </strong>
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <div>
                                    <span className="block text-[11px] font-bold text-foreground">
                                        Distribusi Run:
                                    </span>
                                    {health.runs.map((run) => (
                                        <p
                                            key={run.status}
                                            className="text-[11px] text-muted-foreground tabular-nums"
                                        >
                                            {run.status}: {run.count}
                                        </p>
                                    ))}
                                </div>
                                <div>
                                    <span className="block text-[11px] font-bold text-foreground">
                                        Feedback Moderator:
                                    </span>
                                    {health.feedback.map((item) => (
                                        <p
                                            key={item.decision}
                                            className="text-[11px] text-muted-foreground tabular-nums"
                                        >
                                            {item.decision}: {item.count}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <Panel
                        title="Antrekan Analisis Ulang Laporan"
                        subtitle="Dispatch ulang AnalyzeIncidentJob secara idempoten"
                    >
                        <form
                            className="dr-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                void act(
                                    `/admin/reports/${Number(reportId)}/ai-retry`,
                                    {},
                                );
                            }}
                        >
                            <label className="dr-field">
                                Nomor ID Laporan
                                <input
                                    className="dr-input tabular-nums"
                                    type="number"
                                    min={1}
                                    step={1}
                                    required
                                    placeholder="Contoh: 1"
                                    value={reportId}
                                    onChange={(event) =>
                                        setReportId(event.target.value)
                                    }
                                />
                            </label>
                            <Action
                                variant="outline"
                                size="sm"
                                disabled={busy || !health.enabled}
                            >
                                <Activity
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                <span>Antrekan Analisis Ulang</span>
                            </Action>
                            <p className="text-xs text-muted-foreground">
                                Retry memerlukan queue worker aktif dan tidak
                                mengubah keputusan verifikasi moderator.
                            </p>
                        </form>
                    </Panel>

                    <Panel
                        className="forest"
                        title="Sakelar Pengaman Operasional AI (Kill Switch)"
                    >
                        <p className="text-xs leading-relaxed text-forest-muted">
                            Menonaktifkan AI akan menghentikan seluruh job
                            analisis otomatis baru. Pelaporan warga dan moderasi
                            manual tetap berjalan normal.
                        </p>
                        <Action
                            className="amber"
                            disabled={busy}
                            onClick={() =>
                                void act('/admin/ai/settings', {
                                    enabled: !health.enabled,
                                })
                            }
                        >
                            <Power className="size-4" aria-hidden="true" />
                            <span>
                                {health.enabled
                                    ? 'Nonaktifkan Analisis AI'
                                    : 'Aktifkan Analisis AI'}
                            </span>
                        </Action>
                    </Panel>
                </div>
            </div>
        </>
    );
}
