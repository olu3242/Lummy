import type { TenantContext } from "@lummy/shared-types"

export const MANDATORY_QUEUES = [
  "events.outbox", "events.retry", "events.dlq",
  "automation.execute", "automation.retry", "automation.dlq",
  "ai.execute", "ai.retry", "ai.dlq", "ai.evaluation", "ai.recommendations",
  "messaging.send", "messaging.retry", "messaging.dlq", "messaging.webhook", "messaging.reconcile",
  "analytics.rollup", "analytics.backfill", "analytics.retry", "analytics.dlq",
  "payments.intent", "payments.webhook", "payments.retry", "payments.reconcile", "payments.payout", "payments.dlq",
  "trust.score", "trust.recompute", "trust.retry", "trust.dlq",
  "recommendation.rank", "recommendation.retry", "recommendation.dlq",
  "moderation.review", "moderation.retry", "moderation.dlq",
  "observability.alerts", "observability.retry", "observability.dlq",
  "mobile.sync", "mobile.retry", "mobile.dlq",
  "deployment.validation", "deployment.rollback", "deployment.retry",
  "ecosystem.webhooks", "ecosystem.retry", "ecosystem.dlq",
  "growth.attribution", "growth.referrals", "growth.retry",
  "ads.targeting", "ads.attribution", "ads.retry",
  "network.recompute", "network.discovery", "network.retry",
  "ai.runtime", "ai.runtime.retry", "ai.runtime.dlq",
  "governance.approvals", "governance.audit", "governance.retry",
  "governance.dlq",
  "policy.evaluation", "policy.retry", "policy.dlq",
  "compliance.exports", "compliance.retry",
  "runtime.failover", "runtime.throttle", "runtime.circuit_breaker",
  "region.failover", "region.replication", "region.retry",
  "compliance.validation", "compliance.retry", "compliance.dlq",
  "geo.routing", "geo.retry", "geo.dlq",
] as const

export type QueueName = (typeof MANDATORY_QUEUES)[number]
export type JobEventType = "job.started" | "job.completed" | "job.failed" | "job.retried" | "job.dead_lettered"

export interface JobEnvelope<TPayload = Record<string, unknown>> {
  jobId: string
  queue: QueueName
  tenant: TenantContext
  payload: TPayload
  idempotencyKey: string
  correlationId: string
  causationId: string | null
  attempt: number
  maxAttempts: number
  runAt: string
  createdAt: string
}

export interface JobResult { ok: boolean; retryable?: boolean; error?: string }
