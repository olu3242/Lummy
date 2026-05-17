import type { JobEnvelope } from "./types"

export const JOB_ENVELOPE_VERSION = 1 as const

export interface VersionedJobEnvelope<TPayload = Record<string, unknown>> extends JobEnvelope<TPayload> {
  schemaVersion: typeof JOB_ENVELOPE_VERSION
}

export function assertJobEnvelope(input: JobEnvelope): asserts input is VersionedJobEnvelope {
  const envelope = input as Partial<VersionedJobEnvelope>
  if (envelope.schemaVersion !== JOB_ENVELOPE_VERSION) throw new Error(`Unsupported job schema version: ${envelope.schemaVersion}`)
  if (!envelope.jobId || !envelope.queue || !envelope.tenant || !envelope.idempotencyKey || !envelope.correlationId) {
    throw new Error("Invalid job envelope: missing required fields")
  }
}

