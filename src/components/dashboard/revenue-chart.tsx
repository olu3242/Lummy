"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type RevenuePoint = { label: string; revenue: number; orders: number }

function formatRevenue(v: number) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}k`
  return `₦${v}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return <div className="rounded-xl border border-border bg-card shadow-brand-sm px-3 py-2.5 text-sm"><p className="font-semibold mb-1">{label}</p><p className="text-brand-green font-bold">{formatRevenue(payload[0]?.value ?? 0)}</p><p className="text-muted-foreground text-xs">{payload[1]?.value ?? 0} orders</p></div>
  }
  return null
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const safeData = data.length ? data : [{ label: 'No data', revenue: 0, orders: 0 }]
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5"><div><h3 className="font-display font-bold">Revenue</h3><p className="text-xs text-muted-foreground">Last 7 days from persisted payments</p></div></div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={safeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs><linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6C4EF3" stopOpacity={0.25} /><stop offset="95%" stopColor="#6C4EF3" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => formatRevenue(v)} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke="#6C4EF3" strokeWidth={2.5} fill="url(#revGradient)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
