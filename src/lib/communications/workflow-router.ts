import { sendCommunication, type SendCommunicationInput } from "./communication-service"
import type { CommunicationTemplateId } from "./template-registry"
import type { TemplateVariables } from "./render-template"

const WORKFLOW_TEMPLATE_MAP = {
  "report.generated": "report.generated",
  "lead.created": "lead.created",
  "appointment.created": "appointment.created",
  "appointment.cancelled": "appointment.cancelled",
  "recall.due": "recall.due",
  "patient.no_show": "patient.no_show",
  "treatment.acceptance": "treatment.acceptance",
  "review.request": "review.request",
} satisfies Record<string, CommunicationTemplateId>

export type CommunicationWorkflowEvent = keyof typeof WORKFLOW_TEMPLATE_MAP

export async function sendWorkflowCommunication(input: {
  event: CommunicationWorkflowEvent
  recipient: string
  variables: TemplateVariables
  organizationId?: string | null
  correlationId?: string
  variant?: SendCommunicationInput["variant"]
}) {
  return sendCommunication({
    event: input.event,
    recipient: input.recipient,
    templateId: WORKFLOW_TEMPLATE_MAP[input.event],
    variables: input.variables,
    organizationId: input.organizationId,
    correlationId: input.correlationId,
    variant: input.variant,
  })
}
