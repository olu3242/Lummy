#!/usr/bin/env node
const { runReconciliation } = require('../dist/src/reconciliation')
const { createClient } = require('../../../src/lib/supabase/server')

async function main() {
  const db = await createClient()
  const res = await runReconciliation(db)
  console.log('Reconciliation result:', res)
}

main().catch(e => { console.error(e); process.exit(1) })
