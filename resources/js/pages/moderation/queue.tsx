import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import ReportContent from '@/components/disaster/report-content';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Pager,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { api, stringValue, type Pagination } from '@/lib/disaster';
import type {
    AiSuggestion,
    DuplicateCandidate,
    IncidentReport,
    ReportDetail,
} from '@/types/disaster';

type Props = {
    payload: Pagination<IncidentReport>;
    selected: ReportDetail | null;
    suggestions: { data: AiSuggestion[]; fallback_state: string } | null;
    duplicates: { data: DuplicateCandidate[] } | null;
};
export default function Queue({
    payload,
    selected,
    suggestions,
    duplicates,
}: Props) {
    const [reason, setReason] = useState('');
    const [decision, setDecision] = useState('NEEDS_EVIDENCE');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const review = async () => {
        if (!selected) return;
        setBusy(true);
        setError('');
        try {
            await api(`/admin/reports/${selected.id}/reviews`, {
                version: selected.version,
                decision,
                reason,
            });
            setReason('');
            router.reload();
        } catch (problem) {
            setError(
                problem instanceof Error
                    ? problem.message
                    : 'Keputusan gagal disimpan.',
            );
        } finally {
            setBusy(false);
        }
    };
    return (
        <>
            <Head title="Moderasi Laporan & AI" />
            <PageHeading
                title="Moderasi Laporan & AI"
                description="Periksa laporan asli, bukti, saran AI, dan kandidat duplikat sebelum memutuskan."
            />
            <Notice>
                Provider AI berupa stub deterministik. Saran dan ranking
                duplikat adalah simulasi; menerima saran tidak memverifikasi
                laporan.
            </Notice>
            <div className="dr-queue">
                <Panel
                    title="Antrean Review"
                    subtitle={`${payload.total} laporan`}
                >
                    <select
                        className="dr-select"
                        aria-label="Filter status laporan"
                        onChange={(event) =>
                            router.get(
                                '/admin/reports',
                                event.target.value
                                    ? { status: event.target.value }
                                    : {},
                            )
                        }
                    >
                        <option value="">Semua status</option>
                        {[
                            'PENDING',
                            'NEEDS_EVIDENCE',
                            'VERIFIED',
                            'REJECTED',
                        ].map((status) => (
                            <option key={status}>{status}</option>
                        ))}
                    </select>
                    {payload.data.map((report) => (
                        <Link
                            preserveScroll
                            className={`dr-record ${selected?.id === report.id ? 'selected' : ''}`}
                            href={`/admin/reports?report=${report.id}`}
                            key={report.id}
                        >
                            <strong>#{report.id}</strong>
                            <p className="line-clamp-3">{report.description}</p>
                            <Status value={report.status} />
                        </Link>
                    ))}
                    {!payload.data.length && (
                        <EmptyState title="Antrean kosong" />
                    )}
                    <Pager page={payload} />
                </Panel>
                <div className="dr-stack">
                    {selected ? (
                        <>
                            <Panel title="Laporan Asli">
                                <ReportContent report={selected} />
                            </Panel>
                            <Panel
                                title="Saran AI-01"
                                aside={
                                    <Status tone="simulation">
                                        Simulasi stub
                                    </Status>
                                }
                            >
                                <span className="dr-caption dr-muted">
                                    Status analisis:{' '}
                                    {suggestions?.fallback_state}
                                </span>
                                {suggestions?.data.length ? (
                                    suggestions.data.map((suggestion) => (
                                        <Suggestion
                                            key={suggestion.id}
                                            suggestion={suggestion}
                                            reportId={selected.id}
                                        />
                                    ))
                                ) : (
                                    <EmptyState title="Saran belum tersedia">
                                        Laporan tetap dapat ditinjau secara
                                        manual.
                                    </EmptyState>
                                )}
                            </Panel>
                            <Panel title="Keputusan Moderator">
                                <form
                                    className="dr-form"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void review();
                                    }}
                                >
                                    <label className="dr-field">
                                        Keputusan
                                        <select
                                            className="dr-select"
                                            value={decision}
                                            onChange={(event) =>
                                                setDecision(event.target.value)
                                            }
                                        >
                                            <option value="NEEDS_EVIDENCE">
                                                Minta bukti tambahan
                                            </option>
                                            <option value="VERIFIED">
                                                Verifikasi laporan
                                            </option>
                                            <option value="REJECTED">
                                                Tolak laporan
                                            </option>
                                        </select>
                                    </label>
                                    <label className="dr-field">
                                        Alasan wajib
                                        <textarea
                                            className="dr-textarea"
                                            minLength={5}
                                            maxLength={2000}
                                            required
                                            value={reason}
                                            onChange={(event) =>
                                                setReason(event.target.value)
                                            }
                                        />
                                    </label>
                                    {error && (
                                        <Notice danger>
                                            {error} Jika versi berubah, muat
                                            ulang laporan sebelum memutuskan.
                                        </Notice>
                                    )}
                                    <Action disabled={busy}>
                                        {busy
                                            ? 'Menyimpan…'
                                            : 'Simpan Keputusan & Audit'}
                                    </Action>
                                    <Action
                                        variant="outline"
                                        type="button"
                                        onClick={() => router.reload()}
                                    >
                                        Muat Ulang Laporan
                                    </Action>
                                </form>
                            </Panel>
                        </>
                    ) : (
                        <Panel>
                            <EmptyState title="Pilih laporan untuk ditinjau" />
                        </Panel>
                    )}
                </div>
                <div className="dr-stack">
                    <Panel title="Kandidat Duplikat · AI-02">
                        <Status tone="simulation">
                            PostGIS + lexical stub
                        </Status>
                        <p className="dr-caption dr-muted">
                            Kandidat tidak digabung otomatis. Bandingkan laporan
                            dan beri keputusan manusia.
                        </p>
                        {selected &&
                            duplicates?.data.map((candidate) => (
                                <Candidate
                                    key={candidate.id}
                                    candidate={candidate}
                                    reportId={selected.id}
                                />
                            ))}
                        {!duplicates?.data.length && (
                            <EmptyState title="Tidak ada kandidat" />
                        )}
                    </Panel>
                    <Panel title="Riwayat Review">
                        {selected?.reviews.map((review) => (
                            <div className="dr-record" key={review.id}>
                                <Status value={review.decision} />
                                <p>{review.reason}</p>
                            </div>
                        ))}
                        {!selected?.reviews.length && (
                            <p className="dr-caption dr-muted">
                                Belum ada keputusan.
                            </p>
                        )}
                    </Panel>
                </div>
            </div>
        </>
    );
}

function Suggestion({
    suggestion,
    reportId,
}: {
    suggestion: AiSuggestion;
    reportId: number;
}) {
    const [decision, setDecision] = useState('ACCEPTED');
    const [reason, setReason] = useState('');
    const [corrected, setCorrected] = useState(
        stringValue(suggestion.suggested_value_json, ''),
    );
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    return (
        <div className="dr-record">
            <div className="dr-row">
                <strong>{suggestion.field_name}</strong>
                <Status tone="warning">{suggestion.review_status}</Status>
            </div>
            <p>
                {stringValue(
                    suggestion.suggested_value_json,
                    'Tidak ada bukti · null',
                )}
            </p>
            <blockquote className="dr-caption dr-muted">
                Bukti teks asli: {suggestion.evidence_span ?? 'Tidak ditemukan'}
            </blockquote>
            {suggestion.review_status === 'UNREVIEWED' && (
                <form
                    className="dr-form"
                    onSubmit={async (event) => {
                        event.preventDefault();
                        setBusy(true);
                        setError('');
                        try {
                            await api(
                                `/admin/reports/${reportId}/ai-feedback`,
                                {
                                    suggestion_id: suggestion.id,
                                    decision,
                                    corrected_value:
                                        decision === 'CORRECTED'
                                            ? corrected === ''
                                                ? null
                                                : suggestion.field_name ===
                                                    'water_depth_cm'
                                                  ? Number(corrected)
                                                  : corrected
                                            : null,
                                    reason,
                                },
                            );
                            router.reload();
                        } catch (problem) {
                            setError(
                                problem instanceof Error
                                    ? problem.message
                                    : 'Gagal menyimpan.',
                            );
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    <select
                        aria-label={`Keputusan saran ${suggestion.field_name}`}
                        className="dr-select"
                        value={decision}
                        onChange={(event) => setDecision(event.target.value)}
                    >
                        <option value="ACCEPTED">Terima saran</option>
                        <option value="CORRECTED">Koreksi saran</option>
                        <option value="REJECTED">Tolak saran</option>
                    </select>
                    {decision === 'CORRECTED' && (
                        <input
                            aria-label="Nilai koreksi; kosong berarti null"
                            className="dr-input"
                            value={corrected}
                            onChange={(event) =>
                                setCorrected(event.target.value)
                            }
                        />
                    )}
                    <input
                        aria-label="Alasan review saran"
                        placeholder="Alasan (min. 5 karakter)"
                        className="dr-input"
                        required
                        minLength={5}
                        maxLength={2000}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                    />
                    {error && <p className="dr-error">{error}</p>}
                    <Action variant="outline" disabled={busy}>
                        Simpan Review Saran
                    </Action>
                </form>
            )}
        </div>
    );
}

function Candidate({
    candidate,
    reportId,
}: {
    candidate: DuplicateCandidate;
    reportId: number;
}) {
    const [reason, setReason] = useState('');
    const [decision, setDecision] = useState('NOT_DUPLICATE');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    return (
        <div className="dr-record">
            <Link
                href={`/admin/reports/${candidate.candidate_report_id}`}
                target="_blank"
                className="font-semibold"
            >
                Bandingkan #{candidate.candidate_report_id} ↗
            </Link>
            <span className="dr-caption">
                Jarak {Math.round(candidate.geo_distance_m)} m · selisih{' '}
                {Math.round(candidate.time_delta_minutes)} menit
            </span>
            {candidate.reviewer_decision ? (
                <Status tone="neutral">{candidate.reviewer_decision}</Status>
            ) : (
                <form
                    className="dr-form"
                    onSubmit={async (event) => {
                        event.preventDefault();
                        setBusy(true);
                        setError('');
                        try {
                            await api(
                                `/admin/reports/${reportId}/duplicate-candidates/${candidate.id}`,
                                { decision, reason },
                            );
                            router.reload();
                        } catch (problem) {
                            setError(
                                problem instanceof Error
                                    ? problem.message
                                    : 'Gagal menyimpan.',
                            );
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    <select
                        aria-label="Keputusan kandidat"
                        className="dr-select"
                        value={decision}
                        onChange={(event) => setDecision(event.target.value)}
                    >
                        <option value="NOT_DUPLICATE">Bukan duplikat</option>
                        <option value="DUPLICATE">Duplikat</option>
                    </select>
                    <input
                        aria-label="Alasan keputusan duplikat"
                        className="dr-input"
                        required
                        minLength={5}
                        maxLength={2000}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Alasan keputusan"
                    />
                    {error && <p className="dr-error">{error}</p>}
                    <Action variant="outline" disabled={busy}>
                        Simpan Keputusan
                    </Action>
                </form>
            )}
        </div>
    );
}
