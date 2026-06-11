# ROOT CAUSE REPORT

Scope: forensic audit only. No code, schema, auth, bucket, or deploy changes were made.

Canonical project: `llbuddtdsdbljnsvzide`.

## First Failure In Execution Chain

```text
Signup / Login
↓
Session established
↓
Bootstrap / Onboarding attempts organization creation
↓
organizations insert  ← FIRST FAILURE
↓
organization_members creation
↓
storefront creation
↓
creator_profiles upsert
↓
product creation
↓
dashboard
```

Observed first failure:

```text
42501 new row violates row-level security policy for table "organizations"
```

Runtime certification evidence:

```text
confirmed user sign in: PASS
authenticated client getUser: PASS
organization creation via authenticated user/RLS: FAIL
payloadOwnerMatchesSession: true
```

## High Confidence Findings

### 1. The first actual runtime failure is `organizations` insert.

`organization_members`, `storefronts`, `products`, dashboard, storage, and WhatsApp are downstream. They are not the first failure.

### 2. The failure is not explained by an obvious `owner_id` mismatch in application code.

Audited paths set `owner_id` from the authenticated Supabase user:

- `runtime-bootstrap-repository.ts`: `owner_id: user.id`
- `completeOnboarding()` -> `ensureOrganizationForUser()`: `userId: auth.user.id`
- `onboarding-repository.ts`: `owner_id: input.userId`

The synthetic runtime test confirmed `owner_id` matched the signed-in user id.

### 3. The failure is not best explained by missing storage buckets.

Storage buckets are missing, but uploads occur after organization/storefront/product context exists. Organization creation fails first.

### 4. The failure is not best explained by WhatsApp schema drift.

WhatsApp schema is incompatible, but WhatsApp inbox/event persistence is downstream of onboarding bootstrap.

### 5. `creator_profiles` is missing from live schema and remains a real downstream blocker.

`completeOnboarding()` upserts `creator_profiles`, and many runtime paths still query it. However, this occurs after organization creation, so it is not the first failure.

## Medium Confidence Findings

### 1. Live `organizations` RLS differs from the expected effective behavior.

The provided policy appears reasonable:

```sql
WITH CHECK (owner_id = auth.uid())
```

But production behavior rejects an insert where:

```text
owner_id == authenticated user id
```

Most likely explanations:

- the live policy is not actually the same as the provided policy;
- an additional restrictive policy exists;
- the policy/helper/function search path or grants differ in production;
- the request reaches Postgres with a different effective auth context than Supabase client `getUser()` reports.

The last possibility is lower than the policy-drift explanations because `getUser()` succeeded and the client used the same session for the insert in the focused test.

### 2. Nested server client creation is a risk boundary.

`completeOnboarding()` authenticates with one server client, then `ensureOrganizationForUser()` creates a new server client. In normal Server Action execution both should read the same cookies, but this is still an auth-context boundary worth eliminating later.

This is not proven to be the first failure because the separate synthetic browser-session test also failed with matching owner/session.

## Low Confidence Findings

### 1. `auth.uid()` could be null in some untested callback/server-action edge case.

It is technically possible if request cookies are absent or malformed. Current evidence does not make this the leading explanation.

### 2. Migration history drift could explain multiple downstream failures.

Missing `creator_profiles`, missing WhatsApp columns, missing global preference columns, and missing runtime buckets all indicate drift. However, migration history itself was not used as the root-cause proof; live runtime checks were.

## Downstream Confirmed Blockers

### Missing table

```text
creator_profiles: PGRST205 table not found
```

### Missing columns

```text
organizations.country_code
organizations.currency_code
organizations.locale
organizations.timezone
storefronts.locale
storefronts.timezone
whatsapp_events.creator_id
whatsapp_events.is_read
whatsapp_events.is_followed_up
whatsapp_events.creator_note
whatsapp_events.followed_up_at
```

### Missing runtime buckets

```text
creator-assets
product-images
```

## Final Root Cause Determination

The first true root cause preventing onboarding completion is:

```text
Production RLS/effective auth behavior rejects the first organization insert for an authenticated creator, even when owner_id matches the authenticated user id.
```

The exact failing table:

```text
organizations
```

The exact failing operation:

```text
insert organizations with owner_id = current authenticated user id
```

The exact observed error:

```text
42501 new row violates row-level security policy for table "organizations"
```

Until that is resolved or proven otherwise through direct policy introspection, onboarding cannot proceed to membership, storefront, product, or dashboard certification.
