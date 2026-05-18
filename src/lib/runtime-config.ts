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

export function validatePublicRuntimeEnv() {
  const missing = requiredPublic.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

export function validatePaymentRuntimeEnv() {
  const missing = requiredPayment.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required payment env vars: ${missing.join(', ')}`);
}

export function getMvpDeploymentReadiness() {
  const checks = {
    publicEnv: requiredPublic.every((k) => Boolean(process.env[k])),
    paymentEnv: requiredPayment.every((k) => Boolean(process.env[k])),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  return {
    checks,
    ready: Object.values(checks).every(Boolean),
  };
}
