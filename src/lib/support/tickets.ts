import { createAdminClient } from "@/lib/supabase/server"

export type TicketCategory = "payment" | "webhook" | "onboarding" | "product" | "storefront" | "general"
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed"
export type TicketPriority = "low" | "normal" | "high" | "urgent"

export interface SupportTicket {
  id: string
  creatorId: string
  userId: string
  category: TicketCategory
  subject: string
  body: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  resolvedAt: string | null
}

function mapRow(row: Record<string, unknown>): SupportTicket {
  return {
    id: row.id as string,
    creatorId: row.creator_id as string,
    userId: row.user_id as string,
    category: row.category as TicketCategory,
    subject: row.subject as string,
    body: row.body as string,
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    createdAt: row.created_at as string,
    resolvedAt: row.resolved_at as string | null,
  }
}

export async function createTicket(opts: {
  creatorId: string
  userId: string
  category: TicketCategory
  subject: string
  body: string
  priority?: TicketPriority
}): Promise<SupportTicket | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      creator_id: opts.creatorId,
      user_id: opts.userId,
      category: opts.category,
      subject: opts.subject,
      body: opts.body,
      priority: opts.priority ?? "normal",
    })
    .select()
    .single()

  if (error || !data) return null
  return mapRow(data as Record<string, unknown>)
}

export async function getCreatorTickets(creatorId: string): Promise<SupportTicket[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (!data) return []
  return (data as Record<string, unknown>[]).map(mapRow)
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  const supabase = createAdminClient()
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === "resolved" || status === "closed") {
    update.resolved_at = new Date().toISOString()
  }
  await supabase.from("support_tickets").update(update).eq("id", ticketId)
}

export async function getOpenTicketCount(): Promise<number> {
  const supabase = createAdminClient()
  const { count } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("status", "open")
  return count ?? 0
}

export async function getAllOpenTickets(): Promise<SupportTicket[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50)

  if (!data) return []
  return (data as Record<string, unknown>[]).map(mapRow)
}
