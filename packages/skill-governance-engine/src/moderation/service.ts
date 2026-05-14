export class ModerationService { enforce(skillId: string) { return { skillId, domain: "moderation", queue: "skills.moderation" } } }
