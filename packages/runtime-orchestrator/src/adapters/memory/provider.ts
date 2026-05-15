import type { QueueProvider } from "../provider"; import type { JobEnvelope, QueueName } from "../../contracts/types"
export class MemoryQueueProvider implements QueueProvider {
 private readonly q = new Map<QueueName, JobEnvelope[]>(); private readonly jobs = new Map<string, JobEnvelope>()
 async publish<T>(queue: QueueName, job: JobEnvelope<T>){ (this.q.get(queue)||this.q.set(queue,[]).get(queue)!).push(job as JobEnvelope); this.jobs.set(job.jobId, job as JobEnvelope) }
 async consume<T>(queue: QueueName){ return ((this.q.get(queue)||[]).shift() as JobEnvelope<T>)||null }
 async ack(){ } async nack(){} async retry(){} async deadLetter(){} async delay<T>(queue: QueueName, job: JobEnvelope<T>, delayMs: number){ setTimeout(()=>void this.publish(queue, job), delayMs) }
 async replay(){} async heartbeat(){}
}
