const requiredPublic = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const;

const requiredPayment = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PAYSTACK_SECRET_KEY',
] as const;

const providerEnv = {
  stripe: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
  paystack: ['PAYSTACK_SECRET_KEY'],
} as const;

export function validatePublicRuntimeEnv() {
  const missing = requiredPublic.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

export function validatePaymentRuntimeEnv() {
  const missing = requiredPayment.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required payment env vars: ${missing.join(', ')}`);
}

export function validateProviderRuntimeEnv(provider: keyof typeof providerEnv) {
  const missing = providerEnv[provider].filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required ${provider} env vars: ${missing.join(', ')}`);
}

export function validateAiRuntimeEnv() {
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing AI provider env vars: configure OPENAI_API_KEY or ANTHROPIC_API_KEY');
  }
}

function normalizeUrl(url: string) {
  return url.replace(/\/+$/, '');
}

function isLocalUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function getRuntimeAppUrl(requestUrl?: string | URL) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && (process.env.NODE_ENV !== 'production' || !isLocalUrl(configured))) {
    return normalizeUrl(configured);
  }

  if (requestUrl) {
    return new URL(requestUrl).origin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'https://lummy.co';
}

export function getMvpDeploymentReadiness() {
  const checks = {
    publicEnv: requiredPublic.every((k) => Boolean(process.env[k])),
    paymentEnv: requiredPayment.every((k) => Boolean(process.env[k])),
    aiProviderEnv: Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  return {
    checks,
    ready: Object.values(checks).every(Boolean),
  };
}
