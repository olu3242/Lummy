import type { WorkflowDefinition } from "../graph/types"
export class WorkflowValidationService { validate(def: WorkflowDefinition){ return def.steps.length > 0 && Boolean(def.workflowId) } }
