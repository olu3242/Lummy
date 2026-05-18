import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const trackSchema = z.object({
  creator_id:  z.string().uuid(),
  product_id:  z.string().uuid().optional(),
  event_type:  z.enum(["click", "conversation", "conversion"]).default("click"),
  platform:    z.string().max(50).optional(),
  campaign_id: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = trackSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const { creator_id, product_id, event_type, platform, campaign_id } = parsed.data
    const supabase = createClient()
    const today = new Date().toISOString().split("T")[0]

    // 1. Insert event — fire and forget, don't block the response
    const eventInsert = supabase.from("whatsapp_events").insert({
      creator_id,
      product_id: product_id ?? null,
      event_type,
      platform: platform ?? null,
      campaign_id: campaign_id ?? null,
    })

    // 2. Upsert daily metric counter
    const metricUpsert = (async () => {
      const { data: existing } = await supabase
        .from("creator_metrics_daily")
        .select("whatsapp_clicks")
        .eq("creator_id", creator_id)
        .eq("date", today)
        .maybeSingle()

      const current = (existing as { whatsapp_clicks: number } | null)?.whatsapp_clicks ?? 0
      await supabase
        .from("creator_metrics_daily")
        .upsert(
          { creator_id, date: today, whatsapp_clicks: current + 1 },
          { onConflict: "creator_id,date" }
        )
    })()

    // Run both in parallel — don't await, return 200 immediately
    await Promise.allSettled([eventInsert, metricUpsert])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[whatsapp/track]", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
