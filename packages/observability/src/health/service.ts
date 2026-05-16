export class HealthService { score(input: { queueDepth: number; failures: number }) { return Math.max(0, 100 - input.queueDepth - (input.failures*5)) } }
