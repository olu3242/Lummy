export class SynchronizationService { sync(interactionId: string) { return { interactionId, retryQueue: "multimodal.retry" } } }
