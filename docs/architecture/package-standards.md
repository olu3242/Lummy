# Package Standards

Every package must include: `package.json`, `tsconfig.json`, `src/`, and `src/index.ts`.

Rules:
- Public API only through `src/index.ts` exports.
- Composite TypeScript builds (`tsc -b`) with declaration output.
- No deep imports across packages (`packages/*/src/*` forbidden externally).
