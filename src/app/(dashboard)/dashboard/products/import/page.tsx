"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Upload, FileSpreadsheet, ArrowLeft, ArrowRight, Check, X,
  AlertTriangle, Loader2, Download, History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { IMPORT_FIELDS, type ImportField } from "@/services/product-import"

type Step = "upload" | "mapping" | "preview" | "result"

type PreviewResponse = {
  headers: string[]
  mapping: Record<string, ImportField | null>
  totalRows: number
  validRows: number
  errorCount: number
  errors: Array<{ row: number; field: string; message: string }>
  preview: Array<{ row: number; data: Record<string, unknown>; errors: Array<{ row: number; field: string; message: string }> }>
}

type CommitResponse = {
  jobId: string | null
  totalRows: number
  imported: number
  failed: number
  errors: Array<{ row: number; field: string; message: string }>
}

const FIELD_LABELS: Record<ImportField, string> = {
  title: "Title *", description: "Description", price: "Price (₦) *", currency: "Currency",
  sku: "SKU", slug: "Slug", category: "Category", image_url: "Image URL", stock_quantity: "Stock", status: "Status",
}

const TEMPLATE_CSV = `title,description,price,currency,sku,category,image_url,stock_quantity,status
Ankara Print Dress,Beautiful handmade ankara dress,25000,NGN,ANK-001,Clothing,https://example.com/dress.jpg,10,active
Gold Hoop Earrings,18k gold plated hoops,8500,NGN,EAR-014,Jewellery,,25,draft`

export default function ProductImportPage() {
  const router = useRouter()
  const [step, setStep] = React.useState<Step>("upload")
  const [file, setFile] = React.useState<File | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [previewData, setPreviewData] = React.useState<PreviewResponse | null>(null)
  const [mapping, setMapping] = React.useState<Record<string, ImportField | null>>({})
  const [result, setResult] = React.useState<CommitResponse | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "lummy-import-template.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const runPreview = async (f: File, customMapping?: Record<string, ImportField | null>) => {
    setBusy(true)
    try {
      const form = new FormData()
      form.set("file", f)
      form.set("mode", "preview")
      if (customMapping) form.set("mapping", JSON.stringify(customMapping))
      const res = await fetch("/api/products/import", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? data?.message ?? "Upload failed")
      setPreviewData(data as PreviewResponse)
      setMapping((data as PreviewResponse).mapping)
      return data as PreviewResponse
    } finally {
      setBusy(false)
    }
  }

  const onFileSelected = async (f: File) => {
    const ok = /\.(csv|xlsx|xls)$/i.test(f.name)
    if (!ok) { toast({ title: "Unsupported file — use .csv or .xlsx", variant: "error" }); return }
    setFile(f)
    try {
      await runPreview(f)
      setStep("mapping")
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Could not read file", variant: "error" })
      setFile(null)
    }
  }

  const applyMapping = async () => {
    if (!file) return
    const mapped = Object.values(mapping).filter(Boolean)
    if (!mapped.includes("title") || !mapped.includes("price")) {
      toast({ title: "Map at least Title and Price columns", variant: "error" })
      return
    }
    try {
      await runPreview(file, mapping)
      setStep("preview")
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Validation failed", variant: "error" })
    }
  }

  const commit = async () => {
    if (!file) return
    setBusy(true)
    try {
      const form = new FormData()
      form.set("file", file)
      form.set("mode", "commit")
      form.set("mapping", JSON.stringify(mapping))
      const res = await fetch("/api/products/import", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? "Import failed")
      setResult(data as CommitResponse)
      setStep("result")
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Import failed", variant: "error" })
    } finally {
      setBusy(false)
    }
  }

  const stepIndex = ["upload", "mapping", "preview", "result"].indexOf(step)

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/products" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1">
            <ArrowLeft className="h-3 w-3" /> Products
          </Link>
          <h1 className="font-display text-2xl font-extrabold">Bulk Import</h1>
          <p className="text-sm text-muted-foreground">Upload a CSV or Excel file to add products in bulk.</p>
        </div>
        <Link href="/dashboard/products/imports"
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border bg-background text-xs font-semibold hover:bg-accent transition-colors">
          <History className="h-3.5 w-3.5" /> Import History
        </Link>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {["Upload", "Column Mapping", "Preview", "Result"].map((label, i) => (
          <React.Fragment key={label}>
            <div className={cn("flex items-center gap-1.5 text-xs font-semibold",
              i <= stepIndex ? "text-brand-purple" : "text-muted-foreground/50")}>
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                i < stepIndex ? "bg-brand-purple text-white border-brand-purple" : i === stepIndex ? "border-brand-purple" : "border-border")}>
                {i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {label}
            </div>
            {i < 3 && <div className={cn("flex-1 h-px", i < stepIndex ? "bg-brand-purple" : "bg-border")} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void onFileSelected(f) }}
            className="w-full rounded-2xl border-2 border-dashed border-border hover:border-brand-purple/50 bg-background p-12 flex flex-col items-center gap-3 transition-colors"
          >
            {busy ? <Loader2 className="h-8 w-8 text-brand-purple animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
            <div className="text-center">
              <p className="text-sm font-semibold">{busy ? "Reading file…" : "Drop your file here or click to browse"}</p>
              <p className="text-xs text-muted-foreground mt-1">.csv or .xlsx — up to 5MB / 2,000 rows</p>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFileSelected(f); e.target.value = "" }} />
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs text-brand-purple font-semibold hover:underline">
            <Download className="h-3.5 w-3.5" /> Download CSV template
          </button>
        </div>
      )}

      {/* Step: Mapping */}
      {step === "mapping" && previewData && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-brand-purple" />
              <span className="text-sm font-semibold">{file?.name}</span>
              <span className="text-xs text-muted-foreground">· {previewData.totalRows} rows</span>
            </div>
            <div className="divide-y divide-border">
              {previewData.headers.map((header) => (
                <div key={header} className="flex items-center justify-between px-4 py-2.5 gap-4">
                  <span className="text-sm font-medium truncate">{header}</span>
                  <select
                    value={mapping[header] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [header]: (e.target.value || null) as ImportField | null }))}
                    className="h-8 px-2 rounded-lg border border-border bg-background text-xs min-w-[160px]"
                  >
                    <option value="">— Skip column —</option>
                    {IMPORT_FIELDS.map((f) => (
                      <option key={f} value={f} disabled={Object.entries(mapping).some(([h, v]) => v === f && h !== header)}>
                        {FIELD_LABELS[f]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={() => { setStep("upload"); setFile(null); setPreviewData(null) }}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
            </Button>
            <Button size="sm" onClick={() => void applyMapping()} disabled={busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Validate & Preview <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && previewData && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-2xl font-extrabold">{previewData.totalRows}</p>
              <p className="text-xs text-muted-foreground">Total rows</p>
            </div>
            <div className="rounded-2xl border border-brand-green/25 bg-brand-green/5 p-4">
              <p className="text-2xl font-extrabold text-brand-green">{previewData.validRows}</p>
              <p className="text-xs text-muted-foreground">Ready to import</p>
            </div>
            <div className={cn("rounded-2xl border p-4", previewData.errorCount > 0 ? "border-amber-500/25 bg-amber-500/5" : "border-border")}>
              <p className={cn("text-2xl font-extrabold", previewData.errorCount > 0 && "text-amber-500")}>{previewData.errorCount}</p>
              <p className="text-xs text-muted-foreground">Validation errors</p>
            </div>
          </div>

          {previewData.errors.length > 0 && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-1 max-h-48 overflow-y-auto">
              <p className="text-xs font-bold text-amber-600 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5" /> Rows with errors will be skipped
              </p>
              {previewData.errors.map((err, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  Row {err.row} · <span className="font-semibold">{err.field}</span>: {err.message}
                </p>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">#</th>
                    <th className="text-left px-3 py-2 font-semibold">Title</th>
                    <th className="text-left px-3 py-2 font-semibold">Price (₦)</th>
                    <th className="text-left px-3 py-2 font-semibold">SKU</th>
                    <th className="text-left px-3 py-2 font-semibold">Category</th>
                    <th className="text-left px-3 py-2 font-semibold">Status</th>
                    <th className="text-left px-3 py-2 font-semibold">Valid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewData.preview.map((row) => (
                    <tr key={row.row} className={cn(row.errors.length > 0 && "bg-amber-500/5")}>
                      <td className="px-3 py-2 text-muted-foreground">{row.row}</td>
                      <td className="px-3 py-2 font-medium">{String(row.data.title ?? "—")}</td>
                      <td className="px-3 py-2">{row.data.price ? (Number(row.data.price) / 100).toLocaleString() : "—"}</td>
                      <td className="px-3 py-2">{String(row.data.sku ?? "—")}</td>
                      <td className="px-3 py-2">{String(row.data.category ?? "—")}</td>
                      <td className="px-3 py-2">{String(row.data.status ?? "draft")}</td>
                      <td className="px-3 py-2">
                        {row.errors.length === 0
                          ? <Check className="h-3.5 w-3.5 text-brand-green" />
                          : <X className="h-3.5 w-3.5 text-amber-500" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.totalRows > previewData.preview.length && (
              <p className="px-3 py-2 text-[11px] text-muted-foreground border-t border-border">
                Showing first {previewData.preview.length} of {previewData.totalRows} rows.
              </p>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" size="sm" onClick={() => setStep("mapping")}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to mapping
            </Button>
            <Button size="sm" onClick={() => void commit()} disabled={busy || previewData.validRows === 0}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Import {previewData.validRows} product{previewData.validRows === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && result && (
        <div className="space-y-4 text-center py-6">
          <div className={cn("inline-flex h-16 w-16 items-center justify-center rounded-3xl border-2 mx-auto",
            result.failed === 0 ? "bg-brand-green/15 border-brand-green/30" : "bg-amber-500/15 border-amber-500/30")}>
            {result.failed === 0
              ? <Check className="h-8 w-8 text-brand-green" />
              : <AlertTriangle className="h-8 w-8 text-amber-500" />}
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold">
              {result.imported} of {result.totalRows} products imported
            </h2>
            {result.failed > 0 && (
              <p className="text-sm text-muted-foreground mt-1">{result.failed} row{result.failed === 1 ? "" : "s"} skipped — see the error report below.</p>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-1 max-h-48 overflow-y-auto text-left">
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  Row {err.row} · <span className="font-semibold">{err.field}</span>: {err.message}
                </p>
              ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button size="sm" onClick={() => router.push("/dashboard/products")}>View Products</Button>
            <Button variant="outline" size="sm" onClick={() => { setStep("upload"); setFile(null); setPreviewData(null); setResult(null) }}>
              Import another file
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
