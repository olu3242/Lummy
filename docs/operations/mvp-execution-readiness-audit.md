# LUMMY — MVP Execution Readiness Audit

Date: 2026-05-15
Mode: Operational MVP only (conversion loop validation)

## 1) Current MVP readiness audit

| Flow | Classification | Notes |
|---|---|---|
| Landing page CTAs | Partially wired | CTA components exist, but lead/demo persistence wiring not fully evidenced. |
| Signup flow | Partially wired | Updated to real Supabase `auth.signUp` with onboarding redirect; remaining confirmation edge-cases need testing. |
| Auth/session persistence | Partially wired | Supabase client/server/middleware helpers exist; full end-to-end session durability not yet validated in test artifacts. |
| Organization/workspace creation | Partially wired | `saveOnboardingProfile` upserts `profiles` + `organizations`; org ID propagation from onboarding still incomplete. |
| Onboarding flow | Partially wired | Rich UI exists; backend persistence hooks exist but not fully connected for every step. |
| Storefront creation | Partially wired | `upsertStorefront` exists but requires reliable organization ID binding from authenticated owner. |
| Product/service creation | Partially wired | `createProduct` repository exists; no fully verified UI/API path audit evidence in this pass. |
| Public storefront access | Disconnected | Public storefront route and share link flow are not clearly verified as production-ready. |
| Checkout/payment flow | Partially wired | Provider adapters/webhook scaffolding exists; complete creator→customer checkout validation pending. |
| Dashboard loading | Mixed (real + mock) | Dashboard still imports mock overview data helpers; operational data sources are incomplete. |

## 2) Verified operational flows

- Signup now uses real Supabase authentication instead of timer-based fake success.
- Signup handle availability now checks real storefront handle collisions in database.
- Signup successful completion redirects to onboarding flow for continuation of business loop.

## 3) Broken/disconnected flows

- Public storefront share/purchase loop not yet proven end-to-end.
- Onboarding-to-organization ID propagation is not fully guaranteed.
- Dashboard business metrics still include mock-oriented helper pathways.

## 4) Mock/static implementations discovered

- Previous signup completion used `setTimeout` + `window.location.href` fake success behavior.
- Dashboard utility layer currently depends on `src/data/mock/dashboard-overview` artifacts.

## 5) Exact files requiring modification (next immediate pass)

1. `src/app/onboarding/page.tsx` — bind wizard submission to server action + org/storefront/product persistence.
2. `src/server/actions/onboarding.ts` — derive organization id from authenticated user before storefront upsert.
3. `src/repositories/onboarding-repository.ts` — return org row for downstream usage.
4. `src/app/(dashboard)/dashboard/page.tsx` and `src/lib/dashboard-overview.ts` — remove remaining mock metric dependencies.
5. `src/app/api/...` routes for storefront/product/order/checkout where missing operational handlers are identified.

## 6) Exact backend/API gaps

- Missing unified onboarding completion API that atomically creates org + storefront + first product.
- Missing explicit checkout/order write path proof tying payment webhook events to creator dashboard state.
- Missing evidence of tenant-scoped access checks in all write paths used by onboarding and product management.

## 7) Payment flow status

- Status: **Partially wired**.
- Providers and webhook scaffolding exist; deterministic end-to-end creator monetization verification remains pending.

## 8) Auth + org isolation status

- Status: **Partially wired**.
- Supabase auth/middleware and org persistence primitives exist, but full org-scoped query enforcement across creator flow remains to be validated.

## 9) Runtime risks for MVP launch

- Incomplete onboarding persistence could produce abandoned/invalid creator workspaces.
- Mock-derived dashboard data can misrepresent business truth.
- Checkout/webhook reconciliation not fully validated in creator-visible order/payment lifecycle.

## 10) Recommended immediate fixes only

1. Wire onboarding submit to persisted org/storefront/product creation in a single backend action.
2. Replace remaining dashboard mock metrics with persisted query-backed data.
3. Add minimal API-level error logging for onboarding + checkout + webhook failures.
4. Execute one end-to-end creator trial (signup→onboarding→storefront→product→checkout→dashboard) and record pass/fail artifacts.
