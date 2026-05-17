import { NextResponse } from 'next/server';
import { getAIOperationsSnapshot } from '@/lib/ai/runtime';

export async function GET(): Promise<NextResponse> {
  const snapshot = await getAIOperationsSnapshot();
  return NextResponse.json({ resource: 'ai/telemetry', snapshot });
}
