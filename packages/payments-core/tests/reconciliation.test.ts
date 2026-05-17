import { runReconciliation } from '../src/reconciliation'

class InMemoryDB {
  rows: Record<string, any>[] = []
  async insert(table: string, obj: Record<string, any>) { this.rows.push(obj); return obj }
  async findAll(table: string) { return this.rows.filter(r => r.table === table || true) }
  async update(table: string, updates: Record<string, any>, where: Record<string, any>) {
    const row = this.rows.find(r => Object.keys(where).every(k => r[k] === where[k]))
    if (row) Object.assign(row, updates)
    return row
  }
}

test('reconciliation runner applies reconciled status', async () => {
  const db = new InMemoryDB() as any
  // seed provider events and transaction logs
  await db.insert('payment_provider_events', { transaction_id: 'tx1', provider: 'paystack', event_type: 'webhook_inserted', payload: { id: 'tx1', reference: 'ref_tx1', status: 'settled' }, created_at: new Date().toISOString() })
  await db.insert('payment_transaction_logs', { provider: 'paystack', idempotency_key: 'idem_1', provider_reference: 'ref_tx1', status: 'initiated', created_at: new Date().toISOString() })

  const res = await runReconciliation(db, 'test_run_1')
  expect(res).toBeTruthy()
  // verify transaction log was updated to reconciled
  const updated = db.rows.find(r => r.provider_reference === 'ref_tx1')
  expect(updated.status).toBe('reconciled')
})
