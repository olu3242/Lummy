import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react"
import {
  getRevenueAssessmentStatusCopy,
  type RevenueAssessmentDeliveryState,
} from "@/lib/assessments/revenue-assessment"

export function RevenueAssessmentStatus({
  state,
  reportUrl,
  failureReason,
}: {
  state: RevenueAssessmentDeliveryState
  reportUrl?: string
  failureReason?: string | null
}) {
  const copy = getRevenueAssessmentStatusCopy(state)
  const isSent = state === "report.delivery.sent"
  const isFailed = state === "report.delivery.failed"
  const isPending = state === "report.delivery.pending"
  const Icon = isSent ? CheckCircle2 : isFailed ? AlertTriangle : isPending ? Clock : FileText

  return (
    <section className="border border-border bg-background p-5">
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 ${isSent ? "text-emerald-700" : isFailed ? "text-red-700" : "text-muted-foreground"}`} />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{copy.title}</h2>
          <p className={`mt-1 text-sm font-medium ${isFailed ? "text-red-700" : isSent ? "text-emerald-700" : "text-muted-foreground"}`}>
            {copy.delivery}
          </p>
          {failureReason ? <p className="mt-2 text-sm text-muted-foreground">{failureReason}</p> : null}
          {reportUrl ? (
            <a className="mt-4 inline-flex border border-border px-3 py-2 text-sm font-medium" href={reportUrl}>
              View report
            </a>
          ) : null}
        </div>
      </div>
    </section>
  )
}
