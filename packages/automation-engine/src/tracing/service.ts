export class AutomationTracingService { trace(runId: string, state: string, detail?: Record<string, unknown>) { return { runId, state, detail, at: new Date().toISOString() } } }
