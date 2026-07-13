-- Revenue Assessment delivery state hardening.
-- Prevents customer-facing false success when report email delivery is rejected.

alter table public.communication_deliveries
  add column if not exists delivery_state text null,
  add column if not exists failure_reason text null;

alter table public.communication_deliveries
  drop constraint if exists communication_deliveries_delivery_state_check;

alter table public.communication_deliveries
  add constraint communication_deliveries_delivery_state_check
  check (
    delivery_state is null
    or delivery_state in (
      'report.generated',
      'report.delivery.pending',
      'report.delivery.sent',
      'report.delivery.failed'
    )
  );

alter table public.communication_events
  drop constraint if exists communication_events_event_type_check;

alter table public.communication_events
  add constraint communication_events_event_type_check
  check (event_type in (
    'sent',
    'opened',
    'clicked',
    'bounced',
    'complained',
    'report.delivery.failed'
  ));

create index if not exists communication_deliveries_delivery_state_idx
  on public.communication_deliveries(delivery_state, created_at desc)
  where delivery_state is not null;

insert into public.workflow_registry (workflow_id, name, description, status, triggers, queue_name, sla_max_ms)
values
  (
    'LEAD-REPORT-DELIVERY-FAILURE',
    'Lead Operations Report Delivery Failure',
    'Create Lead Operations Alert when a revenue assessment report email delivery fails',
    'active',
    '["report.delivery.failed"]',
    'lead-ops',
    15000
  )
on conflict (workflow_id) do nothing;
