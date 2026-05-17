export type AccessContext = { tenantId: string; userId: string; roles: string[]; attributes: Record<string, string> };

export class RBACABACGuard {
  authorize(ctx: AccessContext, requiredRole: string, attributeKey?: string, attributeValue?: string) {
    const roleOk = ctx.roles.includes(requiredRole);
    const attrOk = !attributeKey || ctx.attributes[attributeKey] === attributeValue;
    return roleOk && attrOk;
  }
}

export class ScopedTokenManager {
  issue(scope: string[], tenantId: string) { return { token: `${tenantId}:${scope.join(',')}`, tenantId, scope }; }
}

export class WebhookSignatureVerifier {
  verify(expected: string, actual?: string) { return !!actual && expected === actual; }
}

export class AuditTrail {
  log(event: { action: string; tenantId: string; actorId: string; traceId: string }) { return { ...event, at: new Date().toISOString() }; }
}
