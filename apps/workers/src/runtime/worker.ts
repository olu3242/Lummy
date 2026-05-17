import {
  ExecutionCoordinator,
  InMemoryLockService,
  InMemoryQueueService,
  type QueueHandler,
  type QueueName,
  WorkerMonitorService,
} from "@lummy/runtime-orchestrator"

export class WorkerRuntime {
  private readonly queue = new InMemoryQueueService()
  private readonly lock = new InMemoryLockService()
  private readonly monitor = new WorkerMonitorService()
  private readonly coordinator = new ExecutionCoordinator(this.queue, this.lock, this.monitor)

  constructor(private readonly handlers: Partial<Record<QueueName, QueueHandler>>) {}
  registerHandler(queueName: QueueName, handler: QueueHandler) { this.handlers[queueName] = handler }

  getQueue() { return this.queue }
  getMonitor() { return this.monitor }

  async tick(queueName: QueueName): Promise<void> {
    console.info(JSON.stringify({ event: "worker.tick.start", queue: queueName, at: new Date().toISOString() }))
    await this.coordinator.tick(queueName, this.handlers[queueName])
    console.info(JSON.stringify({ event: "worker.tick.end", queue: queueName, at: new Date().toISOString() }))
  }

  async tickAllQueues(queueNames: QueueName[]): Promise<void> {
    for (const queueName of queueNames) await this.tick(queueName)
  }
}
