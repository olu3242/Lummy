import type { DatabaseClient } from "@lummy/db-core"
export class WalletService {
  constructor(private readonly db: DatabaseClient) {}
  async appendEntry(input: { tenantId: string; transactionId: string; entryType: "credit" | "debit"; amount: number; currency: string; description: string; idempotencyKey: string }) {
    return this.db.insert("wallet_entries", { tenant_id: input.tenantId, transaction_id: input.transactionId, entry_type: input.entryType, amount: input.amount, currency: input.currency, description: input.description, idempotency_key: input.idempotencyKey, created_at: new Date().toISOString() })
  }
}
