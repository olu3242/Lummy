# Multi-Tenant Security Audit
**Date:** 2026-05-25  
**Scope:** RLS enforcement and organization_id scoping across key data access paths

---

## Summary Table

| Path | Status | Notes |
|---|---|---|
| `createClient()` vs `createAdminClient()` usage | ✅ properly scoped | Server component uses anon client (RLS); admin client only in server actions/webhook |
| Orders dashboard page | ✅ properly scoped | Fetches via `/api/orders` which uses `getCurrentOrgId()` + org filter |
| Products dashboard page | ✅ properly scoped | Calls `POST /api/products` which scopes by `organization_id` |
| `order-repository.ts` — `createPendingOrder` | ✅ properly scoped | `.eq('organization_id', input.organizationId)` on product lookup |
| `order-repository.ts` — `getDashboardPayments` | ✅ properly scoped | `.eq('organization_id', organizationId)` via `getCurrentOrgId()` |
| `webhook/route.ts` — order inserts | ✅ properly scoped | Uses `parsed.metadata.organizationId` from verified webhook payload |
| Storefront query (`[handle]/page.tsx`) | ✅ properly scoped | Queries by `handle` which is unique per creator |
| Migration 041 new tables | ⚠️ partial | RLS enabled, read policies exist; write policies restrict to service role on sensitive tables |

---

## Detail: createClient vs createAdminClient

**File:** `src/lib/supabase/server.ts`

```typescript
export const createClient = () => { /* uses anon key — RLS applies */ }
export { supabaseAdmin as createAdminClient }  // service role — bypasses RLS
```

`createAdminClient()` is used in:
- `src/app/api/payments/webhook/route.ts:111` — fetches order/org data after webhook verification ✅
- `src/lib/ai/gateway.ts:175` — budget check and cost recording ✅
- All cron jobs — appropriately uses admin client for batch operations ✅

No client-side exposure of service role key found.

---

## Detail: Orders Dashboard

**File:** `src/app/(dashboard)/dashboard/orders/page.tsx:418`

Fetches `GET /api/orders`. The API route calls `getDashboardPayments()` from the order repository which resolves `organizationId` via `getCurrentOrgId()` — reads `auth.getUser()` → `profiles.organization_id` → scopes all queries to that org. ✅

**Gap:** The `handleStatusChange` function (line 428-430) updates local React state only — no API call to persist status changes to the database. Status updates made in the drawer are lost on page refresh.

---

## Detail: Webhook — Tenant Scoping

**File:** `src/app/api/payments/webhook/route.ts:78-80`

```typescript
await supabase.from('provider_webhook_events').insert({
  tenant_id: parsed.metadata.organizationId,  // from webhook payload
  ...
})
```

`organizationId` comes from `parsed.metadata.organizationId` which is embedded in the Paystack/Stripe metadata at payment initiation time. If an attacker crafts a webhook with a different `organizationId`, signature verification would fail first (line 64). After verification, the tenant_id is trusted. ✅

---

## Detail: Migration 041 — New Tables RLS

**File:** `supabase/migrations/041_enterprise_automation_runtime.sql:232-282`

```sql
alter table if exists public.automation_logs          enable row level security;
alter table if exists public.workflow_registry        enable row level security;
alter table if exists public.workflow_versions        enable row level security;
alter table if exists public.ai_usage_budgets         enable row level security;
alter table if exists public.ai_cost_events           enable row level security;
alter table if exists public.security_events          enable row level security;
alter table if exists public.feature_flags            enable row level security;
```

Policies:
- `automation_logs_read_own` — tenants can read their own logs ✅
- `workflow_registry_public_read` — all authenticated users can read registry ✅  
- `feature_flags_public_read` — all authenticated users can read flags ✅
- `ai_budgets_org_read` — org-scoped read ✅
- `human_queue_service_only` — write restricted to service role ✅
- `security_events_service_only` — write restricted to service role ✅

**Gap:** `automation_logs` has a read policy but no explicit write policy beyond service role. The migration does not define an insert policy for `automation_logs` — if the table defaults to deny-all, then the automation SDK (which uses the admin client) would still work, but direct anon-client writes would be blocked, which is correct.

---

## Action Items

1. **P1** — Wire `handleStatusChange` in the orders dashboard to call `PATCH /api/orders/:id` so status updates persist
2. **P2** — Add explicit `INSERT` policy to `automation_logs` documenting service-role-only write access
3. **P2** — Audit `createAdminClient()` call sites (5 files) to ensure none are imported into client components
