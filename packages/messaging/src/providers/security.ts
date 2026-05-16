import { createHmac, timingSafeEqual } from "node:crypto"

export function verifyPrefixedSha256Signature(secret: string, body: string, providedHeader: string | undefined): boolean {
  if (!secret || !body || !providedHeader) return false
  const normalized = providedHeader.trim().toLowerCase()
  const hex = normalized.startsWith("sha256=") ? normalized.slice("sha256=".length) : normalized
  if (!/^[0-9a-f]+$/.test(hex)) return false
  const expected = createHmac("sha256", secret).update(body).digest("hex")
  const expectedBuf = Buffer.from(expected, "hex")
  const providedBuf = Buffer.from(hex, "hex")
  if (expectedBuf.length !== providedBuf.length) return false
  return timingSafeEqual(expectedBuf, providedBuf)
}

