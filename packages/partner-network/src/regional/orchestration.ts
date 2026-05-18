export const regionalPartnerOrchestration = (regions: string[]) => regions.map((region) => ({ region, status: "ready" as const }))
