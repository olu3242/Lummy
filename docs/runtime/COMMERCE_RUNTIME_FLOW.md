# Commerce Runtime Flow

## Full Purchase Journey

```
Creator publishes storefront
  → POST /api/store/publish
  → emitEvent("storefront_published")     → STO-01 workflow
      → notify creator: "Your store is live!"

Customer visits /[handle]
  → StorefrontClient renders public storefront
  → trackMetric("storefront_view")

Customer opens product
  → StorefrontClient: product detail modal
  → trackMetric("product_view")

Customer clicks "Order on WhatsApp" or "Checkout"
  → WhatsApp path: wa.me pre-filled link
      → trackMetric("whatsapp_click")
  → Checkout path: /[handle]/[productId]/checkout
      → POST /api/checkout → creates order (status=pending)
      → POST /api/payments/initiate → Paystack payment link
      → Redirect to Paystack hosted page

Payment succeeds (charge.success webhook)
  → /api/payments/webhook
  → markPaymentCompleted()
  → syncCustomerMemoryForOrder()
  → upsertConversionAttribution()
  → notifyCreator() (in-app)
  → notifyCreatorEmail()
  → sendCustomerReceipt()
  → emitEvent("payment_received")         → WA-04, PAY-01, PAY-02 workflows
      → notify creator: "₦X received!"

Payment fails (charge.failed webhook)
  → /api/payments/webhook
  → payments.status = 'failed'
  → emitEvent("payment_failed")           → PAY-03 workflow
      → notify creator: "Payment failed"
```

## Creator Product Creation

```
Creator adds product via dashboard
  → POST /api/products
  → createProductForCurrentUser()
  → emitEvent("product_created")          → PRD-01 workflow
      → recordMilestone("first_product_created")
```

## Creator Onboarding

```
Onboarding wizard completion
  → emitEvent("onboarding_completed")     → OB-01 workflow
      → notify creator: "Welcome to Lummy!"
      → recordMilestone("onboarding_completed")
      → sendCreatorWelcome() if flag enabled
          → welcome email + WhatsApp template
```

## WhatsApp Commerce

```
WhatsApp message received (webhook)
  → /api/webhooks/whatsapp
  → emitEvent("whatsapp_message_received") → WA-01 workflow

Lead scores above threshold
  → Lead scoring job / CRM action
  → emitEvent("lead_scored")
      → if score >= 80: notify creator "High-intent lead"
      → WA-02 workflow triggered
```

## Retention Automation

```
Creator inactive 7 days
  → runHealthScoringJob() detects inactivity
  → emitEvent("creator_inactive_7d")
      → notify: "Your store misses you"

Creator inactive 30 days
  → emitEvent("creator_inactive_30d")
      → notify: "Don't let your store go cold"

Weekly digest
  → CH-01 workflow (triggered by weekly_digest_requested)
  → notify creator with analytics digest
```

## Checkout Abandonment

```
Checkout started (client-side tracking)
  → emitEvent("checkout_started")         → analytics only

Checkout not completed within window
  → emitEvent("checkout_abandoned")       → CHK-01 workflow
      → notify creator: "Abandoned checkout"
      → (recovery workflow — future: send WhatsApp recovery message)
```

## SDK Context Requirements

All `emitEvent()` calls require a valid `SDKContext`:

```typescript
interface SDKContext {
  tenantId:       string          // organization_id (required)
  creatorId?:     string          // creator_profiles.id (preferred)
  userId?:        string          // auth.users.id
  correlationId?: string          // flows through all downstream logs
}
```

Events without `creatorId` fall back to `tenantId` for routing in `dispatchAutomation()`.
