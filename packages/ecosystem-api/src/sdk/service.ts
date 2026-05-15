export class SDKService { manifest(version: string) { return { version, generatedAt: new Date().toISOString() } } }
