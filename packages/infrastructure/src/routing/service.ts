import type { RegionCode } from '../regions/service';
export type RoutingRequest = { tenantId: string; preferredRegion?: RegionCode; latenciesMs: Partial<Record<RegionCode, number>> };
export const routeTenant = (r: RoutingRequest): RegionCode => r.preferredRegion ?? (Object.entries(r.latenciesMs).sort((a,b)=>(a[1]??999)-(b[1]??999))[0]?.[0] as RegionCode ?? 'us-east');
