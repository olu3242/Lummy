export class AdaptiveUXService {
  personalize(onboardingCompletion: number, engagementScore: number) {
    return onboardingCompletion < 0.7 || engagementScore < 0.6 ? "guided_mode" : "power_mode"
  }
}
