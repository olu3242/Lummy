export interface RetryDecision {
  retry: boolean
  deadLetter: boolean
  delayMs: number
}

export class EventRetryPolicy {
  constructor(private readonly maxAttempts = 5, private readonly baseDelayMs = 1000, private readonly maxDelayMs = 30000) {}

  decide(attempt: number): RetryDecision {
    if (attempt >= this.maxAttempts) return { retry: false, deadLetter: true, delayMs: 0 }
    const delayMs = Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** Math.max(0, attempt - 1))
    return { retry: true, deadLetter: false, delayMs }
  }
}
