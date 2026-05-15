export class SyncService { reconcile(localVersion: number, serverVersion: number) { return { requiresReplay: localVersion !== serverVersion, resolvedAt: new Date().toISOString() } } }
