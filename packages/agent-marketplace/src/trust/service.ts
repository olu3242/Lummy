export class SkillTrustService { score(skillId: string) { return { skillId, fraudRisk: "low" as const } } }
