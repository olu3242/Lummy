export class TrustRecoveryService { replayToken(idempotencyKey: string) { return `trust.replay.${idempotencyKey}` } }
