import { router, usePage } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import type { Contact, Overview, Region } from '@/lib/disaster';
import type { OfficialRecord } from '@/types/disaster';
import type { DashboardView, FeedState, SiagaLevel } from './types';

const VALID_VIEWS: DashboardView[] = [
    'overview',
    'alerts',
    'map',
    'hazards',
    'preparedness',
];

const FALLBACK_CONTACTS: Contact[] = [
    {
        name: 'BNPB',
        phone: '117',
        source_url: 'https://www.bnpb.go.id/kontak',
        verified_at: '2026-11-22T00:00:00Z',
    },
    {
        name: 'Basarnas',
        phone: '115',
        source_url:
            'https://balikpapan.basarnas.go.id/berita/informasi-layanan-kontak-darurat-dan-hotline-basarnas-balikpapan',
        verified_at: '2026-11-22T00:00:00Z',
    },
    {
        name: 'Jakarta Siaga',
        phone: '112',
        source_url: 'https://www.jakarta.go.id/jakarta-siaga-112',
        verified_at: '2026-11-22T00:00:00Z',
    },
];

function readInitialView(): DashboardView {
    if (typeof window === 'undefined') {
        return 'overview';
    }
    const raw = new URLSearchParams(window.location.search).get('view');
    if (raw && VALID_VIEWS.includes(raw as DashboardView)) {
        return raw as DashboardView;
    }
    return 'overview';
}

function deriveSiagaLevel(overview: Overview | null): SiagaLevel {
    if (!overview) {
        return 'siaga-4';
    }
    const activeAlerts = overview.alerts.filter(
        (alert) => alert.alert_state === 'ACTIVE',
    );
    if (activeAlerts.length === 0 && overview.active_alert_count === 0) {
        return 'siaga-4';
    }
    const severities = activeAlerts.map((alert) => {
        const data = alert.data as Record<string, unknown>;
        return typeof data.severity === 'string'
            ? data.severity.toLowerCase()
            : '';
    });
    if (severities.includes('extreme')) {
        return 'siaga-1';
    }
    if (severities.includes('severe')) {
        return 'siaga-2';
    }
    return 'siaga-3';
}

function deriveFeedState(
    overview: Overview | null,
    isReloading: boolean,
    reloadError: boolean,
): FeedState {
    if (isReloading) {
        return 'loading';
    }
    if (reloadError) {
        return 'error';
    }
    if (!overview) {
        return 'empty';
    }
    const bmkgSources = overview.sources.filter((s) => s.agency === 'BMKG');
    if (
        bmkgSources.length > 0 &&
        bmkgSources.every((s) => s.freshness === 'FAILED')
    ) {
        return 'error';
    }
    if (
        bmkgSources.some(
            (s) =>
                s.freshness === 'STALE' ||
                s.freshness === 'PARTIAL' ||
                s.freshness === 'FAILED',
        )
    ) {
        return 'stale';
    }
    if (
        overview.events.length === 0 &&
        overview.alerts.length === 0 &&
        overview.forecasts.length === 0
    ) {
        return 'empty';
    }
    return 'normal';
}

export type RegionOption = {
    code: Region;
    name: string;
    province: string;
};

type DisasterContextValue = {
    overview: Overview | null;
    activeAlerts: OfficialRecord[];
    emergencyContacts: Contact[];
    pendingReports: number | null;
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    selectedRegionCode: Region;
    selectedRegionName: string;
    regionOptions: RegionOption[];
    setSelectedRegionCode: (code: Region) => void;
    siagaLevel: SiagaLevel;
    feedState: FeedState;
    isReloading: boolean;
    retryFeed: () => void;
    mapRevision: number;
    waterLevelOpen: boolean;
    setWaterLevelOpen: (open: boolean) => void;
    evacuationOpen: boolean;
    setEvacuationOpen: (open: boolean) => void;
    regionPickerOpen: boolean;
    setRegionPickerOpen: (open: boolean) => void;
};

const DisasterContext = createContext<DisasterContextValue | null>(null);

export function DisasterProvider({ children }: { children: React.ReactNode }) {
    const pageProps = usePage().props;
    const overview = pageProps.overview ?? null;
    const emergencyContacts =
        pageProps.emergency_contacts && pageProps.emergency_contacts.length > 0
            ? pageProps.emergency_contacts
            : FALLBACK_CONTACTS;
    const pendingReports = pageProps.pending_reports ?? null;

    const [activeView, setActiveViewState] =
        useState<DashboardView>(readInitialView);
    const [isReloading, setIsReloading] = useState(false);
    const [reloadError, setReloadError] = useState(false);
    const [mapRevision, setMapRevision] = useState(0);

    const [waterLevelOpen, setWaterLevelOpen] = useState(false);
    const [evacuationOpen, setEvacuationOpen] = useState(false);
    const [regionPickerOpen, setRegionPickerOpen] = useState(false);

    const selectedRegionCode: Region = overview?.region ?? '31.75.03.1001';

    const regionOptions = useMemo<RegionOption[]>(() => {
        const entries = overview?.regions ?? {
            '31.75.03.1001': 'Kampung Melayu',
            '31.75.03.1002': 'Bidara Cina',
        };
        return (Object.entries(entries) as [Region, string][]).map(
            ([code, name]) => ({
                code,
                name,
                province: 'Jatinegara, Jakarta Timur',
            }),
        );
    }, [overview?.regions]);

    const selectedRegionName =
        overview?.region_name ??
        overview?.regions?.[selectedRegionCode] ??
        regionOptions.find((r) => r.code === selectedRegionCode)?.name ??
        'Kampung Melayu';

    const setActiveView = useCallback((view: DashboardView) => {
        setActiveViewState(view);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (view === 'overview') {
                url.searchParams.delete('view');
            } else {
                url.searchParams.set('view', view);
            }
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    const setSelectedRegionCode = useCallback(
        (code: Region) => {
            setReloadError(false);
            router.get(
                '/dashboard',
                {
                    region: code,
                    ...(activeView !== 'overview' ? { view: activeView } : {}),
                },
                {
                    only: ['overview'],
                    preserveState: true,
                    preserveScroll: true,
                    onStart: () => setIsReloading(true),
                    onFinish: () => setIsReloading(false),
                    onSuccess: () => setMapRevision((n) => n + 1),
                    onError: () => setReloadError(true),
                },
            );
        },
        [activeView],
    );

    const retryFeed = useCallback(() => {
        setReloadError(false);
        router.reload({
            only: ['overview', 'pending_reports'],
            onStart: () => setIsReloading(true),
            onFinish: () => setIsReloading(false),
            onSuccess: () => setMapRevision((n) => n + 1),
            onError: () => setReloadError(true),
        });
    }, []);

    const activeAlerts = useMemo(
        () =>
            (overview?.alerts ?? []).filter(
                (alert) => alert.alert_state === 'ACTIVE',
            ),
        [overview?.alerts],
    );

    const siagaLevel = useMemo(() => deriveSiagaLevel(overview), [overview]);
    const feedState = useMemo(
        () => deriveFeedState(overview, isReloading, reloadError),
        [overview, isReloading, reloadError],
    );

    const value = useMemo<DisasterContextValue>(
        () => ({
            overview,
            activeAlerts,
            emergencyContacts,
            pendingReports,
            activeView,
            setActiveView,
            selectedRegionCode,
            selectedRegionName,
            regionOptions,
            setSelectedRegionCode,
            siagaLevel,
            feedState,
            isReloading,
            retryFeed,
            mapRevision,
            waterLevelOpen,
            setWaterLevelOpen,
            evacuationOpen,
            setEvacuationOpen,
            regionPickerOpen,
            setRegionPickerOpen,
        }),
        [
            overview,
            activeAlerts,
            emergencyContacts,
            pendingReports,
            activeView,
            setActiveView,
            selectedRegionCode,
            selectedRegionName,
            regionOptions,
            setSelectedRegionCode,
            siagaLevel,
            feedState,
            isReloading,
            retryFeed,
            mapRevision,
            waterLevelOpen,
            evacuationOpen,
            regionPickerOpen,
        ],
    );

    return (
        <DisasterContext.Provider value={value}>
            {children}
        </DisasterContext.Provider>
    );
}

export function useDisaster() {
    const ctx = useContext(DisasterContext);
    if (!ctx) {
        throw new Error('useDisaster must be used within DisasterProvider');
    }
    return ctx;
}
