export type ReferralEdge={from:string;to:string;campaignId:string};
export class ReferralGraph { add(edges:ReferralEdge[], edge:ReferralEdge){ return [...edges, edge]; } }
export class AffiliateAttribution { attribute(clicks:number, conversions:number){ return { clicks, conversions, rate: conversions/(clicks||1) }; } }
export class LeaderboardService { rank(rows:{id:string;score:number}[]){ return [...rows].sort((a,b)=>b.score-a.score); } }
