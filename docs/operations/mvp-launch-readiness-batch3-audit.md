# MVP Launch Readiness Audit — Batch 3

## 1) Signup/onboarding status: **operational but weak**
- Status: onboarding runtime persists organization/storefront/product via server actions.
- Risk: no fully automated E2E test executed in this batch.

## 2) Storefront runtime status: **partial**
- Status: dashboard now resolves live storefront handle from DB instead of static handle.
- Risk: storefront merchandising sections still include static/preset content in UI surfaces.

## 3) Product runtime status: **operationally visible**
- Status: product creation API has structured error responses + correlation IDs from prior batch.

## 4) Checkout/payment status: **operationally visible**
- Status: checkout/webhook routes emit correlation IDs and structured failure logs.
- Hardening: removed localhost fallback in checkout redirect URL generation; production URL now required.

## 5) Dashboard visibility status: **operational but weak**
- Status: payment summary is DB-backed, and dashboard query failures are logged.
- Risk: some dashboard panels still depend on mock data blocks.

## 6) Deployment readiness status: **partial**
- Added `/api/runtime/launch-readiness` endpoint that checks:
  - HTTPS app URL
  - non-localhost app URL
  - payment secrets presence
  - Supabase env presence
  - basic DB connectivity
  - webhook event table readability

## 7) Remaining mock/static remnants: **present**
- `src/data/mock/dashboard-overview.ts`
- Dashboard overview panel copy/cards still mock-driven.

## 8) Remaining operational risks (MVP-only)
- No automated browser E2E for creator journey in this batch.
- Mock-heavy dashboard panels may mislead creators even when payments are healthy.

## 9) Remaining MVP blockers only
- Replace remaining dashboard mock KPIs/panels with DB-backed queries or explicit "no data yet" blocks.
- Add one smoke E2E covering signup → onboarding → product → checkout creation.

## 10) Immediate launch-critical fixes remaining
1. Finish replacing `src/data/mock/dashboard-overview.ts` panels with real organization-scoped data.
2. Add CI smoke flow for onboarding + checkout session creation + webhook ingestion.
3. Add explicit operator runbook entry for `/api/runtime/launch-readiness` pre-launch checks.
