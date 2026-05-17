export class RuntimeRecoveryEngine { recover(retries:number,dlqSize:number){ return {retryOrchestrated:retries>0,dlqHandled:dlqSize>=0,rollbackReady:true} } }
