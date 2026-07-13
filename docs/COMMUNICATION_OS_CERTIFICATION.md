# Communication OS Certification

Date: 2026-06-16

## Overall Status

PARTIAL

Readiness score: 82 / 100

## Implemented

- PASS: Centralized template registry at `src/lib/communications/template-registry.ts`
- PASS: Safe variable rendering and missing-variable validation at `src/lib/communications/render-template.ts`
- PASS: Single send entrypoint at `src/lib/communications/communication-service.ts`
- PASS: Workflow event router for `report.generated`, `lead.created`, `appointment.created`, `appointment.cancelled`, `recall.due`, `patient.no_show`, `treatment.acceptance`, and `review.request`
- PASS: Delivery evidence table migration at `supabase/migrations/072_communication_os.sql`
- PASS: Event tracking table for `sent`, `opened`, `clicked`, `bounced`, and `complained`
- PASS: A/B subject support through `subjectA`, `subjectB`, random assignment, and persisted `variant`
- PASS: Mission Control delivery console at `/admin/communications`
- PASS: Template preview and test-send center at `/admin/communications/templates`
- PASS: Provider webhook endpoint at `/api/communications/events`
- PASS: Existing onboarding completion email path routed through Communication OS
- PASS: Existing automation welcome email path routed through Communication OS

## Template Inventory

The registry contains all 18 requested templates:

1. `report.generated`
2. `lead.created`
3. `appointment.created`
4. `appointment.reminder.24h`
5. `appointment.reminder.1h`
6. `appointment.cancelled`
7. `onboarding.started`
8. `onboarding.completed`
9. `pms.connection.required`
10. `recall.due`
11. `patient.no_show`
12. `treatment.acceptance`
13. `review.request`
14. `review.followup`
15. `inactive.lead.7day`
16. `inactive.lead.30day`
17. `executive.weekly.report`
18. `mission.control.alert`

## Persistence Evidence

`communication_deliveries` captures:

- `organization_id`
- `template_id`
- `template_version`
- `event_name`
- `recipient`
- `subject`
- `provider`
- `provider_status`
- `provider_message_id`
- `variant`
- `correlation_id`
- `metadata`
- `error`
- `sent_at`
- `delivered_at`

`communication_events` captures:

- `delivery_id`
- `organization_id`
- `template_id`
- `recipient`
- `event_type`
- `metadata`

## Runtime Semantics

- No workflow code should call Resend directly for registered Communication OS templates.
- `sendCommunication()` renders and validates templates before sending.
- Missing required variables throw `communication_template_variables_missing`.
- Delivery-row creation failures throw immediately.
- Provider failures are persisted as `provider_status = failed`, then thrown as `communication_provider_failed`.
- Delivery update failures throw immediately.

## Local Verification

- PASS: `pnpm typecheck`
- PASS: `pnpm lint`
- PASS: `pnpm build`

## Remaining Runtime Certification

- PARTIAL: `supabase/migrations/072_communication_os.sql` must be applied to the target Supabase project.
- PARTIAL: A real test send must be executed with `RESEND_API_KEY` configured.
- PARTIAL: Provider webhook delivery should be verified with `COMMUNICATION_WEBHOOK_SECRET` configured when webhook signing is enabled.

## GO / NO-GO

GO for staging deployment after applying migration `072_communication_os.sql`.

NO-GO for production certification until a real provider send creates a `communication_deliveries` row and a provider webhook creates a `communication_events` row.
