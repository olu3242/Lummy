export class WeightingService { apply(baseScore: number, trustWeight: number, retentionWeight: number, fraudPenalty: number) { return (baseScore * trustWeight * retentionWeight) - fraudPenalty } }
