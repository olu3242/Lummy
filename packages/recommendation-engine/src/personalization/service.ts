export class PersonalizationService { personalize(profile: Record<string, number>, score: number) { const affinity = Object.values(profile).reduce((a,b)=>a+b,0) || 1; return score * affinity } }
