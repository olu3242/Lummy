export class SkillReviewService { submitReview(skillId: string, rating: number) { return { skillId, rating, queue: "marketplace.review" } } }
