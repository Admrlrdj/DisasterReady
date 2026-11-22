import { lazy, Suspense } from 'react';
const HazardMap = lazy(() => import('./hazard-map'));
export type MapPanelProps = {
    kind?: 'event' | 'alert' | 'forecast';
    hazard?: string;
    region?: string;
    activeOnly?: boolean;
    revision?: number;
    historicalTiles?: string;
};

export default function MapPanel(props: MapPanelProps) {
    return (
        <Suspense
            fallback={
                <div className="dr-live-map dr-empty" role="status">
                    Menyiapkan peta…
                </div>
            }
        >
            <HazardMap {...props} />
        </Suspense>
    );
}
