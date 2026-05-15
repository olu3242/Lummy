export type RegionCode = 'us-east'|'us-west'|'eu'|'africa-west'|'africa-south'|'apac';
export type RegionTopology = { primary: RegionCode; secondary: RegionCode[]; mode: 'active-active'|'active-passive' };
