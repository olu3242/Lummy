# WHATSAPP DEPENDENCY AUDIT

Scope: forensic audit only. No code, schema, auth, bucket, or deploy changes were made.

## Runtime Files

| File | Purpose | Tables / columns expected |
|---|---|---|
| `src/app/api/webhooks/whatsapp/route.ts` | Primary Meta webhook endpoint | `creator_profiles`, `whatsapp_events.creator_id`, `whatsapp_events.event_type`, `whatsapp_events.metadata`, `creator_metrics_daily` |
| `supabase/functions/whatsapp-webhook/index.ts` | Backup Edge Function webhook | `creator_profiles`, `whatsapp_events`, `creator_metrics_daily` |
| `src/lib/whatsapp/inbox.ts` | Creator inbox query and updates | `whatsapp_events.creator_id`, `event_type`, `metadata`, `is_read`, `is_followed_up`, `creator_note`, `followed_up_at` |
| `src/app/(dashboard)/dashboard/whatsapp/page.tsx` | Inbox UI | Uses inbox data model from runtime libs/APIs |
| `src/app/api/whatsapp/track/route.ts` | WhatsApp click/conversation/conversion tracking | `whatsapp_events` |
| `src/app/api/whatsapp/inbox/products/route.ts` | Product picker for inbox | `profiles`, `storefronts`, `products` |
| `src/app/api/whatsapp/inbox/send-link/route.ts` | Sends/records payment links | `whatsapp_events`, `storefronts`, `products` |

## Required Runtime Schema

The active runtime expects:

```text
creator_profiles
whatsapp_events.id
whatsapp_events.creator_id
whatsapp_events.event_type
whatsapp_events.metadata
whatsapp_events.is_read
whatsapp_events.is_followed_up
whatsapp_events.creator_note
whatsapp_events.followed_up_at
whatsapp_events.created_at
```

## Live Schema Evidence

Production read-only column checks against `llbuddtdsdbljnsvzide` returned:

```text
creator_profiles: PGRST205 table not found
whatsapp_events.creator_id: 42703 column does not exist
whatsapp_events.is_read: 42703 column does not exist
whatsapp_events.is_followed_up: 42703 column does not exist
whatsapp_events.creator_note: 42703 column does not exist
whatsapp_events.followed_up_at: 42703 column does not exist
```

Columns confirmed present:

```text
whatsapp_events.id
whatsapp_events.event_type
whatsapp_events.metadata
whatsapp_events.created_at
```

## Does Onboarding Depend On WhatsApp?

Directly for basic org/storefront creation: **No**.

Indirectly during onboarding completion: **Yes, partially**, because:

- `completeOnboarding()` upserts `creator_profiles` with `whatsapp_number`.
- The onboarding client updates `creator_profiles` in `persistStepFour()`.

WhatsApp inbox itself is downstream of onboarding. It is not the first failure in the observed execution chain.
