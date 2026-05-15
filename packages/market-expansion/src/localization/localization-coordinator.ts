export class LocalizationCoordinator {
  plan(region: string) {
    return { region, localeBundles: ["currency", "tax", "language", "checkout"], status: "ready" as const }
  }
}
