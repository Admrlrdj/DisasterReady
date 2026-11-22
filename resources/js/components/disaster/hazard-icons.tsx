import type { SVGProps } from 'react';
import { stringValue } from '@/lib/disaster';
import { cn } from '@/lib/utils';
import type { Hazard, OfficialRecord } from '@/types/disaster';

export type SiagaTier = 'normal' | 'waspada' | 'siaga' | 'awas';

export type SiagaTierMeta = {
    tier: SiagaTier;
    levelNumber: 1 | 2 | 3 | 4;
    code: string;
    shortLabel: string;
    description: string;
    actionHint: string;
    solidHex: string;
    softHexLight: string;
    softHexDark: string;
    badgeClass: string;
    ringClass: string;
    dotClass: string;
};

export const SIAGA_TIERS: Record<SiagaTier, SiagaTierMeta> = {
    normal: {
        tier: 'normal',
        levelNumber: 1,
        code: 'LEVEL 1 · NORMAL',
        shortLabel: 'Normal',
        description:
            'Pemantauan rutin aktif. Tidak ada peringatan darurat mendesak pada sumber ini.',
        actionHint: 'Perbarui rencana keluarga dan pantau prakiraan berkala.',
        solidHex: '#0A7A58',
        softHexLight: '#DCF5EA',
        softHexDark: '#05271A',
        badgeClass:
            'border-status-normal-border bg-status-normal-bg text-status-normal-text',
        ringClass: 'ring-status-normal-solid/45',
        dotClass: 'bg-status-normal-solid',
    },
    waspada: {
        tier: 'waspada',
        levelNumber: 2,
        code: 'LEVEL 2 · WASPADA',
        shortLabel: 'Waspada',
        description:
            'Peningkatan potensi bahaya atau gejala awal terdeteksi oleh sensor instansi.',
        actionHint:
            'Siapkan Tas Siaga 72 jam dan periksa jalur evakuasi lingkungan.',
        solidHex: '#E6B22F',
        softHexLight: '#FAEECE',
        softHexDark: '#271A03',
        badgeClass:
            'border-status-waspada-border bg-status-waspada-bg text-status-waspada-text',
        ringClass: 'ring-status-waspada-solid/55',
        dotClass: 'bg-status-waspada-solid',
    },
    siaga: {
        tier: 'siaga',
        levelNumber: 3,
        code: 'LEVEL 3 · SIAGA',
        shortLabel: 'Siaga',
        description:
            'Ancaman bencana nyata meningkat signifikan dan berpotensi berdampak langsung.',
        actionHint:
            'Bersiap evakuasi kelompok rentan dan ikuti komando petugas BPBD/BNPB.',
        solidHex: '#DC6819',
        softHexLight: '#FCE7D8',
        softHexDark: '#2F1103',
        badgeClass:
            'border-status-siaga-border bg-status-siaga-bg text-status-siaga-text',
        ringClass: 'ring-status-siaga-solid/60',
        dotClass: 'bg-status-siaga-solid',
    },
    awas: {
        tier: 'awas',
        levelNumber: 4,
        code: 'LEVEL 4 · AWAS',
        shortLabel: 'Awas',
        description:
            'Status darurat tertinggi. Bahaya kritis sedang berlangsung atau segera terjadi.',
        actionHint:
            'Evakuasi segera ke titik aman resmi. Hubungi BNPB 117 / SAR 115 / DKI 112.',
        solidHex: '#D93036',
        softHexLight: '#FCE2E1',
        softHexDark: '#31090B',
        badgeClass:
            'border-status-awas-border bg-status-awas-bg text-status-awas-text font-bold',
        ringClass: 'ring-status-awas-solid/75',
        dotClass: 'bg-status-awas-solid',
    },
};

export const HAZARD_META: Record<
    Hazard,
    {
        slug: Hazard;
        label: string;
        shortLabel: string;
        agency: string;
        accentHex: string;
        description: string;
    }
> = {
    flood: {
        slug: 'flood',
        label: 'Banjir & Genangan',
        shortLabel: 'Banjir',
        agency: 'BPBD · BNPB InaRISK',
        accentHex: '#0F6594',
        description:
            'Luapan sungai, limpasan hujan ekstrem, dan pemantauan tinggi muka air',
    },
    earthquake: {
        slug: 'earthquake',
        label: 'Gempa Bumi',
        shortLabel: 'Gempa Bumi',
        agency: 'BMKG Seismologi',
        accentHex: '#DC6819',
        description:
            'Guncangan tektonik autogempa, M5.0+, dan gempa dirasakan BMKG',
    },
    volcano: {
        slug: 'volcano',
        label: 'Gunung Api & Erupsi',
        shortLabel: 'Gunung Api',
        agency: 'PVMBG MAGMA ESDM',
        accentHex: '#D93036',
        description:
            'Aktivitas vulkanik, guguran lava, dan kolom abu PVMBG MAGMA',
    },
    landslide: {
        slug: 'landslide',
        label: 'Tanah Longsor',
        shortLabel: 'Longsor',
        agency: 'PVMBG · BNPB',
        accentHex: '#A64A0D',
        description:
            'Pergerakan tanah dan runtuhan lereng curam saat curah hujan tinggi',
    },
    extreme_weather: {
        slug: 'extreme_weather',
        label: 'Cuaca Ekstrem & CAP',
        shortLabel: 'Cuaca Ekstrem',
        agency: 'BMKG Meteorologi',
        accentHex: '#157675',
        description:
            'Hujan lebat, petir, angin kencang, dan peringatan dini CAP XML',
    },
    tsunami: {
        slug: 'tsunami',
        label: 'Gelombang Tsunami',
        shortLabel: 'Tsunami',
        agency: 'BMKG InaTEWS',
        accentHex: '#0A4B70',
        description:
            'Gelombang pasang seismik pesisir dan peringatan dini InaTEWS',
    },
    other: {
        slug: 'other',
        label: 'Karhutla & Bahaya Lain',
        shortLabel: 'Karhutla / Lain',
        agency: 'BNPB · Multi-Instansi',
        accentHex: '#B6891B',
        description:
            'Kebakaran hutan dan lahan (Karhutla) serta insiden darurat lainnya',
    },
};

export function inferRecordHazard(record: OfficialRecord): Hazard {
    const data = (record.data ?? {}) as Record<string, unknown>;
    if (typeof data.hazard === 'string' && data.hazard in HAZARD_META) {
        return data.hazard as Hazard;
    }
    const text = `${record.title} ${record.message ?? ''}`.toLowerCase();
    if (text.includes('tsunami')) return 'tsunami';
    if (text.includes('gunung') || text.includes('erupsi')) return 'volcano';
    if (text.includes('longsor')) return 'landslide';
    if (text.includes('banjir') || text.includes('genangan')) return 'flood';
    if (text.includes('karhutla') || text.includes('kebakaran')) return 'other';
    if (record.kind === 'event' || text.includes('gempa')) return 'earthquake';
    return 'extreme_weather';
}

export function inferRecordSiagaTier(record: OfficialRecord): SiagaTier {
    const data = (record.data ?? {}) as Record<string, unknown>;
    if (record.kind === 'alert') {
        if (record.alert_state && record.alert_state !== 'ACTIVE') {
            return 'normal';
        }
        const sev =
            typeof data.severity === 'string'
                ? data.severity.toLowerCase()
                : '';
        if (sev.includes('extreme')) return 'awas';
        if (sev.includes('severe')) return 'siaga';
        if (sev.includes('moderate')) return 'waspada';
        return record.alert_state === 'ACTIVE' ? 'siaga' : 'waspada';
    }

    if (record.kind === 'event') {
        const magRaw = stringValue(data.Magnitude, '').replace(',', '.');
        const mag = Number.parseFloat(magRaw);
        const potensi = stringValue(data.Potensi, '').toLowerCase();
        if (
            (potensi.includes('tsunami') && !potensi.includes('tidak')) ||
            mag >= 6.5
        ) {
            return 'awas';
        }
        if (mag >= 5.5) return 'siaga';
        if (mag >= 4.5 || !Number.isNaN(mag)) return 'waspada';
        return 'normal';
    }

    // Forecast
    const desc = stringValue(data.weather_desc, record.title).toLowerCase();
    if (desc.includes('petir') || desc.includes('ekstrem')) return 'siaga';
    if (desc.includes('lebat') || desc.includes('hujan')) return 'waspada';
    return 'normal';
}

/**
 * Bespoke Custom Multi-Path SVG Icons for Each Disaster Type
 * Crafted specifically for immediate recognition in emergency command contexts.
 */
export function HazardSvgIcon({
    hazard,
    className,
    ...props
}: SVGProps<SVGSVGElement> & { hazard: Hazard | 'all' }) {
    switch (hazard) {
        case 'flood':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className={cn('size-5', className)}
                    {...props}
                >
                    {/* Submerged house roofline + water level gauge + dual rising hydro waves */}
                    <path
                        d="M4.5 10.5L12 4.5L19.5 10.5"
                        stroke="currentColor"
                        strokeWidth="1.85"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M7.5 8.5V13M16.5 8.5V13M12 8.5V12.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                    />
                    <path
                        d="M2.5 15.25C4.25 13.75 6.25 13.75 8 15.25C9.75 16.75 11.75 16.75 13.5 15.25C15.25 13.75 17.25 13.75 19 15.25C20 16.1 20.85 16.35 21.5 16"
                        stroke="currentColor"
                        strokeWidth="1.95"
                        strokeLinecap="round"
                    />
                    <path
                        d="M2.5 19.25C4.25 17.75 6.25 17.75 8 19.25C9.75 20.75 11.75 20.75 13.5 19.25C15.25 17.75 17.25 17.75 19 19.25C20 20.1 20.85 20.35 21.5 20"
                        stroke="currentColor"
                        strokeWidth="1.95"
                        strokeLinecap="round"
                    />
                </svg>
            );

        case 'earthquake':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className={cn('size-5', className)}
                    {...props}
                >
                    {/* Concentric epicenter rings + high-amplitude P/S seismic waveform */}
                    <circle
                        cx="12"
                        cy="12"
                        r="8.75"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="3 2.5"
                    />
                    <path
                        d="M2.5 12H6.25L8.4 7.25L11.1 17.25L13.75 5.75L16.1 14.5L17.75 12H21.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );

        case 'volcano':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className={cn('size-5', className)}
                    {...props}
                >
                    {/* Stratovolcano cone + crater rim + eruption ash cloud & ballistic ejecta */}
                    <path
                        d="M3.5 20.25L8.75 11.25H15.25L20.5 20.25H3.5Z"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9.5 11.25L11.25 15.25L13 13.5L14.75 16"
                        stroke="currentColor"
                        strokeWidth="1.55"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M12 11V6.5M12 6.5C12 4.8 10.6 3.5 9 3.5C7.6 3.5 6.5 4.5 6.5 5.8C6.5 6.9 7.3 7.8 8.5 8M12 6.5C12 4.8 13.4 3.5 15 3.5C16.4 3.5 17.5 4.5 17.5 5.8C17.5 6.9 16.7 7.8 15.5 8"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
            );

        case 'landslide':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className={cn('size-5', className)}
                    {...props}
                >
                    {/* Steep escarpment slope + shear slip line + tumbling rock/debris masses */}
                    <path
                        d="M3 20.25V6.5L14.5 20.25H3Z"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M9.5 5.25L19.75 15.5"
                        stroke="currentColor"
                        strokeWidth="1.65"
                        strokeLinecap="round"
                        strokeDasharray="2.5 2.5"
                    />
                    <circle cx="15.25" cy="8.25" r="1.65" fill="currentColor" />
                    <circle cx="18.75" cy="12" r="2.1" fill="currentColor" />
                    <circle cx="19.5" cy="18.25" r="1.75" fill="currentColor" />
                </svg>
            );

        case 'extreme_weather':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className={cn('size-5', className)}
                    {...props}
                >
                    {/* Storm cloud cell + high-voltage lightning discharge + angled squall rain */}
                    <path
                        d="M6.75 15.25H5.8C4 15.25 2.5 13.8 2.5 12C2.5 10.35 3.72 8.98 5.32 8.77C5.86 6.05 8.26 4 11.15 4C14.44 4 17.1 6.66 17.1 9.95C19.53 10.12 21.45 12.14 21.45 14.6C21.45 15.05 21.38 15.48 21.25 15.88"
                        stroke="currentColor"
                        strokeWidth="1.85"
                        strokeLinecap="round"
                    />
                    <path
                        d="M12.5 11.25L9.75 15.5H13.25L11.25 20.25"
                        stroke="currentColor"
                        strokeWidth="1.95"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M6.75 17.5L5.5 20M17.5 17.5L16.25 20"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                    />
                </svg>
            );

        case 'tsunami':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className={cn('size-5', className)}
                    {...props}
                >
                    {/* Towering breaking tsunami crest + coastal surge base */}
                    <path
                        d="M3 18.25C6.5 18.25 8.5 15.5 8.5 11.75C8.5 7.5 11.5 4.5 15.75 4.5C18.5 4.5 20.5 6.25 20.75 8.75C18.25 7.75 15.75 8.85 15.75 11.5C15.75 14.25 18 15.75 21 15.75"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M3 20.5H21"
                        stroke="currentColor"
                        strokeWidth="1.85"
                        strokeLinecap="round"
                    />
                </svg>
            );

        case 'other':
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className={cn('size-5', className)}
                    {...props}
                >
                    {/* Karhutla wildfire flame plume + smoke horizon */}
                    <path
                        d="M12.5 3.25C13.2 6.2 17.75 7.9 17.75 12.75C17.75 16.35 15.1 19.25 11.75 19.25C8.35 19.25 5.75 16.5 5.75 13C5.75 10.6 7.1 8.55 8.6 7.4C8.4 9.2 9.4 10.4 10.6 10.6C9.9 8.15 10.8 5.25 12.5 3.25Z"
                        stroke="currentColor"
                        strokeWidth="1.85"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M4 21H20"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                    />
                </svg>
            );

        default:
            return (
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className={cn('size-5', className)}
                    {...props}
                >
                    {/* Multi-hazard radar compass emblem */}
                    <circle
                        cx="12"
                        cy="12"
                        r="8.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <path
                        d="M12 2.5V5.5M12 18.5V21.5M2.5 12H5.5M18.5 12H21.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
            );
    }
}

export function HazardChipBadge({
    hazard,
    tier,
    showTier = true,
    className,
}: {
    hazard: Hazard;
    tier?: SiagaTier;
    showTier?: boolean;
    className?: string;
}) {
    const meta = HAZARD_META[hazard] ?? HAZARD_META.other;
    const tierMeta = tier ? SIAGA_TIERS[tier] : null;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                tierMeta
                    ? tierMeta.badgeClass
                    : 'border-border bg-secondary text-foreground',
                className,
            )}
        >
            <HazardSvgIcon hazard={hazard} className="size-3.5 shrink-0" />
            <span>{meta.shortLabel}</span>
            {showTier && tierMeta && (
                <>
                    <span aria-hidden="true" className="opacity-55">
                        ·
                    </span>
                    <span>{tierMeta.shortLabel}</span>
                </>
            )}
        </span>
    );
}

/**
 * Generates an inline SVG string for MapLibre custom HTML markers so each
 * disaster marker on the unified map has its distinct custom SVG hazard logo
 * AND 4-tier Siaga status ring.
 */
export function getHazardRawSvgMarkup(hazard: Hazard): string {
    switch (hazard) {
        case 'flood':
            return `<path d="M4.5 10.5L12 4.5L19.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 8.5V13M16.5 8.5V13M12 8.5V12.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M2.5 15.25C4.25 13.75 6.25 13.75 8 15.25C9.75 16.75 11.75 16.75 13.5 15.25C15.25 13.75 17.25 13.75 19 15.25C20 16.1 20.85 16.35 21.5 16" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/><path d="M2.5 19.25C4.25 17.75 6.25 17.75 8 19.25C9.75 20.75 11.75 20.75 13.5 19.25C15.25 17.75 17.25 17.75 19 19.25C20 20.1 20.85 20.35 21.5 20" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>`;
        case 'earthquake':
            return `<circle cx="12" cy="12" r="8.75" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2.5"/><path d="M2.5 12H6.25L8.4 7.25L11.1 17.25L13.75 5.75L16.1 14.5L17.75 12H21.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        case 'volcano':
            return `<path d="M3.5 20.25L8.75 11.25H15.25L20.5 20.25H3.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.5 11.25L11.25 15.25L13 13.5L14.75 16" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 11V6.5M12 6.5C12 4.8 10.6 3.5 9 3.5C7.6 3.5 6.5 4.5 6.5 5.8C6.5 6.9 7.3 7.8 8.5 8M12 6.5C12 4.8 13.4 3.5 15 3.5C16.4 3.5 17.5 4.5 17.5 5.8C17.5 6.9 16.7 7.8 15.5 8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>`;
        case 'landslide':
            return `<path d="M3 20.25V6.5L14.5 20.25H3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.5 5.25L19.75 15.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-dasharray="2.5 2.5"/><circle cx="15.25" cy="8.25" r="1.75" fill="currentColor"/><circle cx="18.75" cy="12" r="2.2" fill="currentColor"/><circle cx="19.5" cy="18.25" r="1.85" fill="currentColor"/>`;
        case 'extreme_weather':
            return `<path d="M6.75 15.25H5.8C4 15.25 2.5 13.8 2.5 12C2.5 10.35 3.72 8.98 5.32 8.77C5.86 6.05 8.26 4 11.15 4C14.44 4 17.1 6.66 17.1 9.95C19.53 10.12 21.45 12.14 21.45 14.6C21.45 15.05 21.38 15.48 21.25 15.88" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12.5 11.25L9.75 15.5H13.25L11.25 20.25" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`;
        case 'tsunami':
            return `<path d="M3 18.25C6.5 18.25 8.5 15.5 8.5 11.75C8.5 7.5 11.5 4.5 15.75 4.5C18.5 4.5 20.5 6.25 20.75 8.75C18.25 7.75 15.75 8.85 15.75 11.5C15.75 14.25 18 15.75 21 15.75" stroke="currentColor" stroke-width="2.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 20.5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
        default:
            return `<path d="M12.5 3.25C13.2 6.2 17.75 7.9 17.75 12.75C17.75 16.35 15.1 19.25 11.75 19.25C8.35 19.25 5.75 16.5 5.75 13C5.75 10.6 7.1 8.55 8.6 7.4C8.4 9.2 9.4 10.4 10.6 10.6C9.9 8.15 10.8 5.25 12.5 3.25Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 21H20" stroke="currentColor" stroke-width="1.85" stroke-linecap="round"/>`;
    }
}
