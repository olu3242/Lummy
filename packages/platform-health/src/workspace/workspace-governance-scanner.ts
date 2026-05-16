export class WorkspaceGovernanceScanner { scan(drift:number,boundaryViolations:number){ return {drift,boundaryViolations,governanceScore:Math.max(0,1-(drift+boundaryViolations)/100)} } }
