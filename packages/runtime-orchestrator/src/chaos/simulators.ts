import type { JobEnvelope, JobResult } from "../contracts/types"
import type { FailureInjectionService } from "./failure-injection"

export type QueueHandler = (job: JobEnvelope) => Promise<JobResult>

export class WorkerChaosSimulator {
  constructor(private readonly failure: FailureInjectionService) {}
  wrapHandler(queue: string, handler: QueueHandler): QueueHandler {
    return async (job) => {
      if (this.failure.decide({ scenarioId: "worker.terminate", queue: queue as never, job }).inject) throw new Error("CHAOS_WORKER_TERMINATED")
      const stall = this.failure.decide({ scenarioId: "worker.stall", queue: queue as never, job })
      if (stall.inject) await new Promise((resolve) => setTimeout(resolve, Number(stall.metadata?.stallMs ?? 1200)))
      if (this.failure.decide({ scenarioId: "worker.lock_expiration", queue: queue as never, job }).inject) return { ok: false, retryable: true, error: "CHAOS_LOCK_EXPIRED" }
      return handler(job)
    }
  }
}

export class ReplayIntegrityValidator {
  validate(envelope: JobEnvelope): JobResult {
    return (envelope.payload as Record<string, unknown> | undefined)?.chaos_corrupt_replay
      ? { ok: false, retryable: false, error: "CHAOS_REPLAY_CORRUPTION_DETECTED" }
      : { ok: true }
  }
}
