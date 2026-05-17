import { AutomationRegistry } from "./automation-registry"
import { DeadLetterHandler } from "./dead-letter-handler"
import { ExecutionTracer } from "./execution-tracer"
import { AutomationRetryEngine } from "./retry-engine"
import { AutomationScheduler } from "./scheduler"
import type { AutomationJob, AutomationQueue, AutomationResult, AutomationStore } from "./types"

export class WorkflowExecutor {
  constructor(
    private readonly registry: AutomationRegistry,
    private readonly queue: AutomationQueue,
    private readonly store: AutomationStore,
    private readonly retries = new AutomationRetryEngine(),
    private readonly scheduler = new AutomationScheduler(),
    private readonly tracer = new ExecutionTracer(),
    private readonly dlq = new DeadLetterHandler(queue, store),
  ) {}

  async execute(job: AutomationJob): Promise<AutomationResult> {
    this.scheduler.assertReplaySafe(job)
    if (!this.scheduler.isReady(job)) return { ok: true, status: "queued", retryAt: job.runAt }
    if (await this.store.isCancelled(job.jobId)) return { ok: true, status: "cancelled" }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), job.timeoutMs)
    await this.store.recordHeartbeat("automation-runtime", job)
    await this.store.recordExecution(job, "running")
    this.tracer.trace(job, "running")

    try {
      const result = await this.registry.resolve(job.workflowKey).execute(job, controller.signal)
      clearTimeout(timer)
      if (result.ok) {
        await this.store.recordExecution(job, "completed")
        this.tracer.trace(job, "completed")
        return { ok: true, status: "completed" }
      }
      return this.handleFailure(job, result.error || "Automation handler failed")
    } catch (error) {
      clearTimeout(timer)
      return this.handleFailure(job, error instanceof Error ? error.message : String(error))
    }
  }

  private async handleFailure(job: AutomationJob, error: string): Promise<AutomationResult> {
    const nextAttempt = job.attempt + 1
    if (nextAttempt < job.maxAttempts) {
      const retryAt = this.retries.nextRunAt(nextAttempt)
      await this.store.recordExecution(job, "retry_scheduled", { error, retryAt, nextAttempt })
      await this.queue.enqueue("automation.retry", { ...job, attempt: nextAttempt, runAt: retryAt })
      this.tracer.trace(job, "retry_scheduled", { error, retryAt, nextAttempt })
      return { ok: false, status: "retry_scheduled", retryAt, error }
    }
    await this.dlq.send(job, error)
    this.tracer.trace(job, "dead_lettered", { error })
    return { ok: false, status: "dead_lettered", error }
  }
}
