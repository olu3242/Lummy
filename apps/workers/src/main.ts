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
}
