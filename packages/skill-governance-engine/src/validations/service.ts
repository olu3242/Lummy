export class ValidationsService { enforce(skillId: string) { return { skillId, domain: "validations", queue: "skills.validations" } } }
