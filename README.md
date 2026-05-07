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

## Project Structure

```
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
