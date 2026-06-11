# ONBOARDING EXECUTION GRAPH

Scope: forensic audit only. No code, schema, auth, bucket, or deploy changes were made.

## Primary Client Flow

```text
/signup
  handleSubmit()
    createBrowserClient()
    supabase.auth.signUp()
    emailRedirectTo=/api/auth/callback?next=/onboarding

/api/auth/callback
  GET()
    createServerClient(request cookies)
    exchangeCodeForSession(code)
    ensureCreatorRuntimeContext(supabase, user)
    redirect /onboarding if profile incomplete

/login
  handleSubmit()
    createBrowserClient()
    signInWithPassword()
    POST /api/account/bootstrap
    redirect /onboarding if profile incomplete

/api/account/bootstrap
  POST()
    createClient() server cookie client
    auth.getUser()
    ensureCreatorRuntimeContext(supabase, auth.user)

/onboarding
  OnboardingFlow()
    createBrowserClient()
    auth.getUser()
    read profiles
    read onboarding_states
    autosave profile/onboarding state
    final CTA calls completeOnboarding()
```

## `ensureCreatorRuntimeContext()` Execution Tree

File: `src/repositories/runtime-bootstrap-repository.ts`

```text
ensureCreatorRuntimeContext(supabase, user)
├── read profiles by user.id
├── upsert profiles
├── if profile.organization_id exists
│   ├── read organization_members
│   └── insert organization_members if missing
├── else
│   ├── read organization_members by user.id
│   ├── if no membership
│   │   ├── read organizations by owner_id=user.id
│   │   ├── if no owned org
│   │   │   └── insert organizations
│   │   │       payload:
│   │   │       - owner_id: user.id
│   │   │       - name: user metadata or `${fullName}'s Store`
│   │   │       - slug: uniqueOrgSlug(...)
│   │   │       - country: "US"
│   │   │       - currency: "USD"
│   │   └── insert organization_members
│   │       payload:
│   │       - organization_id
│   │       - user_id: user.id
│   │       - role: "owner"
├── update profiles.organization_id
└── upsert onboarding_states
```

## `completeOnboarding()` Execution Tree

File: `src/server/actions/onboarding.ts`

```text
completeOnboarding(input)
├── createClient() server cookie client
├── auth.getUser()
├── saveOnboardingProfile(...)
│   ├── createClient() server cookie client
│   ├── auth.getUser()
│   └── upsert profiles
├── ensureOrganizationForUser(...)
│   ├── createClient() server cookie client
│   ├── read organization_members where user_id=input.userId and role='owner'
│   ├── if membership exists, return joined organization
│   ├── generate slug
│   ├── insert organizations
│   │   payload:
│   │   - owner_id: input.userId
│   │   - name: input.orgName
│   │   - slug
│   │   - country: input.country ?? "US"
│   │   - currency: input.currency ?? "USD"
│   ├── insert organization_members
│   └── return created organization
├── update organizations preferences
├── upsertStorefront(organization.id, handle)
├── update storefronts.is_active=true
├── optional createProduct(...)
├── upsert profiles onboarding_completed=true
├── upsert creator_profiles
├── upsert onboarding_states completed=true
├── verify profiles / organization_members / storefronts / onboarding_states
├── send emails fire-and-forget
└── return { organizationId, handle }
```

## First Failure Position From Runtime Evidence

```text
Confirmed signed-in user
↓
organizations insert
↓
42501: new row violates row-level security policy for table "organizations"
↓
membership/storefront/product/dashboard are not reached
```
