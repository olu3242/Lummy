export class PlacementService { place(slots: Array<{id:string;score:number}>) { return [...slots].sort((a,b)=>b.score-a.score) } }
