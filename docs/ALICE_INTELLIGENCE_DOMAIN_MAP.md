# ALICE Intelligence Domain Map

## Purpose

This map defines every Zenith revenue intelligence domain that ALICE owns. Discovery questions must route to ALICE, not to a parallel scoring engine.

## Domain Map

| Domain | ALICE `type` | Primary Signals | ALICE Question | Output |
| --- | --- | --- | --- | --- |
| Recall Intelligence | `recall` | overdue recall count, patient value, last visit age, schedule availability | Which overdue patients can be recovered now? | recall reactivation opportunity |
| Treatment Acceptance Intelligence | `treatment_acceptance` | unscheduled treatment value, case age, provider recommendation, patient intent | Which treatment plans are most likely to convert? | treatment acceptance opportunity |
| Lead Conversion Intelligence | `lead_conversion` | open leads, lead age, source, contact attempts, appointment intent | Which leads need immediate conversion action? | lead acceleration opportunity |
| Review Intelligence | `review` | completed appointments, review deficit, sentiment, review velocity | Which patients should be asked for reviews? | review generation opportunity |
| Referral Intelligence | `referral` | loyal patients, family relationships, NPS/sentiment, accepted treatment | Which patients can generate referrals? | referral activation opportunity |
| Insurance Recovery Intelligence | `insurance_recovery` | denied claims, aging AR, eligibility issues, missing attachments | Which insurance dollars can be recovered? | insurance recovery opportunity |
| Provider Utilization Intelligence | `provider_utilization` | provider idle time, schedule gaps, chair availability, revenue/hour | Which provider capacity can be monetized? | utilization optimization opportunity |

## ALICE Inputs

ALICE accepts normalized domain signals through `AliceDomainSignal` in `src/lib/alice/revenue-opportunity-engine.ts`.

Domain adapters may collect raw PMS, CRM, claims, review, or scheduling data, but they must not score or prioritize independently.

## ALICE Outputs

ALICE outputs canonical `RevenueOpportunity` rows:

- opportunity type
- score
- estimated revenue
- confidence
- priority
- recommended workflow
- status

## Discovery Question Certification

Every discovery question can be answered by ALICE:

| Question | ALICE Answer |
| --- | --- |
| Where is the money? | ranked `revenue_opportunities` by `score` and `estimated_revenue` |
| Which domain matters most? | grouped `revenue_opportunities.type` |
| What should run next? | `recommended_workflow` |
| How confident are we? | `confidence` |
| What is the expected value? | `estimated_revenue` |
| What happened after execution? | Mission Control outcome joined to `revenue_opportunities.id` |

## Non-Goals

- Workflow OS does not score opportunities.
- Runtime OS does not choose opportunities.
- Mission Control does not create recommendations.
- Domain-specific modules do not own priority formulas.
