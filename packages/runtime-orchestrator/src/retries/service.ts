export class RetryService {
  nextBackoffMs(attempt: number, baseMs = 1000, maxMs = 60000) { return Math.min(baseMs * 2 ** Math.max(0, attempt - 1), maxMs) }
  classify(error: unknown) { return { retryable: true, reason: error instanceof Error ? error.message : "unknown" } }
}
