export class IdempotencyService { private keys = new Set<string>()
 checkExecution(key: string){ return this.keys.has(key) }
 reserveExecution(key: string){ if(this.keys.has(key)) return false; this.keys.add(key); return true }
 releaseExecution(key: string){ this.keys.delete(key) }
}
