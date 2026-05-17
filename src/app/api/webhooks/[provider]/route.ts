import { NextResponse } from 'next/server'
import { handleProviderWebhook } from '../../../../../packages/payments-core/src/orchestrator'
import { getCorrelationId, logApiEvent } from '@/lib/ops-observability'
import { createClient } from '@/lib/supabase/server'
import { ensurePaymentProvidersConfigured } from '@/lib/runtime/readiness'

export async function POST(req: Request, { params }: { params: { provider: string } }) {
  const correlationId = getCorrelationId(req)
  const provider = params.provider
  try {
    ensurePaymentProvidersConfigured()
    const rawBody = await req.text()
    const headers: Record<string,string> = {}
    req.headers.forEach((v,k) => headers[k.toLowerCase()] = v)

    const supabase = await createClient()

    const tx = await handleProviderWebhook(supabase as any, provider, headers, rawBody, correlationId)
    if (!tx) {
      logApiEvent('warn', 'webhook.unknown', { provider, correlationId })
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    logApiEvent('info', 'webhook.processed', { provider, transactionId: tx.id, correlationId })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    logApiEvent('error', 'webhook.failed', { provider, correlationId, error: err instanceof Error ? err.message : String(err) })
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
