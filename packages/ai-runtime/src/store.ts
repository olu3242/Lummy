import type { AIRuntimeStore } from "./types"

export class ConsoleAIRuntimeStore implements AIRuntimeStore {
  async insert(table: string, payload: Record<string, unknown>) {
    console.info(JSON.stringify({ event: "ai.store.insert", table, payload }))
  }
}
