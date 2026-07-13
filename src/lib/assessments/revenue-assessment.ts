import { sendCommunication, recordCommunicationEvent } from "@/lib/communications/communication-service"
import { createAdminClient } from "@/lib/supabase/server"

export type RevenueAssessmentDeliveryState =
  | "report.generated"
  | "report.delivery.pending"
  | "report.delivery.sent"
  | "report.delivery.failed"

export interface RevenueAssessmentReport {
  id: string
  practiceName: string
  reportUrl: string
  revenueRecoveryEstimate: string
  practiceHealthScore: string
}

export interface RevenueAssessmentDeliveryResult {
  report: RevenueAssessmentReport
  deliveryState: RevenueAssessmentDeliveryState
  providerStatus: "sent" | "failed" | "not_attempted"
  providerMessageId: string | null
  failureReason: string | null
  deliveryId: string | null
}

export async function createLeadOperationsAlert(input: {
  organizationId?: string | null
  correlationId: string
  reportId: string
  recipient: string
  failureReason: string
  deliveryId?: string | null
}) {
  const admin = createAdminClient()
  const payload = {
    workflow_id: "lead.operations.report.delivery",
    event_type: "report.delivery.failed",
    severity: "high",
    organization_id: input.organizationId ?? null,
    title: "Lead Operations Alert",
    description: "Revenue assessment report email delivery failed.",
    context: {
      correlationId: input.correlationId,
      reportId: input.reportId,
      recipient: input.recipient,
      failureReason: input.failureReason,
      deliveryId: input.deliveryId ?? null,
    },
  }

  const result = await admin
    .from("human_intervention_queue")
    .insert(payload)
    .select("*")
    .single()

  if (result.error) throw result.error
  return result.data
}

export async function deliverRevenueAssessmentReport(input: {
  report: RevenueAssessmentReport
  recipient: string
  organizationId?: string | null
  correlationId: string
}): Promise<RevenueAssessmentDeliveryResult> {
  const reportGenerated: RevenueAssessmentDeliveryResult = {
    report: input.report,
    deliveryState: "report.generated",
    providerStatus: "not_attempted",
    providerMessageId: null,
    failureReason: null,
    deliveryId: null,
  }

  try {
    const sent = await sendCommunication({
      event: "report.generated",
      recipient: input.recipient,
      templateId: "report.generated",
      organizationId: input.organizationId ?? null,
      correlationId: input.correlationId,
      variables: {
        contact_name: "there",
        practice_name: input.report.practiceName,
        report_link: input.report.reportUrl,
        revenue_recovery_estimate: input.report.revenueRecoveryEstimate,
        practice_health_score: input.report.practiceHealthScore,
      },
    })

    return {
      ...reportGenerated,
      deliveryState: "report.delivery.sent",
      providerStatus: sent.providerStatus,
      providerMessageId: sent.providerMessageId ?? null,
      deliveryId: sent.deliveryId,
    }
  } catch (error) {
    const details = error as { message?: string; details?: { deliveryId?: string } }
    const deliveryId = details.details?.deliveryId ?? null
    const failureReason = details.message ?? "Report delivery failed"

    if (deliveryId) {
      await recordCommunicationEvent({
        deliveryId,
        eventType: "report.delivery.failed",
        organizationId: input.organizationId ?? null,
        templateId: "report.generated",
        recipient: input.recipient,
        metadata: {
          correlationId: input.correlationId,
          reportId: input.report.id,
          failureReason,
        },
      })
    }

    await createLeadOperationsAlert({
      organizationId: input.organizationId ?? null,
      correlationId: input.correlationId,
      reportId: input.report.id,
      recipient: input.recipient,
      failureReason,
      deliveryId,
    })

    return {
      ...reportGenerated,
      deliveryState: "report.delivery.failed",
      providerStatus: "failed",
      providerMessageId: null,
      failureReason,
      deliveryId,
    }
  }
}

export function getRevenueAssessmentStatusCopy(state: RevenueAssessmentDeliveryState) {
  if (state === "report.delivery.sent") {
    return {
      title: "Report Generated",
      delivery: "Email Sent",
    }
  }

  if (state === "report.delivery.failed") {
    return {
      title: "Report Generated",
      delivery: "Email Delivery Failed",
    }
  }

  if (state === "report.delivery.pending") {
    return {
      title: "Report Generated",
      delivery: "Email Delivery Pending",
    }
  }

  return {
    title: "Report Generated",
    delivery: "Email Not Sent",
  }
}
