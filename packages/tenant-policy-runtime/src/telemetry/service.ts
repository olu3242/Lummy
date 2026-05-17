export class PolicyTelemetryService { metric(name: string, value: number) { return { name, value, at: new Date().toISOString() } } }
