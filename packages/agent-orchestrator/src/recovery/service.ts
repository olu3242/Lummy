<<<<<<< HEAD
import type { JobEnvelope, QueueAdapter } from "@lummy/runtime-orchestrator"
=======
import type { JobEnvelope, QueueAdapter } from "../../../runtime-orchestrator/src"
>>>>>>> main

export class AgentRecoveryService {
  constructor(private readonly queue: QueueAdapter) {}

  async escalate(job: JobEnvelope, reason: string): Promise<void> {
    await this.queue.enqueue("events.dlq", {
      ...job,
      payload: { ...job.payload, reason, escalated: true },
    })
  }
}
