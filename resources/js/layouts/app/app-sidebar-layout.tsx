import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import {
    GlobalAuroraBackdrop,
    PageVariantSwitcherBar,
} from '@/components/disaster/global-aurora-backdrop';
import { DisasterProvider } from '@/features/disaster/disaster-context';
import { usePageVariant } from '@/hooks/use-page-variant';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { variant } = usePageVariant();

    return (
        <DisasterProvider>
            <div data-ui-variant={variant} className="relative min-h-dvh">
                <GlobalAuroraBackdrop intensity="map" />
                <AppShell variant="sidebar">
                    <AppSidebar />
                    <AppContent
                        variant="sidebar"
                        className="relative z-10 min-w-0 overflow-x-clip bg-transparent"
                    >
                        <AppSidebarHeader breadcrumbs={breadcrumbs} />
                        <div className="px-4 pt-3 md:px-6">
                            <PageVariantSwitcherBar pageLabel="Pusat Komando & Peta Nasional" />
                        </div>
                        {children}
                    </AppContent>
                </AppShell>
            </div>
        </DisasterProvider>
    );
}
