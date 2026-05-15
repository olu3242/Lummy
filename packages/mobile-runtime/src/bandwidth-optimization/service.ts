export class BandwidthOptimizationService { chooseAssetQuality(connectionType: string) { return connectionType === "slow-2g" ? "low" : "high" } }
