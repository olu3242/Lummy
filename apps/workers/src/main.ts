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
}
