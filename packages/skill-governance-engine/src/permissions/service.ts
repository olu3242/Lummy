export class PermissionsService { enforce(skillId: string) { return { skillId, domain: "permissions", queue: "skills.permissions" } } }
