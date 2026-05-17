export type GovernanceRole =
  | 'super_admin' | 'org_admin' | 'ops_admin' | 'finance_admin' | 'moderation_admin'
  | 'AI_admin' | 'workflow_admin' | 'support_admin' | 'auditor' | 'analyst' | 'contributor';

export type RoleAssignment = {
  tenantId: string;
  subjectId: string;
  role: GovernanceRole;
  permissions: string[];
  expiresAt?: string;
};

export class RbacService {
  private readonly assignments: RoleAssignment[] = [];
  assign(assignment: RoleAssignment): void { this.assignments.push(assignment); }
  list(tenantId: string): RoleAssignment[] { return this.assignments.filter((item) => item.tenantId === tenantId); }
}
