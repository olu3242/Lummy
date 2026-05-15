export class RetentionOptimizer {
  recommend(churnRisk: number) {
    if (churnRisk > 0.7) return ["offer_creator_coaching", "trigger_loyalty_campaign"]
    if (churnRisk > 0.4) return ["in_app_nudges", "content_recommendations"]
    return ["steady_state_monitoring"]
  }
}
