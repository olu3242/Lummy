import type { JobEventType } from "../contracts/types"

export interface JobTrace { jobId: string; queue: string; event: JobEventType; at: string; details?: Record<string, unknown> }
export class WorkerMonitorService {
  private readonly traces: JobTrace[] = []
  emit(trace: JobTrace) { this.traces.push(trace) }
  all() { return this.traces }
}
