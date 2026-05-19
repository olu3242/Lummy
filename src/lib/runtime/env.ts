export interface EnvVar {
  key: string
  required: boolean
  redact?: boolean
  description: string
}

export const ENV_SCHEMA: EnvVar[] = [
  // Supabase
  { key: "NEXT_PUBLIC_SUPABASE_URL",   required: true,  description: "Supabase project URL" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true, description: "Supabase anon key" },
  { key: "SUPABASE_SERVICE_ROLE_KEY",  required: true,  redact: true, description: "Supabase service role key (server-only)" },
  // AI
  { key: "ANTHROPIC_API_KEY",          required: true,  redact: true, description: "Anthropic Claude API key" },
  // Payments
  { key: "PAYSTACK_SECRET_KEY",        required: true,  redact: true, description: "Paystack secret key" },
  { key: "PAYSTACK_PUBLIC_KEY",        required: false, description: "Paystack public key (frontend)" },
  // App
  { key: "NEXT_PUBLIC_APP_URL",        required: false, description: "Canonical app URL" },
  { key: "NEXT_PUBLIC_APP_ENV",        required: false, description: "Runtime environment label" },
  // WhatsApp / Meta
  { key: "WHATSAPP_BUSINESS_TOKEN",       required: false, redact: true, description: "WhatsApp Business API token (for sending messages)" },
  { key: "WHATSAPP_PHONE_NUMBER_ID",      required: false, description: "WhatsApp Cloud API phone number ID" },
  { key: "WHATSAPP_WEBHOOK_VERIFY_TOKEN", required: false, redact: true, description: "Meta webhook verify token — set same value in Meta App Dashboard" },
  { key: "META_APP_SECRET",               required: false, redact: true, description: "Meta App Secret — used for HMAC-SHA256 webhook signature validation" },
  // Edge Functions (Supabase — set via: supabase secrets set KEY=value)
  // META_VERIFY_TOKEN: alias of WHATSAPP_WEBHOOK_VERIFY_TOKEN for Supabase edge functions
  // Cron
  { key: "CRON_SECRET",                required: false, redact: true, description: "Secret for cron job authorization" },
]

export interface EnvValidationResult {
  valid: boolean
  score: number            // 0-100: percentage of required vars present
  missing: string[]
  present: string[]
  optional_missing: string[]
}

export function validateEnv(): EnvValidationResult {
  const required = ENV_SCHEMA.filter(e => e.required)
  const optional = ENV_SCHEMA.filter(e => !e.required)

  const missing = required.filter(e => !process.env[e.key]).map(e => e.key)
  const present = required.filter(e => !!process.env[e.key]).map(e => e.key)
  const optional_missing = optional.filter(e => !process.env[e.key]).map(e => e.key)

  const score = required.length > 0 ? Math.round((present.length / required.length) * 100) : 100

  return { valid: missing.length === 0, score, missing, present, optional_missing }
}

export function getEnvSummary(): string {
  const result = validateEnv()
  if (result.valid) return `✅ All ${result.present.length} required env vars present`
  return `❌ Missing required env vars: ${result.missing.join(", ")}`
}
