import type { AutomationHandler } from "./types"

export class AutomationRegistry {
  private readonly handlers = new Map<string, AutomationHandler>()

  register(handler: AutomationHandler) {
    if (this.handlers.has(handler.workflowKey)) throw new Error(`Automation handler already registered: ${handler.workflowKey}`)
    this.handlers.set(handler.workflowKey, handler)
  }

  resolve(workflowKey: string) {
    const handler = this.handlers.get(workflowKey)
    if (!handler) throw new Error(`Automation handler not registered: ${workflowKey}`)
    return handler
  }

  list() {
    return Array.from(this.handlers.keys()).sort()
  }
}
