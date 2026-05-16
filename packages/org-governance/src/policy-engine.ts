export type OrgScope = 'org' | 'workspace' | 'department' | 'team';

export type OrgPolicy = {
  id: string;
  tenantId: string;
  scope: OrgScope;
  scopeId: string;
  key: string;
  value: string | number | boolean;
};

export class OrgPolicyEngine {
  enforce(policies: OrgPolicy[], key: string, tenantId: string) {
    return policies.find((p) => p.tenantId === tenantId && p.key === key) ?? null;
  }
}

export class TenantIsolationManager {
  assertTenant(tenantId: string, resourceTenantId: string) {
    if (tenantId !== resourceTenantId) throw new Error('Tenant isolation violation');
  }
}

export class FeatureAccessResolver {
  canAccess(enabledFeatures: string[], feature: string) {
    return enabledFeatures.includes(feature);
  }
}

export class WorkspaceContextResolver {
  resolve(input: { orgId: string; workspaceId?: string; departmentId?: string; teamId?: string }) {
    return input;
  }
}
