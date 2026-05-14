export class MigrationGovernanceService { validateApplied(expected: number, applied: number) { if (applied < expected) throw new Error("missing migrations") } }
