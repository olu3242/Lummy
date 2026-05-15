export class CacheGovernanceService { policy(lowBandwidth: boolean) { return { strategy: lowBandwidth ? "stale-while-revalidate" : "network-first" } } }
