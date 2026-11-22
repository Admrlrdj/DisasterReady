export type DashboardView =
    | 'overview'
    | 'alerts'
    | 'map'
    | 'hazards'
    | 'preparedness';

export type SiagaLevel = 'siaga-4' | 'siaga-3' | 'siaga-2' | 'siaga-1';

export type FeedState =
    | 'normal'
    | 'loading'
    | 'empty'
    | 'stale'
    | 'error'
    | 'rate-limited'
    | 'offline';

export type PreparednessGuide = {
    id: number;
    hazard_type_id: number;
    title: string;
    content: string;
    official_reference: string;
    reviewed_at: string;
    checklist: string[];
    family_plan: string[];
    emergency_contacts?: {
        name: string;
        phone: string;
        source_url: string;
        verified_at: string;
    }[];
};
