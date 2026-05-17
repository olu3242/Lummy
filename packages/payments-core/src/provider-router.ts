import { PaystackProvider } from './paystack-provider'
import { StripeProvider } from './stripe-provider'
import type { ProviderName, InitializePaymentInput, ProviderInitializeResult, NormalizedTransaction, PaymentProviderInterface } from './provider-types'

const providers = {
  paystack: new PaystackProvider(),
  stripe: new StripeProvider(),
} as Partial<Record<ProviderName, PaymentProviderInterface>>

export function resolveProvider(name: string | undefined) {
  if (!name) throw new Error('No provider specified')
  const key = (name as ProviderName)
  if (!providers[key]) throw new Error(`Unsupported provider: ${name}`)
  const provider = providers[key] as PaymentProviderInterface
  assertProviderCapabilities(provider)
  return provider
}

export function detectProviderFromHeaders(headers: Record<string, string>): ProviderName {
  if (headers['stripe-signature']) return 'stripe'
  if (headers['x-paystack-signature']) return 'paystack'
  throw new Error('Unable to resolve payment provider from webhook headers')
}

export function assertProviderCapabilities(provider: PaymentProviderInterface): void {
  const required: Array<keyof PaymentProviderInterface> = ['initializePayment', 'verifyPayment', 'reconcileWebhook', 'normalizeTransaction', 'refundPayment']
  for (const key of required) {
    if (typeof provider[key] !== 'function') throw new Error(`Payment provider ${provider.name} is missing ${String(key)}`)
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

export async function refundPayment(providerName: string, providerReference: string, amount?: number) {
  const provider = resolveProvider(providerName)
  return provider.refundPayment(providerReference, amount)
}

export function normalizeTransaction(providerName: string, raw: any) {
  const provider = resolveProvider(providerName)
  return provider.normalizeTransaction(raw)
}
