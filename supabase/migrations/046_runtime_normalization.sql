-- ── Migration 046: Runtime Normalization ─────────────────────────────────────
--
-- 1. Fix workflow_registry trigger names to match actual AutomationEventName
--    values (underscore notation). Previous migration used dot notation which
--    caused getWorkflowByEventName() to return null for all events.
--
-- 2. Add explicit `status` column to automation_events for clear lifecycle
--    visibility without requiring derived logic.

-- ── Fix workflow_registry trigger names ───────────────────────────────────────

update public.workflow_registry set triggers = '["whatsapp_message_received"]'
  where workflow_id = 'WA-01';

update public.workflow_registry set triggers = '["lead_scored"]'
  where workflow_id = 'WA-02';

update public.workflow_registry set triggers = '["payment_received"]'
  where workflow_id = 'WA-04';

update public.workflow_registry set triggers = '["payment_received"]'
  where workflow_id = 'PAY-01';

update public.workflow_registry set triggers = '["payment_received", "order_created"]'
  where workflow_id = 'PAY-02';

update public.workflow_registry set triggers = '["whatsapp_message_received", "lead_scored"]'
  where workflow_id = 'AM-01';

update public.workflow_registry set triggers = '["weekly_digest_requested"]'
  where workflow_id = 'CH-01';

update public.workflow_registry set triggers = '["onboarding_completed"]'
  where workflow_id = 'OB-01';

-- ── Add explicit lifecycle status to automation_events ────────────────────────
-- Replaces derived logic (processed+processing boolean combination) with
-- a direct, queryable status column.

alter table if exists public.automation_events
  add column if not exists status text not null default 'pending'
    check (status in ('pending','processing','retrying','completed','failed','dead_letter'));

-- Backfill status from existing boolean flags
update public.automation_events set status =
  case
    when processed = true  and failed_at is null     then 'completed'
    when processed = true  and failed_at is not null then 'dead_letter'
    when processing = true                           then 'processing'
    when attempt_count > 0 and failed_at is not null then 'retrying'
    else 'pending'
  end
where status = 'pending';

-- Index status for processor query (most reads are on pending/retrying)
create index if not exists idx_automation_events_status
  on public.automation_events(status, created_at asc)
  where status in ('pending', 'retrying');

-- ── Insert missing workflow entries if not present ────────────────────────────

insert into public.workflow_registry (workflow_id, name, description, status, triggers, queue_name, sla_max_ms)
values
  ('PAY-03', 'Payment Failed Handler', 'Notify creator and emit recovery workflow on payment failure', 'active',
   '["payment_failed"]', 'payment-jobs', 15000),
  ('STO-01', 'Storefront Published',   'Welcome workflow triggered when creator goes live',             'active',
   '["storefront_published"]', 'onboarding-jobs', 30000),
  ('PRD-01', 'Product Created',        'First-product milestone and catalogue growth tracking',         'active',
   '["product_created"]', 'analytics-jobs', 10000),
  ('CHK-01', 'Checkout Abandoned',     'Recovery workflow for abandoned checkouts',                     'active',
   '["checkout_abandoned"]', 'payment-jobs', 3600000)
on conflict (workflow_id) do nothing;
