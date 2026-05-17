export class ContextualWorkflowPlanner { plan(goal: string) { return { goal, steps: ["analyze", "approve", "execute", "audit"] } } }
