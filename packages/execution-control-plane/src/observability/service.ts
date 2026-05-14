export class ControlPlaneObservabilityService { event(name: string, payload: Record<string, unknown>) { return { name, payload, at: new Date().toISOString() } } }
