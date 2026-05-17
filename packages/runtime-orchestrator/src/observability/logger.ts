export interface RuntimeLogFields {
  correlationId?: string
  queue?: string
  jobId?: string
  attempt?: number
  replayCount?: number
  [key: string]: unknown
}

export function logRuntime(event: string, fields: RuntimeLogFields = {}) {
  const payload = { event, at: new Date().toISOString(), ...fields }
  console.info(JSON.stringify(payload))
}

