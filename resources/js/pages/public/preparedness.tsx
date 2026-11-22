import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import {
    dateTime,
    hazardLabels,
    type Contact,
    type Overview,
} from '@/lib/disaster';
import type { Hazard } from '@/types/disaster';
type Guide = {
    id: number;
    title: string;
    content: string;
    official_reference: string;
    reviewed_at: string;
    checklist: string[];
    family_plan: string[];
};
export default function Preparedness({
    overview,
    hazard,
    guides,
}: {
    overview: Overview;
    hazard: Hazard;
    guides: Guide[];
}) {
    const contacts = usePage().props.emergency_contacts as Contact[];
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    return (
        <>
            <Head title="Pusat Kesiapsiagaan" />
            <PageHeading
                title="Pusat Kesiapsiagaan"
                description="Panduan yang ditinjau manusia, dengan rujukan resmi yang dapat dibaca kembali."
            />
            <div className="dr-choices">
                {overview.hazards.map((item) => (
                    <Link
                        key={item.slug}
                        className={`dr-choice ${hazard === item.slug ? 'active' : ''}`}
                        href={`/preparedness/${item.slug}`}
                    >
                        {hazardLabels[item.slug]}
                    </Link>
                ))}
            </div>
            <div className="dr-two-col">
                <div className="dr-stack">
                    <Panel
                        title={`Panduan ${hazardLabels[hazard] ?? 'Kesiapsiagaan'}`}
                    >
                        <Status tone="verified">
                            Publikasi melalui review admin
                        </Status>
                        {guides.length ? (
                            guides.map((guide) => (
                                <article key={guide.id} className="dr-stack">
                                    <h3 className="font-semibold">
                                        {guide.title}
                                    </h3>
                                    <p className="whitespace-pre-wrap">
                                        {guide.content}
                                    </p>
                                    <a
                                        href={guide.official_reference}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="dr-caption underline"
                                    >
                                        Rujukan resmi ↗ · Ditinjau{' '}
                                        {dateTime(guide.reviewed_at)}
                                    </a>
                                    {guide.family_plan.map((item, index) => (
                                        <p key={index} className="dr-caption">
                                            {item}
                                        </p>
                                    ))}
                                </article>
                            ))
                        ) : (
                            <EmptyState title="Panduan belum diterbitkan">
                                Panduan untuk bahaya ini menunggu peninjauan.
                                Gunakan rujukan resmi BNPB dan arahan petugas.
                            </EmptyState>
                        )}
                        {hazard === 'flood' && (
                            <a
                                className="underline"
                                href="https://bpbd.jakarta.go.id/perpustakaan/Y2NRQ0ZDUFBRalMrc3hmK0owd3YwZz09/kesiapsiagaan-menghadapi-banjir-bagi-masyarakat"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Buka panduan banjir BPBD DKI Jakarta ↗
                            </a>
                        )}
                        <a
                            href="https://www.bnpb.go.id/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Buka portal BNPB ↗
                        </a>
                    </Panel>
                    <Panel title="Tanya Panduan Berbasis Sumber">
                        <Status tone="historical">
                            AI-03 · Belum tersedia
                        </Status>
                        <Notice>
                            Pencarian jawaban dari dokumen belum diaktifkan.
                            Sistem tidak akan membuat jawaban tanpa dokumen
                            resmi yang ditinjau.
                        </Notice>
                    </Panel>
                </div>
                <div className="dr-stack">
                    <Panel title="Checklist Kesiapsiagaan">
                        <p className="dr-caption dr-muted">
                            Penanda pribadi selama halaman terbuka. Tidak
                            mengukur keselamatan atau kesiapan resmi.
                        </p>
                        {guides.flatMap((guide) =>
                            guide.checklist.map((item, index) => {
                                const key = `${guide.id}-${index}`;
                                return (
                                    <label className="dr-consent" key={key}>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(checked[key])}
                                            onChange={(event) =>
                                                setChecked({
                                                    ...checked,
                                                    [key]: event.target.checked,
                                                })
                                            }
                                        />
                                        <span>{item}</span>
                                    </label>
                                );
                            }),
                        )}
                        {!guides.some((guide) => guide.checklist.length) && (
                            <EmptyState title="Checklist belum tersedia" />
                        )}
                    </Panel>
                    <Panel className="forest" title="Kontak Darurat Resmi">
                        {contacts.map((contact) => (
                            <div key={contact.phone} className="dr-row">
                                <div>
                                    <strong>{contact.name}</strong>
                                    <p className="dr-caption">
                                        <a
                                            href={contact.source_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Sumber resmi ↗
                                        </a>
                                    </p>
                                </div>
                                <a
                                    className="text-2xl font-bold"
                                    href={`tel:${contact.phone}`}
                                >
                                    {contact.phone}
                                </a>
                            </div>
                        ))}
                        <p className="dr-caption">
                            112 khusus layanan Jakarta. Hubungi layanan sesuai
                            wilayah dan keadaan.
                        </p>
                    </Panel>
                </div>
            </div>
        </>
    );
}
