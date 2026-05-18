import { createHmac, timingSafeEqual } from "node:crypto"

function safeCompareHex(expectedHex: string, receivedHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex")
  const received = Buffer.from(receivedHex, "hex")
  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}

export function verifyHmacSha256Hex(secret: string, rawBody: string, receivedHex: string | undefined): boolean {
  if (!secret || !receivedHex || !rawBody) return false
  const normalized = receivedHex.trim().toLowerCase()
  if (!/^[0-9a-f]+$/.test(normalized)) return false
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex").toLowerCase()
  return safeCompareHex(expected, normalized)
}

