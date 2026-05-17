export type ReferralEdge = { from: string; to: string; campaignId: string };

export class ReferralGraph {
	add(edges: ReferralEdge[], edge: ReferralEdge) {
		if (process.env.NODE_ENV === 'production') {
			console.error('ReferralGraph.add called in production but not implemented')
			throw new Error('ReferralGraph.add is not implemented')
		}
		return [...edges, edge]
	}
}

export class AffiliateAttribution {
	attribute(clicks: number, conversions: number) {
		if (process.env.NODE_ENV === 'production') {
			console.error('AffiliateAttribution.attribute called in production but implementation is placeholder')
			throw new Error('Affiliate attribution not implemented')
		}
		return { clicks, conversions, rate: conversions / (clicks || 1) }
	}
}

export class LeaderboardService {
	rank(rows: { id: string; score: number }[]) {
		if (process.env.NODE_ENV === 'production') {
			console.warn('LeaderboardService.rank using in-memory sort in production')
		}
		return [...rows].sort((a, b) => b.score - a.score)
	}
}
