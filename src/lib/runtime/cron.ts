import type { NextRequest } from "next/server"

/**
 * Fail-closed cron authentication.
 * Returns false if CRON_SECRET is unset OR if the Authorization header doesn't match.
 * All cron endpoints must call this before executing any work.
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get("authorization")
  return auth === `Bearer ${secret}`
}
