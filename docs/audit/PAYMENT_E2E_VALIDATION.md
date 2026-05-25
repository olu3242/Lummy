# Payment E2E Validation
**Date:** 2026-05-25  
**Scope:** Complete payment flow from storefront checkout to creator notification

---

## Flow Status Summary

| Step | Status | File | Notes |
|---|---|---|---|
| 1. Checkout page — product load | ❌ missing | `src/app/[handle]/[productId]/checkout/page.tsx:387` | Loads from `mockProducts` — not from DB |
| 2. Payment initialization | ❌ missing | `src/app/[handle]/[productId]/checkout/page.tsx:408-425` | `setTimeout()` simulation — no real API call |
| 3. Webhook handler | ✅ wired | `src/app/api/payments/webhook/route.ts` | Stripe + Paystack signature verified |
| 4. Order persistence | ✅ wired | `src/repositories/order-repository.ts:45` | `markPaymentCompleted()` called on verified webhook |
| 5. Creator in-app notification | ✅ wired | `webhook/route.ts:141-149` | `notifyCreator()` called (fire-and-forget) |
| 6. Creator email notification | ✅ wired | `webhook/route.ts:152-162` | `notifyCreatorEmail()` called (fire-and-forget) |
| 7. Customer receipt email | ✅ wired | `webhook/route.ts:164-176` | `sendCustomerReceipt()` called if `customer_email` present |
| 8. Automation event emission | ✅ wired | `webhook/route.ts:179-185` | `emitEvent('payment_received', ...)` called |
| 9. Dashboard order refresh | ⚠️ partial | `src/app/(dashboard)/dashboard/orders/page.tsx:418-426` | Fetches from `/api/orders` on mount; no realtime subscription |

---

## Critical Finding: Checkout Page is Fully Mocked

**File:** `src/app/[handle]/[productId]/checkout/page.tsx`

```typescript
// Line 16-17: Mock imports
import { mockProducts } from "@/data/mock/dashboard"
import { storefrontCreator, buildWhatsAppUrl } from "@/data/mock/storefront"

// Line 387-388: Mock product resolution — ignores URL params
const product = mockProducts.find(p => p.id === productId) ?? mockProducts[0]
const creator = storefrontCreator

// Line 408-425: Paystack payment is simulated with setTimeout
const handlePlaceOrder = () => {
  setPlacing(true)
  if (paymentMethod === "whatsapp") { /* opens wa.me link */ }
  else {
    setTimeout(() => {
      setPlacing(false)
      setStep("confirmation")
      toast({ title: "Payment processed", description: "Order confirmed via Paystack.", variant: "success" })
    }, 1500)
  }
}
```

**Impact:** Customers on the live storefront who attempt to pay via Paystack complete a fake confirmation flow. No order is created in the database. No payment is initiated with Paystack. The real payment infrastructure (`/api/payments/initiate`, `order-repository.createPendingOrder`) exists but is **not called** from the checkout page.

---

## Webhook Handler — Correctly Wired (Step 3-8)

**File:** `src/app/api/payments/webhook/route.ts`

The webhook handler correctly:
- Verifies Stripe signature (5-min timestamp tolerance, `STRIPE_WEBHOOK_SECRET`)
- Verifies Paystack signature (HMAC-SHA512, `PAYSTACK_SECRET_KEY`)
- Persists raw payload with idempotency key to `provider_webhook_events`
- Calls `markPaymentCompleted()` — updates `payments.status = 'succeeded'` and `orders.status = 'paid'`
- Calls `syncCustomerMemoryForOrder()` — updates CRM profile
- Calls `upsertConversionAttribution()` — records revenue attribution
- Fires creator in-app notification, creator email, customer receipt (fire-and-forget `void`)
- Emits `payment_received` automation event

**Note on `void` fire-and-forget:** Notification failures (lines 142, 152, 165, 179) are swallowed — no retry, no DLQ routing for notification failures.

---

## Dashboard Refresh — Partial

**File:** `src/app/(dashboard)/dashboard/orders/page.tsx:418-426`

```typescript
React.useEffect(() => {
  fetch("/api/orders")
    .then(r => r.json())
    .then(({ data }) => {
      if (Array.isArray(data)) setOrders(data.map(apiOrderToDashboard))
    })
    .catch(() => null)
    .finally(() => setOrdersLoading(false))
}, [])  // ← fetch on mount only, no realtime subscription
```

Creators must manually refresh the page to see new orders. Supabase Realtime is available but not subscribed here.

---

## Action Items

1. **P0** — Replace mock product/creator in `checkout/page.tsx` with real DB queries via the storefront repository
2. **P0** — Replace `setTimeout` simulation in `handlePlaceOrder` with a real call to `POST /api/payments/initiate`
3. **P1** — Wrap notification `void` calls in a try/catch or route through the BullMQ `email-jobs` queue for retry
4. **P2** — Add Supabase Realtime subscription on the orders page for live order updates
