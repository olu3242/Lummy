import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getRateLimitKey, rateLimitHeaders } from "@/lib/security/rate-limit"
import { trackError } from "@/lib/observability/events"

const generateSchema = z.object({
  type: z.enum(["caption", "cta", "reply", "description", "campaign"]),
  context: z.object({
    productName:    z.string().optional(),
    productPrice:   z.number().optional(),
    platform:       z.enum(["instagram", "tiktok", "whatsapp", "twitter", "general"]).default("general"),
    tone:           z.enum(["professional", "casual", "exciting", "luxury"]).default("casual"),
    customerMessage: z.string().optional(),  // for reply type
    additionalContext: z.string().max(500).optional(),
  }),
})

const SYSTEM_PROMPT = `You are an AI assistant for Lummy, a creator commerce platform for African creators and social sellers.
You help creators write high-converting content for their products.
You understand African markets, Nigerian consumers, and social commerce.
Keep responses concise, authentic, and culturally relevant.
Use ₦ for Nigerian Naira. Write naturally — avoid sounding robotic.`

const PROMPTS: Record<string, (ctx: z.infer<typeof generateSchema>["context"]) => string> = {
  caption: (ctx) =>
    `Write a high-converting ${ctx.platform} caption for "${ctx.productName}" priced at ₦${ctx.productPrice?.toLocaleString() ?? "N/A"}.
Tone: ${ctx.tone}. ${ctx.additionalContext ?? ""}
Requirements: Include a clear CTA, 3-5 relevant hashtags, emojis, max 280 chars for Twitter or 2200 for Instagram.`,

  cta: (ctx) =>
    `Write 3 short WhatsApp CTA button labels for "${ctx.productName}" at ₦${ctx.productPrice?.toLocaleString() ?? "N/A"}.
Each label max 20 characters. Make them action-oriented. Tone: ${ctx.tone}.`,

  reply: (ctx) =>
    `You are a customer service AI for an African creator store. Reply professionally to this customer message:
"${ctx.customerMessage}"
Be helpful, warm, and concise. If about a product, offer to help with the purchase. Max 3 sentences.`,

  description: (ctx) =>
    `Write a compelling product description for "${ctx.productName}" at ₦${ctx.productPrice?.toLocaleString() ?? "N/A"}.
Tone: ${ctx.tone}. Platform: ${ctx.platform}. ${ctx.additionalContext ?? ""}
Max 200 words. Include key benefits, materials/features, and a closing CTA.`,

  campaign: (ctx) =>
    `Create a 3-part content campaign for "${ctx.productName}" targeting African social media.
Platforms: Instagram + WhatsApp + TikTok.
Include: launch post, mid-campaign engagement post, final urgency post.
Tone: ${ctx.tone}. ${ctx.additionalContext ?? ""}`,
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // 20 AI generations per minute per creator
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
  const promptFn = PROMPTS[type]
  if (!promptFn) return NextResponse.json({ error: "Unknown generation type" }, { status: 400 })

  const promptText = promptFn(context)

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: promptText }],
    })

    const output = message.content[0].type === "text" ? message.content[0].text : ""
    const tokensUsed = (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0)

    // Log generation asynchronously — void to suppress PromiseLike warning
    void Promise.resolve(supabase.from("ai_generations").insert({
      creator_id: user.id,
      generation_type: type,
      prompt_input: context,
      output,
      model: "claude-sonnet-4-20250514",
      tokens_used: tokensUsed,
      was_used: false,
    })).catch(console.error)

    return NextResponse.json({
      output,
      type,
      tokens_used: tokensUsed,
      model: "claude-sonnet-4-20250514",
    })
  } catch (err) {
    trackError("ai.generation", err, { userId: user.id, type })
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 })
  }
}
