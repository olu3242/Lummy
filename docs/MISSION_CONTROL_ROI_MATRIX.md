# Mission Control ROI Matrix

## Purpose

Mission Control measures ALICE outcomes. It does not discover, score, forecast, or recommend opportunities.

## ROI Matrix

| ALICE Type | Opportunity Value | Workflow Outcome | Mission Control ROI Metric |
| --- | --- | --- | --- |
| `recall` | expected recall production | appointment booked, appointment completed | recovered recall revenue / forecasted recall revenue |
| `treatment_acceptance` | unscheduled treatment value | plan accepted, treatment scheduled | accepted treatment value / forecasted value |
| `lead_conversion` | expected lead value | consult booked, patient converted | converted lead revenue / forecasted lead value |
| `review` | acquisition lift estimate | review submitted, rating improved | incremental booked leads attributed to review lift |
| `referral` | expected referral value | referral submitted, referral appointment booked | referral revenue / forecasted referral value |
| `insurance_recovery` | denied or delayed claim value | claim resubmitted, payment received | recovered insurance dollars / forecasted recoverable AR |
| `provider_utilization` | idle capacity value | schedule gap filled, provider production captured | filled production / forecasted idle capacity value |

## Outcome States

Mission Control measures opportunity lifecycle using ALICE status:

- `detected`
- `assigned`
- `in_progress`
- `won`
- `lost`
- `dismissed`

## Required Mission Control Views

1. Forecasted revenue by ALICE domain
2. Recovered revenue by ALICE domain
3. Workflow conversion by recommended workflow
4. Forecast accuracy by opportunity type
5. Open opportunities by priority
6. Lost opportunities by failure reason
7. Runtime failures blocking revenue recovery

## ROI Formula

```text
roi_rate = recovered_revenue / estimated_revenue
```

When recovered revenue is unknown, Mission Control reports operational conversion instead:

```text
workflow_conversion = won_opportunities / assigned_opportunities
```

## Certification

Every workflow is measurable because Workflow OS must carry `revenue_opportunity_id` through execution evidence and Mission Control reads outcomes against that id.
