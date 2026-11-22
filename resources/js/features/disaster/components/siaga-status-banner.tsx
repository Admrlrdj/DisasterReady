import { Link } from '@inertiajs/react';
import {
    AlertOctagon,
    AlertTriangle,
    Droplets,
    Info,
    PhoneCall,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dateTime, recordLink } from '@/lib/disaster';
import { useDisaster } from '../disaster-context';
import type { SiagaLevel } from '../types';

const LEVEL_STYLES: Record<
    SiagaLevel,
    {
        container: string;
        badge: string;
        icon: typeof ShieldCheck;
        role: 'alert' | 'status';
        code: string;
    }
> = {
    'siaga-1': {
        container:
            'border-status-awas-solid bg-status-awas-solid text-status-awas-on-solid shadow-md',
        badge: 'bg-white text-status-awas-on-white font-bold',
        icon: AlertOctagon,
        role: 'alert',
        code: 'LEVEL 4 · AWAS',
    },
    'siaga-2': {
        container:
            'border-status-siaga-border bg-status-siaga-bg text-status-siaga-text',
        badge: 'bg-status-siaga-solid text-status-siaga-on-solid font-bold',
        icon: ShieldAlert,
        role: 'alert',
        code: 'LEVEL 3 · SIAGA',
    },
    'siaga-3': {
        container:
            'border-status-waspada-border bg-status-waspada-bg text-status-waspada-text',
        badge: 'bg-status-waspada-solid text-status-waspada-on-solid font-bold',
        icon: AlertTriangle,
        role: 'status',
        code: 'LEVEL 2 · WASPADA',
    },
    'siaga-4': {
        container:
            'border-status-normal-border bg-status-normal-bg text-status-normal-text',
        badge: 'bg-status-normal-solid text-status-normal-on-solid font-semibold',
        icon: Info,
        role: 'status',
        code: 'LEVEL 1 · NORMAL',
    },
};

export function SiagaStatusBanner() {
    const {
        overview,
        activeAlerts,
        siagaLevel,
        setWaterLevelOpen,
        setEvacuationOpen,
        setActiveView,
    } = useDisaster();

    const style = LEVEL_STYLES[siagaLevel];
    const Icon = style.icon;
    const isCritical = siagaLevel === 'siaga-1';

    const topAlert = activeAlerts[0] ?? null;
    const bmkgSources = (overview?.sources ?? []).filter(
        (s) => s.agency === 'BMKG',
    );
    const freshBmkgCount = bmkgSources.filter(
        (s) => s.freshness === 'FRESH',
    ).length;
    const anySourceUnavailable =
        bmkgSources.length === 0 ||
        bmkgSources.some(
            (s) => s.freshness === 'UNAVAILABLE' || s.freshness === 'FAILED',
        );

    const label = topAlert
        ? `${overview?.active_alert_count ?? activeAlerts.length} Peringatan Resmi BMKG CAP Berlaku`
        : anySourceUnavailable
          ? 'Sebagian sumber BMKG belum tersinkronisasi'
          : `Tidak ada CAP aktif · ${freshBmkgCount}/${bmkgSources.length} sumber BMKG terbarui`;

    const headline = topAlert
        ? topAlert.title
        : anySourceUnavailable
          ? 'Ketiadaan peringatan di tampilan ini bukan indikasi kondisi aman.'
          : 'Tidak ada peringatan dini cuaca BMKG aktif yang tercatat saat ini.';

    const guidance = topAlert
        ? (topAlert.message ??
          'Periksa detail resmi peringatan dan ikuti arahan petugas setempat.')
        : anySourceUnavailable
          ? 'Periksa status sinkronisasi adapter di bawah atau buka langsung portal resmi BMKG sebelum mengambil keputusan.'
          : 'Tetap pantau prakiraan cuaca 3 jam, gempa terbaru, dan panduan kesiapsiagaan resmi.';

    const provenance = topAlert
        ? `Sumber: ${topAlert.source.attribution} · Terbit ${dateTime(topAlert.source_time)} · Berlaku sampai ${dateTime(topAlert.expires_at)}`
        : overview?.generated_at
          ? `Diperbarui dari server: ${dateTime(overview.generated_at)}`
          : 'Sumber: BMKG Open Data · BNPB InaRISK · PVMBG';

    return (
        <section
            role={style.role}
            aria-live={style.role === 'alert' ? 'assertive' : 'polite'}
            aria-label={`Status pantauan ${style.code}`}
            className={`rounded-2xl border px-4 py-3.5 transition-[background-color,border-color] duration-150 ${style.container}`}
        >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-3">
                    <span
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${
                            isCritical
                                ? 'bg-white/15 text-white'
                                : 'bg-card/80 text-current shadow-xs'
                        }`}
                    >
                        <Icon className="size-4" aria-hidden="true" />
                    </span>

                    <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className={style.badge}>{style.code}</Badge>
                            <span className="text-xs font-semibold">
                                {label}
                            </span>
                        </div>

                        <p className="prose-pretty text-sm leading-snug font-semibold">
                            {headline}
                        </p>
                        <p
                            className={`prose-pretty line-clamp-2 text-xs leading-relaxed ${
                                isCritical ? 'text-white/90' : 'opacity-90'
                            }`}
                        >
                            {guidance}
                        </p>
                        <p
                            className={`text-xs tabular-nums ${
                                isCritical ? 'text-white/80' : 'opacity-75'
                            }`}
                        >
                            {provenance}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 xl:shrink-0">
                    {topAlert && (
                        <Button
                            asChild
                            size="sm"
                            variant={isCritical ? 'secondary' : 'default'}
                            className={
                                isCritical
                                    ? 'rounded-full bg-white font-semibold text-status-awas-on-white hover:bg-white/92'
                                    : 'rounded-full font-semibold'
                            }
                        >
                            <Link href={recordLink(topAlert)}>
                                Detail Peringatan
                            </Link>
                        </Button>
                    )}

                    <Button
                        type="button"
                        size="sm"
                        variant={
                            topAlert
                                ? 'outline'
                                : isCritical
                                  ? 'secondary'
                                  : 'default'
                        }
                        onClick={() => setEvacuationOpen(true)}
                        className={
                            isCritical
                                ? 'rounded-full border-white/75 bg-transparent text-white hover:bg-white/15'
                                : topAlert
                                  ? 'rounded-full border-current/25 bg-card/85 text-current hover:bg-card'
                                  : 'rounded-full font-semibold'
                        }
                    >
                        <ShieldCheck className="size-4" aria-hidden="true" />
                        <span>Panduan Siaga</span>
                    </Button>

                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setWaterLevelOpen(true)}
                        className={
                            isCritical
                                ? 'rounded-full border-white/75 bg-transparent text-white hover:bg-white/15'
                                : 'rounded-full border-current/25 bg-card/85 text-current hover:bg-card'
                        }
                    >
                        <Droplets className="size-4" aria-hidden="true" />
                        <span>Rujukan TMA</span>
                    </Button>

                    {isCritical ? (
                        <Button
                            asChild
                            size="sm"
                            className="rounded-full bg-alert-amber font-bold text-forest-fixed hover:bg-alert-amber/90"
                        >
                            <a href="tel:112">
                                <PhoneCall
                                    className="size-4"
                                    aria-hidden="true"
                                />
                                <span>Darurat 112</span>
                            </a>
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveView('alerts')}
                            className="rounded-full border-current/25 bg-card/85 text-current hover:bg-card"
                        >
                            <span>Riwayat CAP</span>
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
}
