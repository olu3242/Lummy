"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Tag, Plus, Copy, CheckCheck, ToggleLeft, ToggleRight,
  Trash2, Percent, Calendar, Users, TrendingUp, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Discount {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  uses: number
  maxUses: number | null
  minOrder: number | null
  expires: string | null
  active: boolean
}

const mockDiscounts: Discount[] = [
  { id: "D1", code: "WELCOME10", type: "percentage", value: 10, uses: 47, maxUses: null, minOrder: null, expires: null, active: true },
  { id: "D2", code: "SAVE5K", type: "fixed", value: 5000, uses: 12, maxUses: 50, minOrder: 20000, expires: "May 31, 2026", active: true },
  { id: "D3", code: "SUMMER20", type: "percentage", value: 20, uses: 34, maxUses: 100, minOrder: null, expires: "Jun 15, 2026", active: true },
  { id: "D4", code: "VIP25", type: "percentage", value: 25, uses: 8, maxUses: 20, minOrder: 50000, expires: null, active: false },
]

function CreateDiscountModal({ onClose, onCreate }: { onClose: () => void; onCreate: (d: Discount) => void }) {
  const [form, setForm] = React.useState<{ code: string; type: "percentage" | "fixed"; value: string; maxUses: string; minOrder: string; expires: string }>({ code: "", type: "percentage", value: "", maxUses: "", minOrder: "", expires: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({
      id: `D${Date.now()}`,
      code: form.code.toUpperCase(),
      type: form.type,
      value: Number(form.value),
      uses: 0,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      minOrder: form.minOrder ? Number(form.minOrder) : null,
      expires: form.expires || null,
      active: true,
    })
    onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-base">Create Discount Code</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Code</label>
            <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="e.g. FLASH30"
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as "percentage" | "fixed" }))}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₦)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Value</label>
              <input required type="number" min="1" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder={form.type === "percentage" ? "10" : "5000"}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Max Uses (optional)</label>
              <input type="number" min="1" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Unlimited"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Min Order (₦, optional)</label>
              <input type="number" min="0" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
                placeholder="No minimum"
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Expiry Date (optional)</label>
            <input type="date" value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1">Create Code</Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = React.useState<Discount[]>(mockDiscounts)
  const [creating, setCreating] = React.useState(false)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)

  const totalSavings = discounts.reduce((s, d) => s + d.uses * (d.type === "fixed" ? d.value : 1000 * d.value / 100), 0)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({ title: "Code copied!", description: `${code} copied to clipboard.`, variant: "success" })
  }

  const toggleActive = (id: string) => {
    setDiscounts(prev => prev.map(d => {
      if (d.id !== id) return d
      const next = { ...d, active: !d.active }
      toast({ title: next.active ? "Code activated" : "Code deactivated", variant: next.active ? "success" : "default" })
      return next
    }))
  }

  const deleteDiscount = (id: string) => {
    const code = discounts.find(d => d.id === id)?.code
    setDiscounts(prev => prev.filter(d => d.id !== id))
    toast({ title: `${code ?? "Code"} deleted`, variant: "default" })
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold">Discounts</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage promotional codes</p>
          </div>
          <Button onClick={() => setCreating(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> New Code
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active Codes", value: discounts.filter(d => d.active).length, icon: Tag, color: "text-brand-purple", bg: "bg-brand-purple/10" },
            { label: "Total Uses", value: discounts.reduce((s, d) => s + d.uses, 0), icon: Users, color: "text-brand-coral", bg: "bg-brand-coral/10" },
            { label: "Est. Savings Given", value: `₦${Math.round(totalSavings / 1000)}k`, icon: TrendingUp, color: "text-brand-green", bg: "bg-brand-green/10" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-4">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl mb-2", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <p className="font-display text-xl font-extrabold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Discount cards */}
        <div className="space-y-3">
          {discounts.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={cn("rounded-2xl border border-border bg-card p-4", !d.active && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Code + copy */}
                  <div className="flex items-center gap-2 mb-2">
                    <code className="font-mono text-base font-extrabold tracking-wider text-brand-purple">{d.code}</code>
                    <button onClick={() => copyCode(d.code, d.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors">
                      {copiedId === d.id ? <CheckCheck className="h-3 w-3 text-brand-green" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                    </button>
                    <Badge variant={d.active ? "brand" : "secondary"} size="sm">{d.active ? "Active" : "Inactive"}</Badge>
                  </div>

                  {/* Value */}
                  <div className="flex items-center gap-1.5 mb-2">
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      {d.type === "percentage" ? `${d.value}% off` : `₦${d.value.toLocaleString()} off`}
                    </span>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{d.uses}{d.maxUses ? `/${d.maxUses}` : ""} uses</span>
                    {d.minOrder && <span>Min ₦{d.minOrder.toLocaleString()}</span>}
                    {d.expires && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Expires {d.expires}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(d.id)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                    {d.active
                      ? <ToggleRight className="h-5 w-5 text-brand-purple" />
                      : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => deleteDiscount(d.id)} className="p-1.5 rounded-lg hover:bg-brand-coral/10 text-muted-foreground hover:text-brand-coral transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {creating && (
          <CreateDiscountModal onClose={() => setCreating(false)} onCreate={d => setDiscounts(prev => [d, ...prev])} />
        )}
      </AnimatePresence>
    </>
  )
}
