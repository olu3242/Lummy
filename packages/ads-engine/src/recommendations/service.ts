export class SponsorAnalyticsService { ctr(impressions: number, clicks: number) { return impressions ? clicks / impressions : 0 } }
