import { NextResponse } from 'next/server';
import { createAppAIRuntime, normalizeCommerceSignalInput } from '@/lib/ai/runtime';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json() as Record<string, unknown>;
  const input = normalizeCommerceSignalInput(body);

  if (!input.tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  const result = await createAppAIRuntime().copilot.summarizeOperations(input);
  return NextResponse.json({ result });
}
