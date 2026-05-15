import type { ProviderMessagePayload } from "../providers/types"
export class MessagingValidationService { validate(payload: ProviderMessagePayload) { if (!payload.to || !payload.provider) throw new Error("Invalid message payload") } }
