export function nextBackoffMs(attempt: number, baseMs = 1000, capMs = 60000): number {
  const value = baseMs * Math.pow(2, Math.max(0, attempt - 1))
  return Math.min(capMs, value)
}
