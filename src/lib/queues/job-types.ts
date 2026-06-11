/**
 * Typed job payloads for every queue.
 * Consumers (workers) import these types; never use plain Record<string, unknown>.
 */

import type { AgentName, GenerationType } from "@/lib/ai/gateway"

// ── AI Jobs ───────────────────────────────────────────────────

export interface AIJobPayload {
  agent:         AgentName
  type:          GenerationType
  prompt:        string
  tenantId:      string
  creatorId?:    string
  userId?:       string
  correlationId?: string
  maxTokens?:    number
  callbackEventName?: string   // automation event to emit on completion
}

// ── WhatsApp Jobs ─────────────────────────────────────────────

export interface WhatsAppTextJobPayload {
  to:            string
  body:          string
  tenantId:      string
  correlationId?: string
}

export interface WhatsAppOrderConfirmJobPayload {
  to:              string
  customerName:    string
  productName:     string
  orderReference:  string
  amountFormatted: string
  creatorName:     string
  creatorWhatsApp: string
  tenantId:        string
  correlationId?:  string
}

// ── Email Jobs ────────────────────────────────────────────────

export interface EmailOrderReceiptJobPayload {
  to:              string
  customerName:    string
  orderReference:  string
  productName:     string
  amountFormatted: string
  storeName:       string
  storeHandle:     string
  tenantId:        string
  correlationId?:  string
}

export interface EmailCreatorNotifyJobPayload {
  to:              string
  creatorName:     string
  customerName:    string
  productName:     string
  amountFormatted: string
  orderReference:  string
  tenantId:        string
  correlationId?:  string
}

export interface EmailWelcomeJobPayload {
  to:          string
  creatorName: string
  storeHandle: string
  storeName:   string
  tenantId:    string
  correlationId?: string
}

// ── Analytics Jobs ────────────────────────────────────────────

export interface AnalyticsEventJobPayload {
  eventType:      string
  organizationId: string
  productId?:     string
  value?:         number
  metadata?:      Record<string, unknown>
}

// ── Payment Jobs ──────────────────────────────────────────────

export interface PaymentWebhookJobPayload {
  orderId:        string
  paymentId:      string
  organizationId: string
  amountKobo:     number
  providerRef:    string
  correlationId?:  string
}

// ── Onboarding Jobs ───────────────────────────────────────────

export interface OnboardingWelcomeJobPayload {
  creatorId:    string
  creatorEmail: string
  creatorPhone?: string
  creatorName:  string
  storeHandle:  string
  storeName:    string
  tenantId:     string
  correlationId?: string
}

// ── Notification Jobs ─────────────────────────────────────────

export interface InAppNotificationJobPayload {
  userId:     string
  title:      string
  body:       string
  actionUrl?: string
  channel?:   string
  tenantId:   string
}

// ── Campaign Jobs ─────────────────────────────────────────────

export interface CampaignDispatchJobPayload {
  campaignId:     string
  organizationId: string
  batchIndex:     number
  recipientIds:   string[]
  templateId:     string
  correlationId?: string
}
