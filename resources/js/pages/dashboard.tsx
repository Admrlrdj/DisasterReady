import { Head } from '@inertiajs/react';
import { EvacuationGuideDrawer } from '@/features/disaster/components/evacuation-guide-drawer';
import { RegionPickerModal } from '@/features/disaster/components/region-picker-modal';
import { RegionWaterLevelDrawer } from '@/features/disaster/components/region-water-level-drawer';
import { SiagaStatusBanner } from '@/features/disaster/components/siaga-status-banner';
import { useDisaster } from '@/features/disaster/disaster-context';
import type { DashboardView } from '@/features/disaster/types';
import { AlertHistoryView } from '@/features/disaster/views/alert-history-view';
import { HazardsFeedView } from '@/features/disaster/views/hazards-feed-view';
import { NationalOverview } from '@/features/disaster/views/national-overview';
import { PreparednessView } from '@/features/disaster/views/preparedness-view';
import { dashboard } from '@/routes';

const VIEW_TITLES: Record<DashboardView, string> = {
    overview: 'Pusat Komando & Peta Multi-Bencana',
    alerts: 'Peringatan & Riwayat CAP',
    map: 'Pusat Komando & Peta Multi-Bencana',
    hazards: 'Cuaca, Gempa & Gunung Api',
    preparedness: 'Pusat Kesiapsiagaan',
};

export default function Dashboard() {
    const { activeView } = useDisaster();

    return (
        <>
            <Head title={VIEW_TITLES[activeView]} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4 md:p-6">
                <SiagaStatusBanner />

                <main className="min-w-0 flex-1">
                    {(activeView === 'overview' || activeView === 'map') && (
                        <NationalOverview />
                    )}
                    {activeView === 'alerts' && <AlertHistoryView />}
                    {activeView === 'hazards' && <HazardsFeedView />}
                    {activeView === 'preparedness' && <PreparednessView />}
                </main>
            </div>

            <RegionWaterLevelDrawer />
            <EvacuationGuideDrawer />
            <RegionPickerModal />
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Pusat Komando & Peta Nasional',
            href: dashboard(),
        },
    ],
};
