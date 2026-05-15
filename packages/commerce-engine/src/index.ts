export type Channel = 'storefront'|'whatsapp'|'instagram'|'tiktok'|'affiliate'|'marketplace';
export class InventoryCoordinator { sync(stockBySku: Record<string, number>) { return stockBySku; } }
export class AttributionResolver { resolve(channel: Channel, sourceId: string) { return { channel, sourceId }; } }
export class CheckoutRouter { route(channel: Channel) { return { channel, strategy: channel === 'whatsapp' ? 'link' : 'native' }; } }
export class CommerceOrchestrator { orchestrate(orderId:string, channel:Channel){ return {orderId, channel, routed:true}; } }
