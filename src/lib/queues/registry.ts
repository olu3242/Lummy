/**
 * Lummy Queue Registry
 *
 * Central registry for all BullMQ queues.
 * Import from here — never instantiate Queue directly in application code.
 */

import { Queue } from "bullmq"
import { getRedisConnection } from "./connection"

export type QueueName =
  | "ai-jobs"
  | "whatsapp-jobs"
  | "email-jobs"
  | "analytics-jobs"
  | "payment-jobs"
  | "onboarding-jobs"
  | "campaign-jobs"
  | "notification-jobs"
  | "dlq"

const DEFAULT_JOB_OPTIONS = {
  attempts:    3,
  backoff: { type: "exponential" as const, delay: 1000 },
  removeOnComplete: { count: 500 },
  removeOnFail:    { count: 200 },
}

const _queues = new Map<QueueName, Queue>()

export function getQueue(name: QueueName): Queue {
  if (!_queues.has(name)) {
    _queues.set(
      name,
      new Queue(name, {
        connection:       getRedisConnection(),
        defaultJobOptions: DEFAULT_JOB_OPTIONS,
      }),
    )
  }
  return _queues.get(name)!
}

/** Enqueue a job — typed wrapper around queue.add() */
export async function enqueue<T extends Record<string, unknown>>(
  queueName: QueueName,
  jobName: string,
  data: T,
  opts?: {
    jobId?: string
    delay?: number
    priority?: number
    attempts?: number
  },
): Promise<string> {
  const q = getQueue(queueName)
  const job = await q.add(jobName, data, {
    jobId:    opts?.jobId,
    delay:    opts?.delay,
    priority: opts?.priority,
    attempts: opts?.attempts,
  })
  return job.id ?? ""
}

/** Send a failed job to the dead-letter queue for manual inspection */
export async function sendToDLQ(
  originalQueue: QueueName,
  jobName: string,
  data: Record<string, unknown>,
  error: string,
): Promise<void> {
  await enqueue("dlq", `dlq:${originalQueue}:${jobName}`, {
    originalQueue,
    jobName,
    data,
    error,
    failedAt: new Date().toISOString(),
  })
}
