export class DistributedSafetyCoordinator { coordinate(tenantIsolated:boolean,timeoutMs:number){ return {tenantIsolated,replayable:true,timeoutGoverned:timeoutMs>0} } }
