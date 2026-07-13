import { sendEmail } from "@/lib/notifications/email"
import { logger } from "@/lib/observability/logger"
import { createAdminClient } from "@/lib/supabase/server"
import {
  renderTemplate,
  type CommunicationTemplateId,
} from "./template-registry"
import type { TemplateVariables } from "./render-template"

export interface SendCommunicationInput {
  event: string
  recipient: string
  templateId: CommunicationTemplateId | string
  variables: TemplateVariables
  organizationId?: string | null
  correlationId?: string
  variant?: "a" | "b"
}

export interface SendCommunicationResult {
  ok: boolean
  deliveryId: string
  providerMessageId?: string
  providerStatus: "sent" | "failed"
  failureReason?: string
  variant: "a" | "b" | "default"
}

function serializeError(error: unknown) {
  if (error && typeof error === "object") {
    const record = error as { code?: string; message?: string; details?: string; hint?: string }
    return {
      code: record.code,
      message: record.message ?? String(error),
      details: record.details,
      hint: record.hint,
    }
  }
  return { message: String(error) }
}

export async function sendCommunication(input: SendCommunicationInput): Promise<SendCommunicationResult> {
  const correlationId = input.correlationId ?? `comm_${Date.now()}`
  const admin = createAdminClient()
  const rendered = renderTemplate(input.templateId, input.variables, { variant: input.variant })

  if (!rendered.valid) {
    const error = Object.assign(new Error("communication_template_variables_missing"), {
      code: "communication_template_variables_missing",
      details: {
        templateId: input.templateId,
        missingVariables: rendered.missingVariables,
      },
    })
    logger.error("[communications] render failed", {
      correlationId,
      event: input.event,
      templateId: input.templateId,
      missingVariables: rendered.missingVariables,
    })
    throw error
  }

  const deliveryPayload = {
    organization_id: input.organizationId ?? null,
    template_id: rendered.template.id,
    template_version: rendered.template.version,
    event_name: input.event,
    recipient: input.recipient,
    subject: rendered.subject,
    provider: "resend",
    provider_status: "rendered",
    delivery_state: input.event === "report.generated" ? "report.delivery.pending" : null,
    failure_reason: null,
    variant: rendered.variant,
    correlation_id: correlationId,
    metadata: {
      variables: input.variables,
      preview_text: rendered.previewText,
      success_metric: rendered.template.successMetric,
    },
  }

  logger.info("[communications] delivery.create", {
    correlationId,
    payload: deliveryPayload,
  })

  const created = await admin
    .from("communication_deliveries")
    .insert(deliveryPayload)
    .select("*")
    .single()

  if (created.error || !created.data) {
    logger.error("[communications] delivery.create_failed", {
      correlationId,
      payload: deliveryPayload,
      error: serializeError(created.error),
    })
    throw created.error ?? new Error("communication_delivery_create_failed")
  }

  const deliveryId = (created.data as { id: string }).id

  const providerResponse = await sendEmail({
    to: input.recipient,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.previewText,
  })

  logger.info("[communications] provider.response", {
    correlationId,
    deliveryId,
    providerResponse,
  })

  const providerStatus = providerResponse.success ? "sent" : "failed"
  const updatePayload = {
    provider_status: providerStatus,
    provider_message_id: providerResponse.emailId ?? null,
    delivery_state: input.event === "report.generated"
      ? providerResponse.success ? "report.delivery.sent" : "report.delivery.failed"
      : null,
    failure_reason: providerResponse.success ? null : providerResponse.error ?? "Email send failed",
    sent_at: providerResponse.success ? new Date().toISOString() : null,
    error: providerResponse.success ? null : { message: providerResponse.error ?? "Email send failed" },
  }

  const updated = await admin
    .from("communication_deliveries")
    .update(updatePayload)
    .eq("id", deliveryId)
    .select("*")
    .single()

  if (updated.error) {
    logger.error("[communications] delivery.update_failed", {
      correlationId,
      deliveryId,
      payload: updatePayload,
      error: serializeError(updated.error),
    })
    throw updated.error
  }

  if (!providerResponse.success) {
    const error = Object.assign(new Error(providerResponse.error ?? "communication_provider_failed"), {
      code: "communication_provider_failed",
      details: { deliveryId, provider: "resend" },
    })
    logger.error("[communications] send_failed", {
      correlationId,
      deliveryId,
      error: serializeError(error),
    })
    throw error
  }

  logger.info("[communications] send_succeeded", {
    correlationId,
    deliveryId,
    providerMessageId: providerResponse.emailId,
  })

  return {
    ok: true,
    deliveryId,
    providerMessageId: providerResponse.emailId,
    providerStatus,
    variant: rendered.variant,
  }
}

export async function recordCommunicationEvent(input: {
  deliveryId: string
  eventType: "sent" | "opened" | "clicked" | "bounced" | "complained" | "report.delivery.failed"
  organizationId?: string | null
  templateId: string
  recipient: string
  metadata?: Record<string, unknown>
}) {
  const admin = createAdminClient()
  const result = await admin
    .from("communication_events")
    .insert({
      delivery_id: input.deliveryId,
      organization_id: input.organizationId ?? null,
      template_id: input.templateId,
      recipient: input.recipient,
      event_type: input.eventType,
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single()

  if (result.error) throw result.error
  return result.data
}
