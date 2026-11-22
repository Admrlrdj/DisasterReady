import { useEffect, useSyncExternalStore } from 'react';

export type PageVariant = 'a' | 'b' | 'c';

export type VariantMeta = {
    id: PageVariant;
    shortLabel: string;
    name: string;
    summary: string;
};

export const PAGE_VARIANTS: readonly VariantMeta[] = [
    {
        id: 'a',
        shortLabel: 'Versi A',
        name: 'Atmospheric Clean',
        summary:
            'Kaca frosted lembut di atas Hydro-Aurora dengan ruang napas luas',
    },
    {
        id: 'b',
        shortLabel: 'Versi B',
        name: 'Tactical Command',
        summary:
            'Pusat komando presisi tinggi dengan strip telemetri dan grid tegas',
    },
    {
        id: 'c',
        shortLabel: 'Versi C',
        name: 'Editorial Minimalist',
        summary:
            'Tipografi Swiss kontras tinggi dengan pembagian garis horisontal bersih',
    },
] as const;

const VARIANT_STORAGE_KEY = 'disasterready_ui_variant_v2';
const AURORA_PAUSE_KEY = 'disasterready_aurora_paused_v1';

const listeners = new Set<() => void>();
let currentVariant: PageVariant = 'a';
let currentAuroraPaused = false;
let hydrated = false;

function hydrateFromStorage() {
    if (typeof window === 'undefined' || hydrated) {
        return;
    }
    hydrated = true;
    let changed = false;
    try {
        const urlVariant = new URLSearchParams(window.location.search)
            .get('variant')
            ?.toLowerCase();
        if (urlVariant === 'a' || urlVariant === 'b' || urlVariant === 'c') {
            if (currentVariant !== urlVariant) {
                currentVariant = urlVariant;
                changed = true;
            }
            window.localStorage.setItem(VARIANT_STORAGE_KEY, urlVariant);
        } else {
            const saved = window.localStorage.getItem(VARIANT_STORAGE_KEY);
            if (
                (saved === 'a' || saved === 'b' || saved === 'c') &&
                currentVariant !== saved
            ) {
                currentVariant = saved;
                changed = true;
            }
        }
        const paused = window.localStorage.getItem(AURORA_PAUSE_KEY) === '1';
        if (currentAuroraPaused !== paused) {
            currentAuroraPaused = paused;
            changed = true;
        }
    } catch {
        // Ignore restricted storage
    }
    if (changed) {
        notify();
    }
}

function subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

function notify() {
    listeners.forEach((fn) => fn());
}

export function setPageVariant(next: PageVariant): void {
    hydrated = true;
    currentVariant = next;
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(VARIANT_STORAGE_KEY, next);
        } catch {
            // Ignore storage errors
        }
    }
    notify();
}

export function setAuroraPaused(paused: boolean): void {
    hydrated = true;
    currentAuroraPaused = paused;
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(AURORA_PAUSE_KEY, paused ? '1' : '0');
        } catch {
            // Ignore storage errors
        }
    }
    notify();
}

export function usePageVariant() {
    const variant = useSyncExternalStore<PageVariant>(
        subscribe,
        () => currentVariant,
        () => 'a',
    );

    const auroraPaused = useSyncExternalStore<boolean>(
        subscribe,
        () => currentAuroraPaused,
        () => false,
    );

    useEffect(() => {
        hydrateFromStorage();
    }, []);

    const meta =
        PAGE_VARIANTS.find((item) => item.id === variant) ?? PAGE_VARIANTS[0];

    return {
        variant,
        meta,
        setVariant: setPageVariant,
        auroraPaused,
        setAuroraPaused,
        toggleAuroraPaused: () => setAuroraPaused(!auroraPaused),
    } as const;
}
