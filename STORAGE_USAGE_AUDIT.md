# STORAGE USAGE AUDIT

Scope: forensic audit only. No code, schema, auth, bucket, or deploy changes were made.

## Runtime Storage References

| File | Reference | Bucket |
|---|---|---|
| `src/lib/supabase/storage.ts` | `BUCKETS.creatorAssets` | `creator-assets` |
| `src/lib/supabase/storage.ts` | `BUCKETS.productImages` | `product-images` |
| `src/lib/supabase/storage.ts` | `supabase.storage.from(bucket).upload(...)` | dynamic from `BUCKETS` |
| `src/lib/supabase/storage.ts` | `supabase.storage.from(bucket).getPublicUrl(...)` | dynamic from `BUCKETS` |
| `src/lib/supabase/storage.ts` | `supabase.storage.from(bucket).remove(...)` | dynamic from `BUCKETS` |
| `src/app/api/upload/route.ts` | `BUCKETS.productImages` | `product-images` |
| `src/app/api/upload/route.ts` | `BUCKETS.creatorAssets` | `creator-assets` |
| `src/lib/storage/continuity.ts` | `REQUIRED_BUCKETS` | `creator-assets`, `product-images` |

## Bucket Use By Feature

| Bucket | Referenced by onboarding? | Referenced by products? | Referenced by storefront? | Notes |
|---|---:|---:|---:|---|
| `creator-assets` | Yes, via `/api/upload` for avatar/banner/default creator uploads | No direct product path | Yes, creator/storefront assets | Runtime bucket constant. |
| `product-images` | Yes, if onboarding/product flow uploads product image | Yes | Public storefront displays product `image_url` after product creation | Runtime bucket constant. |

## Migration References

| Migration | Buckets |
|---|---|
| `supabase/migrations/003_rls_hardening.sql` | `creator-assets`, `product-images` |
| `supabase/migrations/064_org_storage_hydration.sql` | `creator-assets`, `product-images` |
| `supabase/migrations/029_phase10_foundation.sql` | `avatars`, `storefronts`, `products` |
| `supabase/migrations/040_runtime_foundation_reconciliation.sql` | `avatars`, `storefronts`, `products` |

## Live Bucket Inventory Observed

Read-only production check against `llbuddtdsdbljnsvzide` returned:

```text
Lummy AI
avatars
storefronts
products
```

Runtime bucket references found in code:

```text
creator-assets
product-images
```

Actual missing runtime buckets:

```text
creator-assets
product-images
```

This is not the first onboarding failure, because organization creation fails before product/image upload. It is a downstream commerce/storage blocker.
