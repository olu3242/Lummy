# Lummy — Next.js Web App

Production-grade Next.js 14 landing page for **Lummy** — The Creator Commerce OS for Africa.

## Quick Start

```bash
npm install        # or: pnpm install
npm run dev        # http://localhost:3000
```

## Project Structure

```
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
