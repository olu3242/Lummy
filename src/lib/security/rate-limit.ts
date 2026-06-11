// In-memory sliding window rate limiter. Resets on server restart.
// Suitable for MVP — swap Map for Redis when scaling horizontally.

const windows = new Map<string, number[]>()
const WINDOW_MS = 60_000

// Periodically prune expired entries to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - WINDOW_MS
    windows.forEach((hits, key) => {
      const trimmed = hits.filter((t: number) => t > cutoff)
      if (trimmed.length === 0) windows.delete(key)
      else windows.set(key, trimmed)
    })
  }, 30_000)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

export function checkRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now()
  const windowStart = now - WINDOW_MS
  const existing = windows.get(key) ?? []
  const hits = existing.filter(t => t > windowStart)

  if (hits.length >= limit) {
    return { allowed: false, remaining: 0, resetAt: (hits[0] ?? now) + WINDOW_MS, limit }
  }

  hits.push(now)
  windows.set(key, hits)
  return { allowed: true, remaining: limit - hits.length, resetAt: now + WINDOW_MS, limit }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit":     String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset":     String(Math.ceil(result.resetAt / 1000)),
  }
}

// Convenience: extract best available identifier from request
export function getRateLimitKey(prefix: string, request: Request, creatorId?: string): string {
  const forwarded = (request.headers as Headers).get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : "unknown"
  return creatorId ? `${prefix}:creator:${creatorId}` : `${prefix}:ip:${ip}`
}
