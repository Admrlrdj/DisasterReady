import { lazy, Suspense } from 'react';
const HazardMap = lazy(() => import('./hazard-map'));
export type FloodMapKind = 'flood-report' | 'flood-area';
export type MapPanelProps = {
    kind?: 'event' | 'alert' | 'forecast' | FloodMapKind;
    hazard?: string;
    combined?: boolean;
    allHazards?: boolean;
    hazardMarkers?: boolean;
    weatherRegions?: string[];
    region?: string;
    activeOnly?: boolean;
    eventDays?: 1 | 7;
    revision?: number;
    historicalTiles?: string;
    showLoadingPreview?: boolean;
};

export default function MapPanel(props: MapPanelProps) {
    return (
        <Suspense
            fallback={
                <div
                    className={`dr-live-map dr-empty${props.showLoadingPreview ? ' dr-map-preview' : ''}`}
                    role="status"
                >
                    Menyiapkan peta…
                </div>
            }
        >
            <HazardMap {...props} />
        </Suspense>
    );
}
