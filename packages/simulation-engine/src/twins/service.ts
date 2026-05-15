export type TwinType = 'tenant'|'creator'|'workflow'|'ai-runtime'|'commerce'|'marketplace'|'infrastructure';
export type DigitalTwinSnapshot = { twinId: string; type: TwinType; sourceVersion: string; capturedAt: string; replaySafe: boolean };
