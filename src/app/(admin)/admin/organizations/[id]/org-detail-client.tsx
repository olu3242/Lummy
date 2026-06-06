"use client"

import { useState } from "react"
import { Building2, ArrowLeft, Users, ShieldAlert, RefreshCw, Trash2, CheckCircle2, XCircle, AlertTriangle, CreditCard, Activity } from "lucide-react"
import Link from "next/link"
import { formatMoney } from "@/lib/globalization"

export type OrgDetailData = {
  id: string
  name: string
  slug: string
  status: "active" | "suspended"
  plan: string
  currency: string
  createdAt: string
  owner: { name: string; email: string; id: string } | null
  members: { id: string; name: string; email: string; role: string; status: string }[]
  subscription: { plan: string; billingCycle: string; nextBillingDate: string; amount: number; currency: string; status: string } | null
  stats: { totalRevenue: number; totalOrders: number; activeProducts: number }
}

function ConfirmDialog({
  title, body, confirmLabel, danger, onConfirm, onClose,
}: { title: string; body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d1a] p-6 shadow-2xl">
        {danger && <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />}
        <h3 className="text-base font-bold text-white text-center">{title}</h3>
        <p className="text-sm text-white/50 text-center mt-2 leading-relaxed">{body}</p>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:bg-white/5 transition-colors">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${danger ? "bg-red-500 hover:bg-red-600" : "bg-[#6C4EF3] hover:bg-[#5a3de0]"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function OrgDetailClient({ org: initialOrg }: { org: OrgDetailData }) {
  const [org, setOrg] = useState(initialOrg)
  const [dialog, setDialog] = useState<{ type: string } | null>(null)
  const [actionLog, setActionLog] = useState<string[]>([])
  const [newOwnerEmail, setNewOwnerEmail] = useState("")

  function logAction(msg: string) {
    setActionLog(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev.slice(0, 9)])
  }

  function handleTransferOwnership() {
    if (newOwnerEmail) {
      logAction(`Ownership transfer requested → ${newOwnerEmail} (requires server confirmation)`)
      setNewOwnerEmail("")
    }
  }

  const isActive = org.status === "active"

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {dialog?.type === "suspend" && (
        <ConfirmDialog
          title="Suspend Organization"
          body={`This will immediately revoke all team access for "${org.name}". Their storefront will go offline. Continue?`}
          confirmLabel="Suspend"
          danger
          onConfirm={() => { setOrg(o => ({ ...o, status: "suspended" })); logAction("Organization SUSPENDED") }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.type === "delete" && (
        <ConfirmDialog
          title="Permanently Delete Organization"
          body={`This action is irreversible. All data for "${org.name}" will be deleted permanently.`}
          confirmLabel="Delete Permanently"
          danger
          onConfirm={() => logAction("DELETE requested — requires manual Supabase action")}
          onClose={() => setDialog(null)}
        />
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/organizations" className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-[#6C4EF3]/20 flex items-center justify-center text-base font-bold text-[#6C4EF3]">
            {org.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{org.name}</h1>
            <p className="text-xs text-white/40 font-mono">/{org.slug} · {org.plan} plan · created {new Date(org.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive ? (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium"><CheckCircle2 className="w-3 h-3" />Active</span>
          ) : (
            <span className="flex items-center gap-1 text-red-400 text-xs font-medium"><XCircle className="w-3 h-3" />Suspended</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: formatMoney(org.stats.totalRevenue, org.currency) },
          { label: "Total Orders", value: org.stats.totalOrders.toLocaleString() },
          { label: "Active Products", value: org.stats.activeProducts },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#6C4EF3]" /> Ownership
            </h3>
            {org.owner ? (
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#6C4EF3]/20 flex items-center justify-center text-sm font-bold text-[#6C4EF3]">
                  {org.owner.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{org.owner.name}</p>
                  <p className="text-xs text-white/40">{org.owner.email}</p>
                </div>
                <span className="ml-auto text-[10px] font-bold text-[#6C4EF3] bg-[#6C4EF3]/10 border border-[#6C4EF3]/30 rounded px-2 py-0.5">ORG_OWNER</span>
              </div>
            ) : (
              <p className="text-xs text-white/30 mb-4">No owner record found</p>
            )}
            <div className="flex gap-2">
              <input
                value={newOwnerEmail}
                onChange={e => setNewOwnerEmail(e.target.value)}
                placeholder="New owner email…"
                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6C4EF3]/50"
              />
              <button
                onClick={handleTransferOwnership}
                className="flex items-center gap-1.5 rounded-lg border border-[#6C4EF3]/50 px-3 py-2 text-xs font-semibold text-[#6C4EF3] hover:bg-[#6C4EF3]/10 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Transfer
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#6C4EF3]" /> Team Members ({org.members.length})
            </h3>
            {org.members.length === 0 ? (
              <p className="text-xs text-white/30">No members found.</p>
            ) : (
              <div className="space-y-2">
                {org.members.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                        {m.name[0]}
                      </div>
                      <div>
                        <p className="text-sm text-white">{m.name}</p>
                        <p className="text-xs text-white/40">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/40">{m.role}</span>
                      <span className={`text-[10px] capitalize ${m.status === "active" ? "text-emerald-400" : "text-amber-400"}`}>{m.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {org.subscription && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#6C4EF3]" /> Subscription
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Plan", value: org.subscription.plan.toUpperCase() },
                  { label: "Cycle", value: org.subscription.billingCycle },
                  { label: "Amount", value: formatMoney(org.subscription.amount, org.subscription.currency) },
                  { label: "Next billing", value: org.subscription.nextBillingDate !== "—" ? new Date(org.subscription.nextBillingDate).toLocaleDateString() : "—" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-white/40">{label}</p>
                    <p className="text-sm font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Danger Zone
            </h3>
            <div className="space-y-2">
              {isActive ? (
                <button
                  onClick={() => setDialog({ type: "suspend" })}
                  className="w-full rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Suspend Organization
                </button>
              ) : (
                <button
                  onClick={() => { setOrg(o => ({ ...o, status: "active" })); logAction("Organization RESTORED") }}
                  className="w-full rounded-lg border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  Restore Organization
                </button>
              )}
              <button
                onClick={() => setDialog({ type: "delete" })}
                className="w-full rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" /> Delete Permanently
              </button>
            </div>
          </div>

          {actionLog.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs font-semibold text-amber-400 mb-2">Admin Actions (Session)</p>
              {actionLog.map((e, i) => (
                <p key={i} className="font-mono text-[10px] text-amber-400/60">{e}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
