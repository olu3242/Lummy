import {
  renderTemplateContent,
  validateVariables as validateTemplateVariables,
  type RenderedTemplate,
  type TemplateVariables,
} from "./render-template"

export type CommunicationTemplateId =
  | "report.generated"
  | "lead.created"
  | "appointment.created"
  | "appointment.reminder.24h"
  | "appointment.reminder.1h"
  | "appointment.cancelled"
  | "onboarding.started"
  | "onboarding.completed"
  | "pms.connection.required"
  | "recall.due"
  | "patient.no_show"
  | "treatment.acceptance"
  | "review.request"
  | "review.followup"
  | "inactive.lead.7day"
  | "inactive.lead.30day"
  | "executive.weekly.report"
  | "mission.control.alert"

export interface CommunicationTemplate {
  id: CommunicationTemplateId
  name: string
  event: string
  subject: string
  subjectA?: string
  subjectB?: string
  previewText: string
  ctaLabel: string
  ctaUrlVariable: string
  html: string
  variables: string[]
  successMetric: string
  version: number
  active: boolean
}

function layout(title: string, body: string, ctaLabel: string, ctaVariable: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;background:#f7f8fb;color:#18202f;font-family:Arial,sans-serif">
  <div style="display:none;max-height:0;overflow:hidden">{{preview_text}}</div>
  <main style="max-width:620px;margin:0 auto;padding:28px 16px">
    <section style="background:#ffffff;border:1px solid #dde3ee;border-radius:8px;padding:28px">
      <p style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#506176">Zenith PROS</p>
      <h1 style="font-size:24px;line-height:1.25;margin:0 0 16px;color:#111827">${title}</h1>
      ${body}
      <p style="margin:26px 0 0">
        <a href="{{${ctaVariable}}}" style="display:inline-block;background:#166534;color:#ffffff;text-decoration:none;font-weight:700;border-radius:6px;padding:12px 18px">${ctaLabel}</a>
      </p>
    </section>
    <p style="font-size:12px;color:#687386;margin:18px 4px 0">Sent by Zenith PROS Communication OS.</p>
  </main>
</body>
</html>`
}

const baseFallbacks: TemplateVariables = {
  contact_name: "there",
  patient_name: "your patient",
  provider_name: "your provider",
  practice_name: "your practice",
  preview_text: "",
}

export const TEMPLATE_FALLBACKS = baseFallbacks

export const COMMUNICATION_TEMPLATES: Record<CommunicationTemplateId, CommunicationTemplate> = {
  "report.generated": {
    id: "report.generated",
    name: "Report generated",
    event: "report.generated",
    subject: "{{practice_name}} report is ready",
    subjectA: "{{practice_name}} report is ready",
    subjectB: "Your Zenith PROS performance report is ready",
    previewText: "Review recovery opportunities and health score movement.",
    ctaLabel: "View report",
    ctaUrlVariable: "report_link",
    variables: ["practice_name", "report_link", "revenue_recovery_estimate", "practice_health_score"],
    successMetric: "report_open_rate",
    version: 1,
    active: true,
    html: layout(
      "Your report is ready",
      `<p>Hi {{contact_name}},</p><p>Your latest report for <strong>{{practice_name}}</strong> is ready. Estimated recovery opportunity: <strong>{{revenue_recovery_estimate}}</strong>. Practice health score: <strong>{{practice_health_score}}</strong>.</p>`,
      "View report",
      "report_link",
    ),
  },
  "lead.created": {
    id: "lead.created",
    name: "Lead created",
    event: "lead.created",
    subject: "New patient lead for {{practice_name}}",
    previewText: "{{contact_name}} is ready for follow-up.",
    ctaLabel: "Open lead",
    ctaUrlVariable: "portal_link",
    variables: ["practice_name", "contact_name", "portal_link"],
    successMetric: "speed_to_lead_minutes",
    version: 1,
    active: true,
    html: layout("New lead received", `<p><strong>{{contact_name}}</strong> just entered the funnel for {{practice_name}}. Open Mission Control and assign the next action while intent is fresh.</p>`, "Open lead", "portal_link"),
  },
  "appointment.created": {
    id: "appointment.created",
    name: "Appointment created",
    event: "appointment.created",
    subject: "Appointment confirmed for {{appointment_date}}",
    previewText: "{{patient_name}} is scheduled at {{appointment_time}}.",
    ctaLabel: "View appointment",
    ctaUrlVariable: "portal_link",
    variables: ["patient_name", "provider_name", "appointment_date", "appointment_time", "portal_link"],
    successMetric: "appointment_show_rate",
    version: 1,
    active: true,
    html: layout("Appointment confirmed", `<p>Hi {{patient_name}}, your appointment with {{provider_name}} is confirmed for <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong>.</p>`, "View appointment", "portal_link"),
  },
  "appointment.reminder.24h": {
    id: "appointment.reminder.24h",
    name: "24-hour appointment reminder",
    event: "appointment.reminder.24h",
    subject: "Reminder: appointment tomorrow at {{appointment_time}}",
    previewText: "Confirm details for {{appointment_date}}.",
    ctaLabel: "Confirm appointment",
    ctaUrlVariable: "portal_link",
    variables: ["patient_name", "appointment_date", "appointment_time", "portal_link"],
    successMetric: "confirmation_rate",
    version: 1,
    active: true,
    html: layout("Your appointment is tomorrow", `<p>Hi {{patient_name}}, this is a reminder for your appointment on <strong>{{appointment_date}}</strong> at <strong>{{appointment_time}}</strong>.</p>`, "Confirm appointment", "portal_link"),
  },
  "appointment.reminder.1h": {
    id: "appointment.reminder.1h",
    name: "1-hour appointment reminder",
    event: "appointment.reminder.1h",
    subject: "Your appointment starts in 1 hour",
    previewText: "Appointment time: {{appointment_time}}.",
    ctaLabel: "Open details",
    ctaUrlVariable: "portal_link",
    variables: ["patient_name", "appointment_time", "portal_link"],
    successMetric: "late_cancel_reduction",
    version: 1,
    active: true,
    html: layout("Starting soon", `<p>Hi {{patient_name}}, your appointment starts at <strong>{{appointment_time}}</strong>. Please arrive a few minutes early.</p>`, "Open details", "portal_link"),
  },
  "appointment.cancelled": {
    id: "appointment.cancelled",
    name: "Appointment cancelled",
    event: "appointment.cancelled",
    subject: "Appointment cancelled: {{appointment_date}}",
    previewText: "Reschedule when ready.",
    ctaLabel: "Reschedule",
    ctaUrlVariable: "portal_link",
    variables: ["patient_name", "appointment_date", "portal_link"],
    successMetric: "reschedule_rate",
    version: 1,
    active: true,
    html: layout("Appointment cancelled", `<p>Hi {{patient_name}}, your appointment on <strong>{{appointment_date}}</strong> has been cancelled. Use the link below to choose a new time.</p>`, "Reschedule", "portal_link"),
  },
  "onboarding.started": {
    id: "onboarding.started",
    name: "Onboarding started",
    event: "onboarding.started",
    subject: "Welcome to Zenith PROS, {{practice_name}}",
    previewText: "Complete setup to activate your recovery engine.",
    ctaLabel: "Continue setup",
    ctaUrlVariable: "portal_link",
    variables: ["practice_name", "portal_link"],
    successMetric: "onboarding_completion_rate",
    version: 1,
    active: true,
    html: layout("Setup started", `<p>{{practice_name}} is now in Zenith PROS onboarding. Complete the remaining steps to activate reporting, recalls, reviews, and Mission Control.</p>`, "Continue setup", "portal_link"),
  },
  "onboarding.completed": {
    id: "onboarding.completed",
    name: "Onboarding completed",
    event: "onboarding.completed",
    subject: "{{practice_name}} is live on Zenith PROS",
    previewText: "Mission Control is ready.",
    ctaLabel: "Open Mission Control",
    ctaUrlVariable: "portal_link",
    variables: ["practice_name", "portal_link"],
    successMetric: "first_week_activation",
    version: 1,
    active: true,
    html: layout("Mission Control is live", `<p>Congratulations. <strong>{{practice_name}}</strong> is fully activated in Zenith PROS. Your workflows are now ready for revenue recovery operations.</p>`, "Open Mission Control", "portal_link"),
  },
  "pms.connection.required": {
    id: "pms.connection.required",
    name: "PMS connection required",
    event: "pms.connection.required",
    subject: "Connect your PMS to unlock recovery workflows",
    previewText: "Zenith PROS needs PMS access to automate the next step.",
    ctaLabel: "Connect PMS",
    ctaUrlVariable: "portal_link",
    variables: ["practice_name", "portal_link"],
    successMetric: "pms_connection_rate",
    version: 1,
    active: true,
    html: layout("PMS connection needed", `<p>{{practice_name}} needs a PMS connection before Zenith PROS can synchronize appointments, recalls, and treatment opportunities.</p>`, "Connect PMS", "portal_link"),
  },
  "recall.due": {
    id: "recall.due",
    name: "Recall due",
    event: "recall.due",
    subject: "{{patient_name}}, it is time to schedule your visit",
    previewText: "Your care team has a recommended follow-up.",
    ctaLabel: "Schedule visit",
    ctaUrlVariable: "portal_link",
    variables: ["patient_name", "practice_name", "portal_link"],
    successMetric: "recall_booking_rate",
    version: 1,
    active: true,
    html: layout("Time for your next visit", `<p>Hi {{patient_name}}, {{practice_name}} recommends scheduling your next visit. Choose a convenient time below.</p>`, "Schedule visit", "portal_link"),
  },
  "patient.no_show": {
    id: "patient.no_show",
    name: "Patient no-show",
    event: "patient.no_show",
    subject: "We missed you today, {{patient_name}}",
    previewText: "Reschedule your appointment.",
    ctaLabel: "Reschedule",
    ctaUrlVariable: "portal_link",
    variables: ["patient_name", "practice_name", "portal_link"],
    successMetric: "no_show_recovery_rate",
    version: 1,
    active: true,
    html: layout("We missed you", `<p>Hi {{patient_name}}, {{practice_name}} missed you today. You can quickly reschedule using the link below.</p>`, "Reschedule", "portal_link"),
  },
  "treatment.acceptance": {
    id: "treatment.acceptance",
    name: "Treatment acceptance",
    event: "treatment.acceptance",
    subject: "Next step for your treatment plan",
    previewText: "Review and accept your recommended plan.",
    ctaLabel: "Review plan",
    ctaUrlVariable: "portal_link",
    variables: ["patient_name", "provider_name", "portal_link"],
    successMetric: "treatment_acceptance_rate",
    version: 1,
    active: true,
    html: layout("Review your plan", `<p>Hi {{patient_name}}, {{provider_name}} has shared your recommended treatment plan. Review the next step when ready.</p>`, "Review plan", "portal_link"),
  },
  "review.request": {
    id: "review.request",
    name: "Review request",
    event: "review.request",
    subject: "How was your visit with {{practice_name}}?",
    previewText: "Your feedback helps the practice improve.",
    ctaLabel: "Leave a review",
    ctaUrlVariable: "review_link",
    variables: ["patient_name", "practice_name", "review_link"],
    successMetric: "review_conversion_rate",
    version: 1,
    active: true,
    html: layout("Share your experience", `<p>Hi {{patient_name}}, thank you for visiting {{practice_name}}. Your review helps other patients make confident care decisions.</p>`, "Leave a review", "review_link"),
  },
  "review.followup": {
    id: "review.followup",
    name: "Review follow-up",
    event: "review.followup",
    subject: "Following up on your {{practice_name}} visit",
    previewText: "There is still time to share feedback.",
    ctaLabel: "Leave feedback",
    ctaUrlVariable: "review_link",
    variables: ["patient_name", "practice_name", "review_link"],
    successMetric: "review_followup_conversion_rate",
    version: 1,
    active: true,
    html: layout("Quick follow-up", `<p>Hi {{patient_name}}, following up on your recent visit with {{practice_name}}. If you have a moment, please share your experience.</p>`, "Leave feedback", "review_link"),
  },
  "inactive.lead.7day": {
    id: "inactive.lead.7day",
    name: "Inactive lead 7 day",
    event: "inactive.lead.7day",
    subject: "Still interested in scheduling?",
    previewText: "Pick up where you left off.",
    ctaLabel: "Schedule now",
    ctaUrlVariable: "portal_link",
    variables: ["contact_name", "practice_name", "portal_link"],
    successMetric: "lead_reactivation_7day_rate",
    version: 1,
    active: true,
    html: layout("Still interested?", `<p>Hi {{contact_name}}, {{practice_name}} can still help you schedule the care you were considering. Choose a time below.</p>`, "Schedule now", "portal_link"),
  },
  "inactive.lead.30day": {
    id: "inactive.lead.30day",
    name: "Inactive lead 30 day",
    event: "inactive.lead.30day",
    subject: "Checking in from {{practice_name}}",
    previewText: "Reopen your care request.",
    ctaLabel: "Restart request",
    ctaUrlVariable: "portal_link",
    variables: ["contact_name", "practice_name", "portal_link"],
    successMetric: "lead_reactivation_30day_rate",
    version: 1,
    active: true,
    html: layout("Checking in", `<p>Hi {{contact_name}}, checking in from {{practice_name}}. If care is still on your list, you can restart the request here.</p>`, "Restart request", "portal_link"),
  },
  "executive.weekly.report": {
    id: "executive.weekly.report",
    name: "Executive weekly report",
    event: "executive.weekly.report",
    subject: "{{practice_name}} weekly executive report",
    previewText: "Recovery estimate: {{revenue_recovery_estimate}}.",
    ctaLabel: "Open report",
    ctaUrlVariable: "report_link",
    variables: ["practice_name", "report_link", "revenue_recovery_estimate", "practice_health_score"],
    successMetric: "executive_report_open_rate",
    version: 1,
    active: true,
    html: layout("Weekly executive report", `<p>{{practice_name}} has a new executive summary. Recovery estimate: <strong>{{revenue_recovery_estimate}}</strong>. Health score: <strong>{{practice_health_score}}</strong>.</p>`, "Open report", "report_link"),
  },
  "mission.control.alert": {
    id: "mission.control.alert",
    name: "Mission Control alert",
    event: "mission.control.alert",
    subject: "Mission Control alert for {{practice_name}}",
    previewText: "A workflow needs review.",
    ctaLabel: "Open Mission Control",
    ctaUrlVariable: "portal_link",
    variables: ["practice_name", "portal_link"],
    successMetric: "alert_resolution_rate",
    version: 1,
    active: true,
    html: layout("Workflow needs attention", `<p>Mission Control detected an issue for <strong>{{practice_name}}</strong>. Open the alert and resolve the workflow exception.</p>`, "Open Mission Control", "portal_link"),
  },
}

export function listTemplates(): CommunicationTemplate[] {
  return Object.values(COMMUNICATION_TEMPLATES)
}

export function getTemplate(templateId: CommunicationTemplateId | string): CommunicationTemplate {
  const template = COMMUNICATION_TEMPLATES[templateId as CommunicationTemplateId]
  if (!template || !template.active) {
    throw Object.assign(new Error(`Communication template not found or inactive: ${templateId}`), {
      code: "communication_template_not_found",
      templateId,
    })
  }
  return template
}

export function validateVariables(templateId: CommunicationTemplateId | string, variables: TemplateVariables) {
  const template = getTemplate(templateId)
  return validateTemplateVariables(template.variables, variables, TEMPLATE_FALLBACKS)
}

export function renderTemplate(
  templateId: CommunicationTemplateId | string,
  variables: TemplateVariables,
  opts: { variant?: "a" | "b" } = {},
): RenderedTemplate & { template: CommunicationTemplate; variant: "a" | "b" | "default" } {
  const template = getTemplate(templateId)
  const variant = opts.variant ?? (template.subjectA && template.subjectB ? (Math.random() < 0.5 ? "a" : "b") : "default")
  const subject = variant === "a" ? template.subjectA ?? template.subject : variant === "b" ? template.subjectB ?? template.subject : template.subject
  const previewVariables = { ...variables, preview_text: template.previewText }

  return {
    ...renderTemplateContent({
      subject,
      previewText: template.previewText,
      html: template.html,
      variables: previewVariables,
      fallbacks: TEMPLATE_FALLBACKS,
    }),
    template,
    variant,
  }
}
