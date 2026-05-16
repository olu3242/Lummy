import type { DatabaseClient } from "@lummy/db-core"
export class CircuitBreakerService { constructor(private readonly db: DatabaseClient) {} async open(circuitKey: string, reason: string) { return this.db.upsert("execution_circuit_breakers", { circuit_key: circuitKey, status: "open", reason, updated_at: new Date().toISOString() }) } }
