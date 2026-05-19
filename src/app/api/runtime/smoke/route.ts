import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { runAllSmokeTests } from "@/lib/testing/smoke"

export async function GET() {
  // Require authentication — smoke tests reveal internal topology
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await runAllSmokeTests()
  const status = result.allPassed ? 200 : 503

  return NextResponse.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}
