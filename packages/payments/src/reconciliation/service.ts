import type { DatabaseClient } from "../../db-core/src"
import { LedgerService } from "../ledger/service"

export class SettlementService {
  constructor(private readonly db: DatabaseClient, private readonly ledger: LedgerService) {}

  async settle(input: {
    tenantId: string
    paymentIntentId: string
    transactionId: string
    amount: number
    currency: string
    settlementKey: string
  }) {
    const tx = await this.db.insert("transactions", {
      tenant_id: input.tenantId,
      payment_intent_id: input.paymentIntentId,
      transaction_id: input.transactionId,
      amount: input.amount,
      currency: input.currency,
      status: "settled",
      settlement_key: input.settlementKey,
      settled_at: new Date().toISOString(),
    })

    if (tx.error) throw tx.error

    await this.ledger.appendEntry({
      tenantId: input.tenantId,
      transactionId: input.transactionId,
      entryType: "credit",
      amount: input.amount,
      currency: input.currency,
      description: "Payment settlement",
      idempotencyKey: `wallet.credit.${input.settlementKey}`,
    })

    return tx.data
  }
}
