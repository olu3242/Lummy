import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    resource: 'ai/costs',
    status: 'ready',
    controls: {
      requestTokenLimit: 16000,
      tenantWindowTokenLimit: 100000,
      costMetric: 'estimated_cost_usd',
    },
  });
}
