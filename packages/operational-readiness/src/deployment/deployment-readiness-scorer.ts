export class DeploymentReadinessScorer { score(infra:number,payments:number,aiGov:number){ return Number(((infra+payments+aiGov)/3).toFixed(3)) } }
