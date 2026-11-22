import { lazy, Suspense } from 'react';
import type { Overview } from '@/lib/disaster';

const HazardMap = lazy(() => import('./hazard-map'));

export type MapKindFilter = 'all' | 'event' | 'alert' | 'forecast';

export type MapPanelProps = {
    kind?: MapKindFilter;
    hazard?: string;
    siagaFilter?: 'all' | 'normal' | 'waspada' | 'siaga' | 'awas';
    region?: string;
    activeOnly?: boolean;
    revision?: number;
    historicalTiles?: string;
    overview?: Overview | null;
    showControls?: boolean;
};

export default function MapPanel(props: MapPanelProps) {
    return (
        <Suspense
            fallback={
                <div
                    className="dr-live-map dr-empty flex min-h-[380px] items-center justify-center rounded-2xl border border-border/80 bg-card/75 text-xs font-semibold text-muted-foreground"
                    role="status"
                >
                    Menyiapkan kanvas peta multi-bencana...
                </div>
            }
        >
            <HazardMap {...props} />
        </Suspense>
    );
}
