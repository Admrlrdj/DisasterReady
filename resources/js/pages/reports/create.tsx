import { Head, Link, useForm } from '@inertiajs/react';
import {
    Clock,
    Cpu,
    FilePlus2,
    LocateFixed,
    MapPin,
    ShieldCheck,
    Upload,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { HazardSvgIcon } from '@/components/disaster/hazard-icons';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { usePageVariant } from '@/hooks/use-page-variant';
import { dateTime, hazardLabels, type Overview } from '@/lib/disaster';
import { cn } from '@/lib/utils';
import type { IncidentReport } from '@/types/disaster';

const PILOT_PRESETS = [
    {
        label: 'Kampung Melayu (Pilot)',
        lat: '-6.2241',
        lon: '106.8632',
    },
    {
        label: 'Bidara Cina (Pilot)',
        lat: '-6.2314',
        lon: '106.8661',
    },
] as const;

function currentLocalDateTimeInput(): string {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}

export default function CreateReport({
    overview,
    reports,
}: {
    overview: Overview;
    reports: IncidentReport[];
}) {
    const { variant } = usePageVariant();
    const [gpsNotice, setGpsNotice] = useState('');
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

    const fillDeviceGps = () => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setGpsNotice(
                'Geolokasi browser tidak tersedia. Gunakan preset kelurahan pilot atau isi koordinat manual.',
            );
            return;
        }
        setGpsNotice('Mengambil koordinat GPS perangkat...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                form.setData('latitude', pos.coords.latitude.toFixed(6));
                form.setData('longitude', pos.coords.longitude.toFixed(6));
                setGpsNotice('Koordinat GPS perangkat berhasil diisi.');
            },
            () => {
                setGpsNotice(
                    'Akses GPS ditolak atau gagal. Pilih preset kelurahan pilot atau isi manual.',
                );
            },
            { enableHighAccuracy: true, timeout: 6000 },
        );
    };

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
                eyebrow="FR-09 · Pelaporan Warga Privat & Triase AI"
                title="Buat Laporan Kejadian Warga"
                description="Laporkan kondisi bencana yang Anda amati langsung. Foto disimpan privat tanpa metadata EXIF dan ditinjau moderator manusia."
            >
                <Action variant="outline" size="sm" asChild>
                    <Link href="/my/reports">Riwayat Laporan Saya</Link>
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
                    className={variant === 'b' ? 'lg:col-span-8' : undefined}
                    title="Formulir Informasi Kejadian Lapangan"
                    subtitle="Field bertanda * wajib diisi. Koordinat presisi tidak pernah dibuka ke publik."
                >
                    <form className="dr-form" onSubmit={submit}>
                        <fieldset className="dr-field">
                            <legend className="text-xs font-bold text-foreground">
                                Kategori Bencana (opsional · klik ikon untuk
                                memilih)
                            </legend>
                            <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
                                {overview.hazards.map((hazard) => {
                                    const active =
                                        form.data.category === hazard.slug;
                                    return (
                                        <button
                                            type="button"
                                            aria-pressed={active}
                                            className={cn(
                                                'pressable flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                                active
                                                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                                    : 'border-border/80 bg-background/70 text-foreground hover:bg-secondary/70',
                                            )}
                                            key={hazard.slug}
                                            onClick={() =>
                                                form.setData(
                                                    'category',
                                                    active ? '' : hazard.slug,
                                                )
                                            }
                                        >
                                            <HazardSvgIcon
                                                hazard={hazard.slug}
                                                className="size-4 shrink-0"
                                            />
                                            <span className="truncate">
                                                {hazardLabels[hazard.slug]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="dr-field">
                            <label htmlFor="description">
                                Deskripsi kejadian * (min. 10 karakter)
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
                                placeholder="Contoh: Genangan banjir setinggi sekitar 45 cm di sekitar jalan utama Kampung Melayu, arus air cukup deras."
                            />
                        </div>

                        <div className="dr-field">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <label htmlFor="observed">
                                    Waktu pengamatan * (waktu perangkat Anda)
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        form.setData(
                                            'observed_at',
                                            currentLocalDateTimeInput(),
                                        )
                                    }
                                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                >
                                    <Clock
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>Isi Waktu Sekarang</span>
                                </button>
                            </div>
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

                        <div className="space-y-2 rounded-xl border border-border/80 bg-background/65 p-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                                    <MapPin
                                        className="size-3.5 text-primary"
                                        aria-hidden="true"
                                    />
                                    <span>Koordinat Lokasi Kejadian *</span>
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={fillDeviceGps}
                                        className="pressable inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-full border border-primary/40 bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                                    >
                                        <LocateFixed
                                            className="size-3"
                                            aria-hidden="true"
                                        />
                                        <span>GPS Perangkat</span>
                                    </button>
                                    {PILOT_PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => {
                                                form.setData(
                                                    'latitude',
                                                    preset.lat,
                                                );
                                                form.setData(
                                                    'longitude',
                                                    preset.lon,
                                                );
                                                setGpsNotice(
                                                    `Koordinat ${preset.label} dipilih.`,
                                                );
                                            }}
                                            className="pressable inline-flex min-h-8 cursor-pointer items-center rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-primary/40"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {gpsNotice && (
                                <p
                                    role="status"
                                    className="text-xs font-medium text-primary"
                                >
                                    {gpsNotice}
                                </p>
                            )}

                            <div className="dr-two-col equal">
                                {(['latitude', 'longitude'] as const).map(
                                    (field) => (
                                        <div className="dr-field" key={field}>
                                            <label htmlFor={field}>
                                                {field === 'latitude'
                                                    ? 'Lintang (-90 s/d 90)'
                                                    : 'Bujur (-180 s/d 180)'}{' '}
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
                                                    field === 'latitude'
                                                        ? 90
                                                        : 180
                                                }
                                                className="dr-input tabular-nums"
                                                required
                                                placeholder={
                                                    field === 'latitude'
                                                        ? '-6.2241'
                                                        : '106.8632'
                                                }
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

                            <p className="text-xs text-muted-foreground">
                                Koordinat presisi hanya dapat diakses pemilik
                                laporan dan moderator berwenang.
                            </p>
                        </div>

                        <label className="dr-upload cursor-pointer transition-colors hover:border-primary/50">
                            <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                                <Upload
                                    className="size-4 text-primary"
                                    aria-hidden="true"
                                />
                                <span>
                                    Foto bukti lapangan (opsional) · JPG/PNG,
                                    maksimal 5 MB
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
                            <small className="text-muted-foreground">
                                Hindari foto wajah, identitas, dan dokumen
                                pribadi. Metadata EXIF foto dihapus otomatis
                                oleh server (`PrivatePhotoStorage`).
                            </small>
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
                                Saya memahami laporan ditinjau moderator manusia
                                dan data diproses sesuai pemberitahuan privasi.
                                *
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
                                    Saya berhak membagikan foto ini untuk
                                    peninjauan privat oleh moderator. *
                                </span>
                            </label>
                        )}

                        {Object.entries(form.errors).map(([field, error]) => (
                            <p className="dr-error" role="alert" key={field}>
                                {error}
                            </p>
                        ))}

                        <Notice>
                            Laporan dikirim dengan status PENDING. Ekstraksi
                            AI-01 dan deteksi duplikat AI-02 bersifat
                            simulasi/bantuan dan tidak pernah menggantikan
                            verifikasi manusia.
                        </Notice>

                        <Action type="submit" disabled={form.processing}>
                            <FilePlus2 className="size-4" aria-hidden="true" />
                            <span>
                                {form.processing
                                    ? 'Mengirim Laporan...'
                                    : 'Kirim Laporan untuk Ditinjau'}
                            </span>
                        </Action>
                    </form>
                </Panel>

                <div
                    className={
                        variant === 'b' ? 'space-y-4 lg:col-span-4' : 'dr-stack'
                    }
                >
                    <Panel
                        title="Laporan Terbaru Saya"
                        aside={
                            <Link
                                href="/my/reports"
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                Lihat Semua ↗
                            </Link>
                        }
                    >
                        {reports.length ? (
                            reports.map((report) => (
                                <Link
                                    className="dr-record transition-colors hover:border-primary/45"
                                    key={report.id}
                                    href={`/my/reports/${report.id}`}
                                >
                                    <div className="dr-row">
                                        <strong>Laporan #{report.id}</strong>
                                        <Status value={report.status} />
                                    </div>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                        {report.description}
                                    </p>
                                    <small className="text-[11px] text-muted-foreground tabular-nums">
                                        {dateTime(report.created_at)}
                                    </small>
                                </Link>
                            ))
                        ) : (
                            <EmptyState title="Belum ada laporan terkirim">
                                Laporan yang Anda kirim akan muncul di sini
                                beserta status review moderator.
                            </EmptyState>
                        )}
                    </Panel>

                    <Panel
                        className="forest"
                        title="Alur Triase AI & Moderasi Manusia"
                    >
                        <div className="space-y-2 text-xs">
                            <p className="inline-flex items-center gap-1.5 font-bold text-alert-amber">
                                <Cpu className="size-3.5" aria-hidden="true" />
                                <span>AI Membantu, Manusia Memutuskan</span>
                            </p>
                            <p className="leading-relaxed text-forest-muted">
                                1. Foto bukti di-encode ulang oleh server untuk
                                menghapus metadata lokasi EXIF.
                            </p>
                            <p className="leading-relaxed text-forest-muted">
                                2. Job AI-01 mengekstrak kandidat kategori &
                                tinggi air setelah PII (email/telepon)
                                diredaksi.
                            </p>
                            <p className="leading-relaxed text-forest-muted">
                                3. Job AI-02 mencari kandidat laporan serupa
                                dalam radius PostGIS 1 km / 24 jam.
                            </p>
                            <p className="leading-relaxed text-forest-muted">
                                4. Ringkasan dan kandidat duplikat hanya saran;
                                moderator manusia memeriksa bukti asli dan
                                memutuskan status laporan.
                            </p>
                        </div>
                        <div className="pt-1">
                            <Status tone="simulation">
                                <ShieldCheck
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                <span>Triase Terkawal · Audit Penuh</span>
                            </Status>
                        </div>
                    </Panel>
                </div>
            </div>
        </>
    );
}
