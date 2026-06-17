import { z } from "zod"

// Meta phone_number_id / WABA id are numeric Graph API object ids (typically 15-17 digits).
const metaGraphId = z.string().regex(/^\d{6,20}$/, "Must be the numeric ID shown in Meta App Dashboard → WhatsApp → API Setup")

export const whatsappProvisioningSchema = z.object({
  whatsappPhoneNumberId: metaGraphId,
  whatsappBusinessAccountId: metaGraphId,
})

export type WhatsAppProvisioningInput = z.infer<typeof whatsappProvisioningSchema>
