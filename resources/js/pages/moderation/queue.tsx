import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Cpu,
    ExternalLink,
    GitCompare,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { HazardChipBadge } from '@/components/disaster/hazard-icons';
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
import { usePageVariant } from '@/hooks/use-page-variant';
import {
    api,
    hazardLabels,
    stringValue,
    type Pagination,
} from '@/lib/disaster';
import { cn } from '@/lib/utils';
import type {
    AiSuggestion,
    DuplicateCandidate,
    Hazard,
    IncidentReport,
    ReportDetail,
} from '@/types/disaster';

type Props = {
    payload: Pagination<IncidentReport>;
    selected: ReportDetail | null;
    suggestions: {
        data: AiSuggestion[];
        fallback_state: string;
        simulation_only: boolean;
    } | null;
    duplicates: {
        data: DuplicateCandidate[];
        method: string;
        simulation_only: boolean;
        fallback_state: string;
    } | null;
};

export default function Queue({
    payload,
    selected,
    suggestions,
    duplicates,
}: Props) {
    const { url } = usePage();
    const { variant } = usePageVariant();
    const currentStatus =
        new URLSearchParams(url.split('?')[1] ?? '').get('status') ?? '';
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
            <Head title="Moderasi Laporan & Triase AI" />
            <PageHeading
                eyebrow="FR-10 · AI-01 · AI-02 · Workspace Moderasi Manusia"
                title="Moderasi Laporan Warga & Triase AI"
                description="Periksa laporan asli, bukti foto privat, saran ekstraksi AI-01, dan kandidat duplikat spasial PostGIS AI-02 sebelum menetapkan keputusan."
            >
                <Action
                    variant="outline"
                    size="sm"
                    onClick={() => router.reload()}
                >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    <span>Muat Ulang Antrean</span>
                </Action>
            </PageHeading>

            <Notice>
                Periksa saran AI-01 dan kandidat duplikat AI-02 terhadap laporan
                asli. Menerima saran AI tidak otomatis memverifikasi laporan;
                verifikasi memerlukan keputusan moderator manusia.
            </Notice>

            <div className={cn('dr-queue', variant === 'c' && 'grid-cols-1')}>
                {/* Left Column: Moderation Queue List */}
                <Panel
                    title="Antrean Laporan"
                    subtitle={`${payload.total} laporan tercatat`}
                >
                    <select
                        className="dr-select"
                        aria-label="Filter status laporan"
                        value={currentStatus}
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
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>

                    <div className="space-y-2">
                        {payload.data.map((report) => {
                            const params = new URLSearchParams();
                            if (currentStatus)
                                params.set('status', currentStatus);
                            params.set('report', String(report.id));
                            const hz =
                                report.category &&
                                report.category in hazardLabels
                                    ? (report.category as Hazard)
                                    : undefined;
                            const isSelected = selected?.id === report.id;

                            return (
                                <Link
                                    preserveScroll
                                    className={cn(
                                        'dr-record block transition-colors',
                                        isSelected && 'selected',
                                    )}
                                    href={`/admin/reports?${params.toString()}`}
                                    key={report.id}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                                        <strong className="text-xs font-bold">
                                            #{report.id}
                                        </strong>
                                        <Status value={report.status} />
                                    </div>
                                    {hz && (
                                        <div className="pt-1">
                                            <HazardChipBadge
                                                hazard={hz}
                                                showTier={false}
                                            />
                                        </div>
                                    )}
                                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                                        {report.description}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>

                    {!payload.data.length && (
                        <EmptyState title="Antrean kosong" />
                    )}
                    <Pager page={payload} />
                </Panel>

                {/* Center Column: Original Report + AI-01 Suggestions + Human Decision Form */}
                <div className="dr-stack">
                    {selected ? (
                        <>
                            <Panel
                                title={`Laporan Asli #${selected.id}`}
                                subtitle="Periksa konsistensi teks, lokasi, dan foto bukti sebelum mengambil keputusan."
                            >
                                <ReportContent report={selected} />
                            </Panel>

                            <Panel
                                title="Saran Ekstraksi AI-01 (Incident Analyzer)"
                                subtitle={`Status pipeline: ${suggestions?.fallback_state ?? selected.analysis_status}`}
                                aside={
                                    suggestions && (
                                        <Status
                                            tone={
                                                suggestions.simulation_only
                                                    ? 'simulation'
                                                    : undefined
                                            }
                                        >
                                            <Cpu
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                            <span>
                                                {suggestions.simulation_only
                                                    ? 'Simulasi Stub'
                                                    : 'Saran Provider'}
                                            </span>
                                        </Status>
                                    )
                                }
                            >
                                {suggestions?.data.length ? (
                                    <div className="space-y-2.5">
                                        {suggestions.data.map((suggestion) => (
                                            <Suggestion
                                                key={suggestion.id}
                                                suggestion={suggestion}
                                                reportId={selected.id}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState title="Saran AI-01 belum tersedia">
                                        Laporan tetap dapat ditinjau dan
                                        diputuskan secara manual oleh moderator.
                                    </EmptyState>
                                )}
                            </Panel>

                            <Panel
                                title="Keputusan Moderator Manusia"
                                subtitle="Keputusan bersifat mengikat, dikunci dengan optimistic locking (version), dan tercatat di audit log."
                            >
                                <form
                                    className="dr-form"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void review();
                                    }}
                                >
                                    <label className="dr-field">
                                        Keputusan Verifikasi
                                        <select
                                            className="dr-select"
                                            value={decision}
                                            onChange={(event) =>
                                                setDecision(event.target.value)
                                            }
                                        >
                                            <option value="NEEDS_EVIDENCE">
                                                Minta bukti tambahan
                                                (NEEDS_EVIDENCE)
                                            </option>
                                            <option value="VERIFIED">
                                                Verifikasi laporan (VERIFIED)
                                            </option>
                                            <option value="REJECTED">
                                                Tolak laporan (REJECTED)
                                            </option>
                                        </select>
                                    </label>
                                    <label className="dr-field">
                                        Alasan keputusan wajib (min. 5 karakter)
                                        <textarea
                                            className="dr-textarea"
                                            minLength={5}
                                            maxLength={2000}
                                            required
                                            placeholder="Tuliskan dasar verifikasi atau alasan penolakan berdasarkan bukti..."
                                            value={reason}
                                            onChange={(event) =>
                                                setReason(event.target.value)
                                            }
                                        />
                                    </label>
                                    {error && (
                                        <Notice danger>
                                            {error} Jika versi berubah (HTTP
                                            409), muat ulang laporan sebelum
                                            memutuskan.
                                        </Notice>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <Action disabled={busy}>
                                            <ShieldAlert
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                            <span>
                                                {busy
                                                    ? 'Menyimpan...'
                                                    : 'Simpan Keputusan & Audit'}
                                            </span>
                                        </Action>
                                        <Action
                                            variant="outline"
                                            type="button"
                                            onClick={() => router.reload()}
                                        >
                                            Muat Ulang Laporan
                                        </Action>
                                    </div>
                                </form>
                            </Panel>
                        </>
                    ) : (
                        <Panel>
                            <EmptyState title="Pilih laporan dari antrean di sebelah kiri untuk mulai meninjau" />
                        </Panel>
                    )}
                </div>

                {/* Right Column: AI-02 Duplicate Candidates + Review History */}
                <div className="dr-stack">
                    <Panel
                        title="Kandidat Duplikat · AI-02"
                        subtitle="Filter spasial PostGIS ST_DWithin 1 km / 24 jam + kemiripan laporan"
                        aside={
                            duplicates && (
                                <Status
                                    tone={
                                        duplicates.simulation_only
                                            ? 'simulation'
                                            : undefined
                                    }
                                >
                                    <GitCompare
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>{duplicates.method}</span>
                                </Status>
                            )
                        }
                    >
                        <p className="text-xs text-muted-foreground">
                            Kandidat tidak pernah digabung otomatis. Bandingkan
                            kedua laporan dan tetapkan keputusan manusia.
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
                            <EmptyState
                                title={
                                    duplicates?.fallback_state === 'FAILED'
                                        ? 'Pemeringkatan belum tersedia'
                                        : 'Tidak ditemukan kandidat duplikat dalam radius 1 km / 24 jam'
                                }
                            />
                        )}
                    </Panel>

                    <Panel
                        title="Riwayat Keputusan Laporan Ini"
                        subtitle="Jejak audit moderator sebelumnya"
                    >
                        {selected?.reviews.map((rev) => (
                            <div className="dr-record space-y-1" key={rev.id}>
                                <Status value={rev.decision} />
                                <p className="text-xs text-foreground">
                                    {rev.reason}
                                </p>
                            </div>
                        ))}
                        {!selected?.reviews.length && (
                            <p className="text-xs text-muted-foreground">
                                Belum ada keputusan moderator untuk laporan ini.
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
        <div className="dr-record space-y-2">
            <div className="dr-row">
                <strong className="text-xs font-bold text-foreground">
                    Field: {suggestion.field_name}
                </strong>
                <Status tone="warning">{suggestion.review_status}</Status>
            </div>
            <p className="text-sm font-semibold text-primary">
                Nilai saran:{' '}
                {stringValue(
                    suggestion.suggested_value_json,
                    'Tidak ada bukti · null',
                )}
            </p>
            <blockquote className="rounded-lg border border-border/80 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                Kutipan bukti teks asli:{' '}
                <span className="font-medium text-foreground">
                    {suggestion.evidence_span ?? 'Tidak ditemukan'}
                </span>
            </blockquote>
            {suggestion.review_status === 'UNREVIEWED' && (
                <form
                    className="dr-form pt-1"
                    onSubmit={async (event) => {
                        event.preventDefault();
                        setBusy(true);
                        setError('');
                        try {
                            let parsedCorrected: string | number | null = null;
                            if (decision === 'CORRECTED') {
                                const trimmed = corrected.trim();
                                if (trimmed === '') {
                                    parsedCorrected = null;
                                } else if (
                                    suggestion.field_name === 'water_depth_cm'
                                ) {
                                    const numeric = Number(
                                        trimmed.replace(',', '.'),
                                    );
                                    if (
                                        !Number.isFinite(numeric) ||
                                        numeric < 0
                                    ) {
                                        throw new Error(
                                            'Masukkan angka kedalaman (cm) yang valid tanpa satuan, contoh: 45.5.',
                                        );
                                    }
                                    parsedCorrected = numeric;
                                } else {
                                    parsedCorrected = trimmed;
                                }
                            }
                            await api(
                                `/admin/reports/${reportId}/ai-feedback`,
                                {
                                    suggestion_id: suggestion.id,
                                    decision,
                                    corrected_value: parsedCorrected,
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
                        placeholder="Alasan review saran (min. 5 karakter)"
                        className="dr-input"
                        required
                        minLength={5}
                        maxLength={2000}
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                    />
                    {error && <p className="dr-error">{error}</p>}
                    <Action variant="outline" size="sm" disabled={busy}>
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
        <div className="dr-record space-y-2">
            <div className="flex items-center justify-between gap-2">
                <Link
                    href={`/admin/reports/${candidate.candidate_report_id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary underline"
                >
                    <span>
                        Bandingkan Laporan #{candidate.candidate_report_id}
                    </span>
                    <ExternalLink className="size-3" aria-hidden="true" />
                </Link>
                <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                    {Math.round(candidate.geo_distance_m)} m ·{' '}
                    {Math.round(candidate.time_delta_minutes)} mnt
                </span>
            </div>

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
                        placeholder="Alasan keputusan (min. 5 karakter)"
                    />
                    {error && <p className="dr-error">{error}</p>}
                    <Action variant="outline" size="sm" disabled={busy}>
                        Simpan Keputusan
                    </Action>
                </form>
            )}
        </div>
    );
}
