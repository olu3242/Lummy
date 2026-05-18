export interface ToolDefinition { name: string; allowedTenants: string[] }
export class ToolRegistry { private readonly tools = new Map<string, ToolDefinition>(); register(tool: ToolDefinition) { this.tools.set(tool.name, tool) } assertAllowed(name: string, tenantId: string) { const t = this.tools.get(name); if (!t || !t.allowedTenants.includes(tenantId)) throw new Error("tool not allowed") } }
