export class RuntimeDiagnosticsAggregator { aggregate(queueLag:number,workerFailures:number){ return {queueLag,workerFailures,healthy:queueLag<100&&workerFailures<5} } }
