export class AdTargetingService { match(audience: Record<string,string>, campaignTags: string[]) { return campaignTags.some((t)=>Object.values(audience).includes(t)) } }
