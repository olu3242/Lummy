export class OperationalReadinessEngine { assess(sla:number,audit:number,deployment:number){ return Number(((sla+audit+deployment)/3).toFixed(3)) } }
