import type { JobEnvelope, QueueName } from "../contracts/types"
export type JobLifecycleState = "queued"|"leased"|"running"|"completed"|"failed"|"retrying"|"dead_lettered"|"replayed"
export interface DurableJobRecord<T=Record<string,unknown>> { job: JobEnvelope<T>; state: JobLifecycleState; traceId: string; workerId?: string; leasedUntil?: string; updatedAt: string }
export interface QueueAdapter {
 enqueue<T>(queue: QueueName, job: JobEnvelope<T>): Promise<void>
 lease<T>(queue: QueueName, workerId: string, leaseMs: number): Promise<DurableJobRecord<T>|null>
 ack(jobId: string, state: Exclude<JobLifecycleState,"queued"|"leased"|"running">): Promise<void>
 heartbeat(jobId: string, workerId: string, leaseMs: number): Promise<void>
 replay(jobId: string, queue: QueueName): Promise<void>
 depth(queue: QueueName): Promise<number>
}
