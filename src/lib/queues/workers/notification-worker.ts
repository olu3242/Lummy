import { Worker, type Job } from "bullmq"
import { createWorkerConnection } from "@/lib/queues/connection"
import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import type { InAppNotificationJobPayload } from "@/lib/queues/job-types"

async function processNotificationJob(job: Job<InAppNotificationJobPayload>) {
  const { userId, title, body, actionUrl, channel } = job.data
  const supabase = createAdminClient()

  await supabase.from("notifications").insert({
    user_id:    userId,
    title,
    body,
    action_url: actionUrl ?? null,
    channel:    channel ?? "in_app",
  }).throwOnError()

  logger.info("[notif-worker] sent", { jobId: job.id, userId, title })
  return { ok: true }
}

export function startNotificationWorker(): Worker<InAppNotificationJobPayload> {
  const worker = new Worker<InAppNotificationJobPayload>("notification-jobs", processNotificationJob, {
    connection:  createWorkerConnection(),
    concurrency: 20,
  })

  worker.on("failed", (job, err) => {
    logger.warn("[notif-worker] job failed", { jobId: job?.id, error: err.message })
  })

  logger.info("[notif-worker] started")
  return worker
}

// ── RUNTIME STATUS: DISCONNECTED ─────────────────────────────────────────────
// startXWorker() is not called anywhere. Requires REDIS_URL + a worker entry point.
