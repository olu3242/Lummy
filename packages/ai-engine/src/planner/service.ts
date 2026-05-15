export class PlannerService { plan(workflow: string, context: Record<string, unknown>) { return { workflow, steps: ["prepare", "execute", "validate"], context } } }
