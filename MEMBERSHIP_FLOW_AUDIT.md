# MEMBERSHIP FLOW AUDIT

Scope: forensic audit only. No code, schema, auth, bucket, or deploy changes were made.

## Writes To `organization_members`

| File | Function | Operation | Payload | Dependency | Supabase client |
|---|---|---|---|---|---|
| `src/repositories/runtime-bootstrap-repository.ts` | `ensureCreatorRuntimeContext()` | `insert` | `{ organization_id, user_id: user.id, role: "owner" }` | Requires an existing `organizationId`, either from profile, existing membership, owned org, or newly inserted organization. | Caller-provided client from callback/bootstrap. |
| `src/repositories/onboarding-repository.ts` | `ensureOrganizationForUser()` | `insert` | `{ organization_id: createdOrg.data.id, user_id: input.userId, role: "owner" }` | Requires successful `organizations` insert first. | Server cookie `createClient()`. |

## Ordering

Organization creation occurs before membership creation in both canonical bootstrap paths:

```text
organizations insert
↓
organization_members insert
```

Membership creation does not occur before organization creation for a brand-new creator.

## Circular Dependency Assessment

At the intended policy level, no circular dependency should exist if `organizations` can be inserted with `owner_id = auth.uid()`.

The provided helper `public.is_org_member(org_id)` grants membership-like access when either:

```sql
organizations.owner_id = auth.uid()
```

or:

```sql
organization_members.user_id = auth.uid()
```

Therefore, after a valid organization row exists, owner membership insertion should be able to pass checks that use `is_org_member(organization_id)`.

However, runtime never reaches that point in the failed certification because the first `organizations` insert fails with:

```text
42501 new row violates row-level security policy for table "organizations"
```

## First Membership-Relevant Failure

Membership creation is downstream and blocked. There is no evidence that `organization_members` is the first failure.
