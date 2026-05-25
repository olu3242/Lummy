import { Worker, type Job } from "bullmq"
import { createWorkerConnection } from "@/lib/queues/connection"
import { sendToDLQ } from "@/lib/queues/registry"
import { sendTextMessage, sendOrderConfirmation } from "@/lib/whatsapp/send"
import { logger } from "@/lib/observability/logger"
import type { WhatsAppTextJobPayload, WhatsAppOrderConfirmJobPayload } from "@/lib/queues/job-types"

type WhatsAppJobPayload = WhatsAppTextJobPayload | WhatsAppOrderConfirmJobPayload

async function processWhatsAppJob(job: Job<WhatsAppJobPayload>) {
  logger.info("[wa-worker] processing", { jobId: job.id, name: job.name })

  if (job.name === "send_text") {
    const data = job.data as WhatsAppTextJobPayload
    const result = await sendTextMessage({ to: data.to, body: data.body })
    if (!result.success) throw new Error(result.error ?? "WhatsApp send failed")
    return { messageId: result.messageId }
  }

  if (job.name === "order_confirm") {
    const data = job.data as WhatsAppOrderConfirmJobPayload
    const result = await sendOrderConfirmation(data)
    if (!result.success) throw new Error(result.error ?? "WhatsApp order confirm failed")
    return { messageId: result.messageId }
  }

  throw new Error(`Unknown WhatsApp job name: ${job.name}`)
}

export function startWhatsAppWorker(): Worker<WhatsAppJobPayload> {
  const worker = new Worker<WhatsAppJobPayload>("whatsapp-jobs", processWhatsAppJob, {
    connection: createWorkerConnection(),
    concurrency: 10,
    limiter: { max: 80, duration: 1000 },  // 80 msg/s (Meta burst limit)
  })

  worker.on("failed", async (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await sendToDLQ("whatsapp-jobs", job.name, job.data as unknown as Record<string, unknown>, err.message)
      logger.error("[wa-worker] job sent to DLQ", { jobId: job.id, error: err.message })
    }
  })

  logger.info("[wa-worker] started")
  return worker
}

// ── RUNTIME STATUS: DISCONNECTED ─────────────────────────────────────────────
// startXWorker() is not called anywhere. Requires REDIS_URL + a worker entry point.
