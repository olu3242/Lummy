export class DiscoveryService { explain(results: Array<{creatorId:string;score:number}>) { return results.map((r,i)=>({rank:i+1, creatorId:r.creatorId, reason:`score=${r.score}`})) } }
