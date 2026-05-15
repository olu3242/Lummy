export class GlobalRuntimeTelemetryService { metric(name: string, value: number, region: string) { return { name, value, region, at: new Date().toISOString() } } }
