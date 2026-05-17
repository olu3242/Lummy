const priorityMarkets = ["Nigeria", "Kenya", "Ghana", "South Africa", "United States", "United Kingdom", "European Union"]

export class ExpansionIntelligenceEngine {
  demandSignals() {
    return priorityMarkets.map((market, i) => ({ market, demandScore: 0.92 - i * 0.06 }))
  }
}
