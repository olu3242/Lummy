export interface DistributedLock {
  acquire(key: string, ttlMs: number): Promise<boolean>
  release(key: string): Promise<void>
}

export class InMemoryLock implements DistributedLock {
  private readonly held = new Map<string, number>()

  async acquire(key: string, ttlMs: number): Promise<boolean> {
    const now = Date.now()
    const exp = this.held.get(key)
    if (exp && exp > now) return false
    this.held.set(key, now + ttlMs)
    return true
  }

  async release(key: string): Promise<void> {
    this.held.delete(key)
  }
}
