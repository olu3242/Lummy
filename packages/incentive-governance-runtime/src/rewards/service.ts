export class IncentiveService { allocate(programId: string) { return { programId, queue: "incentives.allocate", transparent: true } } }
