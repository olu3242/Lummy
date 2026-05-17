export class ExecutionControlService { denyIfThrottled(throttled: boolean) { if (throttled) throw new Error("throttled") } }
