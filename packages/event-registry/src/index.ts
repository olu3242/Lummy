import { z } from 'zod';

export const eventNameSchema = z.string().regex(/^[a-z]+\.[a-z]+\.[a-z]+\.v\d+$/);

export const envelopeSchema = z.object({
  name: eventNameSchema,
  version: z.number().int().positive(),
  tenantId: z.string().uuid(),
  traceId: z.string().min(8),
  correlationId: z.string().min(8),
  idempotencyKey: z.string().min(8),
  timestamp: z.string(),
  payload: z.unknown(),
  metadata: z.record(z.unknown()).default({}),
});

export type EventEnvelope<T = unknown> = Omit<z.infer<typeof envelopeSchema>, 'payload'> & { payload: T };

export function createEventEnvelope<T>(input: EventEnvelope<T>) {
  return envelopeSchema.parse(input) as EventEnvelope<T>;
}

export function serializeEvent<T>(event: EventEnvelope<T>) {
  return JSON.stringify(createEventEnvelope(event));
}
