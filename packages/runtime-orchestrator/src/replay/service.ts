import type { QueueName } from "../contracts/types"
import type { QueueAdapter } from "../adapters/queue-adapter"
export const REPLAY_REQUEST_VERSION = 1 as const
export class ReplayService {
  constructor(private readonly queue: QueueAdapter) {}

  replay(jobId: string, queue: QueueName, metadata: { actor: string; reason: string; correlationId: string; orgId?: string; version: typeof REPLAY_REQUEST_VERSION }) {
    if (metadata.version !== REPLAY_REQUEST_VERSION) throw new Error(`Unsupported replay request version: ${metadata.version}`)
    if (!metadata.actor || !metadata.reason || !metadata.correlationId) throw new Error("Replay metadata is required")
    return this.queue.replay(jobId, queue)
  }
}
