export class PoliciesService { enforce(skillId: string) { return { skillId, domain: "policies", queue: "skills.policies" } } }
