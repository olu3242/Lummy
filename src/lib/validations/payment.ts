import { z } from "zod"

export const initiatePaymentSchema = z.object({
  productId: z.string().uuid(),
  creatorId: z.string().uuid(),
  email: z.string().email(),
  quantity: z.number().int().min(1).max(100).default(1),
})

export const verifyPaymentSchema = z.object({
  reference: z.string().min(1),
})

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>
