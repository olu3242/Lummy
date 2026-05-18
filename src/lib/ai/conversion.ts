import Anthropic from "@anthropic-ai/sdk"
import { logger } from "@/lib/observability/logger"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CTASuggestion {
  label: string
  style: "primary" | "secondary" | "ghost"
  placement: "hero" | "product" | "checkout" | "whatsapp"
}

// Rule-based CTA suggestions — no AI needed for most cases
export function generateCTASuggestions(opts: {
  niche: string
  hasWhatsApp: boolean
  productCount: number
}): CTASuggestion[] {
  const suggestions: CTASuggestion[] = []

  if (opts.hasWhatsApp) {
    suggestions.push({ label: "Order on WhatsApp", style: "primary", placement: "product" })
    suggestions.push({ label: "Chat to buy", style: "primary", placement: "hero" })
  } else {
    suggestions.push({ label: "Buy Now", style: "primary", placement: "product" })
    suggestions.push({ label: "Shop Now", style: "primary", placement: "hero" })
  }

  if (opts.productCount > 3) {
    suggestions.push({ label: "Shop All", style: "secondary", placement: "hero" })
  }

  suggestions.push({ label: "See Full Collection", style: "ghost", placement: "hero" })
  return suggestions
}

export interface WhatsAppPrompt {
  message: string
  timing: "immediate" | "1h" | "24h"
  trigger: string
}

export async function generateWhatsAppEngagementPrompt(opts: {
  creatorName: string
  buyerName?: string
  productName?: string
  trigger: "abandoned_view" | "post_purchase" | "reengagement"
}): Promise<WhatsAppPrompt> {
  if (opts.trigger === "post_purchase") {
    return {
      message: `Hi${opts.buyerName ? ` ${opts.buyerName}` : ""}! 🎉 Thank you for your order${opts.productName ? ` of ${opts.productName}` : ""}. We'll update you on delivery. Any questions? Just reply here!`,
      timing: "immediate",
      trigger: opts.trigger,
    }
  }

  if (opts.trigger === "abandoned_view") {
    return {
      message: `Hi! 👋 You checked out ${opts.productName ?? "one of our items"} — any questions? We'd love to help you complete your order.`,
      timing: "1h",
      trigger: opts.trigger,
    }
  }

  // AI-assisted re-engagement
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      messages: [{
        role: "user",
        content: `Write a friendly WhatsApp re-engagement message from "${opts.creatorName}" to a past buyer. 1-2 sentences max. Warm, African-friendly tone. No emoji spam. Return only the message text.`,
      }],
    })
    const text = (msg.content[0] as { type: string; text?: string }).text?.trim() ?? ""
    return { message: text, timing: "24h", trigger: opts.trigger }
  } catch (err) {
    logger.warn("[ai/conversion] whatsapp prompt failed", { error: String(err) })
    return {
      message: `Hi! 👋 It's ${opts.creatorName} — we have new items you might love. Check out our latest collection!`,
      timing: "24h",
      trigger: opts.trigger,
    }
  }
}

export interface ConversionAudit {
  score: number
  passedChecks: string[]
  failedChecks: string[]
  topRecommendation: string
}

export function auditConversionReadiness(opts: {
  hasWhatsApp: boolean
  isPublished: boolean
  productCount: number
  hasBio: boolean
  hasAvatar: boolean
  hasCustomDomain: boolean
}): ConversionAudit {
  const checks: Array<{ label: string; passed: boolean; weight: number }> = [
    { label: "WhatsApp connected",  passed: opts.hasWhatsApp,          weight: 25 },
    { label: "Store published",     passed: opts.isPublished,           weight: 20 },
    { label: "3+ products listed",  passed: opts.productCount >= 3,     weight: 20 },
    { label: "Bio completed",       passed: opts.hasBio,                weight: 15 },
    { label: "Avatar uploaded",     passed: opts.hasAvatar,             weight: 10 },
    { label: "Custom domain set",   passed: opts.hasCustomDomain,       weight: 10 },
  ]

  const score = checks.reduce((s, c) => s + (c.passed ? c.weight : 0), 0)
  const passed = checks.filter(c => c.passed).map(c => c.label)
  const failed = checks.filter(c => !c.passed).map(c => c.label)
  const topFailed = checks.filter(c => !c.passed).sort((a, b) => b.weight - a.weight)[0]
  const topRecommendation = topFailed
    ? `Focus on: ${topFailed.label} (+${topFailed.weight} pts)`
    : "Your store is fully optimized!"

  return { score, passedChecks: passed, failedChecks: failed, topRecommendation }
}
