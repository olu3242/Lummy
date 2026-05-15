export class RateLimitService { allow(used: number, limit: number) { return used < limit } }
