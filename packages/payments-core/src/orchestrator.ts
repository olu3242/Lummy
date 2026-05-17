import type { InitializePaymentInput, ProviderInitializeResult, NormalizedTransaction } from './provider-types'
import { initializePayment, resolveProvider, verifyPayment } from './provider-router'
import type { DatabaseClient } from '@lummy/db-core'
import { markPaymentCompleted } from '../../../src/repositories/order-repository'

function generateIdempotencyKey() {
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function createPaymentSession(db: DatabaseClient, providerName: string, input: InitializePaymentInput, correlationId?: string) : Promise<ProviderInitializeResult> {
  const provider = resolveProvider(providerName)
  const idempotencyKey = String((input.metadata && input.metadata.idempotencyKey) || generateIdempotencyKey())

  // Check for existing transaction with same idempotency_key
  const existing = await readOne<any>(db, 'payment_transaction_logs', { idempotency_key: idempotencyKey })
  if (existing.data) {
    // If already completed or initiated, return prior provider reference to prevent duplicate
    return { providerReference: existing.data.provider_reference || undefined, checkoutUrl: existing.data.checkout_url || undefined, status: existing.data.status || 'initiated', raw: existing.data.provider_payload || {} }
  }

  const now = new Date().toISOString()
  const logEntry = {
    provider: provider.name,
    idempotency_key: idempotencyKey,
    correlation_id: correlationId || null,
    status: 'initiated',
    amount: input.amount,
    currency: input.currency,
    metadata: input.metadata || {},
    provider_payload: {},
    created_at: now,
    updated_at: now,
  }

  await writeInsert(db, 'payment_transaction_logs', logEntry)

  try {
    const res = await initializePayment(provider.name, input)

    // persist provider response
    await writeUpdate(db, 'payment_transaction_logs', { idempotency_key: idempotencyKey }, { provider_reference: res.providerReference, checkout_url: res.checkoutUrl, provider_payload: res.raw || {}, status: res.status || 'initiated', updated_at: new Date().toISOString() })

    // record provider event
    await writeInsert(db, 'payment_provider_events', { transaction_id: idempotencyKey, provider: provider.name, event_type: 'initialize', payload: res.raw || {}, correlation_id: correlationId || null, created_at: new Date().toISOString() })

    return res
  } catch (err) {
    // mark failed and record event for reconciliation
    await writeUpdate(db, 'payment_transaction_logs', { idempotency_key: idempotencyKey }, { status: 'failed', provider_payload: { error: err instanceof Error ? err.message : String(err) }, updated_at: new Date().toISOString() })
    await writeInsert(db, 'payment_provider_events', { transaction_id: idempotencyKey, provider: provider.name, event_type: 'initialize_failed', payload: { error: err instanceof Error ? err.message : String(err) }, correlation_id: correlationId || null, created_at: new Date().toISOString() })
    throw err
  }
}

export async function handleProviderWebhook(db: DatabaseClient, providerName: string, headers: Record<string,string>, rawBody: string, correlationId?: string): Promise<NormalizedTransaction | null> {
  const provider = resolveProvider(providerName)
  // Verify and normalize
  const tx = await verifyPayment(provider.name, headers, rawBody)
  if (!tx) return null

  const now = new Date().toISOString()
  // Insert provider event
  await writeInsert(db, 'payment_provider_events', { transaction_id: tx.id, provider: provider.name, event_type: 'webhook_received', payload: tx, correlation_id: correlationId || null, created_at: now })

  // Idempotent upsert to transaction logs: avoid duplicate replay
  const existing = await readOne<any>(db, 'payment_transaction_logs', { provider_reference: tx.providerReference })
  if (existing.data) {
    // If the existing status is same or more advanced, skip state regression
    if (existing.data.status === tx.status || existing.data.status === 'settled' || existing.data.status === 'reconciled') {
      await writeInsert(db, 'payment_provider_events', { transaction_id: tx.id, provider: provider.name, event_type: 'webhook_ignored_replay', payload: tx, correlation_id: correlationId || null, created_at: now })
      return tx
    }
    // otherwise update
    await writeUpdate(db, 'payment_transaction_logs', { provider_reference: tx.providerReference }, { status: tx.status, provider_payload: tx, updated_at: now })
    await writeInsert(db, 'payment_provider_events', { transaction_id: tx.id, provider: provider.name, event_type: 'webhook_applied', payload: tx, correlation_id: correlationId || null, created_at: now })
    // If this webhook indicates a completed payment and metadata contains order/payment ids, update domain records
    try {
      if (['settled', 'captured', 'authorized', 'reconciled'].includes(tx.status) && tx.metadata?.orderId && tx.metadata?.paymentId) {
        await markPaymentCompleted({ orderId: String(tx.metadata.orderId), paymentId: String(tx.metadata.paymentId), providerReference: String(tx.providerReference || ''), providerEventId: String(tx.id) })
        await writeInsert(db, 'payment_provider_events', { transaction_id: tx.id, provider: provider.name, event_type: 'domain_payment_marked', payload: tx, correlation_id: correlationId || null, created_at: new Date().toISOString() })
      }
    } catch (err) {
      await writeInsert(db, 'payment_provider_events', { transaction_id: tx.id, provider: provider.name, event_type: 'domain_payment_failed', payload: { error: err instanceof Error ? err.message : String(err) }, correlation_id: correlationId || null, created_at: new Date().toISOString() })
      // do not throw — reconciliation can pick this up
    }
    return tx
  }

  // no existing transaction — insert a reconciled log
  await writeInsert(db, 'payment_transaction_logs', { provider: provider.name, idempotency_key: `prov_${tx.id}`, correlation_id: correlationId || null, status: tx.status, amount: tx.amount, currency: tx.currency, metadata: tx.metadata || {}, provider_reference: tx.providerReference, provider_payload: tx, created_at: now, updated_at: now })
  await writeInsert(db, 'payment_provider_events', { transaction_id: tx.id, provider: provider.name, event_type: 'webhook_inserted', payload: tx, correlation_id: correlationId || null, created_at: now })

  try {
    if (['settled', 'captured', 'authorized', 'reconciled'].includes(tx.status) && tx.metadata?.orderId && tx.metadata?.paymentId) {
      await markPaymentCompleted({ orderId: String(tx.metadata.orderId), paymentId: String(tx.metadata.paymentId), providerReference: String(tx.providerReference || ''), providerEventId: String(tx.id) })
      await writeInsert(db, 'payment_provider_events', { transaction_id: tx.id, provider: provider.name, event_type: 'domain_payment_marked', payload: tx, correlation_id: correlationId || null, created_at: new Date().toISOString() })
    }
  } catch (err) {
    await writeInsert(db, 'payment_provider_events', { transaction_id: tx.id, provider: provider.name, event_type: 'domain_payment_failed', payload: { error: err instanceof Error ? err.message : String(err) }, correlation_id: correlationId || null, created_at: new Date().toISOString() })
  }

  return tx
}

async function readOne<T>(db: DatabaseClient, table: string, where: Record<string, unknown>) {
  const result = await db.findOne<T>(table, where)
  if (result && typeof result === 'object' && 'data' in result) return result
  return { data: result as T | null, error: null }
}

async function writeInsert(db: DatabaseClient, table: string, payload: Record<string, unknown>) {
  const result = await db.insert(table, payload)
  if (result && typeof result === 'object' && 'error' in result && result.error) throw result.error
  return result
}

async function writeUpdate(db: DatabaseClient, table: string, where: Record<string, unknown>, payload: Record<string, unknown>) {
  const result = await db.update(table, where, payload)
  if (result && typeof result === 'object' && 'error' in result && result.error) throw result.error
  return result
}
