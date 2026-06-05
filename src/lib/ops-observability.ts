import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

type LogLevel = 'info' | 'warn' | 'error';

export function getCorrelationId(req: Request) {
  return req.headers.get('x-correlation-id') || randomUUID();
}

export function logApiEvent(level: LogLevel, event: string, details: Record<string, unknown>) {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...details,
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
    return;
  }
  if (level === 'warn') {
    console.warn(JSON.stringify(payload));
    return;
  }
  console.info(JSON.stringify(payload));
}

export function errorResponse(status: number, code: string, message: string, correlationId: string) {
  return NextResponse.json(
    {
      error: message,
      code,
      correlationId,
    },
    {
      status,
      headers: {
        'x-correlation-id': correlationId,
      },
    },
  );
}
