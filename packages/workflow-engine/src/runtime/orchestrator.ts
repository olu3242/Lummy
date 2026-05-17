import type { WorkflowDefinition, WorkflowRun } from "../graph/types"
export class WorkflowRuntimeOrchestrator {
 executeWorkflow(run: WorkflowRun){ return { ...run, state: "running" as const } }
 queueNextSteps(def: WorkflowDefinition, stepId: string){ return def.graph[stepId] || [] }
 resolveDependencies(def: WorkflowDefinition, stepId: string){ return Object.entries(def.graph).filter(([, next]) => next.includes(stepId)).map(([k])=>k) }
 evaluateConditions(condition?: string){ return !condition || condition === "true" }
 replayWorkflow(run: WorkflowRun){ return { ...run, state: "replaying" as const } }
 compensateWorkflow(run: WorkflowRun){ return { ...run, state: "compensating" as const } }
 resumeWorkflow(run: WorkflowRun){ return { ...run, state: "running" as const } }
}
