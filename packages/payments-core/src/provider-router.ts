import { PaystackProvider } from './paystack-provider'
import { StripeProvider } from './stripe-provider'
import type { ProviderName, InitializePaymentInput, ProviderInitializeResult, NormalizedTransaction } from './provider-types'

const providers = {
  paystack: new PaystackProvider(),
  stripe: new StripeProvider(),
} as Record<ProviderName, any>

export function resolveProvider(name: string | undefined) {
  if (!name) throw new Error('No provider specified')
  const key = (name as ProviderName)
  if (!providers[key]) throw new Error(`Unsupported provider: ${name}`)
  return providers[key] as {
    initializePayment(input: InitializePaymentInput): Promise<ProviderInitializeResult>
    verifyPayment(headers: Record<string, string>, rawBody: string): Promise<NormalizedTransaction | null>
    reconcileWebhook(raw: any): Promise<NormalizedTransaction | null>
  }
}

export async function initializePayment(providerName: string, input: InitializePaymentInput) {
  const provider = resolveProvider(providerName)
  return provider.initializePayment(input)
}

export async function verifyPayment(providerName: string, headers: Record<string, string>, rawBody: string) {
  const provider = resolveProvider(providerName)
  return provider.verifyPayment(headers, rawBody)
}

export async function reconcileWebhook(providerName: string, raw: any) {
  const provider = resolveProvider(providerName)
  return provider.reconcileWebhook(raw)
}
