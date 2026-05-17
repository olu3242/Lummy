export class FailureHandler {
  constructor(private readonly maxRetries = 1) {}

  async run<T>(fn: () => Promise<T>) {
    let lastError: unknown
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        return { value: await fn(), retryCount: attempt }
      } catch (error) {
        lastError = error
      }
    }
    throw lastError
  }
}
