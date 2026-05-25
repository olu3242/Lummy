import { Worker, type Job } from "bullmq"
import { createWorkerConnection } from "@/lib/queues/connection"
import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/observability/logger"
import type { AnalyticsEventJobPayload } from "@/lib/queues/job-types"

async function processAnalyticsJob(job: Job<AnalyticsEventJobPayload>) {
  const { eventType, organizationId, productId, value, metadata } = job.data
  const supabase = createAdminClient()

  await supabase.from("analytics_events").insert({
    event_type:      eventType,
    organization_id: organizationId,
    product_id:      productId ?? null,
    value:           value ?? 1,
    metadata:        metadata ?? {},
  }).throwOnError()

  return { ok: true }
}

export function startAnalyticsWorker(): Worker<AnalyticsEventJobPayload> {
  const worker = new Worker<AnalyticsEventJobPayload>("analytics-jobs", processAnalyticsJob, {
    connection:  createWorkerConnection(),
    concurrency: 20,
  })

  worker.on("failed", (job, err) => {
    logger.warn("[analytics-worker] job failed", { jobId: job?.id, error: err.message })
  })

  logger.info("[analytics-worker] started")
  return worker
}

// ── RUNTIME STATUS: DISCONNECTED ─────────────────────────────────────────────
// startXWorker() is not called anywhere. Requires REDIS_URL + a worker entry point.
