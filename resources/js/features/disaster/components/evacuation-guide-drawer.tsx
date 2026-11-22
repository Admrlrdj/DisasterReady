import { Link } from '@inertiajs/react';
import { ExternalLink, PhoneCall, Printer, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { dateTime, hazardLabels } from '@/lib/disaster';
import type { Hazard } from '@/types/disaster';
import { useDisaster } from '../disaster-context';
import type { PreparednessGuide } from '../types';

const DEFAULT_HAZARDS: Hazard[] = [
    'flood',
    'earthquake',
    'tsunami',
    'volcano',
    'landslide',
    'extreme_weather',
];

export function EvacuationGuideDrawer() {
    const {
        overview,
        emergencyContacts,
        evacuationOpen,
        setEvacuationOpen,
        setActiveView,
    } = useDisaster();
    const [hazard, setHazard] = useState<Hazard>('flood');
    const [guides, setGuides] = useState<PreparednessGuide[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const availableHazards: Hazard[] =
        overview?.hazards && overview.hazards.length > 0
            ? overview.hazards.map((h) => h.slug)
            : DEFAULT_HAZARDS;

    useEffect(() => {
        if (!evacuationOpen) {
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError('');
        fetch(`/data/preparedness/${hazard}`, {
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
                    setError('Panduan resmi dari server belum dapat dimuat.');
                    setGuides([]);
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [evacuationOpen, hazard]);

    return (
        <Sheet open={evacuationOpen} onOpenChange={setEvacuationOpen}>
            <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-lg">
                <SheetHeader className="border-b border-border pb-4">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-brand-sage-strong uppercase">
                        <ShieldCheck className="size-3.5" aria-hidden="true" />
                        <span>Panel Aksi Cepat Kesiapsiagaan</span>
                    </div>
                    <SheetTitle className="text-lg">
                        Panduan Resmi Terverifikasi
                    </SheetTitle>
                    <SheetDescription>
                        Memuat panduan yang telah ditinjau manusia dari server
                        beserta rujukan instansi resmi.
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-4 p-4">
                    <div
                        className="flex flex-wrap gap-1.5"
                        role="group"
                        aria-label="Pilih jenis bencana untuk panduan cepat"
                    >
                        {availableHazards.map((slug) => (
                            <Button
                                key={slug}
                                type="button"
                                size="sm"
                                variant={
                                    hazard === slug ? 'default' : 'outline'
                                }
                                onClick={() => setHazard(slug)}
                                className="text-xs font-semibold"
                            >
                                {hazardLabels[slug] ?? slug}
                            </Button>
                        ))}
                    </div>

                    {loading ? (
                        <div
                            role="status"
                            aria-busy="true"
                            className="space-y-2.5 rounded-xl border border-border bg-card p-4"
                        >
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-5/6" />
                        </div>
                    ) : error ? (
                        <div
                            role="alert"
                            className="rounded-xl border border-destructive/30 bg-danger-soft p-3.5 text-xs text-destructive"
                        >
                            {error}
                        </div>
                    ) : guides.length > 0 ? (
                        <div className="space-y-3">
                            {guides.map((guide) => (
                                <article
                                    key={guide.id}
                                    className="space-y-3 rounded-xl border border-border bg-card p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Badge className="bg-verified-soft text-foreground">
                                            Ditinjau Admin
                                        </Badge>
                                        <span className="text-[11px] text-muted-foreground tabular-nums">
                                            {dateTime(guide.reviewed_at)}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground">
                                        {guide.title}
                                    </h3>
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                        {guide.content}
                                    </p>
                                    {guide.checklist.length > 0 && (
                                        <ul className="list-disc space-y-1 pl-4 text-xs text-foreground">
                                            {guide.checklist.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                    <a
                                        href={guide.official_reference}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-foreground underline underline-offset-4 hover:text-brand-sage-strong"
                                    >
                                        <span>Buka Rujukan Resmi</span>
                                        <ExternalLink
                                            className="size-3"
                                            aria-hidden="true"
                                        />
                                    </a>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2.5 rounded-xl border border-dashed border-input bg-muted/35 p-4 text-xs">
                            <p className="font-semibold text-foreground">
                                Panduan {hazardLabels[hazard]} belum diterbitkan
                                di server.
                            </p>
                            <p className="text-muted-foreground">
                                Panduan menunggu review manusia oleh admin.
                                Gunakan rujukan resmi instansi berikut:
                            </p>
                            <div className="flex flex-wrap gap-3 pt-1">
                                {hazard === 'flood' && (
                                    <a
                                        href="https://bpbd.jakarta.go.id/perpustakaan/Y2NRQ0ZDUFBRalMrc3hmK0owd3YwZz09/kesiapsiagaan-menghadapi-banjir-bagi-masyarakat"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 font-semibold text-foreground underline"
                                    >
                                        <span>Panduan Banjir BPBD DKI</span>
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
                                    <span>Portal BNPB</span>
                                    <ExternalLink
                                        className="size-3"
                                        aria-hidden="true"
                                    />
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl bg-forest-fixed p-3.5 text-white">
                        <p className="text-xs font-bold tracking-wider text-alert-amber uppercase">
                            Kontak Darurat Resmi
                        </p>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {emergencyContacts.map((c) => (
                                <a
                                    key={c.phone}
                                    href={`tel:${c.phone}`}
                                    className="flex items-center justify-between rounded-lg bg-white/10 px-2.5 py-2 text-xs hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-alert-amber focus-visible:outline-none"
                                >
                                    <span className="truncate font-medium">
                                        {c.name === 'Jakarta Siaga'
                                            ? 'DKI'
                                            : c.name}
                                    </span>
                                    <span className="inline-flex items-center gap-1 font-bold text-alert-amber tabular-nums">
                                        <PhoneCall
                                            className="size-3"
                                            aria-hidden="true"
                                        />
                                        {c.phone}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            size="sm"
                            className="flex-1 font-semibold"
                            onClick={() => {
                                setEvacuationOpen(false);
                                setActiveView('preparedness');
                            }}
                        >
                            Pusat Kesiapsiagaan
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="border-input"
                        >
                            <Link
                                href={`/preparedness/${hazard}`}
                                onClick={() => setEvacuationOpen(false)}
                            >
                                Halaman Penuh
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.print()}
                            className="border-input"
                        >
                            <Printer className="size-4" aria-hidden="true" />
                            <span>Cetak</span>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
