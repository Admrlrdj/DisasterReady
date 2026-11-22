import type { Hazard, OfficialRecord, SourceHealth } from '@/types/disaster';

export const hazardLabels: Record<Hazard, string> = {
    flood: 'Banjir',
    earthquake: 'Gempa Bumi',
    tsunami: 'Tsunami',
    volcano: 'Gunung Api',
    landslide: 'Tanah Longsor',
    extreme_weather: 'Cuaca Ekstrem',
    other: 'Lainnya',
};
export const statusLabels: Record<string, string> = {
    PARTIAL: 'Sinkronisasi sebagian',
    PENDING: 'Menunggu review',
    NEEDS_EVIDENCE: 'Butuh bukti',
    VERIFIED: 'Terverifikasi',
    REJECTED: 'Ditolak',
    FRESH: 'Terbarui',
    STALE: 'Data kedaluwarsa',
    FAILED: 'Sinkronisasi gagal',
    UNAVAILABLE: 'Belum tersedia',
    ACTIVE: 'Peringatan aktif',
    EXPIRED: 'Kedaluwarsa',
    CANCELLED: 'Dibatalkan sumber',
    SUPERSEDED: 'Digantikan',
    UPCOMING: 'Belum berlaku',
    COMPLETED: 'Selesai',
    QUEUED: 'Dalam antrean',
    DISABLED: 'Dinonaktifkan',
    DISPATCH_FAILED: 'Pengiriman job tertunda',
    POSTGIS_REQUIRED: 'Memerlukan PostGIS',
};

export function dateTime(value?: string | null, timeOnly = false): string {
    if (!value) return 'Belum tersedia';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia';
    return (
        new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            ...(timeOnly
                ? {}
                : { day: '2-digit', month: 'short', year: 'numeric' }),
            hour: '2-digit',
            minute: '2-digit',
        }).format(date) + ' WIB'
    );
}

export function recordLink(record: OfficialRecord): string {
    return `/${record.kind === 'alert' ? 'alerts' : 'events'}/${record.id}`;
}

export function stringValue(value: unknown, fallback = '—'): string {
    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : fallback;
}

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public errors: Record<string, string[]> = {},
    ) {
        super(message);
    }
}

export async function api<T>(
    url: string,
    data?: Record<string, unknown>,
    method = 'POST',
): Promise<T> {
    const token =
        document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
            ?.split('=')
            .slice(1)
            .join('=') ?? '';
    const response = await fetch(url, {
        method: data ? method : 'GET',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            ...(data
                ? {
                      'Content-Type': 'application/json',
                      'X-XSRF-TOKEN': decodeURIComponent(token),
                  }
                : {}),
        },
        ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        errors?: Record<string, string[]>;
    };
    if (!response.ok)
        throw new ApiError(
            response.status >= 500
                ? 'Layanan belum tersedia. Silakan coba kembali.'
                : response.status === 419
                  ? 'Sesi berakhir. Muat ulang halaman sebelum mencoba kembali.'
                  : response.status === 409
                    ? 'Data sudah berubah. Muat ulang laporan dan periksa versi terbaru.'
                    : response.status === 403
                      ? 'Akunmu tidak memiliki akses untuk tindakan ini.'
                      : Object.values(result.errors ?? {})
                            .flat()
                            .join(' ') ||
                        result.message ||
                        'Permintaan gagal.',
            response.status,
            result.errors,
        );
    return result as T;
}

export type Region = '31.75.03.1001' | '31.75.03.1002';
export type Overview = {
    active_alert_count: number;
    events: OfficialRecord[];
    alerts: OfficialRecord[];
    forecasts: OfficialRecord[];
    sources: SourceHealth[];
    region: Region;
    regions: Record<Region, string>;
    hazards: { id: number; slug: Hazard; label: string }[];
    layers: {
        id: number;
        name: string;
        legend: string;
        layer_url: string;
        temporal_scope: string;
        limitations: string;
        reviewed_at: string | null;
        tile_template: string | null;
    }[];
    generated_at: string;
};
export type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
export type Contact = {
    name: string;
    phone: string;
    source_url: string;
    verified_at: string;
};
