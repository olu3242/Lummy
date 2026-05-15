export class PaymentsGovernanceService { requireAppendOnlyLedger(updateAttempt: boolean) { if (updateAttempt) throw new Error("append-only ledger violation") } }
