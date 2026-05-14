export class ApprovalsService { enforce(skillId: string) { return { skillId, domain: "approvals", queue: "skills.approvals" } } }
