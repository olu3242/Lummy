export class MarketplaceTelemetryService { recordInstall(skillId: string) { return { metric: "skill_install_rate", skillId } } }
