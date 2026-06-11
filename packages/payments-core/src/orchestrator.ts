import type { InitializePaymentInput, NormalizedTransaction, ProviderInitializeResult } from './provider-types'
import { initializePayment, resolveProvider, verifyPayment } from './provider-router'
import type { DatabaseClient, QueryResult } from '@lummy/db-core'
import { markPaymentCompleted } from '../../../src/repositories/order-repository'

type PaymentTransactionLog = {
  provider_reference?: string | null
  checkout_url?: string | null
  status?: ProviderInitializeResult['status'] | NormalizedTransaction['status'] | null
  provider_payload?: Record<string, unknown> | null
}

function generateIdempotencyKey() {
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

async function readOne<T>(db: DatabaseClient, table: string, where: Record<string, unknown>): Promise<QueryResult<T>> {
  return db.findOne<T>(table, where)
}

async function writeInsert(db: DatabaseClient, table: string, payload: Record<string, unknown>) {
  const result = await db.insert(table, payload)
  if (result.error) throw result.error
  return result
}

async function writeUpdate(db: DatabaseClient, table: string, where: Record<string, unknown>, payload: Record<string, unknown>) {
  const result = await db.update(table, where, payload)
  if (result.error) throw result.error
  return result
}

export async function createPaymentSession(db: DatabaseClient, providerName: string, input: InitializePaymentInput, correlationId?: string): Promise<ProviderInitializeResult> {
  const provider = resolveProvider(providerName)
  const idempotencyKey = String((input.metadata && input.metadata.idempotencyKey) || generateIdempotencyKey())

  const existing = await readOne<PaymentTransactionLog>(db, 'payment_transaction_logs', { idempotency_key: idempotencyKey })
  if (existing.data) {
    return {
      providerReference: existing.data.provider_reference || undefined,
      checkoutUrl: existing.data.checkout_url || undefined,
      status: existing.data.status || 'initiated',
      raw: existing.data.provider_payload || {},
    }
  }

  const now = new Date().toISOString()
  await writeInsert(db, 'payment_transaction_logs', {
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
  })

  try {
    const res = await initializePayment(provider.name, input)

    await writeUpdate(db, 'payment_transaction_logs', { idempotency_key: idempotencyKey }, {
      provider_reference: res.providerReference,
      checkout_url: res.checkoutUrl,
      provider_payload: res.raw || {},
      status: res.status || 'initiated',
      updated_at: new Date().toISOString(),
    })

    await writeInsert(db, 'payment_provider_events', {
      transaction_id: idempotencyKey,
      provider: provider.name,
      event_type: 'initialize',
      payload: res.raw || {},
      correlation_id: correlationId || null,
      created_at: new Date().toISOString(),
    })

    return res
  } catch (err) {
    await writeUpdate(db, 'payment_transaction_logs', { idempotency_key: idempotencyKey }, {
      status: 'failed',
      provider_payload: { error: err instanceof Error ? err.message : String(err) },
      updated_at: new Date().toISOString(),
    })
    await writeInsert(db, 'payment_provider_events', {
      transaction_id: idempotencyKey,
      provider: provider.name,
      event_type: 'initialize_failed',
      payload: { error: err instanceof Error ? err.message : String(err) },
      correlation_id: correlationId || null,
      created_at: new Date().toISOString(),
    })
    throw err
  }
}

export async function handleProviderWebhook(db: DatabaseClient, providerName: string, headers: Record<string, string>, rawBody: string, correlationId?: string): Promise<NormalizedTransaction | null> {
  const provider = resolveProvider(providerName)
  const tx = await verifyPayment(provider.name, headers, rawBody)
  if (!tx) return null

  const now = new Date().toISOString()
  await writeInsert(db, 'payment_provider_events', {
    transaction_id: tx.id,
    provider: provider.name,
    event_type: 'webhook_received',
    payload: tx,
    correlation_id: correlationId || null,
    created_at: now,
  })

  const existing = await readOne<PaymentTransactionLog>(db, 'payment_transaction_logs', { provider_reference: tx.providerReference })
  if (existing.data) {
    if (existing.data.status === tx.status || existing.data.status === 'settled' || existing.data.status === 'reconciled') {
      await writeInsert(db, 'payment_provider_events', {
        transaction_id: tx.id,
        provider: provider.name,
        event_type: 'webhook_ignored_replay',
        payload: tx,
        correlation_id: correlationId || null,
        created_at: now,
      })
      return tx
    }

    await writeUpdate(db, 'payment_transaction_logs', { provider_reference: tx.providerReference }, {
      status: tx.status,
      provider_payload: tx,
      updated_at: now,
    })
    await writeInsert(db, 'payment_provider_events', {
      transaction_id: tx.id,
      provider: provider.name,
      event_type: 'webhook_applied',
      payload: tx,
      correlation_id: correlationId || null,
      created_at: now,
    })
  } else {
    await writeInsert(db, 'payment_transaction_logs', {
      provider: provider.name,
      idempotency_key: `prov_${tx.id}`,
      correlation_id: correlationId || null,
      status: tx.status,
      amount: tx.amount,
      currency: tx.currency,
      metadata: tx.metadata || {},
      provider_reference: tx.providerReference,
      provider_payload: tx,
      created_at: now,
      updated_at: now,
    })
    await writeInsert(db, 'payment_provider_events', {
      transaction_id: tx.id,
      provider: provider.name,
      event_type: 'webhook_inserted',
      payload: tx,
      correlation_id: correlationId || null,
      created_at: now,
    })
  }

  try {
    if (['settled', 'captured', 'authorized', 'reconciled'].includes(tx.status) && tx.metadata?.orderId && tx.metadata?.paymentId) {
      await markPaymentCompleted({
        orderId: String(tx.metadata.orderId),
        paymentId: String(tx.metadata.paymentId),
        providerReference: String(tx.providerReference || ''),
        providerEventId: String(tx.id),
      })
      await writeInsert(db, 'payment_provider_events', {
        transaction_id: tx.id,
        provider: provider.name,
        event_type: 'domain_payment_marked',
        payload: tx,
        correlation_id: correlationId || null,
        created_at: new Date().toISOString(),
      })
    }
  } catch (err) {
    await writeInsert(db, 'payment_provider_events', {
      transaction_id: tx.id,
      provider: provider.name,
      event_type: 'domain_payment_failed',
      payload: { error: err instanceof Error ? err.message : String(err) },
      correlation_id: correlationId || null,
      created_at: new Date().toISOString(),
    })
  }

  return tx
}
