/**
 * Canonical orchestrator — re-exports the job processor functions.
 * These are the only approved execution entry points for automation processing.
 */
export {
  runAutomationProcessorJob,
  runStuckQueueRecoveryJob,
  runHealthScoringJob,
  runChurnScoringJobWorker,
  runMarketplaceIntelligenceJob,
  runWebhookRetryJob,
  runNotificationCleanupJob,
  ALL_JOBS,
  type JobResult,
} from "@/lib/jobs/workers"
