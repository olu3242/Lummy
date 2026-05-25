/**
 * Canonical event runtime — re-exports the authoritative event layer.
 * Import from here rather than from the sub-module paths directly.
 */
export { emitEvent, scheduleWorkflow, logAutomation, type SDKContext, type SDKResult } from "@/lib/automation/sdk"
export { dispatchAutomation, triggerAutomation } from "@/lib/automation/triggers"
export type { AutomationEventName, AutomationEvent } from "@/lib/automation/events"
