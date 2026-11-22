import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { dateTime, hazardLabels, type Overview } from '@/lib/disaster';
import type { IncidentReport } from '@/types/disaster';
export default function CreateReport({
    overview,
    reports,
}: {
    overview: Overview;
    reports: IncidentReport[];
}) {
    const form = useForm({
        category: '',
        description: '',
        observed_at: '',
        latitude: '',
        longitude: '',
        photo: null as File | null,
        privacy_consent: false,
        photo_consent: false,
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => ({
            ...data,
            category: data.category || null,
            observed_at: data.observed_at
                ? new Date(data.observed_at).toISOString()
                : '',
        }));
        form.post('/reports', { forceFormData: true });
    };
    return (
        <>
            <Head title="Buat Laporan Warga" />
            <PageHeading
                title="Buat Laporan Warga"
                description="Ceritakan yang kamu lihat. Moderator akan memeriksa bukti dan konteks laporan."
            />
            <div className="dr-two-col">
                <Panel
                    title="Informasi Kejadian"
                    subtitle="Field bertanda * wajib diisi."
                >
                    <form className="dr-form" onSubmit={submit}>
                        <fieldset className="dr-field">
                            <legend>Kategori (opsional)</legend>
                            <div className="dr-choices">
                                {overview.hazards.map((hazard) => (
                                    <button
                                        type="button"
                                        className={`dr-choice ${form.data.category === hazard.slug ? 'active' : ''}`}
                                        key={hazard.slug}
                                        onClick={() =>
                                            form.setData(
                                                'category',
                                                form.data.category ===
                                                    hazard.slug
                                                    ? ''
                                                    : hazard.slug,
                                            )
                                        }
                                    >
                                        {hazardLabels[hazard.slug]}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                        <div className="dr-field">
                            <label htmlFor="description">
                                Deskripsi kejadian *
                            </label>
                            <textarea
                                id="description"
                                className="dr-textarea"
                                required
                                minLength={10}
                                maxLength={5000}
                                value={form.data.description}
                                onChange={(event) =>
                                    form.setData(
                                        'description',
                                        event.target.value,
                                    )
                                }
                                placeholder="Apa yang terjadi? Sebutkan lokasi dan kondisi yang benar-benar kamu lihat."
                            />
                        </div>
                        <div className="dr-field">
                            <label htmlFor="observed">
                                Waktu pengamatan * (waktu perangkatmu)
                            </label>
                            <input
                                id="observed"
                                type="datetime-local"
                                className="dr-input"
                                required
                                value={form.data.observed_at}
                                onChange={(event) =>
                                    form.setData(
                                        'observed_at',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="dr-two-col equal">
                            {(['latitude', 'longitude'] as const).map(
                                (field) => (
                                    <div className="dr-field" key={field}>
                                        <label htmlFor={field}>
                                            {field === 'latitude'
                                                ? 'Lintang'
                                                : 'Bujur'}{' '}
                                            *
                                        </label>
                                        <input
                                            id={field}
                                            type="number"
                                            step="any"
                                            min={
                                                field === 'latitude'
                                                    ? -90
                                                    : -180
                                            }
                                            max={
                                                field === 'latitude' ? 90 : 180
                                            }
                                            className="dr-input"
                                            required
                                            value={form.data[field]}
                                            onChange={(event) =>
                                                form.setData(
                                                    field,
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                ),
                            )}
                        </div>
                        <p className="dr-caption dr-muted">
                            Koordinat presisi hanya dapat diakses pemilik dan
                            reviewer berwenang. Periksa koordinat sebelum
                            mengirim.
                        </p>
                        <label className="dr-upload">
                            Foto bukti (opsional) · JPG/PNG, maksimal 5 MB
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
                            <small>
                                Hindari wajah, identitas, dan dokumen pribadi.
                                Metadata foto dihapus oleh server.
                            </small>
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
                            <span>
                                Saya memahami laporan ditinjau moderator dan
                                data diproses sesuai pemberitahuan privasi. *
                            </span>
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
                                <span>
                                    Saya berhak membagikan foto ini untuk
                                    peninjauan privat. *
                                </span>
                            </label>
                        )}
                        {Object.entries(form.errors).map(([field, error]) => (
                            <p className="dr-error" role="alert" key={field}>
                                {error}
                            </p>
                        ))}
                        <Notice>
                            Laporan dikirim dengan status PENDING. Analisis AI
                            berupa simulasi dan tidak memverifikasi laporan.
                        </Notice>
                        <Action type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Mengirim…'
                                : 'Kirim Laporan untuk Ditinjau'}
                        </Action>
                    </form>
                </Panel>
                <div className="dr-stack">
                    <Panel
                        title="Laporan Saya"
                        aside={
                            <Link href="/my/reports" className="dr-caption">
                                Semua ↗
                            </Link>
                        }
                    >
                        {reports.length ? (
                            reports.map((report) => (
                                <Link
                                    className="dr-record"
                                    key={report.id}
                                    href={`/my/reports/${report.id}`}
                                >
                                    <div className="dr-row">
                                        <strong>#{report.id}</strong>
                                        <Status value={report.status} />
                                    </div>
                                    <p className="line-clamp-2">
                                        {report.description}
                                    </p>
                                    <small>{dateTime(report.created_at)}</small>
                                </Link>
                            ))
                        ) : (
                            <EmptyState title="Belum ada laporan" />
                        )}
                    </Panel>
                    <Panel
                        className="forest"
                        title="AI Membantu, Moderator Memutuskan"
                    >
                        <p>
                            Ringkasan dan kandidat duplikat hanya saran. Teks
                            asli, bukti, dan keputusan manusia tetap menjadi
                            dasar peninjauan.
                        </p>
                        <Status tone="simulation">
                            Stub · bukan model AI nyata
                        </Status>
                    </Panel>
                </div>
            </div>
        </>
    );
}
