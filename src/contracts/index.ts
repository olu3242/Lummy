// ============================================================
// LUMMY — Shared Automation Contracts
// Single source of truth for all event, queue, AI, workflow,
// and notification type contracts across the platform.
// ============================================================

// ── Section 1: Event Contracts ────────────────────────────────

export type LummyEventName =
  // Lifecycle
  | "creator.signed_up"
  | "creator.onboarding_completed"
  | "creator.inactive_7d"
  | "creator.inactive_30d"
  | "creator.churn_risk_high"
  | "creator.churn_risk_critical"
  | "creator.first_sale"
  | "creator.milestone_reached"
  // Commerce
  | "order.created"
  | "order.paid"
  | "order.failed"
  | "order.refunded"
  | "order.fulfilled"
  // Products
  | "product.created"
  | "product.published"
  | "product.unpublished"
  | "product.low_stock"
  // Store
  | "store.schema_updated"
  | "store.published"
  | "store.unpublished"
  | "store.theme_changed"
  | "store.section_added"
  | "store.section_removed"
  // Payments
  | "payment.received"
  | "payment.failed"
  | "payment.refund_initiated"
  // WhatsApp
  | "whatsapp.message_received"
  | "whatsapp.intent_detected"
  | "whatsapp.checkout_sent"
  | "whatsapp.opted_out"
  // AI
  | "ai.generation_completed"
  | "ai.quota_exceeded"
  | "ai.moderation_flagged"
  // Campaigns
  | "campaign.created"
  | "campaign.launched"
  | "campaign.completed"
  // Security
  | "security.suspicious_activity"
  | "security.rate_limit_exceeded"
  | "security.webhook_replay_detected"

export interface LummyEvent {
  id: string
  name: LummyEventName
  tenantId: string        // organization_id (multi-tenant isolation)
  creatorId?: string      // creator_profiles.id
  userId?: string         // auth.users.id
  payload: Record<string, unknown>
  idempotencyKey?: string
  correlationId?: string
  traceId?: string
  timestamp: string       // ISO 8601
  source: string          // e.g., "webhook:paystack", "api:checkout", "cron:health"
  version: 1
}

export type EventStatus = "pending" | "processing" | "processed" | "failed" | "dead"

// ── Section 2: Queue Contracts ────────────────────────────────

export type QueueName =
  | "ai-jobs"
  | "whatsapp-jobs"
  | "email-jobs"
  | "analytics-jobs"
  | "payment-jobs"
  | "onboarding-jobs"
  | "campaign-jobs"
  | "notification-jobs"

export type DLQName =
  | "ai-dlq"
  | "whatsapp-dlq"
  | "payment-dlq"
  | "onboarding-dlq"
  | "campaign-dlq"
  | "notification-dlq"

export interface QueueJob<T = Record<string, unknown>> {
  jobId: string
  queue: QueueName
  type: string
  payload: T
  tenantId: string
  creatorId?: string
  idempotencyKey?: string
  correlationId?: string
  maxRetries: number
  retryDelay: number        // ms
  priority?: number
  scheduledAt?: string      // ISO 8601 for delayed execution
  deadLetterQueue?: DLQName
}

export type JobStatus = "waiting" | "active" | "completed" | "failed" | "delayed" | "dead"

// ── Section 3: AI Contracts ────────────────────────────────────

export type AgentName = "adaeze" | "ngozi" | "chidi" | "emeka" | "taiwo" | "amara"

export type AIProvider = "anthropic" | "openai" | "fallback"

export type GenerationType =
  | "caption"
  | "reply"
  | "description"
  | "cta"
  | "campaign"
  | "storefront_suggestion"
  | "pricing_suggestion"
  | "reengagement_prompt"
  | "onboarding_insight"
  | "conversion_analysis"

export interface AIJobRequest {
  agent: AgentName
  type: GenerationType
  prompt: string
  systemPrompt?: string
  context: {
    tenantId: string
    creatorId?: string
    userId?: string
    correlationId?: string
  }
  options?: {
    maxTokens?: number
    temperature?: number
    provider?: AIProvider
    cacheKey?: string
    enablePromptCaching?: boolean
    budgetTokens?: number    // for extended thinking
  }
}

export interface AIJobResult {
  agent: AgentName
  type: GenerationType
  output: string
  provider: AIProvider
  model: string
  tokensUsed: {
    input: number
    output: number
    cacheRead?: number
    cacheWrite?: number
  }
  costUsd: number
  latencyMs: number
  correlationId?: string
  cached: boolean
}

// ── Section 4: Workflow Contracts ─────────────────────────────

export type WorkflowId =
  | "WA-01_whatsapp_router"
  | "WA-02_lead_qualifier"
  | "WA-04_order_confirmation"
  | "PAY-01_paystack_webhook"
  | "PAY-02_order_status_updater"
  | "AM-01_lead_scorer"
  | "CH-01_daily_metrics"
  | "OB-01_creator_welcome"
  | "CR-01_win_back_campaign"
  | "CR-02_vip_detection"
  | "AN-01_weekly_digest"
  | "SC-01_subscription_lifecycle"

export type WorkflowStatus = "active" | "paused" | "draft" | "deprecated" | "canary"

export interface WorkflowDefinition {
  id: WorkflowId
  name: string
  description: string
  version: number
  status: WorkflowStatus
  triggers: LummyEventName[]
  queue?: QueueName
  sla?: {
    maxLatencyMs: number
    alertThreshold: number
  }
  rollout?: {
    percentage: number
    targetTenantIds?: string[]
  }
}

// ── Section 5: Notification Contracts ─────────────────────────

export type NotificationChannel =
  | "whatsapp"
  | "email"
  | "in_app"
  | "push"
  | "sms"
  | "slack"

export type NotificationPriority = "low" | "normal" | "high" | "critical"

export interface NotificationRequest {
  channel: NotificationChannel
  to: string                   // phone, email, userId, etc.
  template: string             // template key
  data: Record<string, unknown>
  priority: NotificationPriority
  tenantId: string
  creatorId?: string
  idempotencyKey?: string
  scheduledAt?: string
  fallbackChannel?: NotificationChannel
}

// ── Section 6: DLQ Contracts ───────────────────────────────────

export interface DLQEntry {
  originalQueue: QueueName
  jobId: string
  jobType: string
  payload: Record<string, unknown>
  failureReason: string
  attemptCount: number
  firstFailedAt: string
  lastFailedAt: string
  tenantId: string
  correlationId?: string
  canRetry: boolean
  retryAfter?: string
}

// ── Section 7: Observability Contracts ────────────────────────

export type ObservabilityLevel = "debug" | "info" | "warn" | "error" | "critical"

export interface ObservabilityEvent {
  level: ObservabilityLevel
  service: string
  operation: string
  tenantId?: string
  creatorId?: string
  correlationId?: string
  traceId?: string
  durationMs?: number
  statusCode?: number
  error?: string
  metadata?: Record<string, unknown>
  timestamp: string
}

// ── Section 8: Security Contracts ─────────────────────────────

export type SecurityEventType =
  | "webhook_signature_invalid"
  | "webhook_replay_detected"
  | "rate_limit_exceeded"
  | "ai_abuse_detected"
  | "suspicious_activity"
  | "unauthorized_access"
  | "prompt_injection_detected"

export interface SecurityEvent {
  type: SecurityEventType
  severity: "low" | "medium" | "high" | "critical"
  tenantId?: string
  ip?: string
  userId?: string
  endpoint?: string
  details: Record<string, unknown>
  timestamp: string
}

// ── Section 9: Rollout Contracts ──────────────────────────────

export type RolloutStatus = "scheduled" | "running" | "paused" | "completed" | "rolled_back"

export interface WorkflowRollout {
  workflowId: WorkflowId
  version: number
  status: RolloutStatus
  targetPercentage: number
  currentPercentage: number
  startedAt: string
  completedAt?: string
  rollbackReason?: string
}

// ── Section 10: SLA Contracts ─────────────────────────────────

export interface WorkflowSLA {
  workflowId: WorkflowId
  p50Ms: number
  p95Ms: number
  p99Ms: number
  errorRate: number
  successRate: number
  windowStart: string
  windowEnd: string
}
