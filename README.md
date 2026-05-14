# 🟣 Lummy — The Creator Commerce OS for Africa

> **"Turn Followers Into Customers."**  
> Post. Chat. Get Paid.

Production-grade Next.js 14 application for creator commerce in Africa.

## Quick Start

```bash
npm install        # or: pnpm install
npm run dev        # http://localhost:3000
```

## What is Lummy?

Lummy is a **mobile-first creator monetization operating system** built for African social commerce behavior. It helps creators, social sellers, and micro-businesses turn social media traffic into paying customers through:

- 🛍️ Beautiful creator storefronts
- 💬 WhatsApp commerce engine
- 📊 Lightweight CRM
- 🤖 AI-powered growth tools
- 💳 Local payment infrastructure (Paystack, Flutterwave)
- 📱 Social selling engine

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | TailwindCSS + shadcn/ui |
| Animation | Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Payments | Paystack (primary), Flutterwave (secondary) |
| AI | Anthropic Claude (via API) |
| Deployment | Vercel (web) + Supabase Cloud |

## Project Structure

```text
lummy-web/
├── src/
│   ├── app/                  # App Router pages
│   │   ├── (auth)/           # Auth pages
│   │   ├── (dashboard)/      # Creator dashboard
│   │   └── [handle]/         # Public storefronts
│   ├── components/           # Shared UI components
│   ├── data/                 # Mock and seed-friendly data
│   ├── hooks/                # Reusable hooks
│   ├── lib/                  # Utilities
│   └── store/                # Storefront schema + editor
├── supabase/                 # Migrations and server resources
├── docs/                     # Product and architecture docs
└── README.md
```

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Serve production build
npm run lint         # ESLint
npm run typecheck    # TypeScript check (no emit)
```

## Deployment

Deploy to Vercel:

```bash
npx vercel --prod
```

Set `NEXT_PUBLIC_APP_URL` in your Vercel project settings.
