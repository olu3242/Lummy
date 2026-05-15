export type PluginType = 'workflow'|'ai'|'analytics'|'commerce'|'moderation'|'automation'|'observability';
export type PluginManifest = { id: string; tenantId: string; type: PluginType; permissions: string[]; sandbox: 'strict'|'standard' };
