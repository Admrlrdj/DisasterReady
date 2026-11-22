import { Head, router } from '@inertiajs/react';
import { BookOpen, Clock, Edit3, PlusCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { HazardSvgIcon } from '@/components/disaster/hazard-icons';
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
import { api, hazardLabels, type Pagination } from '@/lib/disaster';
import { cn } from '@/lib/utils';
import type { Hazard } from '@/types/disaster';

type Guide = {
    id: number;
    hazard_type_id: number;
    title: string;
    content: string;
    official_reference: string;
    reviewed_at: string | null;
    published: boolean;
    checklist: string | string[] | null;
    family_plan: string | string[] | null;
};

const list = (value: Guide['checklist']) =>
    Array.isArray(value) ? value : value ? (JSON.parse(value) as string[]) : [];

function localReviewTime(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}

export default function Guides({
    payload,
    hazards,
}: {
    payload: Pagination<Guide>;
    hazards: { id: number; slug: Hazard }[];
}) {
    const { variant } = usePageVariant();
    const [editing, setEditing] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [reference, setReference] = useState('');
    const [reviewed, setReviewed] = useState('');
    const [hazard, setHazard] = useState(hazards[0]?.id ?? 0);
    const [published, setPublished] = useState(false);
    const [checklist, setChecklist] = useState('');
    const [family, setFamily] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const resetForm = () => {
        setEditing(null);
        setTitle('');
        setContent('');
        setReference('');
        setReviewed('');
        setPublished(false);
        setChecklist('');
        setFamily('');
        setError('');
    };

    return (
        <>
            <Head title="Editor Panduan & Korpus Kesiapsiagaan" />
            <PageHeading
                eyebrow="FR-08 · Publikasi Panduan Kesiapsiagaan Ber-Review Manusia"
                title="Panduan & Korpus Resmi"
                description="Publikasikan panduan kesiapsiagaan hanya setelah isi dan tautan rujukan HTTPS resminya ditinjau oleh admin."
            >
                {editing !== null && (
                    <Action variant="outline" size="sm" onClick={resetForm}>
                        <PlusCircle className="size-3.5" aria-hidden="true" />
                        <span>Buat Panduan Baru</span>
                    </Action>
                )}
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
                    title={
                        editing
                            ? `Edit Panduan #${editing}`
                            : 'Formulir Buat Panduan Kesiapsiagaan'
                    }
                    subtitle="Pilih jenis bahaya, isi materi panduan, checklist Tas Siaga, dan rujukan HTTPS."
                >
                    <form
                        className="dr-form"
                        onSubmit={async (event) => {
                            event.preventDefault();
                            setBusy(true);
                            setError('');
                            try {
                                await api(
                                    editing
                                        ? `/admin/guides/${editing}`
                                        : '/admin/guides',
                                    {
                                        hazard_type_id: hazard,
                                        title,
                                        content,
                                        official_reference: reference,
                                        reviewed_at: reviewed
                                            ? new Date(reviewed).toISOString()
                                            : null,
                                        published,
                                        checklist: checklist
                                            .split('\n')
                                            .filter(Boolean),
                                        family_plan: family
                                            .split('\n')
                                            .filter(Boolean),
                                    },
                                    editing ? 'PUT' : 'POST',
                                );
                                resetForm();
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
                        <fieldset className="dr-field">
                            <legend className="text-xs font-bold text-foreground">
                                Jenis Bahaya Bencana
                            </legend>
                            <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
                                {hazards.map((item) => {
                                    const active = hazard === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => setHazard(item.id)}
                                            className={cn(
                                                'pressable flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-left text-xs font-semibold transition-colors',
                                                active
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-border/80 bg-background/70 text-foreground hover:bg-secondary/70',
                                            )}
                                        >
                                            <HazardSvgIcon
                                                hazard={item.slug}
                                                className="size-4 shrink-0"
                                            />
                                            <span className="truncate">
                                                {hazardLabels[item.slug]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <label className="dr-field">
                            Judul Panduan *
                            <input
                                className="dr-input"
                                required
                                maxLength={255}
                                placeholder="Contoh: Protokol Evakuasi Banjir DAS Ciliwung"
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                            />
                        </label>

                        <label className="dr-field">
                            Isi Panduan Resmi *
                            <textarea
                                className="dr-textarea"
                                required
                                maxLength={50000}
                                placeholder="Tuliskan langkah pra-bencana, saat bencana, dan pasca-bencana secara terstruktur..."
                                value={content}
                                onChange={(event) =>
                                    setContent(event.target.value)
                                }
                            />
                        </label>

                        <label className="dr-field">
                            Rujukan Resmi HTTPS *
                            <input
                                className="dr-input"
                                type="url"
                                required
                                placeholder="https://www.bnpb.go.id/..."
                                value={reference}
                                onChange={(event) =>
                                    setReference(event.target.value)
                                }
                            />
                        </label>

                        <div className="dr-field">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <label htmlFor="guide-reviewed">
                                    Waktu ditinjau (wajib diisi untuk publikasi)
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setReviewed(
                                            localReviewTime(
                                                new Date().toISOString(),
                                            ),
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
                                id="guide-reviewed"
                                className="dr-input"
                                type="datetime-local"
                                required={published}
                                value={reviewed}
                                onChange={(event) =>
                                    setReviewed(event.target.value)
                                }
                            />
                        </div>

                        <div className="dr-two-col equal">
                            <label className="dr-field">
                                Checklist Tas Siaga (1 item per baris)
                                <textarea
                                    className="dr-textarea"
                                    placeholder="Air minum 72 jam&#10;Dokumen kedap air"
                                    value={checklist}
                                    onChange={(event) =>
                                        setChecklist(event.target.value)
                                    }
                                />
                            </label>
                            <label className="dr-field">
                                Rencana Keluarga (1 item per baris)
                                <textarea
                                    className="dr-textarea"
                                    placeholder="Sepakati titik kumpul RW&#10;Catat nomor darurat 117/112"
                                    value={family}
                                    onChange={(event) =>
                                        setFamily(event.target.value)
                                    }
                                />
                            </label>
                        </div>

                        <label className="dr-consent cursor-pointer rounded-xl border border-border/80 bg-background/60 p-3">
                            <input
                                type="checkbox"
                                checked={published}
                                onChange={(event) =>
                                    setPublished(event.target.checked)
                                }
                            />
                            <span className="text-xs font-semibold">
                                Terbitkan ke halaman publik Pusat Kesiapsiagaan
                                setelah review
                            </span>
                        </label>

                        {error && <Notice danger>{error}</Notice>}

                        <div className="flex flex-wrap gap-2">
                            <Action disabled={busy}>
                                <ShieldCheck
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                <span>
                                    {busy
                                        ? 'Menyimpan...'
                                        : editing
                                          ? 'Simpan Perubahan Panduan'
                                          : 'Simpan Panduan'}
                                </span>
                            </Action>
                            {editing !== null && (
                                <Action
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Batal Edit
                                </Action>
                            )}
                        </div>
                    </form>
                </Panel>

                <div
                    className={
                        variant === 'b' ? 'space-y-4 lg:col-span-5' : 'dr-stack'
                    }
                >
                    <Panel
                        title={`Daftar Panduan Tersimpan (${payload.total})`}
                        subtitle="Klik Edit Panduan untuk memperbarui atau mempublikasikan draf"
                    >
                        {payload.data.map((guide) => {
                            const hzObj = hazards.find(
                                (h) => h.id === guide.hazard_type_id,
                            );
                            return (
                                <div
                                    className="dr-record space-y-2"
                                    key={guide.id}
                                >
                                    <div className="dr-row">
                                        <div className="flex items-center gap-2">
                                            {hzObj && (
                                                <HazardSvgIcon
                                                    hazard={hzObj.slug}
                                                    className="size-4 text-primary"
                                                />
                                            )}
                                            <strong className="text-sm font-bold text-foreground">
                                                {guide.title}
                                            </strong>
                                        </div>
                                        <Status
                                            tone={
                                                guide.published
                                                    ? 'verified'
                                                    : 'neutral'
                                            }
                                        >
                                            {guide.published
                                                ? 'Terbit'
                                                : 'Draf'}
                                        </Status>
                                    </div>
                                    <p className="line-clamp-2 text-xs text-muted-foreground">
                                        {guide.content}
                                    </p>
                                    <Action
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setEditing(guide.id);
                                            setTitle(guide.title);
                                            setContent(guide.content);
                                            setReference(
                                                guide.official_reference,
                                            );
                                            setReviewed(
                                                localReviewTime(
                                                    guide.reviewed_at,
                                                ),
                                            );
                                            setHazard(guide.hazard_type_id);
                                            setPublished(guide.published);
                                            setChecklist(
                                                list(guide.checklist).join(
                                                    '\n',
                                                ),
                                            );
                                            setFamily(
                                                list(guide.family_plan).join(
                                                    '\n',
                                                ),
                                            );
                                        }}
                                    >
                                        <Edit3
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span>Edit Panduan</span>
                                    </Action>
                                </div>
                            );
                        })}
                        {!payload.data.length && (
                            <EmptyState title="Belum ada panduan" />
                        )}
                        <Pager page={payload} />
                    </Panel>

                    <Panel className="forest" title="Status Korpus & RAG AI-03">
                        <div className="flex items-center gap-2">
                            <BookOpen
                                className="size-4 text-alert-amber"
                                aria-hidden="true"
                            />
                            <Status tone="historical">
                                AI-03 Belum Diaktifkan
                            </Status>
                        </div>
                        <p className="text-xs leading-relaxed text-forest-muted">
                            Konten panduan resmi diterbitkan langsung dari
                            database tanpa bergantung pada indeks RAG. Sistem
                            tidak mensimulasikan jumlah dokumen vektor atau skor
                            evaluasi RAG palsu.
                        </p>
                    </Panel>
                </div>
            </div>
        </>
    );
}
