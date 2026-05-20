import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCorrelationId, logApiEvent } from '@/lib/ops-observability';

function isHttps(url?: string) {
  if (!url) return false;
  try { return new URL(url).protocol === 'https:'; } catch { return false; }
}

export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const envChecks = {
    appUrlPresent: Boolean(appUrl), appUrlHttps: isHttps(appUrl), appUrlNotLocalhost: Boolean(appUrl && !appUrl.includes('localhost')),
    stripeSecretPresent: Boolean(process.env.STRIPE_SECRET_KEY), stripeWebhookSecretPresent: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    paystackSecretPresent: Boolean(process.env.PAYSTACK_SECRET_KEY), supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY), supabaseServiceRolePresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
  let dbCheck = false; let webhookTableCheck = false;
  try {
    const supabase = createClient();
    dbCheck = !(await supabase.from('profiles').select('id').limit(1)).error;
    webhookTableCheck = !(await supabase.from('provider_webhook_events').select('idempotency_key').limit(1)).error;
  } catch {}
  const checks = { ...envChecks, dbCheck, webhookTableCheck };
  const ready = Object.values(checks).every(Boolean);
  if (!ready) logApiEvent('warn', 'runtime.launch_readiness_partial', { correlationId, checks });
  return NextResponse.json({ ready, checks, correlationId }, { headers: { 'x-correlation-id': correlationId } });
}
