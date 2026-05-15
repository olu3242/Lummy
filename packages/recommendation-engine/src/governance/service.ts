export class RecommendationGovernanceService { enforceExplainability(explanations: unknown[]) { if (!explanations.length) throw new Error("ranking explanation required") } }
