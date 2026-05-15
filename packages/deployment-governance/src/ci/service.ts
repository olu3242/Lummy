export class CIService { pipeline() { return ["typecheck", "lint", "check:deps", "validate:migrations", "rls:validate", "replay:test"] } }
