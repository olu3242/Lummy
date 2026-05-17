import { NextResponse } from 'next/server';
import type { AIExecutionRequest, AIProviderName } from '@lummy/ai-runtime';
import { createAppAIRuntime } from '@/lib/ai/runtime';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ resource: 'ai/executions', status: 'ready', methods: ['GET', 'POST'] });
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json() as Record<string, unknown>;
  const tenantId = String(body.tenantId || body.organizationId || '');
  const promptKey = String(body.promptKey || '');
  const workflow = String(body.workflow || 'generic');

  if (!tenantId || !promptKey) {
    return NextResponse.json({ error: 'tenantId and promptKey are required' }, { status: 400 });
  }

  const runtime = createAppAIRuntime();
  const result = await runtime.executor.execute({
    tenantId,
    workflow: workflow as AIExecutionRequest['workflow'],
    promptKey,
    provider: providerOption(body.provider),
    fallbackProviders: Array.isArray(body.fallbackProviders) ? body.fallbackProviders.filter(isProviderName) : undefined,
    model: typeof body.model === 'string' ? body.model : undefined,
    variables: isRecord(body.variables) ? body.variables : {},
    messages: Array.isArray(body.messages) ? body.messages as AIExecutionRequest['messages'] : undefined,
    maxOutputTokens: numberOption(body.maxOutputTokens),
    temperature: numberOption(body.temperature),
    timeoutMs: numberOption(body.timeoutMs),
    idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined,
    correlationId: typeof body.correlationId === 'string' ? body.correlationId : undefined,
    metadata: isRecord(body.metadata) ? body.metadata : undefined,
  });

  return NextResponse.json({ result });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function numberOption(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function providerOption(value: unknown): AIProviderName | undefined {
  return isProviderName(value) ? value : undefined;
}

function isProviderName(value: unknown): value is AIProviderName {
  return value === 'openai' || value === 'anthropic';
}
