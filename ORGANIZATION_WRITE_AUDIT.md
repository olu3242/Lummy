# ORGANIZATION WRITE AUDIT

Scope: forensic audit only. No code, schema, auth, bucket, or deploy changes were made.

## Writes To `organizations`

| File | Function | Operation | Payload | Supabase client | Auth/session available? | owner_id source | Transaction boundary |
|---|---|---|---|---|---|---|---|
| `src/repositories/runtime-bootstrap-repository.ts` | `ensureCreatorRuntimeContext(supabase, user)` | `insert` | `{ owner_id: user.id, name, slug, country: "US", currency: "USD" }` | Caller-provided client. From callback: request-cookie `createServerClient`. From login bootstrap: server cookie `createClient()`. | Expected yes after callback/login. | `user.id` from Supabase Auth user. | No DB transaction. Organization insert and membership insert are separate statements. |
| `src/repositories/onboarding-repository.ts` | `ensureOrganizationForUser(input)` | `insert` | `{ owner_id: input.userId, name: input.orgName, slug, country, currency }` | Server cookie `createClient()` | Expected yes; called by `completeOnboarding()` after `auth.getUser()` succeeds. | `input.userId`, passed as `auth.user.id` by `completeOnboarding()`. | No DB transaction. If membership insert fails, code attempts organization delete. |
| `src/server/actions/onboarding.ts` | `completeOnboarding(input)` | `update` | `{ country, currency, country_code, currency_code, locale, timezone }`, with legacy fallback to `{ country, currency }` if missing columns | Server cookie `createClient()` | Expected yes; same action first calls `auth.getUser()`. | Not applicable; update by `organization.id`. | Separate statement after organization creation. |
| `src/repositories/storefront-repository.ts` | `updateStorefrontForCurrentUser(input)` | `update` | `{ name: input.storeName }` | Server cookie `createClient()` | Expected yes; function calls `auth.getUser()` and resolves membership first. | Not applicable; update by current member org id. | Separate statement. |

## Can `owner_id` Ever Differ From Authenticated User ID?

High-confidence answer for audited onboarding paths: **not intentionally**.

- In `runtime-bootstrap-repository.ts`, `owner_id` is set directly from `user.id`, where `user` is the Supabase Auth user passed from callback/bootstrap.
- In `onboarding-repository.ts`, `owner_id` is set from `input.userId`.
- In `completeOnboarding()`, `ensureOrganizationForUser()` is called with `userId: auth.user.id`.

Potential non-code risk:
- If a caller passed an arbitrary `input.userId` to `ensureOrganizationForUser()` outside `completeOnboarding()`, `owner_id` could differ. The audited direct call from `completeOnboarding()` does not do that.

## Runtime Evidence

Synthetic production certification against `llbuddtdsdbljnsvzide` created a confirmed user, signed in, and verified `auth.getUser()` returned the same user. The attempted organization insert used matching `owner_id` and still failed:

```text
42501 new row violates row-level security policy for table "organizations"
payloadOwnerMatchesSession: true
```

This makes a simple `owner_id !== auth.uid()` mismatch unlikely for the observed failure.
