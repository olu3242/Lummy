"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

type SourcePoint = { name: string; value: number; color: string }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (active && payload && payload.length) {
    return <div className="rounded-xl border border-border bg-card shadow-brand-sm px-3 py-2 text-sm"><p className="font-semibold">{payload[0].name}</p><p className="text-muted-foreground">{payload[0].value}% of payments</p></div>
  }
  return null
}

export function OrderSourcesChart({ data }: { data: SourcePoint[] }) {
  const safeData = data.length ? data : [{ name: 'No data', value: 100, color: '#6b7280' }]
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-5"><h3 className="font-display font-bold">Payment Sources</h3><p className="text-xs text-muted-foreground">Distribution by provider</p></div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-shrink-0"><ResponsiveContainer width={160} height={160}><PieChart><Pie data={safeData} cx={75} cy={75} innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>{safeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer></div>
        <div className="flex-1 space-y-2.5">{safeData.map((source) => <div key={source.name} className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: source.color }} /><span className="text-sm text-muted-foreground flex-1">{source.name}</span><span className="text-sm font-bold">{source.value}%</span></div>)}</div>
      </div>
    </div>
  )
}
