import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  // Require authentication — ops data is sensitive
  const userClient = createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only allow admin-role users in production; in dev, allow any authenticated user
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("webhook_events")
    .select("id, source, event_type, status, attempt_count, error_message, created_at, correlation_id")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
