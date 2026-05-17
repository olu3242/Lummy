export class RuntimeOrchestrationService {
  private paused = new Set<string>()
  pauseQueue(queue: string) { this.paused.add(queue) }
  resumeQueue(queue: string) { this.paused.delete(queue) }
  isPaused(queue: string) { return this.paused.has(queue) }
}
