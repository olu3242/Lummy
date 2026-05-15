export class RegionalOpportunityAnalyzer {
  score(creatorSupply: number, buyerDemand: number, infraReadiness: number) {
    return Number(((creatorSupply * 0.4) + (buyerDemand * 0.4) + (infraReadiness * 0.2)).toFixed(3))
  }
}
