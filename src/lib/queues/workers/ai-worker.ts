import { Worker, type Job } from "bullmq"
import { createWorkerConnection } from "@/lib/queues/connection"
import { sendToDLQ } from "@/lib/queues/registry"
import { callAgent } from "@/lib/ai/gateway"
import { logger } from "@/lib/observability/logger"
import { dispatchAutomation } from "@/lib/automation/triggers"
import type { AIJobPayload } from "@/lib/queues/job-types"

async function processAIJob(job: Job<AIJobPayload>) {
  const { agent, type, prompt, tenantId, creatorId, userId, correlationId, maxTokens, callbackEventName } = job.data

  logger.info("[ai-worker] processing", { jobId: job.id, agent, type, correlationId })

  const result = await callAgent({
    agent,
    type,
    prompt,
    context: { tenantId, creatorId, userId, correlationId },
    options: { maxTokens, logToDb: true },
  })

  // If a callback event was requested, emit it with the AI output
  if (callbackEventName) {
    await dispatchAutomation({
      name: callbackEventName as never,
      creatorId: creatorId ?? tenantId,
      payload: { output: result.output, costUsd: result.costUsd, tenantId, correlationId },
    })
  }

  logger.info("[ai-worker] done", { jobId: job.id, latencyMs: result.latencyMs, costUsd: result.costUsd })
  return { output: result.output, costUsd: result.costUsd }
}

export function startAIWorker(): Worker<AIJobPayload> {
  const worker = new Worker<AIJobPayload>("ai-jobs", processAIJob, {
    connection: createWorkerConnection(),
    concurrency: 5,
  })

  worker.on("failed", async (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      await sendToDLQ("ai-jobs", job.name, job.data as unknown as Record<string, unknown>, err.message)
      logger.error("[ai-worker] job sent to DLQ", { jobId: job.id, error: err.message })
    }
  })

  logger.info("[ai-worker] started")
  return worker
}
