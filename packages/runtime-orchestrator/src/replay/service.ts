import type { QueueName } from "../contracts/types"
import type { QueueAdapter } from "../adapters/queue-adapter"
export class ReplayService { constructor(private readonly queue: QueueAdapter) {} replay(jobId: string, queue: QueueName){ return this.queue.replay(jobId, queue) } }
