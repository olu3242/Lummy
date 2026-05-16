export class RiskClassificationService { classify(score: number) { if (score > 80) return "high"; if (score > 40) return "medium"; return "low" } }
