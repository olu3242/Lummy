<<<<<<< HEAD
import { MANDATORY_QUEUES } from "@lummy/runtime-orchestrator"
import { createAutomationHandler } from "./handlers/automation-execute"
import { eventsOutboxHandler } from "./handlers/events-outbox"
import { WorkerRuntime } from "./runtime/worker"

const runtime = new WorkerRuntime({})
const queue = runtime.getQueue()

const worker = new WorkerRuntime({
  "events.outbox": eventsOutboxHandler,
  "automation.execute": createAutomationHandler(queue),
})

export async function tickAllQueues() {
  await worker.tickAllQueues([...MANDATORY_QUEUES])
=======
import { InMemoryLock, InMemoryQueueAdapter } from "../../../packages/runtime-orchestrator/src"
import { WorkerRuntime } from "./runtime/worker"
import { handleEventsOutbox } from "./handlers/events-outbox"
import { handleAutomationExecute } from "./handlers/automation-execute"

const queue = new InMemoryQueueAdapter()
const lock = new InMemoryLock()

const runtime = new WorkerRuntime(queue, lock, {
  "events.outbox": (job) => handleEventsOutbox(queue, job),
  "automation.execute": (job) => handleAutomationExecute(queue, [], job as never),
})

export async function tickAllQueues() {
  await runtime.tick("events.outbox")
  await runtime.tick("automation.execute")
>>>>>>> main
}
