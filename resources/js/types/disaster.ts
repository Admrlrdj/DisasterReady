/** Backend JSON contracts; these types do not imply an implemented UI. */
export type Hazard =
    | 'flood'
    | 'earthquake'
    | 'tsunami'
    | 'volcano'
    | 'landslide'
    | 'extreme_weather'
    | 'other';

export type ReportStatus =
    | 'PENDING'
    | 'NEEDS_EVIDENCE'
    | 'VERIFIED'
    | 'REJECTED';

export type AnalysisStatus =
    | 'QUEUED'
    | 'DISPATCH_FAILED'
    | 'COMPLETED'
    | 'FAILED'
    | 'DISABLED';

export type DuplicateStatus = AnalysisStatus | 'POSTGIS_REQUIRED';
export type Freshness =
    | 'FRESH'
    | 'STALE'
    | 'FAILED'
    | 'UNAVAILABLE'
    | 'PARTIAL';
export type SuggestionDecision = 'ACCEPTED' | 'CORRECTED' | 'REJECTED';
export type SuggestionField =
    | 'hazard'
    | 'summary'
    | 'place'
    | 'observation_time'
    | 'water_depth_cm'
    | 'road_access';

export interface IncidentReport {
    id: number;
    category: Hazard | null;
    description: string;
    observed_at: string;
    status: ReportStatus;
    version: number;
    analysis_status: AnalysisStatus;
    duplicate_status: DuplicateStatus;
    created_at: string;
    updated_at: string;
}

export interface ReportReview {
    id: number;
    report_id: number;
    reviewer_id: number;
    decision: Exclude<ReportStatus, 'PENDING'>;
    reason: string;
    version: number;
    created_at: string;
    updated_at: string;
}

export interface ReportDetail extends IncidentReport {
    latitude: string;
    longitude: string;
    evidence: { id: number; sha256: string }[];
    reviews: ReportReview[];
    follow_ups: {
        id: number;
        description: string | null;
        version: number;
        created_at: string;
    }[];
}

export interface AiSuggestion {
    id: number;
    analysis_run_id: number;
    field_name: SuggestionField;
    suggested_value_json: string | number | null;
    evidence_span: string | null;
    review_status: 'UNREVIEWED' | SuggestionDecision;
    reviewed_by: number | null;
    reviewed_at: string | null;
}

export interface DuplicateCandidate {
    id: number;
    report_id: number;
    candidate_report_id: number;
    method_version: string;
    geo_distance_m: number;
    time_delta_minutes: number;
    text_score: number | null;
    reviewer_decision: 'DUPLICATE' | 'NOT_DUPLICATE' | null;
    reviewed_by: number | null;
    reviewed_at: string | null;
}

export interface SourceHealth {
    id: number;
    name: string;
    agency: string;
    attribution: string;
    last_success_at: string | null;
    sync_status: 'OK' | 'FAILED' | 'UNAVAILABLE' | 'PARTIAL';
    source_url: string;
    freshness: Freshness;
}

export interface OfficialRecord {
    forecast_at: string | null;
    id: number;
    kind: 'event' | 'alert' | 'forecast';
    title: string;
    message: string | null;
    source: SourceHealth;
    source_url: string;
    source_time: string;
    fetched_at: string;
    expires_at: string | null;
    expired: boolean;
    synthetic: boolean;
    hazard_type_id: number | null;
    alert_state:
        | 'ACTIVE'
        | 'UPCOMING'
        | 'EXPIRED'
        | 'CANCELLED'
        | 'SUPERSEDED'
        | null;
    data: Record<string, unknown> | unknown[];
}
