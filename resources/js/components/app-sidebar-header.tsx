import { MapPin, RefreshCw } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useDisaster } from '@/features/disaster/disaster-context';
import { dateTime } from '@/lib/disaster';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const {
        overview,
        selectedRegionName,
        isReloading,
        setRegionPickerOpen,
        retryFeed,
    } = useDisaster();

    const latestSourceSync = overview?.sources
        .map((s) => s.last_success_at)
        .filter((v): v is string => Boolean(v))
        .sort()
        .at(-1);

    const syncLabel = isReloading
        ? 'Memuat ulang...'
        : latestSourceSync
          ? `BMKG · ${dateTime(latestSourceSync, true)}`
          : overview?.generated_at
            ? `Server · ${dateTime(overview.generated_at, true)}`
            : 'Belum sinkron';

    return (
        <header className="sticky top-0 z-20 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-background/95 px-4 py-2 backdrop-blur-xs transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-12 md:px-6">
            <div className="flex items-center gap-2.5">
                <SidebarTrigger className="-ml-1" />
                <span className="hidden h-4 w-px bg-border sm:inline-block" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="segmented-track">
                <button
                    type="button"
                    onClick={() => setRegionPickerOpen(true)}
                    className="pressable inline-flex h-7 items-center gap-1.5 rounded-full bg-card px-3 text-xs font-semibold text-foreground shadow-xs hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                    <MapPin
                        className="size-3.5 text-brand-sage-strong"
                        aria-hidden="true"
                    />
                    <span className="max-w-40 truncate">
                        {selectedRegionName}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={retryFeed}
                    disabled={isReloading}
                    aria-label="Muat ulang data resmi dari server"
                    className="pressable hidden h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 sm:inline-flex"
                >
                    <RefreshCw
                        className={`size-3.5 ${isReloading ? 'motion-safe:animate-spin' : ''}`}
                        aria-hidden="true"
                    />
                    <span className="tabular-nums">{syncLabel}</span>
                </button>
            </div>
        </header>
    );
}
