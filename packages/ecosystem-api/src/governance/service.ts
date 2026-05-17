export class PartnerGovernanceService { enforce(approved: boolean) { if (!approved) throw new Error("partner app not approved") } }
