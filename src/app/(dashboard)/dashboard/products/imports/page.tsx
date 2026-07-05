"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, FileSpreadsheet, Check, AlertTriangle, X, Loader2, Upload } from "lucide-react"
import { cn } from "@/lib/utils"

type ImportJob = {
  id: string
  file_name: string
  file_type: string
  total_rows: number
  imported_rows: number
  failed_rows: number
  status: "completed" | "partial" | "failed"
  error_report: Array<{ row: number; field: string; message: string }>
  created_at: string
}

const statusCfg = {
  completed: { label: "Completed", icon: Check, className: "bg-brand-green/10 text-brand-green border-brand-green/20" },
  partial:   { label: "Partial",   icon: AlertTriangle, className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  failed:    { label: "Failed",    icon: X, className: "bg-red-500/10 text-red-500 border-red-500/20" },
}

export default function ImportHistoryPage() {
  const [jobs, setJobs] = React.useState<ImportJob[] | null>(null)
  const [expanded, setExpanded] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch("/api/products/import")
      .then((r) => (r.ok ? r.json() : { jobs: [] }))
      .then((d: { jobs?: ImportJob[] }) => setJobs(d.jobs ?? []))
      .catch(() => setJobs([]))
  }, [])

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/products" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1">
            <ArrowLeft className="h-3 w-3" /> Products
          </Link>
          <h1 className="font-display text-2xl font-extrabold">Import History</h1>
          <p className="text-sm text-muted-foreground">Every bulk import, with row counts and error reports.</p>
        </div>
        <Link href="/dashboard/products/import"
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-accent transition-colors">
          <Upload className="h-3.5 w-3.5" /> New Import
        </Link>
      </div>

      {jobs === null ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm font-semibold">No imports yet</p>
          <p className="text-xs text-muted-foreground mt-1">Bulk imports of your product catalog will appear here.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {jobs.map((job) => {
            const cfg = statusCfg[job.status] ?? statusCfg.completed
            const Icon = cfg.icon
            const hasErrors = (job.error_report?.length ?? 0) > 0
            return (
              <div key={job.id}>
                <button
                  onClick={() => hasErrors && setExpanded(expanded === job.id ? null : job.id)}
                  className={cn("w-full flex items-center gap-4 px-4 py-3 text-left", hasErrors && "hover:bg-accent/50 transition-colors")}
                >
                  <FileSpreadsheet className="h-4 w-4 text-brand-purple flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{job.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleString()} · {job.imported_rows}/{job.total_rows} imported
                      {job.failed_rows > 0 ? ` · ${job.failed_rows} failed` : ""}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold", cfg.className)}>
                    <Icon className="h-3 w-3" /> {cfg.label}
                  </span>
                </button>
                {expanded === job.id && hasErrors && (
                  <div className="px-4 pb-3 space-y-1 max-h-40 overflow-y-auto bg-muted/20">
                    {job.error_report.map((err, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        Row {err.row} · <span className="font-semibold">{err.field}</span>: {err.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
