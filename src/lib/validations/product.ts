import { z } from "zod"

export const createProductSchema = z.object({
  name:              z.string().min(1).max(200),
  description:       z.string().max(2000).optional(),
  price:             z.number().int().positive(),       // kobo
  compare_at_price:  z.number().int().positive().optional(),
  currency:          z.string().default("NGN"),
  type:              z.enum(["physical", "digital", "service"]).default("physical"),
  images:            z.array(z.string().url()).default([]),
  stock_quantity:    z.number().int().min(0).optional(),
  is_unlimited_stock: z.boolean().default(false),
  is_published:      z.boolean().default(false),
  is_featured:       z.boolean().default(false),
  category:          z.string().max(100).optional(),
  tags:              z.array(z.string()).optional(),
  whatsapp_enabled:  z.boolean().default(true),
})

export const updateProductSchema = createProductSchema.partial()

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
