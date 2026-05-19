import Anthropic from "@anthropic-ai/sdk"
import { logger } from "@/lib/observability/logger"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface StorefrontSuggestion {
  type: "headline" | "bio" | "cta" | "pricing" | "product_description"
  original: string
  suggestion: string
  reason: string
}

export async function generateStorefrontSuggestions(opts: {
  creatorName: string
  niche: string
  currentBio?: string
  productNames?: string[]
  currency?: string
}): Promise<StorefrontSuggestion[]> {
  try {
    const prompt = `You are a conversion expert for African creator commerce.
Creator: ${opts.creatorName}, niche: ${opts.niche}, currency: ${opts.currency ?? "NGN"}.
Current bio: "${opts.currentBio ?? "None"}"
Products: ${opts.productNames?.slice(0, 5).join(", ") ?? "None listed"}

Return a JSON array of 3 suggestions. Each: { "type": "bio"|"cta"|"headline", "original": "<current or empty>", "suggestion": "<improved text>", "reason": "<1 sentence why>" }.
Be concise, mobile-friendly, and Africa-native. No markdown outside JSON.`

    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    })

    const text = (msg.content[0] as { type: string; text?: string }).text ?? "[]"
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    return JSON.parse(match[0]) as StorefrontSuggestion[]
  } catch (err) {
    logger.warn("[ai/commerce] storefront suggestions failed", { error: String(err) })
    return []
  }
}

export interface PricingSuggestion {
  productName: string
  currentPrice: number
  suggestedPrice: number
  reasoning: string
  confidence: "low" | "medium" | "high"
}

// Rule-based pricing — avoids AI latency on every product
export function generatePricingSuggestion(opts: {
  productName: string
  currentPriceKobo: number
  niche: string
  currency: string
}): PricingSuggestion {
  const price = opts.currentPriceKobo / 100
  let multiplier = 1.0
  let reasoning = "Price looks competitive."
  let confidence: PricingSuggestion["confidence"] = "medium"

  if (price < 500) {
    multiplier = 1.5
    reasoning = "Price is below market for this niche. Consider raising to improve perceived value."
    confidence = "high"
  } else if (price > 50_000) {
    multiplier = 0.9
    reasoning = "High price point. Ensure value proposition is clear or consider a lower entry anchor."
    confidence = "low"
  } else if (opts.niche.toLowerCase().includes("fashion") && price < 5_000) {
    multiplier = 1.3
    reasoning = "Fashion items typically command higher prices in this market."
    confidence = "medium"
  }

  return {
    productName: opts.productName,
    currentPrice: opts.currentPriceKobo,
    suggestedPrice: Math.round(opts.currentPriceKobo * multiplier),
    reasoning,
    confidence,
  }
}

export async function generateProductDescription(opts: {
  productName: string
  niche: string
  currentDescription?: string
}): Promise<string> {
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Write a short, compelling product description (2-3 sentences) for "${opts.productName}" in the ${opts.niche} niche. Target: Nigerian/African buyers. Mobile-first copy. Current description: "${opts.currentDescription ?? "none"}". Return only the description text.`,
      }],
    })
    return (msg.content[0] as { type: string; text?: string }).text?.trim() ?? opts.currentDescription ?? ""
  } catch (err) {
    logger.warn("[ai/commerce] product description failed", { error: String(err) })
    return opts.currentDescription ?? ""
  }
}
