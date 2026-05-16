export class ContextualMemoryService { persist(tenantId: string) { return { tenantId, queue: "ambient.memory", tenantSafe: true } } }
