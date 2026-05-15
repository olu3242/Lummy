export class VersioningService { resolve(version: string) { if (!["v1","v2"].includes(version)) throw new Error("unsupported api version"); return version } }
