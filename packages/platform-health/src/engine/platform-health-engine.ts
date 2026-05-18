export class PlatformHealthEngine { score(buildSuccess:number,runtimeHealth:number,governance:number){ return Number(((buildSuccess+runtimeHealth+governance)/3).toFixed(3)) } }
