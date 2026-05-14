import type { JobEnvelope, QueueName } from "../contracts/types"
export interface QueueProvider {
  publish<T>(queue: QueueName, job: JobEnvelope<T>): Promise<void>
  consume<T>(queue: QueueName, workerId: string): Promise<JobEnvelope<T> | null>
  ack(jobId: string): Promise<void>
  nack(jobId: string, reason: string): Promise<void>
  retry(jobId: string, delayMs: number): Promise<void>
  deadLetter(jobId: string, reason: string): Promise<void>
  delay<T>(queue: QueueName, job: JobEnvelope<T>, delayMs: number): Promise<void>
  replay(jobId: string): Promise<void>
  heartbeat(jobId: string, workerId: string): Promise<void>
}
