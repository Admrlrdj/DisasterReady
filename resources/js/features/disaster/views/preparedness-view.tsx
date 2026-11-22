import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    Bot,
    CheckSquare,
    ExternalLink,
    PhoneCall,
    Printer,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { dateTime, hazardLabels } from '@/lib/disaster';
import type { Hazard } from '@/types/disaster';
import { useDisaster } from '../disaster-context';
import type { PreparednessGuide } from '../types';

type PrepTab = 'evacuation' | 'ai-rag' | 'family-plan';

const FAMILY_PLAN_KEY = 'disasterready_family_plan_v1';
const CHECKLIST_KEY = 'disasterready_checklist_v1';

const DEFAULT_GO_BAG_ITEMS = [
    { id: 'water', label: 'Air minum & makanan tahan simpan (72 jam)' },
    { id: 'docs', label: 'Salinan dokumen penting dalam wadah kedap air' },
    { id: 'meds', label: 'Kotak P3K, obat rutin keluarga, & masker' },
    { id: 'light', label: 'Senter, baterai cadangan, peluit, & powerbank' },
    { id: 'clothes', label: 'Pakaian cadangan, selimut, & uang tunai' },
];

const DEFAULT_HAZARDS: Hazard[] = [
    'flood',
    'earthquake',
    'tsunami',
    'volcano',
    'landslide',
    'extreme_weather',
    'other',
];

export function PreparednessView() {
    const { overview, emergencyContacts } = useDisaster();
    const [tab, setTab] = useState<PrepTab>('evacuation');
    const [selectedHazard, setSelectedHazard] = useState<Hazard>('flood');
    const [guides, setGuides] = useState<PreparednessGuide[]>([]);
    const [loadingGuides, setLoadingGuides] = useState(false);
    const [guideError, setGuideError] = useState('');

    const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
    const [plan, setPlan] = useState({
        primaryPoint: '',
        backupPoint: '',
        outOfTownContact: '',
        specialNeeds: '',
    });
    const [planSavedAt, setPlanSavedAt] = useState<string | null>(null);

    const availableHazards: Hazard[] =
        overview?.hazards && overview.hazards.length > 0
            ? overview.hazards.map((h) => h.slug)
            : DEFAULT_HAZARDS;

    useEffect(() => {
        try {
            const rawPlan = window.localStorage.getItem(FAMILY_PLAN_KEY);
            if (rawPlan) {
                setPlan(JSON.parse(rawPlan));
            }
            const rawChecks = window.localStorage.getItem(CHECKLIST_KEY);
            if (rawChecks) {
                setCheckedMap(JSON.parse(rawChecks));
            }
        } catch {
            // Ignore restricted storage
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        setLoadingGuides(true);
        setGuideError('');
        fetch(`/data/preparedness/${selectedHazard}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Gagal memuat panduan');
                }
                const payload = (await response.json()) as {
                    data?: PreparednessGuide[];
                };
                setGuides(payload.data ?? []);
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setGuideError(
                        'Panduan resmi dari server belum dapat dimuat.',
                    );
                    setGuides([]);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoadingGuides(false);
                }
            });

        return () => controller.abort();
    }, [selectedHazard]);

    const serverChecklist = guides.flatMap((guide) =>
        guide.checklist.map((item, idx) => ({
            id: `guide-${guide.id}-${idx}`,
            label: item,
        })),
    );
    const checklistItems =
        serverChecklist.length > 0 ? serverChecklist : DEFAULT_GO_BAG_ITEMS;
    const readyCount = checklistItems.filter(
        (item) => checkedMap[item.id],
    ).length;

    const toggleChecklistItem = (id: string, checked: boolean) => {
        setCheckedMap((prev) => {
            const next = { ...prev, [id]: checked };
            try {
                window.localStorage.setItem(
                    CHECKLIST_KEY,
                    JSON.stringify(next),
                );
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    };

    const saveFamilyPlan = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            window.localStorage.setItem(FAMILY_PLAN_KEY, JSON.stringify(plan));
        } catch {
            // Ignore storage errors
        }
        setPlanSavedAt(
            new Intl.DateTimeFormat('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date()),
        );
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                    <h1 className="heading-display text-2xl font-bold text-foreground sm:text-[1.65rem]">
                        Pusat Kesiapsiagaan
                    </h1>
                    <p className="prose-pretty text-sm text-muted-foreground">
                        Panduan yang telah ditinjau manusia dari server disertai
                        rujukan resmi, serta rencana keluarga lokal di perangkat
                        Anda.
                    </p>
                </div>

                <div
                    className="segmented-track overflow-x-auto"
                    role="tablist"
                    aria-label="Modul Pusat Kesiapsiagaan"
                >
                    {(
                        [
                            ['evacuation', 'Panduan Resmi', BookOpen],
                            ['ai-rag', 'Asisten AI-03', Bot],
                            ['family-plan', 'Rencana Keluarga', CheckSquare],
                        ] as const
                    ).map(([id, label, Icon]) => {
                        const active = tab === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setTab(id)}
                                className={`pressable inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                                    active
                                        ? 'bg-card text-foreground shadow-xs'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon className="size-3.5" aria-hidden="true" />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
                <div className="space-y-4 xl:col-span-8">
                    {tab === 'evacuation' && (
                        <Card className="gap-4 py-5">
                            <CardHeader className="flex flex-col gap-3 px-5 pb-0 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap gap-1.5">
                                    {availableHazards.map((slug) => (
                                        <Button
                                            key={slug}
                                            type="button"
                                            size="sm"
                                            variant={
                                                selectedHazard === slug
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() =>
                                                setSelectedHazard(slug)
                                            }
                                            className="rounded-full text-xs font-semibold"
                                        >
                                            {hazardLabels[slug] ?? slug}
                                        </Button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="rounded-full text-xs"
                                    >
                                        <Link
                                            href={`/preparedness/${selectedHazard}`}
                                        >
                                            Halaman Penuh
                                        </Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.print()}
                                        className="w-fit rounded-full text-xs"
                                    >
                                        <Printer
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span>Cetak</span>
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4 px-5">
                                {loadingGuides ? (
                                    <div
                                        role="status"
                                        aria-busy="true"
                                        className="space-y-3 rounded-xl border border-border bg-muted/30 p-4"
                                    >
                                        <Skeleton className="h-5 w-56" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                    </div>
                                ) : guideError ? (
                                    <div
                                        role="alert"
                                        className="rounded-xl border border-destructive/35 bg-danger-soft p-4 text-xs text-destructive"
                                    >
                                        {guideError}
                                    </div>
                                ) : guides.length > 0 ? (
                                    guides.map((guide) => (
                                        <article
                                            key={guide.id}
                                            className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <Badge className="bg-verified-soft text-foreground">
                                                    Publikasi Melalui Review
                                                    Admin
                                                </Badge>
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                    Ditinjau{' '}
                                                    {dateTime(
                                                        guide.reviewed_at,
                                                    )}
                                                </span>
                                            </div>
                                            <h2 className="text-base font-bold text-foreground">
                                                {guide.title}
                                            </h2>
                                            <p className="prose-pretty text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                                                {guide.content}
                                            </p>
                                            {guide.family_plan.length > 0 && (
                                                <div className="space-y-1.5 rounded-xl bg-card p-3.5">
                                                    <p className="text-xs font-bold text-foreground">
                                                        Langkah Rencana Keluarga
                                                    </p>
                                                    <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                                                        {guide.family_plan.map(
                                                            (step) => (
                                                                <li key={step}>
                                                                    {step}
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
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-foreground underline underline-offset-4 hover:text-brand-sage-strong"
                                            >
                                                <span>
                                                    Buka Dokumen Rujukan Resmi
                                                </span>
                                                <ExternalLink
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                            </a>
                                        </article>
                                    ))
                                ) : (
                                    <div className="space-y-3 rounded-xl border border-dashed border-input bg-muted/30 p-5 text-sm">
                                        <p className="font-semibold text-foreground">
                                            Panduan{' '}
                                            {hazardLabels[selectedHazard]} belum
                                            diterbitkan di database.
                                        </p>
                                        <p className="text-xs leading-relaxed text-muted-foreground">
                                            Panduan untuk jenis bahaya ini
                                            menunggu peninjauan dan publikasi
                                            manusia oleh admin melalui menu
                                            Panduan & Korpus. Gunakan rujukan
                                            resmi instansi berikut:
                                        </p>
                                        <div className="flex flex-wrap gap-3 text-xs">
                                            {selectedHazard === 'flood' && (
                                                <a
                                                    href="https://bpbd.jakarta.go.id/perpustakaan/Y2NRQ0ZDUFBRalMrc3hmK0owd3YwZz09/kesiapsiagaan-menghadapi-banjir-bagi-masyarakat"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 font-semibold text-foreground underline"
                                                >
                                                    <span>
                                                        Panduan Banjir BPBD DKI
                                                        Jakarta
                                                    </span>
                                                    <ExternalLink
                                                        className="size-3"
                                                        aria-hidden="true"
                                                    />
                                                </a>
                                            )}
                                            <a
                                                href="https://www.bnpb.go.id/"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 font-semibold text-foreground underline"
                                            >
                                                <span>Portal Resmi BNPB</span>
                                                <ExternalLink
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {tab === 'ai-rag' && (
                        <Card className="gap-4 py-5">
                            <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 pb-0">
                                <div>
                                    <CardTitle className="text-base font-bold">
                                        Tanya Panduan Berbasis Sumber (AI-03)
                                    </CardTitle>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Modul RAG P1 menunggu korpus dokumen
                                        resmi terkurasi dan endpoint backend.
                                    </p>
                                </div>
                                <Badge className="bg-brand-bronze-soft text-brand-bronze-text">
                                    AI-03 · Belum Tersedia
                                </Badge>
                            </CardHeader>

                            <CardContent className="space-y-4 px-5">
                                <div
                                    role="status"
                                    className="flex items-start gap-2.5 rounded-xl border border-brand-bronze-text/30 bg-brand-bronze-soft p-4 text-xs text-brand-bronze-text"
                                >
                                    <AlertTriangle
                                        className="mt-0.5 size-4 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <div className="space-y-1">
                                        <p className="font-bold">
                                            Pencarian jawaban AI-03 belum
                                            diaktifkan di backend.
                                        </p>
                                        <p className="leading-relaxed">
                                            Sistem tidak mensimulasikan jawaban
                                            atau sitasi dokumen tanpa korpus
                                            resmi yang ditinjau. Baca panduan
                                            resmi yang sudah terbit pada tab
                                            pertama atau buka halaman
                                            Kesiapsiagaan penuh.
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setTab('evacuation')}
                                    className="rounded-full"
                                >
                                    Kembali ke Panduan Resmi
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {tab === 'family-plan' && (
                        <Card className="gap-4 py-5">
                            <CardHeader className="px-5 pb-0">
                                <p className="overline-label text-brand-sage-strong">
                                    Penyimpanan Lokal · LocalStorage
                                </p>
                                <CardTitle className="heading-section text-base font-bold">
                                    Rencana Kesiapsiagaan Keluarga Saya
                                </CardTitle>
                                <p className="prose-pretty text-xs text-muted-foreground">
                                    Disimpan lokal di perangkat Anda agar tetap
                                    terbaca saat jaringan terganggu. Tidak
                                    dikirim ke server publik.
                                </p>
                            </CardHeader>

                            <CardContent className="px-5">
                                <form
                                    onSubmit={saveFamilyPlan}
                                    className="space-y-4"
                                >
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="primary-point">
                                            Titik kumpul keluarga utama (dekat
                                            rumah)
                                        </Label>
                                        <Input
                                            id="primary-point"
                                            value={plan.primaryPoint}
                                            onChange={(e) =>
                                                setPlan((p) => ({
                                                    ...p,
                                                    primaryPoint:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder="Contoh: Halaman masjid RW atau lapangan kelurahan"
                                            className="text-base sm:text-sm"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="backup-point">
                                            Titik kumpul cadangan (di luar area
                                            rawan)
                                        </Label>
                                        <Input
                                            id="backup-point"
                                            value={plan.backupPoint}
                                            onChange={(e) =>
                                                setPlan((p) => ({
                                                    ...p,
                                                    backupPoint: e.target.value,
                                                }))
                                            }
                                            placeholder="Contoh: Rumah kerabat di luar kecamatan"
                                            className="text-base sm:text-sm"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="out-contact">
                                            Kontak darurat keluarga di luar kota
                                        </Label>
                                        <Input
                                            id="out-contact"
                                            value={plan.outOfTownContact}
                                            onChange={(e) =>
                                                setPlan((p) => ({
                                                    ...p,
                                                    outOfTownContact:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder="Nama kerabat dan nomor telepon aktif"
                                            className="text-base sm:text-sm"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="special-needs">
                                            Catatan kebutuhan khusus (lansia,
                                            balita, obat rutin)
                                        </Label>
                                        <Input
                                            id="special-needs"
                                            value={plan.specialNeeds}
                                            onChange={(e) =>
                                                setPlan((p) => ({
                                                    ...p,
                                                    specialNeeds:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder="Contoh: Obat hipertensi harian, kursi roda lipat"
                                            className="text-base sm:text-sm"
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        <Button
                                            type="submit"
                                            className="rounded-full px-5 font-semibold"
                                        >
                                            Simpan Rencana Lokal
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => window.print()}
                                            className="rounded-full"
                                        >
                                            <Printer
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                            <span>Cetak PDF</span>
                                        </Button>
                                        {planSavedAt && (
                                            <span
                                                role="status"
                                                className="text-xs font-semibold text-brand-sage-strong tabular-nums"
                                            >
                                                Tersimpan lokal pukul{' '}
                                                {planSavedAt}
                                            </span>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-4 xl:col-span-4">
                    <Card className="gap-3.5 py-4">
                        <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
                            <CardTitle className="text-base font-bold">
                                Checklist Tas Siaga
                            </CardTitle>
                            <span className="text-xs font-bold text-brand-sage-strong tabular-nums">
                                {readyCount} / {checklistItems.length} Siap
                            </span>
                        </CardHeader>
                        <CardContent className="space-y-3 px-4">
                            <p className="text-xs text-muted-foreground">
                                Penanda pribadi lokal di perangkat. Tidak
                                mengukur keselamatan resmi.
                            </p>
                            <div
                                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                                role="progressbar"
                                aria-valuenow={readyCount}
                                aria-valuemin={0}
                                aria-valuemax={checklistItems.length}
                                aria-label="Progres kesiapan Tas Siaga"
                            >
                                <div
                                    className="h-full bg-brand-sage-strong transition-[width] duration-200"
                                    style={{
                                        width: `${Math.round((readyCount / Math.max(1, checklistItems.length)) * 100)}%`,
                                    }}
                                />
                            </div>
                            <ul className="space-y-2">
                                {checklistItems.map((item) => {
                                    const checked = Boolean(
                                        checkedMap[item.id],
                                    );
                                    return (
                                        <li key={item.id}>
                                            <label
                                                htmlFor={`gobag-${item.id}`}
                                                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors duration-150 ${
                                                    checked
                                                        ? 'border-brand-sage-strong/30 bg-verified-soft/75 text-foreground'
                                                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/60'
                                                }`}
                                            >
                                                <Checkbox
                                                    id={`gobag-${item.id}`}
                                                    checked={checked}
                                                    onCheckedChange={(value) =>
                                                        toggleChecklistItem(
                                                            item.id,
                                                            value === true,
                                                        )
                                                    }
                                                />
                                                <span>{item.label}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="gap-3.5 border-none bg-forest-fixed py-4 text-white dark:border dark:border-border dark:bg-forest-card">
                        <CardHeader className="px-4 pb-0">
                            <p className="overline-label text-alert-amber">
                                Kontak Darurat Resmi
                            </p>
                            <p className="text-xs text-forest-muted">
                                Hubungi instansi resmi jika dalam bahaya
                                langsung (112 khusus layanan Jakarta):
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-2 px-4">
                            {emergencyContacts.map((c) => (
                                <div
                                    key={c.phone}
                                    className="flex items-center justify-between rounded-xl bg-white/8 px-3.5 py-2.5"
                                >
                                    <div>
                                        <p className="text-xs font-bold text-white">
                                            {c.name}
                                        </p>
                                        <a
                                            href={c.source_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[11px] text-forest-muted underline"
                                        >
                                            Sumber resmi ↗
                                        </a>
                                    </div>
                                    <a
                                        href={`tel:${c.phone}`}
                                        className="pressable inline-flex items-center gap-1 rounded-full bg-alert-amber px-2.5 py-1 text-xs font-bold text-forest-fixed tabular-nums"
                                    >
                                        <PhoneCall
                                            className="size-3"
                                            aria-hidden="true"
                                        />
                                        {c.phone}
                                    </a>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
