export class SkillInstallService { requestInstall(skillId: string, tenantId: string) { return { skillId, tenantId, auditTrail: true } } }
