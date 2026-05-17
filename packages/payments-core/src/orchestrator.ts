import type { InitializePaymentInput, ProviderInitializeResult, NormalizedTransaction } from './provider-types'
import { initializePayment, reconcileWebhook, verifyPayment } from './provider-router'
import type { DatabaseClient } from '@lummy/db-core'
import { markPaymentCompleted } from '../../../src/repositories/order-repository'

function generateIdempotencyKey() {
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function createPaymentSession(db: DatabaseClient, providerName: string, input: InitializePaymentInput, correlationId?: string) : Promise<ProviderInitializeResult> {
  const idempotencyKey = String((input.metadata && input.metadata.idempotencyKey) || generateIdempotencyKey())

  // Check for existing transaction with same idempotency_key
  const existing = await db.findOne('payment_transaction_logs', { idempotency_key: idempotencyKey })
  if (existing) {
    // If already completed or initiated, return prior provider reference to prevent duplicate
    return { providerReference: existing.provider_reference || undefined, checkoutUrl: existing.checkout_url || undefined, status: existing.status || 'initiated', raw: existing.provider_payload || {} }
  }

  const now = new Date().toISOString()
  const logEntry = {
    provider: providerName,
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

  await db.insert('payment_transaction_logs', logEntry)

  try {
    const res = await initializePayment(providerName, input)

    // persist provider response
    await db.update('payment_transaction_logs', { provider_reference: res.providerReference, checkout_url: res.checkoutUrl, provider_payload: res.raw || {}, status: res.status || 'initiated', updated_at: new Date().toISOString() }, { idempotency_key: idempotencyKey })

    // record provider event
    await db.insert('payment_provider_events', { transaction_id: idempotencyKey, provider: providerName, event_type: 'initialize', payload: res.raw || {}, correlation_id: correlationId || null, created_at: new Date().toISOString() })

    return res
  } catch (err) {
    // mark failed and record event for reconciliation
    await db.update('payment_transaction_logs', { status: 'failed', provider_payload: { error: err instanceof Error ? err.message : String(err) }, updated_at: new Date().toISOString() }, { idempotency_key: idempotencyKey })
    await db.insert('payment_provider_events', { transaction_id: idempotencyKey, provider: providerName, event_type: 'initialize_failed', payload: { error: err instanceof Error ? err.message : String(err) }, correlation_id: correlationId || null, created_at: new Date().toISOString() })
    throw err
  }
}

export async function handleProviderWebhook(db: DatabaseClient, providerName: string, headers: Record<string,string>, rawBody: string, correlationId?: string): Promise<NormalizedTransaction | null> {
  // Verify and normalize
  const tx = await verifyPayment(providerName, headers, rawBody)
  if (!tx) return null

  const now = new Date().toISOString()
  // Insert provider event
  await db.insert('payment_provider_events', { transaction_id: tx.id, provider: providerName, event_type: 'webhook_received', payload: tx, correlation_id: correlationId || null, created_at: now })

  // Idempotent upsert to transaction logs: avoid duplicate replay
  const existing = await db.findOne('payment_transaction_logs', { provider_reference: tx.providerReference })
  if (existing) {
    // If the existing status is same or more advanced, skip state regression
    if (existing.status === tx.status || existing.status === 'settled' || existing.status === 'reconciled') {
      await db.insert('payment_provider_events', { transaction_id: tx.id, provider: providerName, event_type: 'webhook_ignored_replay', payload: tx, correlation_id: correlationId || null, created_at: now })
      return tx
    }
    // otherwise update
    await db.update('payment_transaction_logs', { status: tx.status, provider_payload: tx, updated_at: now }, { provider_reference: tx.providerReference })
    await db.insert('payment_provider_events', { transaction_id: tx.id, provider: providerName, event_type: 'webhook_applied', payload: tx, correlation_id: correlationId || null, created_at: now })
    // If this webhook indicates a completed payment and metadata contains order/payment ids, update domain records
    try {
      if (['settled', 'captured', 'authorized', 'reconciled'].includes(tx.status) && tx.metadata?.orderId && tx.metadata?.paymentId) {
        await markPaymentCompleted({ orderId: String(tx.metadata.orderId), paymentId: String(tx.metadata.paymentId), providerReference: String(tx.providerReference || ''), providerEventId: String(tx.id) })
        await db.insert('payment_provider_events', { transaction_id: tx.id, provider: providerName, event_type: 'domain_payment_marked', payload: tx, correlation_id: correlationId || null, created_at: new Date().toISOString() })
      }
    } catch (err) {
      await db.insert('payment_provider_events', { transaction_id: tx.id, provider: providerName, event_type: 'domain_payment_failed', payload: { error: err instanceof Error ? err.message : String(err) }, correlation_id: correlationId || null, created_at: new Date().toISOString() })
      // do not throw — reconciliation can pick this up
    }
    return tx
  }

  // no existing transaction — insert a reconciled log
  await db.insert('payment_transaction_logs', { provider: providerName, idempotency_key: `prov_${tx.id}`, correlation_id: correlationId || null, status: tx.status, amount: tx.amount, currency: tx.currency, metadata: tx.metadata || {}, provider_reference: tx.providerReference, provider_payload: tx, created_at: now, updated_at: now })
  await db.insert('payment_provider_events', { transaction_id: tx.id, provider: providerName, event_type: 'webhook_inserted', payload: tx, correlation_id: correlationId || null, created_at: now })

  try {
    if (['settled', 'captured', 'authorized', 'reconciled'].includes(tx.status) && tx.metadata?.orderId && tx.metadata?.paymentId) {
      await markPaymentCompleted({ orderId: String(tx.metadata.orderId), paymentId: String(tx.metadata.paymentId), providerReference: String(tx.providerReference || ''), providerEventId: String(tx.id) })
      await db.insert('payment_provider_events', { transaction_id: tx.id, provider: providerName, event_type: 'domain_payment_marked', payload: tx, correlation_id: correlationId || null, created_at: new Date().toISOString() })
    }
  } catch (err) {
    await db.insert('payment_provider_events', { transaction_id: tx.id, provider: providerName, event_type: 'domain_payment_failed', payload: { error: err instanceof Error ? err.message : String(err) }, correlation_id: correlationId || null, created_at: new Date().toISOString() })
  }

  return tx
}
