export class SchedulingService { schedule(delayMs: number) { return new Date(Date.now() + delayMs).toISOString() } }
