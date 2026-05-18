export class AutomationScheduler { schedule(delayMs: number) { return new Date(Date.now() + delayMs).toISOString() } }
