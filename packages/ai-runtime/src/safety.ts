export class AIRateLimiter {
  private readonly hits = new Map<string, number[]>()

  constructor(private readonly maxRequests = 60, private readonly windowMs = 60_000) {}

  assertAllowed(key: string) {
    const now = Date.now()
    const recent = (this.hits.get(key) || []).filter((hit) => hit + this.windowMs > now)
    if (recent.length >= this.maxRequests) throw new Error("AI rate limit exceeded")
    recent.push(now)
    this.hits.set(key, recent)
  }
}
