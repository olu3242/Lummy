export class SettlementOrchestrationService { orchestrate(settlementId: string) { return { settlementId, queue: "settlement.execute", replaySafe: true } } }
