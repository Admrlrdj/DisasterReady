import { Head, Link, usePage } from '@inertiajs/react';
import {
    CheckSquare,
    ExternalLink,
    PhoneCall,
    Printer,
    ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { HAZARD_META, HazardSvgIcon } from '@/components/disaster/hazard-icons';
import {
    Action,
    EmptyState,
    Notice,
    PageHeading,
    Panel,
    Status,
} from '@/components/disaster/ui';
import { usePageVariant } from '@/hooks/use-page-variant';
import {
    dateTime,
    hazardLabels,
    type Contact,
    type Overview,
} from '@/lib/disaster';
import { cn } from '@/lib/utils';
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

const CHECKLIST_STORAGE_KEY = 'disasterready_public_checklist_v2';
const FAMILY_PLAN_STORAGE_KEY = 'disasterready_family_plan_v1';

const DEFAULT_CHECKLIST = [
    'Air minum & makanan siap saji untuk minimal 72 jam',
    'Salinan dokumen penting keluarga dalam kantong kedap air',
    'Kotak P3K, obat rutin harian, dan masker pelindung',
    'Senter LED, baterai cadangan, peluit darurat, dan powerbank penuh',
    'Pakaian ganti, jas hujan, selimut darurat, dan uang tunai secukupnya',
];

export default function Preparedness({
    overview,
    hazard,
    guides,
}: {
    overview: Overview;
    hazard: Hazard;
    guides: Guide[];
}) {
    const { variant } = usePageVariant();
    const contacts = (usePage().props.emergency_contacts ?? []) as Contact[];
    const [checked, setChecked] = useState<Record<string, boolean>>({});
    const [plan, setPlan] = useState({
        primaryPoint: '',
        backupPoint: '',
        outOfTownContact: '',
        specialNeeds: '',
    });
    const [savedTime, setSavedTime] = useState<string | null>(null);

    useEffect(() => {
        try {
            const rawChecks = window.localStorage.getItem(
                CHECKLIST_STORAGE_KEY,
            );
            if (rawChecks) setChecked(JSON.parse(rawChecks));
            const rawPlan = window.localStorage.getItem(
                FAMILY_PLAN_STORAGE_KEY,
            );
            if (rawPlan) setPlan(JSON.parse(rawPlan));
        } catch {
            // Ignore restricted storage
        }
    }, []);

    const toggleItem = (key: string, nextVal: boolean) => {
        setChecked((prev) => {
            const updated = { ...prev, [key]: nextVal };
            try {
                window.localStorage.setItem(
                    CHECKLIST_STORAGE_KEY,
                    JSON.stringify(updated),
                );
            } catch {
                // Ignore storage errors
            }
            return updated;
        });
    };

    const savePlan = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            window.localStorage.setItem(
                FAMILY_PLAN_STORAGE_KEY,
                JSON.stringify(plan),
            );
            setSavedTime(
                new Intl.DateTimeFormat('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                }).format(new Date()),
            );
        } catch {
            // Ignore storage errors
        }
    };

    const serverChecklist = guides.flatMap((guide) =>
        guide.checklist.map((item, index) => ({
            key: `${guide.id}-${index}`,
            label: item,
        })),
    );
    const activeChecklist =
        serverChecklist.length > 0
            ? serverChecklist
            : DEFAULT_CHECKLIST.map((item, idx) => ({
                  key: `default-${hazard}-${idx}`,
                  label: item,
              }));

    const completedCount = activeChecklist.filter((i) =>
        Boolean(checked[i.key]),
    ).length;
    const hazardMeta = HAZARD_META[hazard] ?? HAZARD_META.flood;

    return (
        <>
            <Head
                title={`Pusat Kesiapsiagaan · ${hazardLabels[hazard] ?? 'Multi-Bahaya'}`}
            />
            <PageHeading
                eyebrow="FR-08 · Korpus Panduan Terverifikasi & Rencana Keluarga"
                title={`Pusat Kesiapsiagaan: ${hazardMeta.label}`}
                description="Panduan yang telah ditinjau manusia disertai rujukan HTTPS instansi resmi, checklist Tas Siaga 72 jam, serta rencana darurat keluarga offline-ready."
            >
                <Action
                    variant="outline"
                    size="sm"
                    onClick={() => window.print()}
                >
                    <Printer className="size-3.5" aria-hidden="true" />
                    <span>Cetak Panduan & Rencana</span>
                </Action>
            </PageHeading>

            {/* 7 Custom SVG Hazard Selector Bar */}
            <div
                role="navigation"
                aria-label="Pilih kategori bencana kesiapsiagaan"
                className="grid grid-cols-2 gap-2 rounded-2xl border border-border/80 bg-card/85 p-3 backdrop-blur-md sm:grid-cols-4 lg:grid-cols-7"
            >
                {overview.hazards.map((item) => {
                    const isCurrent = hazard === item.slug;
                    return (
                        <Link
                            key={item.slug}
                            href={`/preparedness/${item.slug}`}
                            aria-current={isCurrent ? 'page' : undefined}
                            className={cn(
                                'pressable flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                isCurrent
                                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                                    : 'border-border/80 bg-background/70 text-foreground hover:bg-secondary/75',
                            )}
                        >
                            <HazardSvgIcon
                                hazard={item.slug}
                                className="size-4 shrink-0"
                            />
                            <span className="truncate">
                                {hazardLabels[item.slug]}
                            </span>
                        </Link>
                    );
                })}
            </div>

            <div
                className={
                    variant === 'b'
                        ? 'grid grid-cols-1 gap-4 lg:grid-cols-12'
                        : 'dr-two-col'
                }
            >
                <div
                    className={
                        variant === 'b' ? 'space-y-4 lg:col-span-7' : 'dr-stack'
                    }
                >
                    <Panel
                        title={`Panduan Resmi ${hazardLabels[hazard] ?? 'Kesiapsiagaan'}`}
                        subtitle={`${hazardMeta.agency} · ${hazardMeta.description}`}
                        aside={<Status tone="verified">Ditinjau Admin</Status>}
                    >
                        {guides.length ? (
                            guides.map((guide) => (
                                <article
                                    key={guide.id}
                                    className="dr-record space-y-3"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-base font-bold text-foreground">
                                            {guide.title}
                                        </h3>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            Ditinjau{' '}
                                            {dateTime(guide.reviewed_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                                        {guide.content}
                                    </p>
                                    {guide.family_plan.length > 0 && (
                                        <div className="space-y-1.5 rounded-xl border border-border/70 bg-background/70 p-3">
                                            <strong className="block text-xs text-foreground">
                                                Langkah Rencana Keluarga:
                                            </strong>
                                            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                                                {guide.family_plan.map(
                                                    (item, index) => (
                                                        <li key={index}>
                                                            {item}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                    <a
                                        href={guide.official_reference}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline"
                                    >
                                        <span>Buka Dokumen Rujukan Resmi</span>
                                        <ExternalLink
                                            className="size-3"
                                            aria-hidden="true"
                                        />
                                    </a>
                                </article>
                            ))
                        ) : (
                            <EmptyState title="Panduan kategori ini menunggu publikasi admin">
                                Panduan resmi untuk{' '}
                                {hazardLabels[hazard] ?? hazard} sedang dalam
                                antrean peninjauan manusia. Gunakan protokol
                                standar Tas Siaga 72 jam serta rujukan resmi
                                BNPB dan BPBD di bawah ini.
                            </EmptyState>
                        )}

                        <div className="flex flex-wrap gap-2 pt-1">
                            {hazard === 'flood' && (
                                <Action variant="outline" size="sm" asChild>
                                    <a
                                        href="https://bpbd.jakarta.go.id/perpustakaan/Y2NRQ0ZDUFBRalMrc3hmK0owd3YwZz09/kesiapsiagaan-menghadapi-banjir-bagi-masyarakat"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <span>Panduan Banjir BPBD DKI</span>
                                        <ExternalLink
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </a>
                                </Action>
                            )}
                            <Action variant="outline" size="sm" asChild>
                                <a
                                    href="https://www.bnpb.go.id/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <span>Portal Resmi BNPB</span>
                                    <ExternalLink
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                </a>
                            </Action>
                        </div>
                    </Panel>

                    {/* LocalStorage Offline-Ready Family Emergency Plan Form */}
                    <Panel
                        title="Rencana Darurat Keluarga (Tersimpan Lokal / Offline)"
                        subtitle="Disimpan di LocalStorage perangkat Anda agar tetap terbaca saat sinyal seluler terganggu."
                    >
                        <form className="dr-form" onSubmit={savePlan}>
                            <div className="dr-field">
                                <label htmlFor="prep-primary-point">
                                    Titik kumpul keluarga utama (dekat rumah)
                                </label>
                                <input
                                    id="prep-primary-point"
                                    className="dr-input"
                                    value={plan.primaryPoint}
                                    onChange={(e) =>
                                        setPlan((p) => ({
                                            ...p,
                                            primaryPoint: e.target.value,
                                        }))
                                    }
                                    placeholder="Contoh: Halaman Masjid RW 04 atau Lapangan Kelurahan"
                                />
                            </div>
                            <div className="dr-field">
                                <label htmlFor="prep-backup-point">
                                    Titik kumpul cadangan (di luar zona rawan)
                                </label>
                                <input
                                    id="prep-backup-point"
                                    className="dr-input"
                                    value={plan.backupPoint}
                                    onChange={(e) =>
                                        setPlan((p) => ({
                                            ...p,
                                            backupPoint: e.target.value,
                                        }))
                                    }
                                    placeholder="Contoh: Rumah kerabat di kecamatan aman"
                                />
                            </div>
                            <div className="dr-two-col equal">
                                <div className="dr-field">
                                    <label htmlFor="prep-contact">
                                        Kontak darurat luar kota
                                    </label>
                                    <input
                                        id="prep-contact"
                                        className="dr-input"
                                        value={plan.outOfTownContact}
                                        onChange={(e) =>
                                            setPlan((p) => ({
                                                ...p,
                                                outOfTownContact:
                                                    e.target.value,
                                            }))
                                        }
                                        placeholder="Nama & nomor telepon aktif"
                                    />
                                </div>
                                <div className="dr-field">
                                    <label htmlFor="prep-needs">
                                        Kebutuhan medis / kelompok rentan
                                    </label>
                                    <input
                                        id="prep-needs"
                                        className="dr-input"
                                        value={plan.specialNeeds}
                                        onChange={(e) =>
                                            setPlan((p) => ({
                                                ...p,
                                                specialNeeds: e.target.value,
                                            }))
                                        }
                                        placeholder="Obat rutin, lansia, balita"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Action type="submit" size="sm">
                                    <ShieldCheck
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                    <span>Simpan Rencana di Perangkat</span>
                                </Action>
                                {savedTime && (
                                    <span
                                        role="status"
                                        className="text-xs font-semibold text-status-normal-text tabular-nums"
                                    >
                                        Tersimpan lokal pukul {savedTime}
                                    </span>
                                )}
                            </div>
                        </form>
                    </Panel>

                    <Panel
                        title="Tanya Panduan Berbasis Sumber (AI-03 RAG)"
                        aside={
                            <Status tone="historical">
                                AI-03 · Belum tersedia
                            </Status>
                        }
                    >
                        <Notice>
                            Pencarian jawaban interaktif berbasis dokumen
                            (AI-03) belum diaktifkan di backend. Sistem tidak
                            pernah mengarang jawaban tanpa sitasi dokumen resmi
                            yang ditinjau manusia.
                        </Notice>
                    </Panel>
                </div>

                <div
                    className={
                        variant === 'b' ? 'space-y-4 lg:col-span-5' : 'dr-stack'
                    }
                >
                    <Panel
                        title="Checklist Tas Siaga 72 Jam"
                        subtitle="Progres tersimpan otomatis di perangkat ini"
                        aside={
                            <span className="inline-flex items-center gap-1 rounded-full bg-verified-soft px-2.5 py-0.5 text-xs font-bold text-foreground tabular-nums">
                                <CheckSquare
                                    className="size-3.5 text-primary"
                                    aria-hidden="true"
                                />
                                <span>
                                    {completedCount}/{activeChecklist.length}{' '}
                                    Siap
                                </span>
                            </span>
                        }
                    >
                        <div
                            className="h-2 w-full overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-valuenow={completedCount}
                            aria-valuemin={0}
                            aria-valuemax={activeChecklist.length}
                            aria-label="Progres kesiapan Tas Siaga"
                        >
                            <div
                                className="h-full bg-primary transition-[width] duration-200"
                                style={{
                                    width: `${Math.round((completedCount / Math.max(1, activeChecklist.length)) * 100)}%`,
                                }}
                            />
                        </div>

                        <div className="space-y-2 pt-1">
                            {activeChecklist.map((item) => {
                                const isChecked = Boolean(checked[item.key]);
                                return (
                                    <label
                                        className={cn(
                                            'dr-consent cursor-pointer rounded-xl border p-3 text-xs transition-colors',
                                            isChecked
                                                ? 'border-primary/40 bg-verified-soft/75 font-semibold text-foreground'
                                                : 'border-border/80 bg-background/60 text-foreground/90 hover:bg-secondary/50',
                                        )}
                                        key={item.key}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(event) =>
                                                toggleItem(
                                                    item.key,
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <span>{item.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </Panel>

                    <Panel className="forest" title="Kontak Darurat Resmi">
                        <div className="space-y-2.5">
                            {contacts.map((contact) => (
                                <div
                                    key={contact.phone}
                                    className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3.5 py-2.5"
                                >
                                    <div>
                                        <strong className="text-sm text-white">
                                            {contact.name}
                                        </strong>
                                        <p className="text-[11px] text-forest-muted">
                                            <a
                                                href={contact.source_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="underline"
                                            >
                                                Sumber resmi ↗
                                            </a>
                                        </p>
                                    </div>
                                    <a
                                        className="inline-flex items-center gap-1.5 rounded-full bg-alert-amber px-3 py-1 text-base font-bold text-forest-fixed tabular-nums"
                                        href={`tel:${contact.phone}`}
                                    >
                                        <PhoneCall
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span>{contact.phone}</span>
                                    </a>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-forest-muted">
                            112 khusus layanan darurat DKI Jakarta. Hubungi
                            layanan sesuai wilayah dan kondisi darurat.
                        </p>
                    </Panel>
                </div>
            </div>
        </>
    );
}
