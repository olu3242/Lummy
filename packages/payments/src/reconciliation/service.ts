import type { DatabaseClient } from "@lummy/db-core"
import { WalletService } from "../ledger/service"
export class ReconciliationService {
  constructor(private readonly db: DatabaseClient, private readonly wallet: WalletService) {}
  async settle(input: { tenantId: string; paymentIntentId: string; transactionId: string; amount: number; currency: string; settlementKey: string }) {
    const existing = await this.db.findOne("settlement_reconciliations", { settlement_key: input.settlementKey })
    if (existing.data) return { replayed: true }
    await this.db.insert("transactions", { tenant_id: input.tenantId, payment_intent_id: input.paymentIntentId, transaction_id: input.transactionId, amount: input.amount, currency: input.currency, status: "settled", settlement_key: input.settlementKey, settled_at: new Date().toISOString() })
    await this.wallet.appendEntry({ tenantId: input.tenantId, transactionId: input.transactionId, entryType: "credit", amount: input.amount, currency: input.currency, description: "Payment settlement", idempotencyKey: `wallet.credit.${input.settlementKey}` })
    await this.db.insert("settlement_reconciliations", { settlement_key: input.settlementKey, payment_intent_id: input.paymentIntentId, reconciled_at: new Date().toISOString() })
    return { replayed: false }
  }
}
