import { NextResponse } from 'next/server';
import { getMvpDeploymentReadiness } from '@/lib/runtime-config';
import { getCorrelationId, logApiEvent } from '@/lib/ops-observability';

export async function GET(req: Request) {
  const correlationId = getCorrelationId(req);
  const readiness = getMvpDeploymentReadiness();

  if (!readiness.ready) {
    logApiEvent('warn', 'runtime.deployment_readiness_partial', {
      correlationId,
      checks: readiness.checks,
    });
  }

  return NextResponse.json(
    { resource: 'metrics', status: 'ok', readiness, correlationId },
    { headers: { 'x-correlation-id': correlationId } },
  );
}
