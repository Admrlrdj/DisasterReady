# Backend contract — DisasterReady

Status: implemented for local development with synthetic AI; see [verification](BACKEND_VERIFICATION.md) for execution evidence and pending gates. These routes return JSON and do not create UI pages. The existing Inertia welcome/auth/settings pages remain available.

Shared frontend contracts are in [disaster.ts](../resources/js/types/disaster.ts). Suggestion values and run output JSON are decoded into JSON values/objects by the suggestions endpoint; database column names ending in `_json` do not imply an extra JSON.parse step for that endpoint.

## Authentication and response rules

Send `Accept: application/json`. Writes use the existing Fortify session cookie and Laravel CSRF token from the authenticated web session (`X-CSRF-TOKEN` or `X-XSRF-TOKEN`). No bearer-token login or Supabase Auth is introduced. Registration cannot assign roles. Report/admin routes require verified email; suspended accounts cannot submit, read private reports, or administer data. Moderator/admin role provisioning requires trusted console access.

Responses use HTTP 201 for creation, 202 for queued operations, 401 for unauthenticated JSON requests, 403 for authorization/email-verification failures, 404 for missing resources, 409 for stale/final review conflicts, 419 for CSRF failures, 422 for validation, and 429 for throttling. Unexpected infrastructure errors can produce 500/503. Keep `APP_DEBUG=false` outside local development.

Domain timestamps are ISO 8601 UTC. `observed_at` input must include `T` and a timezone (`Z` or an offset); the action converts it to UTC before persistence. Coordinates in GeoJSON are **longitude, latitude**. Report coordinates are decimal strings in private detail responses. IDs are numeric. Collections use Laravel pagination (`data`, `current_page`, `last_page`, `per_page`, `total`, links) unless documented as a bounded list. Page size defaults to 20 and is capped at 100 for report and feed collections.

## Citizen reporting and moderation

Additional frontend-supporting contracts: `GET /my/reports?per_page=20` returns an owner-scoped paginated list. `POST /my/reports/{report}/follow-ups` accepts `version`, optional `description` (10–5000 characters) and/or `photo` under the existing photo limits, with `privacy_consent=true` and `photo_consent=true` when uploading. Only the owner can submit when NEEDS_EVIDENCE and the version matches; returns 201 with PENDING and incremented version, 409 for a stale/non-eligible report. Original text is retained; detail includes `follow_ups`. Consent, private evidence, state and audit are persisted atomically. New evidence is reviewed by a human; prior AI output remains tied to the original text.

| Method/path                                     | Access                                 | Request or result                                                               |
| ----------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| `POST /reports`                                 | Active verified account                | Create PENDING report; returns `{data: report}`                                 |
| `GET /my/reports/{report}`                      | Owner or active moderator/admin        | Private report with coordinates, evidence IDs/hashes and review history         |
| `GET /reports/{report}/evidence/{evidence}`     | Same ownership/role policy             | Reencoded JPEG stream; private/no-store; storage path never returned            |
| `GET /admin/reports?status=PENDING&per_page=20` | Moderator/admin                        | Paginated queue; list excludes precise coordinates                              |
| `GET /admin/reports/{report}`                   | Moderator/admin                        | Private detail                                                                  |
| `POST /admin/reports/{report}/reviews`          | Moderator/admin, excluding own reports | `{version, decision, reason}`; decision is NEEDS_EVIDENCE, VERIFIED or REJECTED |

Report request fields: `description` (10–5000 characters), `observed_at` (not in future), `latitude` (-90..90), `longitude` (-180..180), `privacy_consent=true`. Optional `category`: flood, earthquake, tsunami, volcano, landslide, extreme_weather, other; omitted/null stays null. Optional `photo`: JPEG/PNG, at most 5 MiB and 6000 × 6000 pixels; requires `photo_consent=true`. Use multipart form data for real uploads. Consent timestamps are retained internally.

```json
{
    "description": "SINTETIS: banjir 40 cm di jalan kampung.",
    "observed_at": "2026-11-22T02:00:00Z",
    "latitude": -6.22,
    "longitude": 106.87,
    "privacy_consent": true
}
```

The client cannot assign reporter, status, role or version on creation. Photo processing happens before the database transaction; a failed transaction removes its new file. Dispatch failure after commit preserves the report and sets `analysis_status=DISPATCH_FAILED`; scheduled recovery retries it.

Initial status is PENDING, initial version is 1. Each review requires the currently loaded version, increments it, and writes review/status/audit atomically. VERIFIED/REJECTED are final in this backend version; subsequent attempts return 409. NEEDS_EVIDENCE may receive a later reviewer decision. A citizen follow-up/edit endpoint is not included yet. Verifying a citizen report never creates an official alert. Citizen reports are not published by public/GIS endpoints in this version.

## AI suggestions and duplicate candidates

| Method/path                                                     | Access                          | Behavior                                                                                       |
| --------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /admin/reports/{report}/ai-suggestions`                    | Moderator/admin                 | Runs and suggestions, model version, unverified label, fallback state                          |
| `POST /admin/reports/{report}/ai-feedback`                      | Reviewer, excluding own reports | `suggestion_id`, `decision`, `corrected_value`, `reason`                                       |
| `GET /admin/reports/{report}/duplicate-candidates`              | Moderator/admin                 | Bounded candidates, distance metres, time delta minutes, lexical score, fallback state         |
| `POST /admin/reports/{report}/duplicate-candidates/{candidate}` | Reviewer, excluding own reports | `decision=DUPLICATE                                                                            | NOT_DUPLICATE`, reason; no automatic merge/delete |
| `GET /admin/ai/health`                                          | Admin                           | Provider/version, kill switch, circuit, pending/failed job counts, run/feedback counts, totals |
| `POST /admin/ai/settings`                                       | Admin                           | `{enabled: boolean}` persisted and audited; environment kill switch also applies               |
| `POST /admin/reports/{report}/ai-retry`                         | Admin                           | Queue a retry; completed analysis is idempotent                                                |

Feedback decisions: ACCEPTED, CORRECTED, REJECTED. `corrected_value` must be present; use null unless correcting. For CORRECTED, null remains allowed; depth is numeric 0..100000 cm, hazard uses the category enum, observation_time is a date, other fields are strings up to 2000 characters. Feedback is append-only and each suggestion/candidate can be reviewed once; repeat review returns 409. Feedback does not change report verification status.

The default provider is `synthetic-rule-stub-v1`, prompt `incident-v1`, with `simulation_only=true`. Fields: hazard, summary, place, observation_time, water_depth_cm, road_access. The stub detects the literal word banjir and an explicit numeric cm measurement and leaves other fields null. The [optional HTTP provider](NATIONAL_P0.md#ai-provider) uses the same server-side schema and evidence validation. Analysis runs identify the provider/model and simulation mode. Input omits separate identity, photo, and location fields and masks common identifiers in the report text.

Analysis states: QUEUED, DISPATCH_FAILED, COMPLETED, FAILED, DISABLED. Duplicate states additionally include POSTGIS_REQUIRED on non-PostgreSQL test environments. Reports remain PENDING during all these states. Retries use 60/180/600-second backoff; stub calls are limited by a configurable daily counter and a temporary circuit after failures. Usage/cost is zero for this local stub.

Duplicates: PostGIS geography distance ≤1000 m, observation window ±24 hours, nearest 20 candidates. The method version distinguishes simulated lexical scoring from optional embedding scoring. Candidate records retain reviewer decisions across retries.

## Official/public data

| Method/path                                                          | Result                                                                                                   |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `GET /data/overview`                                                 | Latest 10 events, latest 10 alert messages, source health                                                |
| `GET /data/events`                                                   | Paginated events; `hazard=earthquake` provides the earthquakes feed                                      |
| `GET /data/events/{id}`                                              | Event detail                                                                                             |
| `GET /data/alerts` and `/data/alerts/{id}`                           | Official CAP messages, including expired/cancelled/superseded records                                    |
| `GET /data/regions?q=Gurabesi`                                       | National ADM4 catalogue search, up to 20 results                                                         |
| `GET /data/weather?region=91.71.01.1001&current=1`                   | Paginated, unexpired slots from the latest batch and regional freshness                                  |
| `GET /data/map?kind=event&bbox[]=106&bbox[]=-7&bbox[]=108&bbox[]=-5` | GeoJSON; kind event/alert/forecast, optional hazard and limit (default 100, max 200)                     |
| `GET /data/layers`                                                   | Publication-approved historical/modelled hazard-layer metadata                                           |
| `GET /data/preparedness/{hazard}`                                    | Published guides, references/review dates, checklist, family_plan and verified-source emergency contacts |

Map bbox is `[west,south,east,north]`, must have increasing bounds, width ≤60° and height ≤40°. An over-limit result includes `truncated=true`. Non-PostgreSQL environments return 503 instead of pretending to perform spatial queries. Exact citizen-report coordinates/photos/text are not part of this endpoint. Metadata identifies event, alert, forecast or historical/modelled risk separately; weather forecasts never infer flood status.

Official records include source/attribution, source_time, fetched_at, expires_at, expired and synthetic. Source freshness is FRESH, STALE, FAILED or UNAVAILABLE, separate from record expiry. Alert state is ACTIVE, UPCOMING, EXPIRED, CANCELLED or SUPERSEDED. CAP updates/cancellations supersede referenced records from the same source. Cancellation never means a computed all-clear. Historical records remain visible with their dates and state; clients must not show unavailable sources as safe.

## Data administration

All following routes require active verified admin access:

- `GET /admin/sources`: sources and last 50 ingestion runs.
- `POST /admin/sources/{id}`: `enabled` boolean and `freshness_sla` seconds (60..604800); cannot change URLs through the browser.
- `POST /admin/sources/{id}/retry`: queue source ingestion. Both source and environment enable switches are required for live fetching.
- `GET /admin/alerts`: paginated official records. Alert content is ingestion-owned; no arbitrary alert creation/edit endpoint exists. Correct upstream data through its trusted source and retry ingestion.
- `GET /admin/guides`, `POST /admin/guides`, `PUT /admin/guides/{id}`: manage reviewed guides; updates are audited in the same transaction.
- `GET /admin/audit-logs`: newest-first, 50 per page; no write/delete endpoint.

Guide fields: hazard_type_id, title, content, official_reference (HTTPS), reviewed_at (not future), published boolean. Optional checklist/family_plan are arrays of up to 100 strings (500 characters each). Optional emergency_contacts is an array of up to 30 `{name,phone,source_url,verified_at}` records; HTTPS source and past verification date are required. Admins must verify references/contact ownership before publishing. No contact numbers or safety instructions are seeded without verification. UI must render supplied text safely, without raw HTML execution.
