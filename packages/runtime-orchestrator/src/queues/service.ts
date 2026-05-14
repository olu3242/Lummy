import type { JobEnvelope, QueueName } from "../contracts/types"

export interface QueueService {
  enqueue<T>(queue: QueueName, job: JobEnvelope<T>): Promise<void>
  dequeue<T>(queue: QueueName): Promise<JobEnvelope<T> | null>
  size(queue: QueueName): Promise<number>
}

export class InMemoryQueueService implements QueueService {
  private readonly queues = new Map<QueueName, JobEnvelope<unknown>[]>()
  async enqueue<T>(queue: QueueName, job: JobEnvelope<T>) { const list = this.queues.get(queue) || []; list.push(job as JobEnvelope<unknown>); this.queues.set(queue, list) }
  async dequeue<T>(queue: QueueName) { const list = this.queues.get(queue); if (!list?.length) return null; return list.shift() as JobEnvelope<T> }
  async size(queue: QueueName) { return this.queues.get(queue)?.length || 0 }
}
