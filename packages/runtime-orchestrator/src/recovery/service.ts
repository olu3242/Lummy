import type { JobEnvelope } from "../contracts/types"
import type { QueueService } from "../queues/service"

export class RecoveryService {
  constructor(private readonly queue: QueueService) {}
  async replayFromDlq(job: JobEnvelope, targetQueue: JobEnvelope["queue"]) { await this.queue.enqueue(targetQueue, { ...job, attempt: 0, runAt: new Date().toISOString() }) }
}
