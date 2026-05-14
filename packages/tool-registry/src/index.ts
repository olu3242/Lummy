export type ToolDefinition = { id: string; tenantId: string; version: string; permissions: string[]; sandbox: 'strict' | 'standard' };
export type ToolExecution = { id: string; toolId: string; status: 'queued' | 'running' | 'completed' | 'failed'; retries: number };
