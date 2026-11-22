import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Pager,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { api, hazardLabels, type Pagination } from '@/lib/disaster';
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
    return (
        <>
            <Head title="Panduan & Korpus" />
            <PageHeading
                title="Panduan & Korpus Resmi"
                description="Publikasikan panduan setelah isi dan rujukan resminya ditinjau manusia."
            />
            <div className="dr-two-col">
                <Panel
                    title={
                        editing ? `Edit Panduan #${editing}` : 'Buat Panduan'
                    }
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
                                setEditing(null);
                                setTitle('');
                                setContent('');
                                setReference('');
                                setReviewed('');
                                setPublished(false);
                                setChecklist('');
                                setFamily('');
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
                        <label className="dr-field">
                            Jenis bahaya
                            <select
                                className="dr-select"
                                value={hazard}
                                onChange={(event) =>
                                    setHazard(Number(event.target.value))
                                }
                            >
                                {hazards.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {hazardLabels[item.slug]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="dr-field">
                            Judul
                            <input
                                className="dr-input"
                                required
                                maxLength={255}
                                value={title}
                                onChange={(event) =>
                                    setTitle(event.target.value)
                                }
                            />
                        </label>
                        <label className="dr-field">
                            Isi panduan
                            <textarea
                                className="dr-textarea"
                                required
                                maxLength={50000}
                                value={content}
                                onChange={(event) =>
                                    setContent(event.target.value)
                                }
                            />
                        </label>
                        <label className="dr-field">
                            Rujukan resmi HTTPS
                            <input
                                className="dr-input"
                                type="url"
                                required
                                value={reference}
                                onChange={(event) =>
                                    setReference(event.target.value)
                                }
                            />
                        </label>
                        <label className="dr-field">
                            Waktu ditinjau (wajib untuk publikasi)
                            <input
                                className="dr-input"
                                type="datetime-local"
                                required={published}
                                value={reviewed}
                                onChange={(event) =>
                                    setReviewed(event.target.value)
                                }
                            />
                        </label>
                        <label className="dr-field">
                            Checklist (satu item per baris)
                            <textarea
                                className="dr-textarea"
                                value={checklist}
                                onChange={(event) =>
                                    setChecklist(event.target.value)
                                }
                            />
                        </label>
                        <label className="dr-field">
                            Rencana keluarga (satu item per baris)
                            <textarea
                                className="dr-textarea"
                                value={family}
                                onChange={(event) =>
                                    setFamily(event.target.value)
                                }
                            />
                        </label>
                        <label className="dr-consent">
                            <input
                                type="checkbox"
                                checked={published}
                                onChange={(event) =>
                                    setPublished(event.target.checked)
                                }
                            />
                            Terbitkan setelah review
                        </label>
                        {error && <Notice danger>{error}</Notice>}
                        <Action disabled={busy}>Simpan Panduan</Action>
                    </form>
                </Panel>
                <div className="dr-stack">
                    <Panel title="Daftar Panduan">
                        {payload.data.map((guide) => (
                            <div className="dr-record" key={guide.id}>
                                <strong>{guide.title}</strong>
                                <Status
                                    tone={
                                        guide.published ? 'verified' : 'neutral'
                                    }
                                >
                                    {guide.published ? 'Terbit' : 'Draf'}
                                </Status>
                                <Action
                                    variant="outline"
                                    onClick={() => {
                                        setEditing(guide.id);
                                        setTitle(guide.title);
                                        setContent(guide.content);
                                        setReference(guide.official_reference);
                                        setReviewed(
                                            localReviewTime(guide.reviewed_at),
                                        );
                                        setHazard(guide.hazard_type_id);
                                        setPublished(guide.published);
                                        setChecklist(
                                            list(guide.checklist).join('\n'),
                                        );
                                        setFamily(
                                            list(guide.family_plan).join('\n'),
                                        );
                                    }}
                                >
                                    Edit Panduan
                                </Action>
                            </div>
                        ))}
                        {!payload.data.length && (
                            <EmptyState title="Belum ada panduan" />
                        )}
                        <Pager page={payload} />
                    </Panel>
                    <Panel className="forest" title="Korpus & RAG">
                        <Status tone="historical">
                            AI-03 belum diaktifkan
                        </Status>
                        <p>
                            Konten panduan dapat diterbitkan tanpa RAG. Tidak
                            ada jumlah dokumen atau hasil evaluasi yang
                            disimulasikan.
                        </p>
                    </Panel>
                </div>
            </div>
        </>
    );
}
