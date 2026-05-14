import type { JobEnvelope, JobResult, QueueName } from "../contracts/types"
import type { LockService } from "../locks/service"
import type { WorkerMonitorService } from "../monitoring/service"
import type { QueueService } from "../queues/service"
import { RetryService } from "../retries/service"
import { SchedulerService } from "../scheduler/service"

export type QueueHandler = (job: JobEnvelope) => Promise<JobResult>

const RETRY_QUEUE: Partial<Record<QueueName, QueueName>> = {
  "events.outbox": "events.retry",
  "automation.execute": "automation.retry",
  "ai.execute": "ai.retry",
  "ai.evaluation": "ai.retry",
  "ai.recommendations": "ai.retry",
  "messaging.send": "messaging.retry",
  "messaging.webhook": "messaging.retry",
  "messaging.reconcile": "messaging.retry",
  "analytics.rollup": "analytics.retry",
  "analytics.backfill": "analytics.retry",
  "payments.intent": "payments.retry",
  "payments.webhook": "payments.retry",
  "payments.reconcile": "payments.retry",
  "payments.payout": "payments.retry",
  "trust.score": "trust.retry",
  "trust.recompute": "trust.retry",
  "recommendation.rank": "recommendation.retry",
  "moderation.review": "moderation.retry",
  "observability.alerts": "observability.retry",
  "mobile.sync": "mobile.retry",
  "deployment.validation": "deployment.retry",
  "deployment.rollback": "deployment.retry",
  "ecosystem.webhooks": "ecosystem.retry",
  "growth.attribution": "growth.retry",
  "growth.referrals": "growth.retry",
  "ads.targeting": "ads.retry",
  "ads.attribution": "ads.retry",
  "network.recompute": "network.retry",
  "network.discovery": "network.retry",
  "ai.runtime": "ai.runtime.retry",
  "governance.approvals": "governance.retry",
  "governance.audit": "governance.retry",
  "policy.evaluation": "policy.retry",
  "compliance.exports": "compliance.retry",
  "runtime.failover": "runtime.throttle",
  "runtime.circuit_breaker": "runtime.throttle",
  "region.failover": "region.retry",
  "region.replication": "region.retry",
  "compliance.validation": "compliance.retry",
  "geo.routing": "geo.retry",
}

const DLQ_QUEUE: Partial<Record<QueueName, QueueName>> = {
  "events.outbox": "events.dlq",
  "automation.execute": "automation.dlq",
  "ai.execute": "ai.dlq",
  "ai.evaluation": "ai.dlq",
  "ai.recommendations": "ai.dlq",
  "messaging.send": "messaging.dlq",
  "messaging.webhook": "messaging.dlq",
  "messaging.reconcile": "messaging.dlq",
  "analytics.rollup": "analytics.dlq",
  "analytics.backfill": "analytics.dlq",
  "payments.intent": "payments.dlq",
  "payments.webhook": "payments.dlq",
  "payments.reconcile": "payments.dlq",
  "payments.payout": "payments.dlq",
  "trust.score": "trust.dlq",
  "trust.recompute": "trust.dlq",
  "recommendation.rank": "recommendation.dlq",
  "moderation.review": "moderation.dlq",
  "observability.alerts": "observability.dlq",
  "mobile.sync": "mobile.dlq",
  "ecosystem.webhooks": "ecosystem.dlq",
  "ai.runtime": "ai.runtime.dlq",
  "governance.approvals": "governance.dlq",
  "policy.evaluation": "policy.dlq",
  "compliance.validation": "compliance.dlq",
  "geo.routing": "geo.dlq",
}

export class ExecutionCoordinator {
  constructor(private readonly queue: QueueService, private readonly lock: LockService, private readonly monitor: WorkerMonitorService, private readonly scheduler = new SchedulerService(), private readonly retries = new RetryService()) {}

  async tick(queueName: QueueName, handler: QueueHandler | undefined) {
    if (!handler) return
    if (!(await this.lock.acquire(`worker:${queueName}`, 5000))) return
    try {
      const job = await this.queue.dequeue(queueName)
      if (!job || !this.scheduler.isReady(job)) return
      this.monitor.emit({ jobId: job.jobId, queue: queueName, event: "job.started", at: new Date().toISOString() })
      try {
        const res = await handler(job)
        if (!res.ok) throw new Error(res.error || "handler returned not ok")
        this.monitor.emit({ jobId: job.jobId, queue: queueName, event: "job.completed", at: new Date().toISOString() })
      } catch (error) {
        const nextAttempt = job.attempt + 1
        if (nextAttempt < job.maxAttempts && RETRY_QUEUE[queueName]) {
          await this.queue.enqueue(RETRY_QUEUE[queueName]!, { ...job, queue: RETRY_QUEUE[queueName]!, attempt: nextAttempt, runAt: new Date(Date.now() + this.retries.nextBackoffMs(nextAttempt)).toISOString() })
          this.monitor.emit({ jobId: job.jobId, queue: queueName, event: "job.retried", at: new Date().toISOString() })
          return
        }
        if (DLQ_QUEUE[queueName]) await this.queue.enqueue(DLQ_QUEUE[queueName]!, { ...job, queue: DLQ_QUEUE[queueName]!, payload: { ...job.payload, error: `${error}` } })
        this.monitor.emit({ jobId: job.jobId, queue: queueName, event: "job.dead_lettered", at: new Date().toISOString() })
      }
    } finally { await this.lock.release(`worker:${queueName}`) }
  }
}
