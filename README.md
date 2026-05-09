<<<<<<< HEAD
# Lummy — Next.js Web App

Production-grade Next.js 14 landing page for **Lummy** — The Creator Commerce OS for Africa.

## Quick Start

```bash
npm install        # or: pnpm install
npm run dev        # http://localhost:3000
```
=======
# Lummy
Turn Followers Into Customers
# 🟣 Lummy — The Creator Commerce OS for Africa

> **"Turn Followers Into Customers."**  
> Post. Chat. Get Paid.

---

## What is Lummy?

Lummy is a **mobile-first creator monetization operating system** built for African social commerce behavior. It helps creators, social sellers, and micro-businesses turn social media traffic into paying customers through:

- 🛍️ Beautiful creator storefronts
- 💬 WhatsApp commerce engine
- 📊 Lightweight CRM
- 🤖 AI-powered growth tools
- 💳 Local payment infrastructure (Paystack, Flutterwave)
- 📱 Social selling engine

---

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

---
>>>>>>> 5303821880de0e1c55398a3d8d28f745b05fe2ca

## Project Structure

```
<<<<<<< HEAD
lummy-web/
├── app/
│   ├── layout.tsx          # Root layout — metadata, fonts, dark mode
│   ├── page.tsx            # Home page (composes all sections)
│   └── globals.css         # Design tokens, Tailwind base, custom utilities
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx      # [client] scroll-aware, mobile hamburger
│   │   └── Footer.tsx      # [server] static footer
│   │
│   ├── ui/                 # Primitive design-system atoms
│   │   ├── Badge.tsx       # Pill badge with optional dot
│   │   ├── Button.tsx      # primary / ghost / outline / nav variants
│   │   ├── IconBubble.tsx  # Square icon container
│   │   ├── Logo.tsx        # Lummy wordmark + logomark
│   │   └── index.ts        # Barrel export
│   │
│   ├── phone/
│   │   ├── PhoneMockup.tsx  # [client] Framer Motion entrance animation
│   │   └── FloatingCard.tsx # [client] Framer Motion floating cards
│   │
│   ├── cards/
│   │   ├── FeatureCard.tsx      # Feature grid card
│   │   ├── StepCard.tsx         # How-it-works step
│   │   ├── TestimonialCard.tsx  # Review card with stars
│   │   └── GalleryCard.tsx      # Image gallery card
│   │
│   └── sections/
│       ├── HeroSection.tsx   # [server] Hero — phone mockup + copy
│       ├── FeaturesStrip.tsx # [server] 6-col features on white
│       ├── HowItWorks.tsx    # [server] 3-col flow diagram
│       ├── GallerySection.tsx # [server] Creator gallery grid
│       └── CtaSection.tsx    # [client] Email signup form
│
├── hooks/
│   ├── use-scroll.ts        # Scroll position for navbar
│   └── use-intersection.ts  # IntersectionObserver for scroll animations
│
├── lib/
│   ├── cn.ts                # clsx + tailwind-merge utility
│   ├── data.ts              # All site content — single source of truth
│   └── types.ts             # TypeScript interfaces
│
├── tailwind.config.ts       # Extended design tokens
├── next.config.ts
└── tsconfig.json
```

## Architecture Decisions

### Server vs Client Components

| Component | Boundary | Reason |
|-----------|----------|--------|
| `Navbar` | `"use client"` | scroll state, mobile toggle |
| `PhoneMockup` | `"use client"` | Framer Motion animations |
| `FloatingCard` | `"use client"` | Framer Motion animations |
| `CtaSection` | `"use client"` | form state |
| All other sections | Server | static content, no interactivity |

This minimises the client bundle — only the interactive leaves ship JS.

### Data Layer

All page content lives in `lib/data.ts` as typed constants. To update copy, images, or pricing — change that file only. Components are purely presentational.

### Design Tokens

All colours, fonts, and shadows are defined as Tailwind extensions in `tailwind.config.ts` and mirrored as CSS variables in `globals.css`. Never use raw hex values in components.

## Environment Variables

```bash
# .env.local (create from this template)
NEXT_PUBLIC_APP_URL=http://localhost:3000
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

Deploy to Vercel in one command:

```bash
npx vercel --prod
```

Set `NEXT_PUBLIC_APP_URL` in your Vercel project settings.
=======
lummy/
├── apps/
│   └── web/                    # Next.js web application
│       └── src/
│           ├── app/            # App Router pages
│           │   ├── (auth)/     # Auth pages
│           │   ├── (dashboard)/# Creator dashboard
│           │   ├── (admin)/    # Admin panel
│           │   └── [handle]/   # Public storefronts
│           ├── components/     # Shared UI components
│           └── lib/            # Utilities, hooks, API clients
├── packages/
│   ├── ui/                     # Shared design system
│   ├── db/                     # Schema + migrations
│   ├── api/                    # API types + client
│   └── config/                 # Shared config (eslint, ts, tailwind)
├── supabase/
│   ├── migrations/             # SQL migration files
│   └── functions/              # Edge functions
├── docs/
│   ├── PRD.md                  # Full Product Requirements Document
│   ├── API.md                  # API documentation
│   └── ARCHITECTURE.md         # System architecture
├── landing/
│   └── index.html              # Standalone landing page
├── .env.example
├── package.json
├── turbo.json
├── CLAUDE.md
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase CLI
- A Supabase project

### 1. Clone & Install

```bash
git clone https://github.com/your-org/lummy.git
cd lummy
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in your environment variables (see `.env.example` for required fields).

### 3. Database Setup

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Seed sample data (development only)
supabase db reset --db-url YOUR_DB_URL
```

### 4. Start Development

```bash
# Start the Next.js app
pnpm dev

# Or use turbo for all packages
pnpm turbo dev
```

App runs at: `http://localhost:3000`

---

## Key Features

### 🏪 Creator Storefront
Public-facing storefront at `lummy.co/[handle]` with products, services, digital offers, WhatsApp CTA, and testimonials.

### 💬 WhatsApp Commerce Engine
Auto-generates pre-filled WhatsApp order messages. Tracks clicks, conversations, and conversions per campaign.

### 🤖 AI Growth Assistant
Powered by Claude. Generates captions, CTAs, pricing suggestions, WhatsApp reply templates, and campaign ideas.

### 📊 Analytics Dashboard
Real-time tracking of clicks, conversions, sales, top products, and campaign performance.

### 👥 CRM Module
Lead management, customer history, smart segmentation, follow-up reminders.

### 💳 Payments
Paystack and Flutterwave integration. Supports one-time, deposits, and installment-ready payment flows.

---

## Creator Onboarding Flow

1. **Creator Type** — Product Seller / Service Creator / Digital Seller / Influencer / Coach
2. **Business Setup** — Name, handle, WhatsApp, niche, platform
3. **AI Setup** — AI interviews creator to build profile
4. **Auto-generate** — Storefront, starter theme, recommended campaign

---

## Deployment

### Vercel (Web App)

```bash
vercel --prod
```

Set all environment variables in Vercel dashboard.

### Supabase Edge Functions

```bash
supabase functions deploy --all
```

### Environment Variables

See `.env.example` for the full list. Critical variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PAYSTACK_SECRET_KEY
ANTHROPIC_API_KEY
```

---

## Creator Roles

| Role | Description |
|---|---|
| `creator` | Owns storefront, products, campaigns |
| `customer` | Browses and purchases from storefronts |
| `admin` | Internal Lummy team management |

---

## API Overview

Base URL: `https://api.lummy.co/v1`

All endpoints require `Authorization: Bearer <token>` except public storefront endpoints.

See `docs/API.md` for full endpoint documentation.

---

## Design System

Colors:
- **Primary**: `#6C4EF3` (Electric Purple)
- **Secondary**: `#4F46E5` (Neon Indigo)
- **Accent**: `#10B981` (Emerald) / `#F97316` (Coral)
- **Dark**: `#080815` (Midnight)
- **Light**: `#FAFAFA` (Soft White)

Fonts: Clash Display (headings) + DM Sans (body)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Commit with conventional commits (`git commit -m "feat: add WhatsApp CTA generator"`)
4. Push and open a Pull Request

---

## License

MIT © 2025 Lummy Technologies Ltd.

---

## Links

- 🌐 Website: [lummy.co](https://lummy.co)
- 📖 Docs: [docs.lummy.co](https://docs.lummy.co)
- 🐦 Twitter: [@lummyhq](https://twitter.com/lummyhq)
- 💬 WhatsApp Community: [Join](https://wa.me/lummy)
>>>>>>> 5303821880de0e1c55398a3d8d28f745b05fe2ca
