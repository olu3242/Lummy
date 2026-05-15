export class ReconciliationLineageService { reconcile(settlementId: string) { return { settlementId, queue: "settlement.reconcile" } } }
