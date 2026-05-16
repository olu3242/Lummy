import { MANDATORY_QUEUES } from "@lummy/runtime-orchestrator"
import { createAutomationHandler } from "./handlers/automation-execute"
import { eventsOutboxHandler } from "./handlers/events-outbox"
import { WorkerRuntime } from "./runtime/worker"

const worker = new WorkerRuntime({
  "events.outbox": eventsOutboxHandler,
})
const queue = worker.getQueue()
worker.registerHandler("automation.execute", createAutomationHandler(queue))

export async function tickAllQueues() {
  await worker.tickAllQueues([...MANDATORY_QUEUES])
}
