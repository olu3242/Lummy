import {
  ConsoleAIRuntimeStore,
  createAIRuntime,
  createDefaultPromptRegistry,
  type AIRuntimeStore,
  type CommerceSignalInput,
} from '@lummy/ai-runtime';
import { supabaseAdmin } from '@/lib/supabase/admin';

export interface AIOperationsSnapshot {
  status: 'ok' | 'degraded';
  reason?: string;
  totalExecutions: number;
  providerFailures: number;
  degradedExecutions: number;
  estimatedCostUsd: number;
  averageLatencyMs: number;
  providerHealth: Record<string, number>;
  lastExecutionAt: unknown;
}

interface SupabaseInsertClient {
  from(table: string): {
    insert(payload: Record<string, unknown>): Promise<{ error: { message: string } | null }>;
    select(columns?: string): {
      order(column: string, options: { ascending: boolean }): {
        limit(count: number): Promise<{ data: Array<Record<string, unknown>> | null; error: { message: string } | null }>;
      };
    };
  };
}

class SupabaseAIRuntimeStore implements AIRuntimeStore {
  constructor(private readonly client: SupabaseInsertClient) {}

  async insert(table: string, payload: Record<string, unknown>) {
    const { error } = await this.client.from(table).insert(payload);
    if (error) {
      console.error(JSON.stringify({ event: 'ai.store.insert_failed', table, error: error.message }));
    }
  }
}

export function createAppAIRuntime() {
  return createAIRuntime(createAIRuntimeStore());
}

export function listAppPrompts() {
  return createDefaultPromptRegistry().list();
}

export function normalizeCommerceSignalInput(body: Record<string, unknown>): CommerceSignalInput {
  return {
    tenantId: String(body.tenantId || body.organizationId || ''),
    customerId: optionalString(body.customerId),
    productId: optionalString(body.productId),
    orderId: optionalString(body.orderId),
    channel: optionalString(body.channel),
    events: Array.isArray(body.events) ? body.events.filter(isRecord) : [],
    metrics: isNumericRecord(body.metrics) ? body.metrics : undefined,
    correlationId: optionalString(body.correlationId),
  };
}

export async function getAIOperationsSnapshot(): Promise<AIOperationsSnapshot> {
  if (!canUseServiceRole()) {
    return emptySnapshot('service_role_unavailable');
  }

  const client = supabaseAdmin() as unknown as SupabaseInsertClient;
  const executions = await client.from('ai_execution_logs').select('*').order('created_at', { ascending: false }).limit(100);
  const failures = await client.from('ai_provider_failures').select('*').order('created_at', { ascending: false }).limit(100);

  if (executions.error) {
    return emptySnapshot(executions.error.message);
  }

  const rows = executions.data || [];
  const failureRows = failures.data || [];
  const estimatedCostUsd = rows.reduce((sum, row) => sum + numberField(row.estimated_cost_usd), 0);
  const averageLatencyMs = rows.length ? rows.reduce((sum, row) => sum + numberField(row.latency_ms), 0) / rows.length : 0;
  const providerHealth = rows.reduce<Record<string, number>>((acc, row) => {
    const provider = String(row.provider || 'unknown');
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {});

  return {
    status: 'ok',
    totalExecutions: rows.length,
    providerFailures: failureRows.length,
    degradedExecutions: rows.filter((row) => row.degraded === true).length,
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
    averageLatencyMs: Math.round(averageLatencyMs),
    providerHealth,
    lastExecutionAt: rows[0]?.created_at || null,
  };
}

function createAIRuntimeStore(): AIRuntimeStore {
  if (!canUseServiceRole()) return new ConsoleAIRuntimeStore();
  return new SupabaseAIRuntimeStore(supabaseAdmin() as unknown as SupabaseInsertClient);
}

function canUseServiceRole() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function emptySnapshot(reason: string) {
  return {
    status: 'degraded',
    reason,
    totalExecutions: 0,
    providerFailures: 0,
    degradedExecutions: 0,
    estimatedCostUsd: 0,
    averageLatencyMs: 0,
    providerHealth: {},
    lastExecutionAt: null,
  };
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isNumericRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'number' && Number.isFinite(item));
}

function numberField(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
