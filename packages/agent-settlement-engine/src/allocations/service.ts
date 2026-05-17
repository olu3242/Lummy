export class AllocationService { allocate(settlementId: string) { return { settlementId, deterministic: true } } }
