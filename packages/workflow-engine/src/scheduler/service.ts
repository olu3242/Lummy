export class WorkflowSchedulerService { schedule(runId: string, delayMs: number){ return { runId, runAt: new Date(Date.now()+delayMs).toISOString() } } }
