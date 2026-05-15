export class PaymentsRetryService { classify(error: unknown) { return { retryable: true, reason: error instanceof Error ? error.message : "unknown" } } }
