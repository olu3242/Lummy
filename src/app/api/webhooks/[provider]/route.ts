import { NextResponse } from 'next/server'
import { handleProviderWebhook } from '../../../../../packages/payments-core/src/orchestrator'
import { getCorrelationId, logApiEvent } from '@/lib/ops-observability'
import { createClient } from '@/lib/supabase/server'
import { ensurePaymentProvidersConfigured } from '@/lib/runtime/readiness'
import { createPaymentDatabaseAdapter } from '@/lib/payments/payment-db-adapter'

export async function POST(req: Request, { params }: { params: { provider: string } }) {
  const correlationId = getCorrelationId(req)
  const provider = params.provider
  try {
    ensurePaymentProvidersConfigured()
    const rawBody = await req.text()
    const headers: Record<string,string> = {}
    req.headers.forEach((v,k) => headers[k.toLowerCase()] = v)

    const supabase = await createClient()

    const tx = await handleProviderWebhook(createPaymentDatabaseAdapter(supabase as never), provider, headers, rawBody, correlationId)
    if (!tx) {
      // null means signature verification failed — return 401 so provider stops retrying invalid requests
      logApiEvent('warn', 'webhook.signature_invalid', { provider, correlationId })
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
    }

    logApiEvent('info', 'webhook.processed', { provider, transactionId: tx.id, correlationId })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    logApiEvent('error', 'webhook.failed', { provider, correlationId, error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
