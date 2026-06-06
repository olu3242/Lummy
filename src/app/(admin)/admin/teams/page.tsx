"use client"

import { useState } from "react"
import { Users, UserPlus, Search, MoreVertical, CheckCircle2, XCircle, Clock, ShieldAlert } from "lucide-react"

const MOCK_MEMBERS = [
  { id: "m1", name: "Adeola Sade", email: "sade@lummy.co", role: "ORG_OWNER", org: "Sade Styles", orgId: "o1", status: "active", joinedAt: "2024-02-10", lastActive: "2 hours ago" },
  { id: "m2", name: "Emeka Okonkwo", email: "emeka@afrodrip.ng", role: "STORE_MANAGER", org: "AfroDrip", orgId: "o2", status: "active", joinedAt: "2024-03-15", lastActive: "1 day ago" },
  { id: "m3", name: "Fatima Al-Hassan", email: "fatima@luxeafrica.co", role: "ORG_ADMIN", org: "LuxeAfrica", orgId: "o3", status: "active", joinedAt: "2024-04-01", lastActive: "3 days ago" },
  { id: "m4", name: "Kofi Mensah", email: "kofi@koficraft.gh", role: "SALES_MANAGER", org: "KofiCraft", orgId: "o4", status: "inactive", joinedAt: "2024-01-20", lastActive: "45 days ago" },
  { id: "m5", name: "Amara Diallo", email: "amara@beadsbyamara.sn", role: "FULFILLMENT_AGENT", org: "BeadsByAmara", orgId: "o5", status: "active", joinedAt: "2024-05-10", lastActive: "5 hours ago" },
  { id: "m6", name: "Nala Osei", email: "nala@nalaafrica.ke", role: "TEAM_MEMBER", org: "NalaAfrica", orgId: "o6", status: "suspended", joinedAt: "2024-06-01", lastActive: "7 days ago" },
  { id: "m7", name: "Chidi Obi", email: "chidi@chidisells.ng", role: "SUPPORT_AGENT", org: "ChidiSells", orgId: "o7", status: "pending", joinedAt: "2024-06-10", lastActive: "Never" },
]

const ROLE_OPTIONS = ["ALL", "ORG_OWNER", "ORG_ADMIN", "STORE_MANAGER", "SALES_MANAGER", "SUPPORT_AGENT", "FULFILLMENT_AGENT", "TEAM_MEMBER"]
const STATUS_OPTIONS = ["ALL", "active", "inactive", "suspended", "pending"]

const ROLE_COLOR: Record<string, string> = {
  ORG_OWNER: "text-[#6C4EF3] bg-[#6C4EF3]/10 border-[#6C4EF3]/30",
  ORG_ADMIN: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  STORE_MANAGER: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  SALES_MANAGER: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  SUPPORT_AGENT: "text-sky-400 bg-sky-400/10 border-sky-400/30",
  FULFILLMENT_AGENT: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  TEAM_MEMBER: "text-white/50 bg-white/5 border-white/10",
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="w-3 h-3 text-emerald-400" />,
  inactive: <Clock className="w-3 h-3 text-amber-400" />,
  suspended: <XCircle className="w-3 h-3 text-red-400" />,
  pending: <Clock className="w-3 h-3 text-blue-400" />,
}

type Member = typeof MOCK_MEMBERS[0]

function InviteModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"form" | "sent">("form")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("STORE_MANAGER")
  const [org, setOrg] = useState("")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d1a] p-6 shadow-2xl">
        {step === "form" ? (
          <>
            <h3 className="text-base font-bold text-white mb-4">Invite Team Member</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Email address</label>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C4EF3]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Organization</label>
                <input
                  value={org}
                  onChange={e => setOrg(e.target.value)}
                  placeholder="Organization name or ID"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C4EF3]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6C4EF3]/50"
                >
                  {ROLE_OPTIONS.filter(r => r !== "ALL").map(r => (
                    <option key={r} value={r} className="bg-[#0d0d1a]">{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={onClose} className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5 transition-colors">Cancel</button>
              <button
                onClick={() => email && setStep("sent")}
                className="flex-1 rounded-lg bg-[#6C4EF3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5a3de0] transition-colors"
              >
                Send Invite
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-base font-bold text-white">Invite Sent!</p>
            <p className="text-sm text-white/50 mt-1">An invitation email was sent to <strong className="text-white">{email}</strong> for the <strong className="text-[#6C4EF3]">{role}</strong> role.</p>
            <button onClick={onClose} className="mt-4 rounded-lg bg-[#6C4EF3] px-6 py-2 text-sm font-semibold text-white hover:bg-[#5a3de0] transition-colors">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionMenu({ member, onAction }: { member: Member; onAction: (action: string, member: Member) => void }) {
  const [open, setOpen] = useState(false)
  const actions =
    member.status === "active"
      ? [{ label: "Disable access", action: "disable", danger: false }, { label: "Suspend account", action: "suspend", danger: true }, { label: "Change role", action: "role", danger: false }]
      : member.status === "suspended"
      ? [{ label: "Restore access", action: "restore", danger: false }, { label: "Permanently revoke", action: "revoke", danger: true }]
      : [{ label: "Activate", action: "activate", danger: false }, { label: "Revoke invite", action: "revoke", danger: true }]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-white/10 bg-[#0d0d1a] shadow-2xl py-1.5">
          {actions.map(({ label, action, danger }) => (
            <button
              key={action}
              onClick={() => { onAction(action, member); setOpen(false) }}
              className={`w-full text-left px-4 py-2 text-xs hover:bg-white/5 transition-colors ${danger ? "text-red-400 hover:text-red-300" : "text-white/70 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TeamsPage() {
  const [members, setMembers] = useState(MOCK_MEMBERS)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [actionLog, setActionLog] = useState<string[]>([])

  const filtered = members.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()) || m.org.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "ALL" || m.role === roleFilter
    const matchStatus = statusFilter === "ALL" || m.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  function handleAction(action: string, member: Member) {
    setMembers(prev => prev.map(m => {
      if (m.id !== member.id) return m
      if (action === "disable" || action === "suspend") return { ...m, status: action === "suspend" ? "suspended" : "inactive" }
      if (action === "restore" || action === "activate") return { ...m, status: "active" }
      if (action === "revoke") return { ...m, status: "suspended" }
      return m
    }))
    setActionLog(prev => [`${action.toUpperCase()} → ${member.name} (${member.role})`, ...prev.slice(0, 9)])
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#6C4EF3]" />
            Team Provisioning
          </h1>
          <p className="text-sm text-white/50 mt-1">Invite, manage, and revoke access for team members across all organizations.</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#6C4EF3] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5a3de0] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total members", value: members.length },
          { label: "Active", value: members.filter(m => m.status === "active").length },
          { label: "Suspended", value: members.filter(m => m.status === "suspended").length },
          { label: "Pending invites", value: members.filter(m => m.status === "pending").length },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or org…"
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C4EF3]/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none"
        >
          {ROLE_OPTIONS.map(r => <option key={r} value={r} className="bg-[#0d0d1a]">{r === "ALL" ? "All Roles" : r}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none"
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#0d0d1a]">{s === "ALL" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Member</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Organization</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Role</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Status</th>
              <th className="text-left py-3 px-4 text-white/50 font-medium text-xs">Last Active</th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => (
              <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6C4EF3]/20 flex items-center justify-center text-xs font-bold text-[#6C4EF3]">
                      {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{member.name}</p>
                      <p className="text-xs text-white/40">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-white/60 text-sm">{member.org}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-bold font-mono px-2 py-1 rounded-lg border ${ROLE_COLOR[member.role] || "text-white/50 bg-white/5 border-white/10"}`}>
                    {member.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 text-xs capitalize text-white/60">
                    {STATUS_ICON[member.status]}
                    {member.status}
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-white/40">{member.lastActive}</td>
                <td className="py-3 px-4">
                  <ActionMenu member={member} onAction={handleAction} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-white/30">No members match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action log */}
      {actionLog.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-semibold text-white">Session Action Log</p>
          </div>
          <div className="space-y-1">
            {actionLog.map((entry, i) => (
              <p key={i} className="font-mono text-[11px] text-white/50">{entry}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
