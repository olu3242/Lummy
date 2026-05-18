# LUMMY — MVP Task 02: Organization + Onboarding Operationalization

Date: 2026-05-16

## 1) Onboarding runtime audit

| Flow | Status | Notes |
|---|---|---|
| Onboarding route | Partial | Multi-step wizard exists but final completion previously did not persist tenant context. |
| Organization/workspace creation | Partial → Operationalized in this patch | Added idempotent server-side organization creation and owner membership write. |
| Onboarding persistence | Partial → Operationalized in this patch | Completion now writes profile onboarding completion flag server-side. |
| Dashboard redirect | Partial → Operationalized in this patch | Final onboarding CTA now calls backend action then redirects only on success. |
| Tenant initialization | Partial → Operationalized in this patch | Organization + membership + storefront persisted together in action. |
| Auth session propagation | Partial | Middleware session update/protected redirects exist; needs E2E verification. |
| Onboarding completion state | Partial → Operationalized in this patch | `profiles.onboarding_completed` and `onboarding_step` now updated on completion. |

## 2) Organization creation verification

Implemented in `completeOnboarding` flow:
- Authenticated user required.
- Idempotent org lookup by `owner_id` before insert.
- Slug normalization + reserved slug protection + collision suffix fallback.
- Owner membership upsert (`organization_members`) for org context propagation.

## 3) Session propagation status

- Middleware enforces protected routes and onboarding redirect checks.
- Signup redirects to onboarding; onboarding now writes completion state before dashboard redirect.
- Status: **Partial (code wired, runtime verification pending)**.

## 4) Tenant isolation status

- Org writes are owner-linked (`owner_id`) and membership-linked (`organization_id`, `user_id`).
- Storefront/product writes now use created organization id from authenticated context.
- Status: **Partial (RLS policy behavior must be verified in running environment)**.

## 5) Mock/disconnected onboarding flows

- Onboarding wizard still has rich UI-only steps for some fields (bank details not persisted yet).
- Public store/share loop still not validated in this task.

## 6) Exact files requiring modification (done now)

1. `src/repositories/onboarding-repository.ts`
2. `src/server/actions/onboarding.ts`
3. `src/app/onboarding/page.tsx`

## 7) API/backend gaps (remaining)

1. Persist bank setup step data into tenant-linked payout settings table.
2. Persist onboarding step-by-step progress for resumable partial completion.
3. Add explicit onboarding failure logging sink (minimal DB log/event table or server log wrapper).

## 8) Dashboard authorization status

- Protected route middleware exists for `/dashboard`.
- Onboarding completion now server-backed before redirect.
- Status: **Partial operational** (needs E2E auth + refresh + cross-tenant tests).

## 9) MVP risks remaining

1. If RLS policies are missing/misconfigured, tenant writes may fail or leak.
2. Bank setup stage is currently not persisted.
3. Dashboard still contains mock-derived overview data in parts of UI.

## 10) Immediate fixes only

1. Persist bank setup fields in onboarding completion.
2. Persist step-level onboarding progress (`onboarding_step`) on each step transition.
3. Replace remaining dashboard mock data with tenant-query-backed data.
4. Run one E2E test: signup → onboarding completion → dashboard access with refreshed session.
