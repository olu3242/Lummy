# CLAUDE.md — Lummy AI Context

This file gives Claude Code full context for working within the Lummy codebase.

---

## Project Summary

**Lummy** is a Creator Commerce OS for Africa. It helps creators, social sellers, and micro-businesses turn social media traffic into paying customers via:

- Mobile-first storefronts
- WhatsApp commerce engine
- Lightweight CRM
- AI-powered growth tools
- Local payment integrations (Paystack, Flutterwave)

**Target market**: African creators, primarily Nigeria (primary), Ghana, Kenya, South Africa.

---

## Tech Stack

| Concern | Stack |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styles | TailwindCSS + CSS Modules for complex animations |
| UI Components | shadcn/ui (customized) |
| Animation | Framer Motion |
| Backend | Supabase (Auth, Postgres, Storage, Realtime, Edge Functions) |
| State management | Zustand |
| Forms | React Hook Form + Zod |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Payments | Paystack (primary), Flutterwave (secondary) |
| Icons | Lucide React |
| Monorepo | Turborepo + pnpm workspaces |

---

## Repository Layout

```
lummy/
├── apps/web/           — Next.js web app
├── packages/ui/        — Shared design system components
├── packages/db/        — Database types and query helpers
├── packages/api/       — API route definitions and client
├── packages/config/    — Shared ESLint, TS, Tailwind config
├── supabase/           — Migrations and edge functions
└── docs/               — PRD, API docs, architecture
```

---

## Coding Standards

### TypeScript

- Use strict TypeScript (`"strict": true`)
- Prefer `type` over `interface` for simple shapes; use `interface` for classes
- Never use `any` — use `unknown` and narrow it
- Always type API responses with Zod schemas
- Export types from `types/index.ts` in each package

### React / Next.js

- Use Server Components by default; add `"use client"` only when needed
- Data fetching: use async Server Components + `fetch` with Next.js caching
- Never fetch data in Client Components directly — pass as props or use SWR
- Route groups: `(auth)`, `(dashboard)`, `(admin)`, `(public)`
- File naming: `kebab-case` for files, `PascalCase` for components

### Supabase Patterns

- Always use RLS. Never bypass with service role on client side
- Use typed Supabase client from `packages/db/src/client.ts`
- Auth: use `supabase.auth.getUser()` in server components, never `getSession()`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client

```typescript
// ✅ Correct — Server Component
import { createServerClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: products } = await supabase.from('products').select('*');
  return <ProductList products={products} />;
}

// ❌ Wrong — never do this
const { data } = await supabase.from('products').select('*').eq('creator_id', 'hardcoded');
```

### Styling

- Use Tailwind utility classes primarily
- Design tokens defined in `tailwind.config.ts` — always use them
- Color palette:
  - `primary`: `#6C4EF3` (Electric Purple)
  - `secondary`: `#4F46E5` (Indigo)
  - `accent-emerald`: `#10B981`
  - `accent-coral`: `#F97316`
  - `bg-dark`: `#080815`
- Never use raw hex colors inline — always reference CSS variables
- Mobile-first: default styles = mobile, use `md:` and `lg:` for larger screens

### Zod Validation

```typescript
// Always define schemas in /lib/validations/
import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  currency: z.enum(['NGN', 'GHS', 'KES', 'ZAR']),
  type: z.enum(['physical', 'digital', 'service']),
});

export type Product = z.infer<typeof ProductSchema>;
```

### Error Handling

- API routes: always return `{ data, error }` shape
- Use `Result<T>` pattern for service functions
- Log errors server-side, never expose raw errors to client
- Show user-friendly error messages via toast (using sonner)

---

## Key Workflows

### 1. Creator Onboarding

Route: `(auth)/onboarding` — 4-step wizard

Steps:
1. Creator type selection
2. Business setup (name, handle, WhatsApp, niche)
3. AI interview (powered by Claude API)
4. Auto-generate storefront + starter theme

State: Managed with Zustand `useOnboardingStore`

### 2. WhatsApp Commerce Flow

```
User clicks "Order on WhatsApp" on storefront
  → Generates pre-filled wa.me link with product name + price
  → Records click event in `whatsapp_clicks` table
  → Tracks via campaign_id if present
```

Edge function: `supabase/functions/track-whatsapp-click/index.ts`

### 3. AI Growth Assistant

Uses `@anthropic-ai/sdk` via a server action:

```typescript
// app/actions/ai.ts
'use server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateCaption(productName: string, platform: string) {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: `Generate a high-converting ${platform} caption for: ${productName}` }],
  });
  return (message.content[0] as { text: string }).text;
}
```

### 4. Payment Flow (Paystack)

```
Checkout page → initiate payment (server action)
  → Redirect to Paystack hosted page
  → Paystack webhook → Edge function verifies signature
  → Update order status → notify creator via Supabase Realtime
```

---

## Database

Supabase project with RLS enabled on all tables.

Key tables:
- `users` — auth.users linked profiles
- `creator_profiles` — storefront config, theme, WhatsApp
- `products` / `services` / `digital_products`
- `orders` / `transactions`
- `leads` / `customers` (CRM)
- `campaigns` / `posts` / `post_ctas`
- `ai_generations` — logged AI outputs
- `creator_metrics_daily` — analytics rollup

See `supabase/migrations/` for full schema.

Generate types after schema changes:
```bash
pnpm db:generate
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Payments
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_PUBLIC_KEY=

# AI
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://lummy.co
NEXT_PUBLIC_APP_ENV=production

# WhatsApp
WHATSAPP_BUSINESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
```

---

## Common Pitfalls

1. **Don't use `cookies()` in Middleware** — use `NextRequest.cookies` directly
2. **Always await Supabase queries** — they return promises
3. **RLS applies to all queries** — test with different user contexts
4. **Framer Motion in Server Components** — always wrap in `"use client"`
5. **WhatsApp links** — use `https://wa.me/` not `whatsapp://` for cross-platform
6. **Currency** — Always store amounts in kobo/pesewas (smallest unit). Display with division by 100.
7. **Phone numbers** — Store in E.164 format (`+234XXXXXXXXXX`)

---

## Testing

```bash
# Unit tests
pnpm test

# E2E (Playwright)
pnpm test:e2e

# Type checking
pnpm typecheck
```

Critical paths to test:
- Auth flows (sign up, sign in, onboarding)
- Product creation and storefront display
- WhatsApp CTA generation
- Payment initiation and webhook handling
- AI generation endpoints

---

## Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase migrations applied (`supabase db push`)
- [ ] Edge functions deployed (`supabase functions deploy --all`)
- [ ] RLS policies verified with test users
- [ ] Paystack webhook URL configured
- [ ] Domain configured in Supabase Auth settings
- [ ] Rate limiting enabled on AI endpoints
- [ ] Error monitoring (Sentry) configured

---

## Contact

Engineering questions: eng@lummy.co  
Product questions: product@lummy.co
