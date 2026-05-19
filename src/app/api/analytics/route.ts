import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { get30DayAnalytics } from "@/lib/queries/analytics"
import { errorResponse, getCorrelationId } from "@/lib/ops-observability"

export async function GET(req: Request) {
  const correlationId = getCorrelationId(req)
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return errorResponse(401, "UNAUTHORIZED", "Unauthorized", correlationId)

    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!profile?.id) return NextResponse.json({ summary: null })

    const summary = await get30DayAnalytics(profile.id)
    return NextResponse.json({ summary }, { headers: { "x-correlation-id": correlationId } })
  } catch (error) {
    return errorResponse(500, "ANALYTICS_FAILED", "Failed to fetch analytics", correlationId)
  }
}
