export class AutomationRecoveryService { shouldStopRecursive(correlationId: string, seen: Set<string>) { return seen.has(correlationId) } }
