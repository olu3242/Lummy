export class ActionRoutingService { route(actionId: string) { return { actionId, queue: "realtime.actions" } } }
