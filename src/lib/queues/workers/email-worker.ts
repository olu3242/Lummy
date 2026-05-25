import { Worker, type Job } from "bullmq"
import { createWorkerConnection } from "@/lib/queues/connection"
import { sendToDLQ } from "@/lib/queues/registry"
import {
  sendOrderReceipt,
  sendCreatorOrderNotification,
  sendCreatorWelcomeEmail,
} from "@/lib/notifications/email"
import { logger } from "@/lib/observability/logger"
import type {
  EmailOrderReceiptJobPayload,
  EmailCreatorNotifyJobPayload,
  EmailWelcomeJobPayload,
} from "@/lib/queues/job-types"

type EmailJobPayload =
  | EmailOrderReceiptJobPayload
  | EmailCreatorNotifyJobPayload
  | EmailWelcomeJobPayload

async function processEmailJob(job: Job<EmailJobPayload>) {
  logger.info("[email-worker] processing", { jobId: job.id, name: job.name })

  if (job.name === "order_receipt") {
    const data = job.data as EmailOrderReceiptJobPayload
    const result = await sendOrderReceipt(data)
    if (!result.success) throw new Error(result.error ?? "Email send failed")
    return { emailId: result.emailId }
  }

  if (job.name === "creator_notify") {
    const data = job.data as EmailCreatorNotifyJobPayload
    const result = await sendCreatorOrderNotification(data)
    if (!result.success) throw new Error(result.error ?? "Email send failed")
    return { emailId: result.emailId }
  }

  if (job.name === "welcome") {
    const data = job.data as EmailWelcomeJobPayload
    const result = await sendCreatorWelcomeEmail(data)
    if (!result.success) throw new Error(result.error ?? "Email send failed")
    return { emailId: result.emailId }
  }

  throw new Error(`Unknown email job name: ${job.name}`)
}

export function startEmailWorker(): Worker<EmailJobPayload> {
  const worker = new Worker<EmailJobPayload>("email-jobs", processEmailJob, {
    connection: createWorkerConnection(),
    concurrency: 5,
    limiter: { max: 50, duration: 1000 },  // Resend rate limit
  })

  worker.on("failed", async (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await sendToDLQ("email-jobs", job.name, job.data as unknown as Record<string, unknown>, err.message)
      logger.error("[email-worker] job sent to DLQ", { jobId: job.id, error: err.message })
    }
  })

  logger.info("[email-worker] started")
  return worker
}

// ── RUNTIME STATUS: DISCONNECTED ─────────────────────────────────────────────
// startXWorker() is not called anywhere. Requires REDIS_URL + a worker entry point.
