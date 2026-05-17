# Payment Reliability Report

## Scope

Reviewed Stripe/Paystack checkout routes, webhook route, package payment adapters, replay service, reconciliation service, payout service, and payment runtime env checks.

## Strengths

- Checkout creates pending orders before provider handoff.
- Webhooks require provider signatures before processing.
- Stripe webhook timestamp tolerance is enforced at five minutes.
- Duplicate webhook events are treated as successful replays when a unique/idempotency conflict is detected.
- Correlation IDs are returned in checkout and webhook responses.
- Runtime readiness checks validate Stripe, Paystack, Supabase, and app URL environment presence.

## Gaps

- Stripe adapter in `packages/payments` uses HMAC over raw body rather than Stripe's exact signed payload format; the app route implements the more correct timestamped Stripe check.
- Checkout provider adapters currently return test checkout URLs and should be replaced by real Checkout Sessions or Paystack transaction initialization before production.
- The payment failure sink currently writes to `messaging_failures`, which makes payment incident analytics harder.
- Payout service records initiated payouts but does not yet enforce provider-side payout confirmation or retry-storm controls.

## Stripe Alignment

For one-time web checkout, Stripe best practice is Checkout Sessions. The current app-level checkout direction is compatible with that target, but the placeholder provider implementation must be replaced by real Checkout Sessions before live traffic.

## Recommendations

- Promote app-route Stripe signature logic into the package adapter or wrap official Stripe SDK verification.
- Preserve duplicate webhook idempotency behavior and add tests around replayed events.
- Add payment-specific failure persistence.
- Add provider health/fallback policy for degraded Paystack or Stripe paths.
