export class OfflineSyncService { queueAction(action: Record<string, unknown>) { return { ...action, queuedAt: new Date().toISOString(), state: "queued" } } }
