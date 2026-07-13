# Workflow Assignment Matrix

## Purpose

ALICE recommends workflows. Workflow OS executes them. This file maps canonical ALICE opportunity types to Workflow OS workflow keys.

## Matrix

| ALICE Type | Recommended Workflow | Workflow OS Responsibility | Runtime OS Monitoring | Mission Control Measurement |
| --- | --- | --- | --- | --- |
| `recall` | `recall.reactivation` | send recall outreach, book appointment, handle follow-up | delivery status, retries, booking task completion | recall bookings, recovered revenue |
| `treatment_acceptance` | `treatment.acceptance.recovery` | send treatment plan follow-up and assign coordinator task | outreach success, coordinator SLA | accepted treatment value |
| `lead_conversion` | `lead.conversion.acceleration` | contact lead, schedule consult, escalate stale leads | speed-to-lead, failed contact attempts | lead-to-appointment conversion |
| `review` | `review.generation` | request review after successful appointment | message delivery, link click, suppression rules | review count, rating velocity |
| `referral` | `referral.activation` | request referral from eligible patient | campaign delivery, opt-out events | referrals generated, referral revenue |
| `insurance_recovery` | `insurance.recovery` | create claim recovery task, request missing info, resubmit | task aging, claim submission success | recovered AR, denial reversal rate |
| `provider_utilization` | `provider.schedule.optimization` | fill schedule gaps, rebalance provider load | schedule fill SLA, capacity alerts | filled hours, revenue per provider hour |

## Assignment Rules

1. ALICE assigns `recommended_workflow`.
2. Workflow OS receives the workflow key and opportunity id.
3. Workflow OS writes execution evidence against the opportunity id.
4. Runtime OS monitors execution health.
5. Mission Control measures financial and operational outcome.

## Escalation

| Priority | Workflow OS Behavior |
| --- | --- |
| critical | immediate execution and human escalation |
| high | same-day execution |
| medium | scheduled execution within active campaign window |
| low | batch into next optimization cycle |

## Certification

Every ALICE opportunity can be assigned because every canonical `type` has exactly one default `recommended_workflow` in `ALICE_WORKFLOW_ASSIGNMENTS`.
