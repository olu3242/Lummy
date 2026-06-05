import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { syncCustomerMemoryForOrder, upsertConversionAttribution } from '@/repositories/order-repository'
import { handleProviderWebhook } from '../../../../../packages/payments-core/src/orchestrator'
import { detectProviderFromHeaders } from '../../../../../packages/payments-core/src/provider-router'
import { validateProviderRuntimeEnv } from '@/lib/runtime-config'
import { errorResponse, getCorrelationId, logApiEvent } from '@/lib/ops-observability'
import { createPaymentDatabaseAdapter } from '@/lib/payments/payment-db-adapter'
import { notifyCreator, sendCustomerReceipt, notifyCreatorEmail, emitEvent } from '@/lib/automation/sdk'

type PaymentMetadata = {
  orderId?: string
  paymentId?: string
  organizationId?: string
}

const completedStatuses = new Set(['settled', 'captured', 'authorized', 'reconciled'])

export async function POST(req: Request) {
  const correlationId = getCorrelationId(req)
  const rawBody = await req.text()
  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value
  })

  try {
    let detectedProvider: string
    try {
      detectedProvider = detectProviderFromHeaders(headers)
    } catch {
      logApiEvent('warn', 'payments.webhook_processing_failed', { correlationId, message: 'Unable to resolve payment provider from webhook headers' })
      return errorResponse(400, 'UNSUPPORTED_PAYMENT_PROVIDER', 'Unable to resolve payment provider from webhook headers', correlationId)
    }
    if (detectedProvider !== 'stripe' && detectedProvider !== 'paystack') {
      return errorResponse(400, 'UNSUPPORTED_PAYMENT_PROVIDER', 'Unsupported payment provider', correlationId)
    }
    const provider: 'stripe' | 'paystack' = detectedProvider
    validateProviderRuntimeEnv(provider)

    const supabase = createClient()
    const tx = await handleProviderWebhook(createPaymentDatabaseAdapter(supabase as never), provider, headers, rawBody, correlationId)

    if (!tx) {
      logApiEvent('warn', 'payments.webhook_invalid_signature', { correlationId, provider })
      return errorResponse(401, 'INVALID_WEBHOOK_SIGNATURE', 'Invalid webhook signature', correlationId)
    }

    const metadata = tx.metadata as PaymentMetadata
    if (!metadata?.orderId || !metadata?.paymentId || !metadata?.organizationId) {
      logApiEvent('warn', 'payments.webhook_missing_metadata', { correlationId, eventId: tx.id, provider })
      return errorResponse(400, 'MISSING_WEBHOOK_METADATA', 'Missing metadata linkage', correlationId)
    }

    if (completedStatuses.has(tx.status)) {
      await syncCustomerMemoryForOrder({
        orgId: metadata.organizationId,
        orderId: metadata.orderId,
        paymentId: metadata.paymentId,
        correlationId,
      })

      const paymentRow = await supabase
        .from('payments')
        .select('amount')
        .eq('id', metadata.paymentId)
        .eq('organization_id', metadata.organizationId)
        .maybeSingle()
      if (paymentRow.error) throw paymentRow.error

      await upsertConversionAttribution({
        orgId: metadata.organizationId,
        orderId: metadata.orderId,
        checkoutId: metadata.orderId,
        conversionType: 'payment',
        conversionStatus: 'payment_completed',
        revenueAmount: Number(paymentRow.data?.amount || 0),
      })

      const amountNgn = Number(paymentRow.data?.amount || 0)
      const amountFormatted = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }).format(amountNgn)
      const sdkCtx = { tenantId: metadata.organizationId, correlationId }
      const admin = createAdminClient()

      const [orderRow, orgRow] = await Promise.all([
        admin
          .from('orders')
          .select('customer_email,customer_name,customer_phone,creator_id')
          .eq('id', metadata.orderId)
          .maybeSingle(),
        admin
          .from('organizations')
          .select('name')
          .eq('id', metadata.organizationId)
          .maybeSingle(),
      ])

      const order = orderRow.data as { customer_email?: string; customer_name?: string; customer_phone?: string; creator_id?: string } | null
      const org = orgRow.data as { name?: string } | null
      const storeName = org?.name ?? "Lummy Store"

      let creatorUserId: string | null = null
      let creatorEmail: string | null = null
      if (order?.creator_id) {
        const creatorRow = await admin
          .from('creator_profiles')
          .select('user_id, contact_email')
          .eq('id', order.creator_id)
          .maybeSingle()
        const creator = creatorRow.data as { user_id?: string; contact_email?: string } | null
        creatorUserId = creator?.user_id ?? null
        creatorEmail = creator?.contact_email ?? null
      }

      if (creatorUserId) {
        void notifyCreator({
          userId: creatorUserId,
          title: `${amountFormatted} received!`,
          body: `Payment confirmed for order #${metadata.orderId.slice(0, 8).toUpperCase()}. Check your orders.`,
          actionUrl: '/dashboard/orders',
          ctx: sdkCtx,
        })
      }

      if (creatorEmail) {
        void notifyCreatorEmail({
          to: creatorEmail,
          creatorName: storeName,
          customerName: order?.customer_name ?? 'Customer',
          productName: 'Order',
          amountFormatted,
          orderReference: metadata.orderId.slice(0, 8).toUpperCase(),
          ctx: sdkCtx,
        })
      }

      if (order?.customer_email) {
        void sendCustomerReceipt({
          to: order.customer_email,
          customerName: order.customer_name ?? 'Customer',
          orderReference: metadata.orderId.slice(0, 8).toUpperCase(),
          productName: 'Your Order',
          amountFormatted,
          storeName,
          storeHandle: metadata.organizationId,
          ctx: sdkCtx,
        })
      }

      void emitEvent('payment_received', sdkCtx, {
        orderId: metadata.orderId,
        paymentId: metadata.paymentId,
        amountKobo: amountNgn * 100,
        amountFormatted,
        correlationId,
      }, `payment_received:${metadata.paymentId}`)
    }

    if (tx.status === 'failed') {
      const sdkCtx = { tenantId: metadata.organizationId, correlationId }
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', metadata.paymentId)
        .eq('organization_id', metadata.organizationId)

      void emitEvent('payment_failed', sdkCtx, {
        orderId: metadata.orderId,
        paymentId: metadata.paymentId,
        orderReference: metadata.orderId.slice(0, 8).toUpperCase(),
        correlationId,
      }, `payment_failed:${metadata.paymentId}`)
    }

    logApiEvent('info', 'payments.webhook_processed', { correlationId, eventId: tx.id, provider, paymentId: metadata.paymentId })
    return NextResponse.json({ ok: true, correlationId }, { headers: { 'x-correlation-id': correlationId } })
  } catch (error) {
    logApiEvent('error', 'payments.webhook_processing_failed', {
      correlationId,
      message: error instanceof Error ? error.message : 'Webhook processing failed',
    })

    const supabase = createClient()
    await supabase.from('messaging_failures').insert({
      tenant_id: 'unknown',
      reason: error instanceof Error ? error.message : 'Webhook processing failed',
    })

    return errorResponse(500, 'WEBHOOK_PROCESSING_FAILED', 'Webhook processing failed', correlationId)
  }
}
