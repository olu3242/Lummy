export class ThrottlingService { enforce(skillId: string) { return { skillId, domain: "throttling", queue: "skills.throttling" } } }
