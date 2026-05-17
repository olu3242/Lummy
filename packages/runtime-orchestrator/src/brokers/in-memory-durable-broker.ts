import type { JobEnvelope, QueueName } from "../contracts/types"
import type { DurableJobRecord, QueueAdapter } from "../adapters/queue-adapter"
export class InMemoryDurableBroker implements QueueAdapter {
 private readonly queues = new Map<QueueName, DurableJobRecord[]>()
 private readonly byId = new Map<string, DurableJobRecord>()
 async enqueue<T>(queue: QueueName, job: JobEnvelope<T>) { const rec: DurableJobRecord={job:job as JobEnvelope, state:"queued", traceId: job.correlationId, updatedAt:new Date().toISOString()}; (this.queues.get(queue)||this.queues.set(queue,[]).get(queue)!).push(rec); this.byId.set(job.jobId,rec) }
 async lease<T>(queue: QueueName, workerId: string, leaseMs: number){ const rec=(this.queues.get(queue)||[]).find(r=>r.state==="queued"||r.state==="retrying"||r.state==="replayed"); if(!rec) return null; rec.state="leased"; rec.workerId=workerId; rec.leasedUntil=new Date(Date.now()+leaseMs).toISOString(); rec.updatedAt=new Date().toISOString(); return rec as DurableJobRecord<T> }
 async ack(jobId: string, state: "completed"|"failed"|"retrying"|"dead_lettered"|"replayed"){ const rec=this.byId.get(jobId); if(!rec) return; rec.state=state; rec.updatedAt=new Date().toISOString() }
 async heartbeat(jobId: string, workerId: string, leaseMs: number){ const rec=this.byId.get(jobId); if(!rec||rec.workerId!==workerId) return; rec.leasedUntil=new Date(Date.now()+leaseMs).toISOString(); rec.updatedAt=new Date().toISOString() }
 async replay(jobId: string){ const rec=this.byId.get(jobId); if(!rec) return; rec.state="replayed"; rec.updatedAt=new Date().toISOString() }
 async depth(queue: QueueName){ return (this.queues.get(queue)||[]).filter(r=>["queued","retrying","replayed"].includes(r.state)).length }
}
