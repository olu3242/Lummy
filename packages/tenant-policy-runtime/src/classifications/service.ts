export class ClassificationService { classifyRisk(score: number) { return score > 80 ? "high" : score > 40 ? "medium" : "low" } }
