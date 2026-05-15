export function isPoisonJob(attempt: number, maxAttempts: number) { return attempt >= maxAttempts }
