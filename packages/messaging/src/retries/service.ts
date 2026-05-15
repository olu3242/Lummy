export class MessagingRetryService { classify(error: unknown) { return { retryable: true, reason: error instanceof Error ? error.message : "unknown" } } }
