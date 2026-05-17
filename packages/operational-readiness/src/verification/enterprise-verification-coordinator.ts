export class EnterpriseVerificationCoordinator { verify(regional:boolean,runbook:boolean){ return {regional,runbook,productionReady:regional&&runbook} } }
