import crypto from 'crypto'

jest.mock('../../../src/repositories/order-repository', () => ({
  markPaymentCompleted: jest.fn().mockResolvedValue({ payment: {}, order: {} }),
}))

import { createPaymentSession, handleProviderWebhook } from '../src/orchestrator'

beforeEach(() => {
  process.env.PAYSTACK_SECRET_KEY = 'test_paystack_secret'
  process.env.STRIPE_SECRET_KEY = 'test_stripe_secret'
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      status: true,
      data: {
        reference: 'ref_test_1',
        authorization_url: 'https://paystack.test/checkout/ref_test_1',
      },
    }),
  }) as any
})

class InMemoryDB {
  rows: Record<string, any>[] = []
  async findOne(table: string, where: Record<string, any>) {
    return this.rows.find(r => Object.keys(where).every(k => r[k] === where[k])) || null
  }
  async insert(table: string, obj: Record<string, any>) {
    this.rows.push(obj)
    return obj
  }
  async update(table: string, where: Record<string, any>, updates: Record<string, any>) {
    const row = this.rows.find(r => Object.keys(where).every(k => r[k] === where[k]))
    if (row) Object.assign(row, updates)
    return row
  }
}

test('idempotency: repeated initialize returns same provider reference', async () => {
  const db = new InMemoryDB()
  const metadata = { organizationId: 'org_test', idempotencyKey: 'idem_test_1' }

  const res1 = await createPaymentSession(db as any, 'paystack', { amount: 1000, currency: 'NGN', metadata, customerEmail: 'a@b.test' }, 'corr_1')
  const res2 = await createPaymentSession(db as any, 'paystack', { amount: 1000, currency: 'NGN', metadata, customerEmail: 'a@b.test' }, 'corr_1')

  expect(res1.providerReference).toEqual(res2.providerReference)
})

test('webhook handling: paystack signature verification and normalization', async () => {
  const db = new InMemoryDB()
  process.env.PAYSTACK_SECRET_KEY = 'test_paystack_secret'

  const fakeRaw = JSON.stringify({ id: 'tx_999', reference: 'ref_999', status: 'settled', amount: 2000, currency: 'NGN' })
  const paystackSig = crypto.createHmac('sha256', process.env.PAYSTACK_SECRET_KEY as string).update(fakeRaw).digest('hex')
  const fakeHeaders = { 'x-paystack-signature': paystackSig }

  const tx = await handleProviderWebhook(db as any, 'paystack', fakeHeaders as any, fakeRaw, 'corr_webhook')
  expect(tx).toBeTruthy()
  expect(tx?.id).toBeTruthy()
})
