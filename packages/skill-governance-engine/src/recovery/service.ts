export class RecoveryService { enforce(skillId: string) { return { skillId, domain: "recovery", queue: "skills.recovery" } } }
