# AUTH CONTEXT AUDIT

Scope: forensic audit only. No code, schema, auth, bucket, or deploy changes were made.

## Client Immediately Before `organizations` Insert

### Path 1: Auth Callback / Login Bootstrap

File: `src/repositories/runtime-bootstrap-repository.ts`

```text
ensureCreatorRuntimeContext(supabase, user)
```

Client is supplied by caller:

- From `src/app/api/auth/callback/route.ts`: direct `createServerClient` using request cookies and the exchanged session.
- From `src/app/api/account/bootstrap/route.ts`: server `createClient()` reading request cookies.

Organization insert payload:

```text
owner_id: user.id
name
slug
country: "US"
currency: "USD"
```

### Path 2: Final Onboarding Server Action

File: `src/server/actions/onboarding.ts`

```text
completeOnboarding()
├── const supabase = createClient()
├── const { data: auth } = await supabase.auth.getUser()
├── if (!auth.user) throw Unauthorized
└── ensureOrganizationForUser({ userId: auth.user.id, ... })
```

File: `src/repositories/onboarding-repository.ts`

```text
ensureOrganizationForUser()
├── const supabase = createClient()
└── organizations.insert({ owner_id: input.userId, ... })
```

Important nuance: `ensureOrganizationForUser()` creates a **new** server cookie client instead of reusing the already-authenticated client from `completeOnboarding()`. In a Server Action, both should read the same request cookies, but this is still a separate auth-context boundary.

## Could This Insert Execute With `auth.uid() = NULL`?

Possible in general:

- If `ensureOrganizationForUser()` were called without valid request cookies.
- If Server Action cookies were not available to the nested server client.
- If `/api/account/bootstrap` were called without session cookies.

Observed production certification evidence:

- A confirmed synthetic user signed in successfully.
- `auth.getUser()` returned the expected user.
- The attempted organization insert used `owner_id` equal to that user id.
- The insert still failed with:

```text
42501 new row violates row-level security policy for table "organizations"
payloadOwnerMatchesSession: true
```

Therefore, for the observed failure, `auth.uid() = NULL` is **not the highest-confidence explanation**. A live RLS/policy mismatch or hidden restrictive policy is more consistent with the evidence.

## Role Expected

The insert should execute as:

```text
authenticated
```

with:

```text
auth.uid() = current Supabase Auth user id
```

It should not execute as service role in the normal onboarding path.
