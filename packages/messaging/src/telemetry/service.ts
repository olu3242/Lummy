export class MessagingTelemetryService { metric(name: string, value: number, tags: Record<string, string>) { return { name, value, tags, at: new Date().toISOString() } } }
