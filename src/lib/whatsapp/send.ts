/**
 * WhatsApp outbound message sender — Meta Cloud API
 *
 * P0 gap: All existing infrastructure handles inbound messages but
 * nothing sends outbound. This implements the missing send layer.
 *
 * Uses WHATSAPP_BUSINESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID (already in .env.local)
 */

import { logger } from "@/lib/observability/logger"
import { isEnabled } from "@/lib/flags/feature-flags"

const META_API_VERSION = "v21.0"
const META_API_BASE = "https://graph.facebook.com"

function getPhoneNumberId(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!id) throw new Error("WHATSAPP_PHONE_NUMBER_ID not configured")
  return id
}

function getToken(): string {
  const token = process.env.WHATSAPP_BUSINESS_TOKEN
  if (!token) throw new Error("WHATSAPP_BUSINESS_TOKEN not configured")
  return token
}

function apiUrl(): string {
  return `${META_API_BASE}/${META_API_VERSION}/${getPhoneNumberId()}/messages`
}

// ── Types ──────────────────────────────────────────────────────

export interface TextMessagePayload {
  to: string          // E.164 format: +234XXXXXXXXXX
  body: string        // Max 4096 chars
  previewUrl?: boolean
}

export interface TemplateMessagePayload {
  to: string
  templateName: string
  languageCode?: string             // default "en"
  components?: WhatsAppTemplateComponent[]
}

export interface InteractiveButtonPayload {
  to: string
  bodyText: string
  buttons: Array<{ id: string; title: string }>
  headerText?: string
  footerText?: string
}

export interface WhatsAppSendResult {
  success: boolean
  messageId?: string
  error?: string
  to: string
}

export interface WhatsAppTemplateComponent {
  type: "header" | "body" | "button"
  parameters: Array<{
    type: "text" | "currency" | "date_time" | "image" | "document"
    text?: string
    currency?: { fallback_value: string; code: string; amount_1000: number }
  }>
  sub_type?: "quick_reply" | "url"
  index?: number
}

// ── Core send function ─────────────────────────────────────────

async function postToMeta(body: Record<string, unknown>): Promise<WhatsAppSendResult> {
  const to = (body.to as string) ?? "unknown"

  try {
    const res = await fetch(apiUrl(), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    })

    const data = await res.json() as {
      messages?: Array<{ id: string }>
      error?: { message: string; code: number }
    }

    if (!res.ok || data.error) {
      const errMsg = data.error?.message ?? `HTTP ${res.status}`
      logger.error("[whatsapp/send] Meta API error", { to, error: errMsg, status: res.status })
      return { success: false, error: errMsg, to }
    }

    const messageId = data.messages?.[0]?.id
    logger.info("[whatsapp/send] sent", { to, messageId })
    return { success: true, messageId, to }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    logger.error("[whatsapp/send] network error", { to, error: errMsg })
    return { success: false, error: errMsg, to }
  }
}

// ── Public API ─────────────────────────────────────────────────

/** Send a plain text message */
export async function sendTextMessage(payload: TextMessagePayload): Promise<WhatsAppSendResult> {
  const flagEnabled = await isEnabled("whatsapp_outbound_enabled")
  if (!flagEnabled) {
    logger.info("[whatsapp/send] outbound disabled by feature flag", { to: payload.to })
    return { success: true, to: payload.to }  // silently skip, not an error
  }

  return postToMeta({
    to: payload.to,
    type: "text",
    text: {
      body: payload.body,
      preview_url: payload.previewUrl ?? false,
    },
  })
}

/** Send an approved template message */
export async function sendTemplateMessage(payload: TemplateMessagePayload): Promise<WhatsAppSendResult> {
  return postToMeta({
    to: payload.to,
    type: "template",
    template: {
      name: payload.templateName,
      language: { code: payload.languageCode ?? "en" },
      components: payload.components ?? [],
    },
  })
}

/** Send an interactive message with quick reply buttons */
export async function sendInteractiveButtons(payload: InteractiveButtonPayload): Promise<WhatsAppSendResult> {
  return postToMeta({
    to: payload.to,
    type: "interactive",
    interactive: {
      type: "button",
      header: payload.headerText ? { type: "text", text: payload.headerText } : undefined,
      body: { text: payload.bodyText },
      footer: payload.footerText ? { text: payload.footerText } : undefined,
      action: {
        buttons: payload.buttons.map(b => ({
          type: "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  })
}

/** Mark a received message as read */
export async function markMessageRead(waMessageId: string): Promise<void> {
  try {
    await fetch(apiUrl(), {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: waMessageId,
      }),
    })
  } catch (err) {
    logger.warn("[whatsapp/send] markRead failed", { waMessageId, error: String(err) })
  }
}

/** Send WhatsApp message with checkout link for a product order */
export async function sendOrderCheckoutLink(opts: {
  to: string
  productName: string
  priceFormatted: string
  checkoutUrl: string
  creatorName: string
}): Promise<WhatsAppSendResult> {
  const body = [
    `Hi! 👋 Here's your order link for *${opts.productName}*`,
    ``,
    `💰 Price: ${opts.priceFormatted}`,
    ``,
    `🔗 Complete your order here:`,
    opts.checkoutUrl,
    ``,
    `Questions? Just reply to this message — ${opts.creatorName} is here to help.`,
  ].join("\n")

  return sendTextMessage({ to: opts.to, body, previewUrl: true })
}

/** Send order confirmation to customer after payment */
export async function sendOrderConfirmation(opts: {
  to: string
  customerName: string
  productName: string
  orderReference: string
  amountFormatted: string
  creatorName: string
  creatorWhatsApp: string
}): Promise<WhatsAppSendResult> {
  const body = [
    `✅ *Order Confirmed!*`,
    ``,
    `Hi ${opts.customerName}! 🎉 Your payment was received.`,
    ``,
    `📦 *${opts.productName}*`,
    `💰 ${opts.amountFormatted}`,
    `🔖 Ref: ${opts.orderReference}`,
    ``,
    `${opts.creatorName} will reach out shortly about delivery.`,
    ``,
    `Reply here if you have any questions!`,
  ].join("\n")

  return sendTextMessage({ to: opts.to, body })
}

/** Send welcome message to creator on onboarding completion */
export async function sendCreatorWelcome(opts: {
  to: string
  creatorName: string
  storeHandle: string
}): Promise<WhatsAppSendResult> {
  const body = [
    `🎉 Welcome to Lummy, ${opts.creatorName}!`,
    ``,
    `Your store is live at: lummy.co/${opts.storeHandle}`,
    ``,
    `Here's what to do next:`,
    `1️⃣ Add your first product`,
    `2️⃣ Share your store link`,
    `3️⃣ Start getting orders!`,
    ``,
    `Need help? Just reply here — we've got you. 💜`,
  ].join("\n")

  return sendTextMessage({ to: opts.to, body })
}

/** Normalize phone to E.164 for WhatsApp */
export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  // Nigerian number without country code
  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`
  }
  // Already has country code
  if (digits.length >= 10) {
    return `+${digits}`
  }
  return phone
}
