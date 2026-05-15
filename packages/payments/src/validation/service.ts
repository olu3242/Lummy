import type { PaymentIntentInput } from "../providers/types"
export class PaymentsValidationService { validateIntent(input: PaymentIntentInput) { if (input.amount <= 0) throw new Error("invalid amount") } }
