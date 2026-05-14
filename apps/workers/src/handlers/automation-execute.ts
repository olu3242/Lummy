import type { JobEnvelope, JobResult, QueueAdapter } from "../../../../packages/runtime-orchestrator/src"
import { handleFailure, runAutomationJob, type AutomationRule } from "../../../../packages/automation-engine/src"

export async function handleAutomationExecute(
  queue: QueueAdapter,
  rules: AutomationRule[],
  job: JobEnvelope<{ trigger: string; payload: Record<string, unknown> }>
): Promise<JobResult> {
  try {
    return await runAutomationJob(queue, rules, job)
  } catch (err) {
    await handleFailure(queue, job, err instanceof Error ? err.message : "automation_failed")
    return { ok: false, retryable: true }
  }
}
