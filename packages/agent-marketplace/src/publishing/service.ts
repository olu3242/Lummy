export class SkillPublishingService { publish(skillId: string) { return { skillId, queue: "marketplace.publish", state: "pending-review" as const } } }
