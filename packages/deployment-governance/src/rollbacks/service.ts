export class RollbackService { plan(releaseId: string) { return { releaseId, actions: ["disable_flags", "drain_queues", "rollback_migration"], createdAt: new Date().toISOString() } } }
