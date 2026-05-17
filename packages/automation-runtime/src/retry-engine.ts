export class AutomationRetryEngine {
  constructor(private readonly baseDelayMs = 1000, private readonly maxDelayMs = 60000) {}

  nextDelayMs(attempt: number) {
    return Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** Math.max(0, attempt - 1))
  }

  nextRunAt(attempt: number) {
    return new Date(Date.now() + this.nextDelayMs(attempt)).toISOString()
  }
}
