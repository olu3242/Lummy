export class MessagingGovernanceService { enforceRateLimit(sentInWindow: number, maxPerWindow: number) { if (sentInWindow >= maxPerWindow) throw new Error("Rate limited") } }
