import { Head, Link, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import ReportContent from '@/components/disaster/report-content';
import {
    Action,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { dateTime } from '@/lib/disaster';
import type { ReportDetail } from '@/types/disaster';
export default function Detail({
    payload,
}: {
    payload: { data: ReportDetail };
}) {
    const report = payload.data;
    const {
        url,
        props: { photoMaxKb },
    } = usePage<{ photoMaxKb: number }>();
    const admin = url.startsWith('/admin/');
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
                title={`Detail Laporan #${report.id}`}
                description="Teks asli dan bukti disimpan untuk pemeriksaan manusia."
            >
                <Action variant="outline" asChild>
                    <Link
                        href={
                            admin
                                ? `/admin/reports?report=${report.id}`
                                : '/my/reports'
                        }
                    >
                        {admin ? 'Buka Moderasi' : '← Laporan Saya'}
                    </Link>
                </Action>
            </PageHeading>
            <div className="dr-two-col">
                <Panel title="Laporan & Bukti">
                    <ReportContent report={report} />
                </Panel>
                <div className="dr-stack">
                    <Panel title="Riwayat Peninjauan">
                        {report.reviews.length ? (
                            report.reviews.map((review) => (
                                <div className="dr-record" key={review.id}>
                                    <Status value={review.decision} />
                                    <p>{review.reason}</p>
                                    <small>{dateTime(review.created_at)}</small>
                                </div>
                            ))
                        ) : (
                            <Notice>
                                Laporan menunggu peninjauan. Status AI:{' '}
                                {report.analysis_status}. Hasil analisis tidak
                                menentukan verifikasi.
                            </Notice>
                        )}
                    </Panel>
                    {report.status === 'NEEDS_EVIDENCE' && !admin && (
                        <Panel title="Lengkapi Bukti">
                            <form className="dr-form" onSubmit={submit}>
                                <label className="dr-field">
                                    Keterangan tambahan
                                    <textarea
                                        aria-label="Keterangan tambahan"
                                        className="dr-textarea"
                                        minLength={10}
                                        maxLength={5000}
                                        value={form.data.description}
                                        onChange={(event) =>
                                            form.setData(
                                                'description',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                                <label className="dr-upload">
                                    Foto tambahan (opsional) · maksimal{' '}
                                    {photoMaxKb / 1024} MB
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        onChange={(event) => {
                                            const photo =
                                                event.target.files?.[0] ?? null;
                                            if (
                                                photo &&
                                                photo.size > photoMaxKb * 1024
                                            ) {
                                                form.setData('photo', null);
                                                form.setError(
                                                    'photo',
                                                    `Ukuran foto maksimal ${photoMaxKb / 1024} MB.`,
                                                );
                                            } else {
                                                form.setData('photo', photo);
                                                form.clearErrors('photo');
                                            }
                                        }}
                                    />
                                </label>
                                <label className="dr-consent">
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
                                    Saya setuju bukti tambahan diproses untuk
                                    peninjauan privat.
                                </label>
                                {form.data.photo && (
                                    <label className="dr-consent">
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
                                        Saya berhak membagikan foto ini.
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
                                    Kirim Bukti Tambahan
                                </Action>
                            </form>
                        </Panel>
                    )}
                    <Panel className="forest" title="Privasi Tetap Dijaga">
                        <p>
                            Foto dan lokasi presisi hanya untuk pemilik laporan
                            serta reviewer berwenang.
                        </p>
                    </Panel>
                </div>
            </div>
        </>
    );
}
