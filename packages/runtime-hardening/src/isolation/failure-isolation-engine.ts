export class FailureIsolationEngine { isolate(service:string,severity:number){ return {service,severity,circuitBroken:severity>7} } }
