import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { api, dateTime } from '@/lib/disaster';
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
    simulation_only: boolean;
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
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [reportId, setReportId] = useState('');
    const act = async (url: string, data: Record<string, unknown>) => {
        setBusy(true);
        setMessage('');
        try {
            await api(url, data);
            setMessage(
                'Perubahan diterima. Job antrean memerlukan worker aktif.',
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
            <Head title="Adapter & AI Health" />
            <PageHeading
                title="Adapter & AI Health"
                description="Pantau sumber resmi, sinkronisasi, antrean, dan operasi AI."
            />
            <div className="dr-kpis">
                {[
                    ['Sumber terdaftar', payload.data?.length ?? 0],
                    ['Job antrean', health.pending_jobs],
                    ['Job gagal', health.failed_jobs],
                    ['Token tercatat', health.token_usage],
                ].map(([label, value]) => (
                    <div className="dr-kpi" key={String(label)}>
                        <small>{label}</small>
                        <strong>{value}</strong>
                    </div>
                ))}
            </div>
            {message && <Notice>{message}</Notice>}
            <div className="dr-two-col">
                <div className="dr-stack">
                    <Panel title="Adapter Sumber Resmi">
                        {payload.data?.map((source) => (
                            <div key={source.id} className="dr-record">
                                <div className="dr-row">
                                    <div>
                                        <strong>{source.name}</strong>
                                        <p className="dr-caption dr-muted">
                                            {source.agency} · Sinkronisasi{' '}
                                            {dateTime(source.last_success_at)}
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
                                        onClick={() =>
                                            void act(
                                                `/admin/sources/${source.id}/retry`,
                                                {},
                                            )
                                        }
                                    >
                                        Sinkronkan Ulang
                                    </Action>
                                    <Action
                                        disabled={busy}
                                        variant="outline"
                                        onClick={() =>
                                            void act(
                                                `/admin/sources/${source.id}`,
                                                {
                                                    enabled: !source.enabled,
                                                    freshness_sla:
                                                        source.freshness_sla,
                                                },
                                            )
                                        }
                                    >
                                        {source.enabled
                                            ? 'Nonaktifkan'
                                            : 'Aktifkan'}{' '}
                                        Adapter
                                    </Action>
                                    <span className="dr-caption">
                                        Batas kesegaran {source.freshness_sla}{' '}
                                        detik
                                    </span>
                                </div>
                            </div>
                        ))}
                        {!payload.data?.length && (
                            <EmptyState title="Tidak ada sumber pada tampilan ini" />
                        )}
                    </Panel>
                    <Panel title="Riwayat Sinkronisasi">
                        <div className="dr-table-wrap">
                            <table className="dr-table">
                                <thead>
                                    <tr>
                                        <th>Run</th>
                                        <th>Sumber</th>
                                        <th>Status</th>
                                        <th>Mulai</th>
                                        <th>Kegagalan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payload.recent_runs?.map((run) => (
                                        <tr key={run.id}>
                                            <td>#{run.id}</td>
                                            <td>{run.source_id}</td>
                                            <td>
                                                <Status value={run.status} />
                                            </td>
                                            <td>{dateTime(run.started_at)}</td>
                                            <td>{run.error_code ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </div>
                <div className="dr-stack">
                    <Panel title="Fitur AI">
                        <Status
                            tone={
                                health.simulation_only
                                    ? 'simulation'
                                    : undefined
                            }
                        >
                            {health.simulation_only
                                ? 'Provider stub · simulasi'
                                : 'Provider HTTP'}
                        </Status>
                        <p className="dr-caption">{health.model_version}</p>
                        <div className="dr-source-line">
                            <span>AI-01 Ekstraksi laporan</span>
                            <Status
                                value={
                                    health.enabled ? 'COMPLETED' : 'DISABLED'
                                }
                            />
                        </div>
                        <div className="dr-source-line">
                            <span>AI-02 Kandidat duplikat</span>
                            <Status
                                tone={
                                    health.simulation_only
                                        ? 'simulation'
                                        : undefined
                                }
                            >
                                {health.simulation_only
                                    ? 'Stub + PostGIS'
                                    : 'Embedding + PostGIS'}
                            </Status>
                        </div>
                        <div className="dr-source-line">
                            <span>AI-03 / AI-04</span>
                            <Status value="UNAVAILABLE" />
                        </div>
                        <p className="dr-caption dr-muted">
                            Biaya tercatat: {health.estimated_cost}. Circuit:{' '}
                            {health.circuit_open ? 'terbuka' : 'tertutup'}.
                        </p>
                        {health.runs.map((run) => (
                            <p key={run.status} className="dr-caption">
                                {run.status}: {run.count}
                            </p>
                        ))}
                        {health.feedback.map((item) => (
                            <p key={item.decision} className="dr-caption">
                                Feedback {item.decision}: {item.count}
                            </p>
                        ))}
                    </Panel>
                    <Panel title="Ulangi Analisis Laporan">
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
                                ID laporan
                                <input
                                    className="dr-input"
                                    type="number"
                                    min={1}
                                    step={1}
                                    required
                                    value={reportId}
                                    onChange={(event) =>
                                        setReportId(event.target.value)
                                    }
                                />
                            </label>
                            <Action
                                variant="outline"
                                disabled={busy || !health.enabled}
                            >
                                Antrekan Analisis Ulang
                            </Action>
                            <p className="dr-caption dr-muted">
                                Retry idempoten dan tetap memerlukan worker.
                                Tidak mengubah keputusan verifikasi.
                            </p>
                        </form>
                    </Panel>
                    <Panel className="forest" title="Kontrol Operasional AI">
                        <p>
                            Menonaktifkan AI menghentikan analisis baru. Laporan
                            tetap dapat ditinjau manual.
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
                            {health.enabled
                                ? 'Nonaktifkan Analisis AI'
                                : 'Aktifkan Analisis AI'}
                        </Action>
                    </Panel>
                </div>
            </div>
        </>
    );
}
