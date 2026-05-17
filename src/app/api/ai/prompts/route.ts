import { NextResponse } from 'next/server';
import { listAppPrompts } from '@/lib/ai/runtime';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ resource: 'ai/prompts', prompts: listAppPrompts() });
}
