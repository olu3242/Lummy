export const calculateRevenueShare = (gross: number, partnerSharePct: number) => ({ partner: gross * partnerSharePct, platform: gross * (1 - partnerSharePct) })
