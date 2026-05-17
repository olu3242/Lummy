export class ProactiveInsightEngine { suggest(signal: number) { return { action: signal > 0.7 ? "promote_offers" : "observe", score: signal } } }
