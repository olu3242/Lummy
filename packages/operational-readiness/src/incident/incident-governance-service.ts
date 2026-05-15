export class IncidentGovernanceService { escalate(severity:number){ return {severity,model:severity>7?"sev1":"sev2",slaCompliant:severity<9} } }
