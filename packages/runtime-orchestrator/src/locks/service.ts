export interface LockService { acquire(key: string, ttlMs: number): Promise<boolean>; release(key: string): Promise<void> }
export class InMemoryLockService implements LockService {
  private readonly held = new Map<string, number>()
  async acquire(key: string, ttlMs: number) { const now = Date.now(); const exp = this.held.get(key); if (exp && exp > now) return false; this.held.set(key, now + ttlMs); return true }
  async release(key: string) { this.held.delete(key) }
}
