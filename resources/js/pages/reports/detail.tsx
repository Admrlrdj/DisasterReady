import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Cpu, ShieldCheck, Upload } from 'lucide-react';
import type { FormEvent } from 'react';
import ReportContent from '@/components/disaster/report-content';
import {
    Action,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { usePageVariant } from '@/hooks/use-page-variant';
import { dateTime } from '@/lib/disaster';
import type { ReportDetail } from '@/types/disaster';

export default function Detail({
    payload,
}: {
    payload: { data: ReportDetail };
}) {
    const { variant } = usePageVariant();
    const report = payload.data;
    const admin = usePage().url.startsWith('/admin/');
    const form = useForm({
        version: report.version,
        description: '',
        photo: null as File | null,
        privacy_consent: false,
        photo_consent: false,
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({ ...data, version: report.version }));
        form.post(`/my/reports/${report.id}/follow-ups`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <Head title={`Laporan #${report.id}`} />
            <PageHeading
                eyebrow="FR-09 · FR-10 · Rincian Bukti & Jejak Verifikasi Laporan"
                title={`Detail Laporan Warga #${report.id}`}
                description="Teks asli, koordinat privat, dan bukti foto disimpan untuk pemeriksaan manusia yang dapat diaudit."
            >
                <Status value={report.status} />
                <Action variant="outline" size="sm" asChild>
                    <Link
                        href={
                            admin
                                ? `/admin/reports?report=${report.id}`
                                : '/my/reports'
                        }
                    >
                        <ArrowLeft className="size-3.5" aria-hidden="true" />
                        <span>
                            {admin
                                ? 'Buka di Workspace Moderasi'
                                : 'Kembali ke Laporan Saya'}
                        </span>
                    </Link>
                </Action>
            </PageHeading>

            <div
                className={
                    variant === 'b'
                        ? 'grid grid-cols-1 gap-4 lg:grid-cols-12'
                        : 'dr-two-col'
                }
            >
                <Panel
                    className={variant === 'b' ? 'lg:col-span-7' : undefined}
                    title="Isi Laporan & Bukti Lapangan"
                    subtitle="Foto dan koordinat dilindungi kebijakan akses pemilik serta moderator."
                >
                    <ReportContent report={report} />
                </Panel>

                <div
                    className={
                        variant === 'b' ? 'space-y-4 lg:col-span-5' : 'dr-stack'
                    }
                >
                    <Panel
                        title="Riwayat Peninjauan Moderator"
                        subtitle="Setiap keputusan disimpan dalam log audit transaksional"
                    >
                        {report.reviews.length ? (
                            report.reviews.map((review) => (
                                <div
                                    className="dr-record space-y-1.5"
                                    key={review.id}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <Status value={review.decision} />
                                        <small className="text-[11px] text-muted-foreground tabular-nums">
                                            {dateTime(review.created_at)}
                                        </small>
                                    </div>
                                    <p className="text-xs leading-relaxed text-foreground">
                                        {review.reason}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <Notice>
                                <div className="space-y-1">
                                    <p className="font-semibold">
                                        Laporan sedang dalam antrean peninjauan
                                        moderator.
                                    </p>
                                    <p className="inline-flex items-center gap-1.5 text-xs">
                                        <Cpu
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span>
                                            Status Triase AI-01:{' '}
                                            <strong>
                                                {report.analysis_status}
                                            </strong>{' '}
                                            (hasil analisis AI tidak menentukan
                                            verifikasi).
                                        </span>
                                    </p>
                                </div>
                            </Notice>
                        )}
                    </Panel>

                    {report.status === 'NEEDS_EVIDENCE' && !admin && (
                        <Panel
                            title="Lengkapi Bukti Tambahan"
                            subtitle="Moderator meminta keterangan atau foto tambahan sebelum memverifikasi laporan ini."
                        >
                            <form className="dr-form" onSubmit={submit}>
                                <label className="dr-field">
                                    Keterangan tambahan (min. 10 karakter)
                                    <textarea
                                        aria-label="Keterangan tambahan"
                                        className="dr-textarea"
                                        minLength={10}
                                        maxLength={5000}
                                        placeholder="Jelaskan perkembangan terbaru atau rincian lokasi yang diminta moderator..."
                                        value={form.data.description}
                                        onChange={(event) =>
                                            form.setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <label className="dr-upload cursor-pointer">
                                    <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                                        <Upload
                                            className="size-4 text-primary"
                                            aria-hidden="true"
                                        />
                                        <span>
                                            Foto bukti tambahan (opsional ·
                                            JPG/PNG)
                                        </span>
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        onChange={(event) =>
                                            form.setData(
                                                'photo',
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                    />
                                </label>
                                <label className="dr-consent cursor-pointer rounded-xl border border-border/80 bg-background/60 p-3">
                                    <input
                                        type="checkbox"
                                        required
                                        checked={form.data.privacy_consent}
                                        onChange={(event) =>
                                            form.setData(
                                                'privacy_consent',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    <span className="text-xs">
                                        Saya setuju bukti tambahan diproses
                                        untuk peninjauan privat. *
                                    </span>
                                </label>
                                {form.data.photo && (
                                    <label className="dr-consent cursor-pointer rounded-xl border border-primary/40 bg-verified-soft/60 p-3">
                                        <input
                                            type="checkbox"
                                            required
                                            checked={form.data.photo_consent}
                                            onChange={(event) =>
                                                form.setData(
                                                    'photo_consent',
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <span className="text-xs font-semibold">
                                            Saya berhak membagikan foto ini. *
                                        </span>
                                    </label>
                                )}
                                {Object.values(form.errors).map(
                                    (error, index) => (
                                        <p className="dr-error" key={index}>
                                            {error}
                                        </p>
                                    ),
                                )}
                                <Action disabled={form.processing}>
                                    {form.processing
                                        ? 'Mengirim Bukti...'
                                        : 'Kirim Bukti Tambahan'}
                                </Action>
                            </form>
                        </Panel>
                    )}

                    <Panel className="forest" title="Jaminan Privasi Pelapor">
                        <p className="inline-flex items-center gap-1.5 text-xs font-bold text-alert-amber">
                            <ShieldCheck
                                className="size-4"
                                aria-hidden="true"
                            />
                            <span>EXIF Dihapus · Akses Terbatas</span>
                        </p>
                        <p className="text-xs leading-relaxed text-forest-muted">
                            Foto bukti dan koordinat presisi hanya dapat dibuka
                            oleh pemilik laporan serta moderator berwenang,
                            tidak pernah dipublikasikan secara terbuka.
                        </p>
                    </Panel>
                </div>
            </div>
        </>
    );
}
