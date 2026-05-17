export class MarketReadinessScorer {
  score(regulatory: number, operations: number, partnerCoverage: number) {
    return Number(((regulatory + operations + partnerCoverage) / 3).toFixed(3))
  }
}
