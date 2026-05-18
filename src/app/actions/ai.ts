"use server"

import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are an AI assistant for Lummy, a creator commerce platform for African creators.
Write authentic, high-converting content for African social commerce. Use ₦ for Naira. Be concise.`

export async function generateCaption(
  productName: string,
  platform: "instagram" | "tiktok" | "whatsapp" | "twitter" | "general" = "instagram",
  tone: "professional" | "casual" | "exciting" | "luxury" = "casual",
): Promise<{ output: string; error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Write a ${tone} ${platform} caption for "${productName}". Include CTA + 3 hashtags. Max 220 chars.`,
      }],
    })

    const output = msg.content[0].type === "text" ? msg.content[0].text : ""

    if (user) {
      void Promise.resolve(supabase.from("ai_generations").insert({
        creator_id: user.id,
        generation_type: "caption",
        prompt_input: { productName, platform, tone },
        output,
        model: "claude-sonnet-4-20250514",
        tokens_used: (msg.usage?.input_tokens ?? 0) + (msg.usage?.output_tokens ?? 0),
        was_used: false,
      })).catch(console.error)
    }

    return { output }
  } catch (err) {
    console.error("[generateCaption]", err)
    return { output: "", error: "Failed to generate caption" }
  }
}

export async function generateReply(customerMessage: string): Promise<{ output: string; error?: string }> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Reply warmly to this customer WhatsApp message: "${customerMessage}". Max 2 sentences.`,
      }],
    })

    const output = msg.content[0].type === "text" ? msg.content[0].text : ""
    return { output }
  } catch (err) {
    console.error("[generateReply]", err)
    return { output: "", error: "Failed to generate reply" }
  }
}

export async function generateProductDescription(
  productName: string,
  priceNgn: number,
  additionalContext?: string,
): Promise<{ output: string; error?: string }> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: SYSTEM,
      messages: [{
        role: "user",
        content: `Write a compelling product description for "${productName}" at ₦${priceNgn.toLocaleString()}. ${additionalContext ?? ""} Max 150 words. Include key benefits and a CTA.`,
      }],
    })

    const output = msg.content[0].type === "text" ? msg.content[0].text : ""
    return { output }
  } catch (err) {
    console.error("[generateProductDescription]", err)
    return { output: "", error: "Failed to generate description" }
  }
}
