import { createAdminClient } from "@/lib/supabase/server"
import { generateText } from "@/lib/ai/gateway"
import { detectIntent } from "@/lib/ai-conversion"
import { buildStorefrontUrl } from "@/lib/whatsapp/share"

export interface SalesAgentReply {
  body: string
  intent: ReturnType<typeof detectIntent>["intent"]
  productLink: string | null
}

interface ConversationTurn {
  from: "customer" | "agent"
  body: string
}

/**
 * Generates a grounded WhatsApp sales reply for an inbound customer message.
 * Runs entirely on the admin client because the caller is the Meta webhook —
 * server-to-server, no Supabase auth session to satisfy org-membership RLS.
 */
export async function generateSalesAgentReply(input: {
  creatorId: string
  customerPhone: string
  message: string
}): Promise<SalesAgentReply | null> {
  const supabase = createAdminClient()

  const creatorProfile = await supabase
    .from("creator_profiles")
    .select("user_id, business_name, handle")
    .eq("id", input.creatorId)
    .maybeSingle()
  if (creatorProfile.error || !creatorProfile.data) return null

  const profile = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", creatorProfile.data.user_id)
    .maybeSingle()
  const organizationId = profile.data?.organization_id as string | undefined
  if (!organizationId) return null

  const [productsRes, historyRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, title, price, currency")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("whatsapp_events")
      .select("metadata, created_at")
      .eq("creator_id", input.creatorId)
      .in("event_type", ["conversation", "agent_reply"])
      .order("created_at", { ascending: false })
      .limit(8),
  ])

  const products = (productsRes.data ?? []) as { id: string; title: string; price: number; currency: string }[]

  const history: ConversationTurn[] = (historyRes.data ?? [])
    .map((row) => {
      const meta = (row.metadata as Record<string, unknown>) ?? {}
      const from = meta.from as string | undefined
      const body = meta.message_body as string | undefined
      if (!body) return null
      return { from: from === input.customerPhone ? "customer" : "agent", body } as ConversationTurn
    })
    .filter((t): t is ConversationTurn => t !== null)
    .reverse()

  const { intent, confidence } = detectIntent(input.message)

  const matchedProduct = (intent === "purchase_intent" || intent === "pricing_inquiry")
    ? products.find((p) => input.message.toLowerCase().includes(p.title.toLowerCase()))
      ?? (products.length === 1 ? products[0] : undefined)
    : undefined

  const productLink = matchedProduct
    ? `${buildStorefrontUrl(creatorProfile.data.handle)}/${matchedProduct.id}`
    : null

  const storeName = creatorProfile.data.business_name || creatorProfile.data.handle
  const catalogLines = products.length > 0
    ? products.map((p) => `- ${p.title}: ${new Intl.NumberFormat("en-NG", { style: "currency", currency: p.currency || "NGN", maximumFractionDigits: 0 }).format(Number(p.price))}`).join("\n")
    : "(no active products listed yet)"
  const historyLines = history.length > 0
    ? history.map((t) => `${t.from === "customer" ? "Customer" : "You"}: ${t.body}`).join("\n")
    : "(no prior messages)"

  const prompt = [
    `Store: ${storeName} (lummy.co/${creatorProfile.data.handle})`,
    ``,
    `Product catalog:`,
    catalogLines,
    ``,
    `Recent conversation:`,
    historyLines,
    ``,
    `New customer message: "${input.message}"`,
    `Detected intent: ${intent} (confidence ${confidence})`,
    matchedProduct ? `Checkout link to share: ${productLink}` : `No specific product matched yet — ask a clarifying question if needed.`,
    ``,
    `Reply as the store's WhatsApp sales assistant. Only mention products and prices listed above — never invent a product, price, or delivery promise that isn't in the catalog. Keep it short (under 4 sentences), warm, and in plain WhatsApp style. If a checkout link is provided above, include it.`,
  ].join("\n")

  const reply = await generateText("emeka", "reply", prompt, {
    tenantId: organizationId,
    creatorId: input.creatorId,
  }, { maxTokens: 250 })

  return { body: reply, intent, productLink }
}
