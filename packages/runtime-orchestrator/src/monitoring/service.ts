import type { JobEventType } from "../contracts/types"

export interface JobTrace { jobId: string; queue: string; event: JobEventType; at: string; details?: Record<string, unknown> }
export interface RuntimeCounters { started: number; completed: number; retried: number; deadLettered: number }
export class WorkerMonitorService {
  private readonly traces: JobTrace[] = []
  private readonly counters: RuntimeCounters = { started: 0, completed: 0, retried: 0, deadLettered: 0 }
  emit(trace: JobTrace) {
    this.traces.push(trace)
    if (trace.event === "job.started") this.counters.started += 1
    if (trace.event === "job.completed") this.counters.completed += 1
    if (trace.event === "job.retried") this.counters.retried += 1
    if (trace.event === "job.dead_lettered") this.counters.deadLettered += 1
  }
  all() { return this.traces }
  metrics() { return { ...this.counters } }
}
