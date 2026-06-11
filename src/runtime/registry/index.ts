/**
 * Canonical workflow registry — re-exports the workflow lookup service.
 */
export {
  getWorkflowByEventName,
  getWorkflowSLA,
  getWorkflowExecutionMetadata,
  invalidateRegistryCache,
  type WorkflowEntry,
} from "./workflow-registry-service"
