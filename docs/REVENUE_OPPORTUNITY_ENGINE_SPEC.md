# Revenue Opportunity Engine Spec

## Canonical Decision

ALICE is the canonical Revenue Intelligence Layer for Zenith.

No separate revenue opportunity engine exists. No domain owns its own scoring system. Domain signals are normalized into ALICE, scored by ALICE, forecast by ALICE, and assigned by ALICE to Workflow OS.

## Canonical Model

`RevenueOpportunity` is defined in `src/lib/alice/revenue-opportunity.ts`.

Required fields:

| Field | Meaning |
| --- | --- |
| `id` | Stable ALICE opportunity identifier |
| `organization_id` | Owning practice or organization |
| `type` | One of ALICE's revenue domains |
| `score` | 0-100 ALICE opportunity score |
| `estimated_revenue` | Forecasted recoverable revenue |
| `confidence` | 0-100 confidence in the recommendation |
| `priority` | `low`, `medium`, `high`, or `critical` |
| `recommended_workflow` | Workflow OS workflow key |
| `status` | Lifecycle state measured by Mission Control |

## Domains

ALICE owns these domains:

1. Recall Intelligence
2. Treatment Acceptance Intelligence
3. Lead Conversion Intelligence
4. Review Intelligence
5. Referral Intelligence
6. Insurance Recovery Intelligence
7. Provider Utilization Intelligence

## Responsibility Boundaries

| Layer | Responsibility |
| --- | --- |
| ALICE | Detect opportunities, score opportunities, forecast revenue, recommend workflows |
| Workflow OS | Execute assigned workflows |
| Runtime OS | Monitor execution, retries, failures, latency, and runtime health |
| Mission Control | Measure outcomes, ROI, conversion, and recovery |

## Persistence

`supabase/migrations/073_alice_revenue_opportunities.sql` creates `public.revenue_opportunities` as ALICE's source of truth.

Service role writes are required. Organization members and ops users may read opportunities through RLS.

## Scoring

ALICE score is computed from:

- confidence
- urgency
- impact
- estimated revenue magnitude

Priority is derived only from ALICE score:

| Score | Priority |
| --- | --- |
| 85-100 | critical |
| 70-84 | high |
| 45-69 | medium |
| 0-44 | low |

## Execution Contract

ALICE emits or persists an opportunity with `recommended_workflow`.

Workflow OS consumes that workflow key and executes the workflow.

Runtime OS monitors whether execution succeeded.

Mission Control attributes outcome and ROI back to `revenue_opportunities.id`.

## Duplicate-System Prohibition

Existing commerce-specific helpers must adapt to ALICE. They may expose view models for dashboards, but the canonical opportunity, score, forecast, priority, workflow assignment, and status must come from ALICE.
