export class CommunityService { create(tenantId:string,name:string){ return { tenantId, name, created:true }; } }
export class BroadcastChannel { publish(channelId:string, message:string){ return { channelId, message, delivered:true }; } }
export class InboxAssistant { suggestReply(message:string){ return `Suggested reply: ${message.slice(0,32)}`; } }
export class EngagementScorer { score(replies:number, views:number){ return views? replies/views : 0; } }
