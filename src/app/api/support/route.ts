import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { createTicket, getCreatorTickets } from "@/lib/support/tickets"

const CreateTicketSchema = z.object({
  category: z.enum(["payment", "webhook", "onboarding", "product", "storefront", "general"]),
  subject: z.string().min(5).max(150),
  body: z.string().min(10).max(2000),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
})

async function resolveCreatorId(userId: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("creator_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const creatorId = await resolveCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ data: [] })

  const tickets = await getCreatorTickets(creatorId)
  return NextResponse.json({ data: tickets })
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const parsed = CreateTicketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const creatorId = await resolveCreatorId(user.id)
  if (!creatorId) return NextResponse.json({ error: "Creator profile not found" }, { status: 404 })

  const ticket = await createTicket({ creatorId, userId: user.id, ...parsed.data })
  if (!ticket) return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })

  return NextResponse.json({ data: ticket }, { status: 201 })
}
