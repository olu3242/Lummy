export class WorkerHeartbeat { constructor(private readonly workerId: string) {} lastBeatAt: string | null = null; beat(){ this.lastBeatAt = new Date().toISOString() } }
