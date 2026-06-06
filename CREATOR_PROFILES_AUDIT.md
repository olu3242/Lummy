# CREATOR_PROFILES AUDIT

Scope: forensic audit only. No code, schema, auth, bucket, or deploy changes were made.

## Runtime Dependency Summary

`creator_profiles` is still required by multiple runtime paths. It has not been fully replaced by `profiles`.

## Direct Onboarding Dependency

File: `src/server/actions/onboarding.ts`

`completeOnboarding()` upserts `creator_profiles` after storefront/product/profile completion:

```text
supabase.from('creator_profiles').upsert(...)
```

This means onboarding completion is still directly dependent on `creator_profiles`.

File: `src/app/onboarding/page.tsx`

The onboarding client also writes to `creator_profiles` in `persistStepFour()`.

## Other Runtime Dependencies

Representative direct dependencies found:

| Area | Files / patterns | Dependency |
|---|---|---|
| Public storefront/product | `src/lib/queries/storefront.ts`, `src/lib/queries/creator.ts`, `src/app/api/storefront/[handle]/product/[productId]/route.ts` | Resolves creator data by handle/user. |
| Products API | `src/app/api/products/route.ts` | Looks up `creator_profiles.id` for automation event metadata. |
| Store publish | `src/app/api/store/publish/route.ts` | Reads `creator_profiles`, updates publish state, counts products by creator id. |
| Health/readiness | `src/app/api/health/route.ts`, `src/lib/runtime/launch.ts`, `src/lib/runtime/readiness.ts`, `src/lib/migrations/verify.ts` | Treats `creator_profiles` as required schema. |
| Leads/referrals/creator APIs | `src/app/api/leads/route.ts`, `src/app/api/referrals/route.ts`, `src/app/api/creator/*` | Uses `creator_profiles` as creator identity. |
| Ops/admin checks | `src/app/api/ops/*` | Several admin checks query `creator_profiles.is_admin`. |
| WhatsApp | `src/app/api/webhooks/whatsapp/route.ts`, `supabase/functions/whatsapp-webhook/index.ts`, `src/lib/whatsapp/inbox.ts` | Resolves creator and conversation ownership through `creator_profiles`. |
| Marketplace/recovery/intelligence | `src/lib/marketplace-*`, `src/lib/recovery-kernel/*`, `src/lib/retention-intelligence/*` | Uses `creator_profiles` as creator entity. |

## Migrations / RLS References

`creator_profiles` is defined in `supabase/migrations/001_initial_schema.sql`, and many early migrations reference it as the canonical creator id table.

Later org-centric migrations introduce:

```text
profiles
organizations
organization_members
storefronts
products
```

but the codebase still contains substantial legacy/runtime dependencies on `creator_profiles`.

## Live Schema Evidence

Production PostgREST check against `llbuddtdsdbljnsvzide` returned:

```text
PGRST205 Could not find the table 'public.creator_profiles' in the schema cache
```

This is a downstream onboarding blocker after organization creation. It is not the first observed failure, because organization insertion fails before this upsert is reached.

## Answer

- Is `creator_profiles` still required? **Yes.**
- Was it fully replaced by `profiles`? **No.**
- Is onboarding dependent on it? **Yes, in `completeOnboarding()` and onboarding step persistence.**
