export class AmbientPresenceService { activate(tenantId: string) { return { tenantId, queue: "ambient.context", supervised: true } } }
