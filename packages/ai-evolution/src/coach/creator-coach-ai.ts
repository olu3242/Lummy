export class CreatorCoachAI {
  recommend(revenueTrend: number, audienceGrowth: number) {
    return revenueTrend < 0 || audienceGrowth < 0.05 ? ["improve_funnel", "increase_personalized_offers"] : ["scale_top_channels"]
  }
}
