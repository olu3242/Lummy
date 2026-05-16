export class DependencyCheckService { assertNoDrift(lockHash: string, expectedHash: string) { if (lockHash !== expectedHash) throw new Error("dependency drift detected") } }
