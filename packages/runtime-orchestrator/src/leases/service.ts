export interface LeaseRecord { leaseKey: string; workerId: string; leaseUntil: string }
export class LeaseService { private leases = new Map<string, LeaseRecord>()
 acquireLease(leaseKey: string, workerId: string, leaseMs: number){ const cur=this.leases.get(leaseKey); if(cur && new Date(cur.leaseUntil)>new Date()) return null; const rec={leaseKey,workerId,leaseUntil:new Date(Date.now()+leaseMs).toISOString()}; this.leases.set(leaseKey,rec); return rec }
 renewLease(leaseKey: string, workerId: string, leaseMs: number){ const cur=this.leases.get(leaseKey); if(!cur||cur.workerId!==workerId) return null; cur.leaseUntil=new Date(Date.now()+leaseMs).toISOString(); return cur }
 releaseLease(leaseKey: string, workerId: string){ const cur=this.leases.get(leaseKey); if(cur?.workerId===workerId) this.leases.delete(leaseKey) }
 recoverExpiredLease(now = new Date()){ return [...this.leases.values()].filter(l=>new Date(l.leaseUntil)<=now).map(l=>l.leaseKey) }
}
