/**
 * Lummy Automation SDK
 *
 * Reusable, typed, tenant-aware primitives for all automation workflows.
 * All methods are: observable, retryable, idempotent, creator-aware.
 *
 * Import from here rather than calling sub-systems directly in workflows.
 */

import { logger } from "@/lib/observability/logger"
import { createAdminClient } from "@/lib/supabase/server"
import { dispatchAutomation } from "./triggers"
import { sendTextMessage, sendOrderConfirmation, sendOrderCheckoutLink } from "@/lib/whatsapp/send"
import { sendOrderReceipt, sendCreatorOrderNotification, sendCreatorWelcomeEmail } from "@/lib/notifications/email"
import { callAgent, type AgentName, type GenerationType } from "@/lib/ai/gateway"
import { checkRateLimit } from "@/lib/security/rate-limit"
import type { AutomationEventName } from "./events"

// ── Types ──────────────────────────────────────────────────────

export interface SDKContext {
  tenantId: string
  creatorId?: string
  userId?: string
  correlationId?: string
}

export interface SDKResult<T = void> {
  ok: boolean
  data?: T
  error?: string
  skipped?: boolean
  skipReason?: string
}

// ── 1. emitEvent ───────────────────────────────────────────────

/**
 * Emit an automation event for async processing.
 * Idempotency key prevents duplicate triggers (5-min dedup window).
 */
export async function emitEvent(
  name: AutomationEventName,
  ctx: SDKContext,
  payload: Record<string, unknown> = {},
  idempotencyKey?: string,
): Promise<SDKResult> {
  try {
    const key = idempotencyKey ?? `${name}:${ctx.creatorId ?? ctx.tenantId}:${Math.floor(Date.now() / 300_000)}`
    await dispatchAutomation({
      name,
      creatorId: ctx.creatorId ?? ctx.tenantId,
      payload: { ...payload, tenantId: ctx.tenantId, correlationId: ctx.correlationId },
      idempotencyKey: key,
    })
    return { ok: true }
  } catch (err) {
    logger.error("[sdk] emitEvent failed", { name, error: String(err), ...ctx })
    return { ok: false, error: String(err) }
  }
}

// ── 2. sendWhatsApp ────────────────────────────────────────────

/** Send an outbound WhatsApp message. Rate-limited per recipient. */
export async function sendWhatsApp(opts: {
  to: string
  body: string
  ctx: SDKContext
}): Promise<SDKResult<{ messageId?: string }>> {
  // Rate limit: max 10 messages per recipient per hour
  const rl = checkRateLimit(`whatsapp:send:${opts.to}`, 10)
  if (!rl.allowed) {
    logger.warn("[sdk] WhatsApp rate limited", { to: opts.to, ...opts.ctx })
    return { ok: false, skipped: true, skipReason: "rate_limited", error: "WhatsApp rate limit exceeded" }
  }

  const result = await sendTextMessage({ to: opts.to, body: opts.body })
  if (!result.success) {
    return { ok: false, error: result.error }
  }
  return { ok: true, data: { messageId: result.messageId } }
}

/** Send WhatsApp checkout link to a customer */
export async function sendWhatsAppCheckout(opts: {
  to: string
  productName: string
  priceFormatted: string
  checkoutUrl: string
  creatorName: string
  ctx: SDKContext
}): Promise<SDKResult<{ messageId?: string }>> {
  const result = await sendOrderCheckoutLink({
    to: opts.to,
    productName: opts.productName,
    priceFormatted: opts.priceFormatted,
    checkoutUrl: opts.checkoutUrl,
    creatorName: opts.creatorName,
  })
  return result.success
    ? { ok: true, data: { messageId: result.messageId } }
    : { ok: false, error: result.error }
}

/** Send WhatsApp order confirmation to customer after payment */
export async function sendWhatsAppOrderConfirm(opts: {
  to: string
  customerName: string
  productName: string
  orderReference: string
  amountFormatted: string
  creatorName: string
  creatorWhatsApp: string
  ctx: SDKContext
}): Promise<SDKResult> {
  const result = await sendOrderConfirmation(opts)
  return result.success ? { ok: true } : { ok: false, error: result.error }
}

// ── 3. notifyCreator ───────────────────────────────────────────

/** Push in-app notification to a creator by userId */
export async function notifyCreator(opts: {
  userId: string
  title: string
  body: string
  actionUrl?: string
  channel?: string
  ctx: SDKContext
}): Promise<SDKResult> {
  try {
    const supabase = createAdminClient()
    await supabase.from("notifications").insert({
      user_id:    opts.userId,
      title:      opts.title,
      body:       opts.body,
      action_url: opts.actionUrl ?? null,
      channel:    opts.channel ?? "in_app",
    })
    logger.info("[sdk] notifyCreator", { userId: opts.userId, title: opts.title, ...opts.ctx })
    return { ok: true }
  } catch (err) {
    logger.error("[sdk] notifyCreator failed", { error: String(err), ...opts.ctx })
    return { ok: false, error: String(err) }
  }
}

/** Send creator notification via email */
export async function notifyCreatorEmail(opts: {
  to: string
  creatorName: string
  customerName: string
  productName: string
  amountFormatted: string
  orderReference: string
  ctx: SDKContext
}): Promise<SDKResult> {
  const result = await sendCreatorOrderNotification({
    to:               opts.to,
    creatorName:      opts.creatorName,
    customerName:     opts.customerName,
    productName:      opts.productName,
    amountFormatted:  opts.amountFormatted,
    orderReference:   opts.orderReference,
  })
  return result.success ? { ok: true } : { ok: false, error: result.error }
}

// ── 4. sendCustomerReceipt ─────────────────────────────────────

/** Send order receipt email to customer */
export async function sendCustomerReceipt(opts: {
  to: string
  customerName: string
  orderReference: string
  productName: string
  amountFormatted: string
  storeName: string
  storeHandle: string
  creatorWhatsApp?: string
  ctx: SDKContext
}): Promise<SDKResult> {
  const result = await sendOrderReceipt(opts)
  return result.success ? { ok: true } : { ok: false, error: result.error }
}

// ── 5. queueAIJob ──────────────────────────────────────────────

/** Queue an AI generation through the centralized gateway */
export async function queueAIJob(opts: {
  agent: AgentName
  type: GenerationType
  prompt: string
  ctx: SDKContext
  options?: { maxTokens?: number; logToDb?: boolean }
}): Promise<SDKResult<{ output: string; costUsd: number }>> {
  // Rate limit: max 30 AI calls per creator per minute
  const rlKey = `ai:job:${opts.ctx.creatorId ?? opts.ctx.tenantId}`
  const rl = checkRateLimit(rlKey, 30)
  if (!rl.allowed) {
    return { ok: false, skipped: true, skipReason: "ai_rate_limited", error: "AI rate limit exceeded" }
  }

  try {
    const result = await callAgent({
      agent:   opts.agent,
      type:    opts.type,
      prompt:  opts.prompt,
      context: {
        tenantId:      opts.ctx.tenantId,
        creatorId:     opts.ctx.creatorId,
        userId:        opts.ctx.userId,
        correlationId: opts.ctx.correlationId,
      },
      options: opts.options,
    })
    return { ok: true, data: { output: result.output, costUsd: result.costUsd } }
  } catch (err) {
    logger.error("[sdk] queueAIJob failed", { agent: opts.agent, error: String(err), ...opts.ctx })
    return { ok: false, error: String(err) }
  }
}

// ── 6. createPaymentLink ───────────────────────────────────────

/** Create a Paystack payment link for an order */
export async function createPaymentLink(opts: {
  customerEmail: string
  amountKobo: number
  productName: string
  orderId: string
  organizationId: string
  currency?: string
  ctx: SDKContext
}): Promise<SDKResult<{ url: string; reference: string }>> {
  try {
    const reference = `LMY-${opts.orderId.slice(0, 8).toUpperCase()}-${Date.now()}`
    const body = {
      email:    opts.customerEmail,
      amount:   opts.amountKobo,
      currency: opts.currency ?? "USD",
      reference,
      metadata: {
        orderId:        opts.orderId,
        organizationId: opts.organizationId,
        productName:    opts.productName,
      },
    }

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await res.json() as {
      status: boolean
      data?: { authorization_url: string; reference: string }
      message?: string
    }

    if (!data.status || !data.data) {
      return { ok: false, error: data.message ?? "Paystack initialization failed" }
    }

    return { ok: true, data: { url: data.data.authorization_url, reference: data.data.reference } }
  } catch (err) {
    logger.error("[sdk] createPaymentLink failed", { error: String(err), ...opts.ctx })
    return { ok: false, error: String(err) }
  }
}

// ── 7. logAutomation ───────────────────────────────────────────

/** Log an automation execution to the audit trail */
export async function logAutomation(opts: {
  workflowId: string
  eventName: string
  status: "success" | "failure" | "skipped"
  durationMs: number
  ctx: SDKContext
  metadata?: Record<string, unknown>
}): Promise<void> {
  logger.info("[sdk] automation_log", {
    workflowId:  opts.workflowId,
    eventName:   opts.eventName,
    status:      opts.status,
    durationMs:  opts.durationMs,
    tenantId:    opts.ctx.tenantId,
    creatorId:   opts.ctx.creatorId,
    correlationId: opts.ctx.correlationId,
    ...opts.metadata,
  })

  try {
    const supabase = createAdminClient()
    await supabase.from("automation_logs").insert({
      workflow_id:    opts.workflowId,
      event_name:     opts.eventName,
      status:         opts.status,
      duration_ms:    opts.durationMs,
      tenant_id:      opts.ctx.tenantId,
      creator_id:     opts.ctx.creatorId ?? null,
      correlation_id: opts.ctx.correlationId ?? null,
      metadata:       opts.metadata ?? {},
    }).throwOnError()
  } catch (err) {
    // Best-effort: log failures are never fatal
    logger.warn("[sdk] logAutomation DB insert failed", { error: String(err) })
  }
}

// ── 8. scoreLead ───────────────────────────────────────────────

/** Score a WhatsApp lead based on intent signals */
export function scoreLead(opts: {
  hasOrderIntent: boolean
  hasPriceInquiry: boolean
  messageCount: number
  hasProductName: boolean
  repliedToCheckout: boolean
}): { score: number; tier: "cold" | "warm" | "hot" | "buyer" } {
  let score = 0
  if (opts.hasOrderIntent)      score += 35
  if (opts.repliedToCheckout)   score += 30
  if (opts.hasPriceInquiry)     score += 20
  if (opts.hasProductName)      score += 10
  if (opts.messageCount >= 3)   score += 5

  const tier =
    score >= 65 ? "buyer" :
    score >= 40 ? "hot"   :
    score >= 20 ? "warm"  : "cold"

  return { score: Math.min(score, 100), tier }
}

// ── 9. trackMetrics ────────────────────────────────────────────

/** Track a commerce metric event */
export async function trackMetrics(opts: {
  metric: "storefront_view" | "product_view" | "whatsapp_click" | "checkout_started" | "order_completed" | "checkout_abandoned"
  organizationId: string
  productId?: string
  value?: number
  ctx: SDKContext
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase.from("analytics_events").insert({
      event_type:      opts.metric,
      organization_id: opts.organizationId,
      product_id:      opts.productId ?? null,
      value:           opts.value ?? 1,
      metadata:        { correlationId: opts.ctx.correlationId },
    })
  } catch {
    // Best-effort
  }
}

// ── 10. scheduleWorkflow ───────────────────────────────────────

/**
 * Schedule a workflow for delayed execution by inserting a future-dated event.
 * Uses Vercel Cron / automation_events table as the scheduling backbone.
 */
export async function scheduleWorkflow(opts: {
  workflowId: string
  eventName: AutomationEventName
  runAfter: Date
  payload: Record<string, unknown>
  ctx: SDKContext
  idempotencyKey?: string
}): Promise<SDKResult> {
  try {
    const supabase = createAdminClient()
    const key = opts.idempotencyKey ??
      `${opts.workflowId}:${opts.ctx.creatorId ?? opts.ctx.tenantId}:${opts.runAfter.toISOString()}`

    await supabase.from("automation_events").insert({
      creator_id:      opts.ctx.creatorId ?? opts.ctx.tenantId,
      event_name:      opts.eventName,
      payload:         { ...opts.payload, workflowId: opts.workflowId, tenantId: opts.ctx.tenantId },
      idempotency_key: key,
      processed:       false,
      scheduled_for:   opts.runAfter.toISOString(),
    })

    logger.info("[sdk] scheduleWorkflow", {
      workflowId: opts.workflowId,
      runAfter:   opts.runAfter.toISOString(),
      ...opts.ctx,
    })

    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

// ── 11. sendCreatorWelcome ─────────────────────────────────────

/** Onboarding welcome: email + WhatsApp */
export async function sendCreatorWelcome(opts: {
  creatorEmail: string
  creatorPhone?: string
  creatorName: string
  storeHandle: string
  storeName: string
  ctx: SDKContext
}): Promise<{ email: SDKResult; whatsapp: SDKResult }> {
  const [emailResult, waResult] = await Promise.allSettled([
    sendCreatorWelcomeEmail({
      to:          opts.creatorEmail,
      creatorName: opts.creatorName,
      storeHandle: opts.storeHandle,
      storeName:   opts.storeName,
    }),
    opts.creatorPhone
      ? sendTextMessage({
          to:   opts.creatorPhone,
          body: `🎉 Welcome to Lummy, ${opts.creatorName}!\n\nYour store is live: lummy.co/${opts.storeHandle}\n\nAdd your first product and start selling! 💜`,
        })
      : Promise.resolve({ success: true, to: "" }),
  ])

  const email: SDKResult = emailResult.status === "fulfilled" && emailResult.value.success
    ? { ok: true }
    : { ok: false, error: emailResult.status === "rejected" ? String(emailResult.reason) : "email failed" }

  const whatsapp: SDKResult = waResult.status === "fulfilled" && waResult.value.success
    ? { ok: true }
    : { ok: false, error: waResult.status === "rejected" ? String(waResult.reason) : "whatsapp failed", skipped: !opts.creatorPhone }

  return { email, whatsapp }
}
