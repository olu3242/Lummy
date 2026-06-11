"use server"

import { createClient } from "@/lib/supabase/server"
import { callAgent } from "@/lib/ai/gateway"

export async function generateCaption(
  productName: string,
  platform: "instagram" | "tiktok" | "whatsapp" | "twitter" | "general" = "instagram",
  tone: "professional" | "casual" | "exciting" | "luxury" = "casual",
): Promise<{ output: string; error?: string }> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const result = await callAgent({
      agent: "ngozi",
      type: "caption",
      prompt: `Write a ${tone} ${platform} caption for "${productName}". Include CTA + 3 hashtags. Max 220 chars.`,
      context: { userId: user?.id },
      options: { maxTokens: 400, logToDb: true },
    })

    return { output: result.output }
  } catch (err) {
    console.error("[generateCaption]", err)
    return { output: "", error: "Failed to generate caption" }
  }
}

export async function generateReply(customerMessage: string): Promise<{ output: string; error?: string }> {
  try {
    const result = await callAgent({
      agent: "emeka",
      type: "reply",
      prompt: `Reply warmly to this customer WhatsApp message: "${customerMessage}". Max 2 sentences.`,
      context: {},
      options: { maxTokens: 200 },
    })
    return { output: result.output }
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
    const result = await callAgent({
      agent: "ngozi",
      type: "description",
      prompt: `Write a compelling product description for "${productName}" at $${priceNgn.toLocaleString()}. ${additionalContext ?? ""} Max 150 words. Include key benefits and a CTA.`,
      context: {},
      options: { maxTokens: 400 },
    })
    return { output: result.output }
  } catch (err) {
    console.error("[generateProductDescription]", err)
    return { output: "", error: "Failed to generate description" }
  }
}
