/**
 * Canonical telemetry — re-exports the observability layer.
 * All runtime logging, correlation, and SLA tracking routes through here.
 */
export { logger } from "@/lib/observability/logger"
export {
  generateCorrelationId,
  getCorrelationId,
  correlationHeaders,
} from "@/lib/observability/correlation"
export { startSLARecord, completeSLARecord, type SLARecord } from "@/lib/automation/sla"
export { logAutomation } from "@/lib/automation/sdk"
