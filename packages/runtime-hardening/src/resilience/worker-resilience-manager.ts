export class WorkerResilienceManager { status(failures:number){ return {failures,fallbackEnabled:true,healthy:failures<3} } }
