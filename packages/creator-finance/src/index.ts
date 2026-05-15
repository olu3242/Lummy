export type Currency = 'NGN'|'USD'|'GBP';
export type WalletBalance = { tenantId:string; currency:Currency; available:number; pending:number };
export class WalletService { private balances = new Map<string, WalletBalance>(); upsert(balance: WalletBalance){ this.balances.set(`${balance.tenantId}:${balance.currency}`, balance); return balance; } }
export class CommissionCalculator { compute(amount:number, rateBps:number){ return Math.round(amount*rateBps)/10000; } }
export class SettlementCoordinator { reconcile(entries:{credit:number;debit:number}[]){ return entries.reduce((a,e)=>a+e.credit-e.debit,0); } }
export class PayoutEngine { schedule(tenantId:string, amount:number, currency:Currency){ return {tenantId, amount, currency, status:'scheduled' as const}; } }
