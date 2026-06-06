import { requireAdminAccess } from "@/lib/admin/auth"
import { createClient } from "@/lib/supabase/server"
import { HeadphonesIcon, Search, MessageSquare, AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"
export const metadata = { title: "Support Center" }

const MOCK_TICKETS = [
  { id: "t1", title: "Payment not reflecting after Paystack checkout", org: "Sade Styles", user: "sade@lummy.co", status: "open", priority: "high", category: "billing", createdAt: "2026-06-06 14:30", assignee: "support@lummy.co", replies: 2 },
  { id: "t2", title: "WhatsApp message not sending to customers", org: "AfroDrip", user: "emeka@afrodrip.ng", status: "in_progress", priority: "medium", category: "whatsapp", createdAt: "2026-06-06 11:10", assignee: "support@lummy.co", replies: 5 },
  { id: "t3", title: "Cannot upload product images larger than 2MB", org: "LuxeAfrica", user: "fatima@luxeafrica.co", status: "open", priority: "low", category: "products", createdAt: "2026-06-05 17:45", assignee: null, replies: 0 },
  { id: "t4", title: "Storefront showing wrong currency symbol", org: "KofiCraft", user: "kofi@koficraft.gh", status: "resolved", priority: "medium", category: "storefront", createdAt: "2026-06-04 09:00", assignee: "support@lummy.co", replies: 8 },
  { id: "t5", title: "AI caption tool returning empty responses", org: "BeadsByAmara", user: "amara@beadsbyamara.sn", status: "open", priority: "high", category: "ai", createdAt: "2026-06-06 08:20", assignee: null, replies: 1 },
]

const STATUS_COLOR: Record<string, string> = {
  open: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  in_progress: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  resolved: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-blue-400",
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  open: <AlertCircle className="w-3 h-3 text-amber-400" />,
  in_progress: <Clock className="w-3 h-3 text-blue-400" />,
  resolved: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
}

export default async function SupportPage() {
  await requireAdminAccess()
  const supabase = createClient()

  const { data: dbTickets } = await supabase
    .from("support_tickets")
    .select("id, title, status, priority, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  const tickets = dbTickets && dbTickets.length > 0 ? dbTickets.map((t: { id: string; title: string; status: string; priority: string; created_at: string }) => ({
    id: t.id,
    title: t.title,
    org: "—",
    user: "—",
    status: t.status,
    priority: t.priority || "medium",
    category: "general",
    createdAt: new Date(t.created_at).toLocaleString(),
    assignee: null,
    replies: 0,
  })) : MOCK_TICKETS

  const open = tickets.filter(t => t.status === "open").length
  const inProgress = tickets.filter(t => t.status === "in_progress").length
  const highPriority = tickets.filter(t => t.priority === "high" && t.status !== "resolved").length

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <HeadphonesIcon className="w-6 h-6 text-[#6C4EF3]" />
          Support Center
        </h1>
        <p className="text-sm text-white/50 mt-1">Platform-level support tickets, escalations, and user lookup.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Open tickets", value: open, color: "text-amber-400" },
          { label: "In progress", value: inProgress, color: "text-blue-400" },
          { label: "High priority", value: highPriority, color: "text-red-400" },
          { label: "Resolved today", value: tickets.filter(t => t.status === "resolved").length, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {highPriority > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">
            <strong>{highPriority} high-priority ticket{highPriority > 1 ? "s" : ""}</strong> require immediate attention.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              placeholder="Search tickets…"
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Ticket</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Organization</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Category</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Priority</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Status</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Assignee</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Created</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-start gap-2">
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[ticket.priority] ?? "bg-white/20"}`} />
                    <div>
                      <p className="font-medium text-white text-sm leading-tight">{ticket.title}</p>
                      <p className="text-xs text-white/40 mt-0.5">{ticket.user}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-white/60 text-sm">{ticket.org}</td>
                <td className="py-3 px-4">
                  <span className="text-[10px] font-mono text-white/40 uppercase">{ticket.category}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-bold uppercase font-mono ${PRIORITY_DOT[ticket.priority] === "bg-red-400" ? "text-red-400" : PRIORITY_DOT[ticket.priority] === "bg-amber-400" ? "text-amber-400" : "text-blue-400"}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`flex items-center gap-1 text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border ${STATUS_COLOR[ticket.status] ?? "text-white/50 bg-white/5 border-white/10"}`}>
                    {STATUS_ICON[ticket.status]}
                    {ticket.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {ticket.assignee ? (
                    <p className="text-xs text-white/50">{ticket.assignee}</p>
                  ) : (
                    <button className="text-xs text-[#6C4EF3] hover:text-white transition-colors">Assign →</button>
                  )}
                </td>
                <td className="py-3 px-4 text-xs text-white/30">{ticket.createdAt}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-white/40 text-xs">
                    <MessageSquare className="w-3 h-3" />
                    {ticket.replies}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
