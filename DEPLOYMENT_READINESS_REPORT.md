# Deployment Readiness Report

## Current Signals

- Supabase migrations are sequential through `036_storefront_fk_normalization.sql`.
- Runtime readiness endpoint checks public env, payment env, Supabase service role, DB access, and webhook table access.
- CI workflows exist for build, lint, typecheck, security, release, and reliability gates.
- Turborepo build/typecheck/lint tasks are defined.

## Gaps

- `.env.example` now includes `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`, both required by runtime readiness.
- Two Next config files exist: `next.config.mjs` and `next.config.ts`. This should be consolidated before production release.
- `validate:migrations` uses Unix shell commands and may not run on native Windows CI agents.
- Turbo cache warnings were observed on OneDrive-backed local filesystem; CI should use a non-synced workspace path.

## Recommendations

- Keep Stripe env keys present in `.env.example` and configured in hosted environments.
- Choose a single Next config file.
- Replace shell-specific migration validation with a Node script or Supabase CLI check.
- Keep final preflight as `pnpm install`, `pnpm dedupe`, `pnpm run typecheck`, `pnpm run lint`, and `pnpm run build`.
