import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getRateLimitKey, rateLimitHeaders } from "@/lib/security/rate-limit"
import { trackError } from "@/lib/observability/events"
import { callAgent, type AgentName, type GenerationType } from "@/lib/ai/gateway"

const generateSchema = z.object({
  type: z.enum(["caption", "cta", "reply", "description", "campaign"]),
  context: z.object({
    productName:      z.string().optional(),
    productPrice:     z.number().optional(),
    platform:         z.enum(["instagram", "tiktok", "whatsapp", "twitter", "general"]).default("general"),
    tone:             z.enum(["professional", "casual", "exciting", "luxury"]).default("casual"),
    customerMessage:  z.string().optional(),
    additionalContext: z.string().max(500).optional(),
  }),
})

type GenerationTypeInput = z.infer<typeof generateSchema>["type"]
type ContextInput        = z.infer<typeof generateSchema>["context"]

const AGENT_MAP: Record<GenerationTypeInput, AgentName> = {
  caption:     "ngozi",
  cta:         "taiwo",
  reply:       "emeka",
  description: "ngozi",
  campaign:    "taiwo",
}

const TYPE_MAP: Record<GenerationTypeInput, GenerationType> = {
  caption:     "caption",
  cta:         "cta",
  reply:       "reply",
  description: "description",
  campaign:    "campaign",
}

function buildPrompt(type: GenerationTypeInput, ctx: ContextInput): string {
  const price = ctx.productPrice?.toLocaleString() ?? "N/A"
  switch (type) {
    case "caption":
      return `Write a high-converting ${ctx.platform} caption for "${ctx.productName}"${price !== "N/A" ? ` priced at ${price}` : ""}. Tone: ${ctx.tone}. ${ctx.additionalContext ?? ""} Include a clear CTA, 3-5 relevant hashtags, emojis, max 280 chars for Twitter or 2200 for Instagram.`
    case "cta":
      return `Write 3 short WhatsApp CTA button labels for "${ctx.productName}"${price !== "N/A" ? ` at ${price}` : ""}. Each label max 20 characters. Make them action-oriented. Tone: ${ctx.tone}.`
    case "reply":
      return `Reply professionally to this customer message: "${ctx.customerMessage}". Be helpful, warm, and concise. If about a product, offer to help with the purchase. Max 3 sentences.`
    case "description":
      return `Write a compelling product description for "${ctx.productName}"${price !== "N/A" ? ` at ${price}` : ""}. Tone: ${ctx.tone}. Platform: ${ctx.platform}. ${ctx.additionalContext ?? ""} Max 200 words. Include key benefits, materials/features, and a closing CTA.`
    case "campaign":
      return `Create a 3-part content campaign for "${ctx.productName}". Platforms: Instagram + WhatsApp + TikTok. Include: launch post, mid-campaign engagement post, final urgency post. Tone: ${ctx.tone}. ${ctx.additionalContext ?? ""}`
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rlKey = getRateLimitKey("ai:generate", request, user.id)
  const rl = checkRateLimit(rlKey, 20)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429, headers: rateLimitHeaders(rl) }
    )
  }

  const body = await request.json()
  const parsed = generateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 })
  }

  const { type, context } = parsed.data
  const promptText = buildPrompt(type, context)

  try {
    const result = await callAgent({
      agent:   AGENT_MAP[type],
      type:    TYPE_MAP[type],
      prompt:  promptText,
      context: { userId: user.id },
      options: { maxTokens: 1024, logToDb: true },
    })

    return NextResponse.json({
      output:      result.output,
      type,
      tokens_used: result.tokensUsed.input + result.tokensUsed.output,
      model:       result.model,
      cost_usd:    result.costUsd,
    })
  } catch (err) {
    trackError("ai.generation", err, { userId: user.id, type })
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 })
  }
}
