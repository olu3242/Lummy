const { handleProviderWebhook } = require('../src/orchestrator')

async function run() {
  // Simple in-memory fake DB implementing necessary methods
  const db = {
    _rows: [],
    async findOne(table, where) {
      return this._rows.find(r => Object.keys(where).every(k => r[k] === where[k])) || null
    },
    async insert(table, obj) { this._rows.push(obj); return obj },
    async update(table, updates, where) {
      const row = this._rows.find(r => Object.keys(where).every(k => r[k] === where[k]));
      if (row) Object.assign(row, updates); return row
    }
  }

  const fakeHeaders = { 'x-paystack-signature': 'sig' }
  const fakeRaw = JSON.stringify({ id: 'tx_123', reference: 'ref_123', status: 'settled', amount: 1000, currency: 'NGN' })

  const tx = await handleProviderWebhook(db, 'paystack', fakeHeaders, fakeRaw, 'corr_1')
  console.log('Result:', tx)
}

run().catch(e => { console.error(e); process.exit(1) })
