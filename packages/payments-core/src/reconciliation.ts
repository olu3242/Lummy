import type { DatabaseClient } from '@lummy/db-core'

export async function runReconciliation(db: DatabaseClient, runId?: string) {
  const run_uuid = runId || `recon_${Date.now()}`
  const started_at = new Date().toISOString()
  await db.insert('payment_reconciliation_runs', { run_id: run_uuid, started_at, summary: {} })

  // Fetch unreconciled provider events
  // For simplicity, fetch recent events where event_type != 'reconciled'
  const events = await (db as any).findAll ? await (db as any).findAll('payment_provider_events', { }) : []

  // Group by transaction_id
  const groups: Record<string, any[]> = {}
  for (const ev of events || []) {
    const tid = ev.transaction_id || ev.payload?.reference || ev.payload?.id || `tx_missing_${Math.random().toString(36).slice(2,6)}`
    groups[tid] = groups[tid] || []
    groups[tid].push(ev)
  }

  const summary: Record<string, any> = { total_transactions: Object.keys(groups).length }

  for (const [tx, evs] of Object.entries(groups)) {
    // Basic reconciliation logic: if any event has status 'settled' or 'reconciled', mark transaction as reconciled
    const settled = evs.find(e => (e.payload && (e.payload.status === 'settled' || e.payload.status === 'reconciled')) || e.event_type === 'webhook_applied' || e.event_type === 'webhook_inserted')
    if (settled) {
      // update transaction log where provider_reference equals payload reference or by id
      const ref = settled.payload?.reference || settled.payload?.provider_reference || tx
      await db.update('payment_transaction_logs', { status: 'reconciled', updated_at: new Date().toISOString() }, { provider_reference: ref })
    }
  }

  const finished_at = new Date().toISOString()
  await db.update('payment_reconciliation_runs', { finished_at, summary }, { run_id: run_uuid })
  return { runId: run_uuid, started_at, finished_at, summary }
}
