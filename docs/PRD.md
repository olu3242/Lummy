# LUMMY — Product Requirements Document (PRD)

**Version**: 1.0  
**Status**: MVP  
**Last Updated**: May 2025  
**Author**: Lummy Product Team  

---

## 1. Product Overview

### Vision Statement

Lummy is the easiest way for African creators to turn social media attention into real revenue. We are building the operating system for creator commerce in Africa — a category-defining platform that sits at the intersection of social selling, WhatsApp commerce, and AI-powered growth tools.

### Problem Being Solved

**The Creator Monetization Gap in Africa**

African creators face a broken monetization workflow:

1. **Discovery is strong** — creators build massive audiences on TikTok, Instagram, and Facebook
2. **Conversion is broken** — no native tools exist for social → sale on African platforms
3. **WhatsApp is primary** — 90%+ of African commerce discussions happen via WhatsApp, but there are no tools to manage it
4. **Payment infrastructure is fragmented** — Paystack, Flutterwave, mobile money — no unified layer
5. **AI tools exist for Western creators** — nothing is built with African market behavior in mind

Lummy solves all five problems in one platform.

### Target Users (Personas)

#### Persona 1: The Skincare Creator (Primary)
- **Name**: Zainab, 26, Lagos
- **Platforms**: Instagram (42K followers), TikTok (89K)
- **Products**: Glow serums, skincare bundles, 1:1 skincare consultations
- **Pain**: DMs are unmanageable. She loses orders daily. No way to track who ordered what.
- **Goal**: Systematize selling without losing the personal creator feel

#### Persona 2: The Fashion Seller (Primary)
- **Name**: Daniel, 31, Accra
- **Platforms**: Facebook (120K), WhatsApp Broadcast lists (2K contacts)
- **Products**: Ready-to-wear clothing, custom tailoring bookings
- **Pain**: Handles all orders via WhatsApp manually. No payment tracking. Can't scale.
- **Goal**: Automate order taking and payment collection while selling on WhatsApp

#### Persona 3: The Digital Creator (Secondary)
- **Name**: Amara, 29, Nairobi
- **Platforms**: YouTube (55K), Twitter (22K)
- **Products**: Notion templates, e-books, online courses
- **Pain**: Uses Gumroad (no African payment support). Delivery is manual. No analytics.
- **Goal**: Sell digital products with zero friction and local payment options

#### Persona 4: The Coach / Tutor (Secondary)
- **Name**: Chidi, 35, Lagos
- **Platforms**: LinkedIn (8K), Instagram (15K)
- **Products**: Business coaching sessions, financial literacy courses
- **Pain**: Booking is done via DMs. Payments via bank transfer. No follow-up system.
- **Goal**: Professional storefront with booking + payment + CRM

### Success Metrics (KPIs)

#### Phase 1 KPIs (Months 1–3)
| Metric | Target |
|---|---|
| Creator signups | 1,000 |
| Storefronts published | 700 |
| WhatsApp clicks generated | 50,000 |
| Orders processed | 5,000 |
| GMV (Gross Merchandise Volume) | ₦50M (~$30K) |
| DAU / MAU ratio | >30% |

#### Phase 2 KPIs (Months 4–6)
| Metric | Target |
|---|---|
| Creator signups | 10,000 |
| GMV | ₦500M (~$300K) |
| AI generation usage rate | >60% of active creators |
| WhatsApp conversion rate | >15% click-to-conversation |
| NPS | >50 |

---

## 2. Core Features (MVP)

### P0 — Must Have at Launch

| Feature | Description | Est. Effort |
|---|---|---|
| Auth System | Email + Google auth, role-based (creator/customer/admin) | 3 days |
| Creator Onboarding | 4-step wizard with AI interview | 5 days |
| Public Storefront | Creator page with products, services, WhatsApp CTA | 8 days |
| Product Management | Create, edit, publish physical/digital/service products | 5 days |
| WhatsApp CTA Engine | Pre-filled wa.me link generator with tracking | 3 days |
| Basic Analytics | Clicks, conversions, revenue — daily/weekly/monthly | 4 days |
| Paystack Integration | Checkout, webhooks, payment confirmation | 5 days |
| Mobile Responsive UI | Full mobile optimization across all screens | Ongoing |

### P1 — Required by Week 4

| Feature | Description | Est. Effort |
|---|---|---|
| AI Growth Assistant | Caption gen, CTA gen, WhatsApp reply gen | 5 days |
| Social Selling Posts | Sellable post system with CTA attachment | 4 days |
| CRM Module | Leads, customers, order history, tags | 5 days |
| Campaign Tracking | UTM-style campaign links with analytics | 3 days |
| Dark/Light Mode | System-aware theme switching | 2 days |
| Testimonials | Creator-managed social proof widget | 2 days |

### P2 — Post-MVP

| Feature | Description | Est. Effort |
|---|---|---|
| Flutterwave Integration | Secondary payment provider | 4 days |
| AI Pricing Suggestions | Market-aware pricing recommendations | 5 days |
| WhatsApp Business API | Automated order confirmations | 8 days |
| Installment Payments | Buy-now-pay-later architecture | 6 days |
| Admin Dashboard | Creator verification, fraud monitoring, payouts | 7 days |
| Affiliate System | Creator referral tracking | 6 days |

### User Stories by Role

#### Creator
- As a creator, I can create a storefront in under 5 minutes
- As a creator, I can add products with images, prices, and descriptions
- As a creator, I can generate a WhatsApp order link for any product
- As a creator, I can see which posts drive the most conversions
- As a creator, I can use AI to write captions and CTAs for my posts
- As a creator, I can manage my leads and customers in one place
- As a creator, I can accept payments via Paystack without leaving the platform

#### Customer
- As a customer, I can browse a creator's storefront on mobile
- As a customer, I can click "Order on WhatsApp" and be taken to a pre-filled chat
- As a customer, I can complete a purchase via Paystack checkout
- As a customer, I can receive an order confirmation

#### Admin
- As an admin, I can verify creator accounts
- As an admin, I can view platform GMV and active creators
- As an admin, I can manage featured creators on the homepage
- As an admin, I can monitor and flag suspicious transactions

---

## 3. Non-Functional Requirements

### Performance
- Storefront page load (LCP): < 2.5s on 3G mobile
- Time to Interactive: < 4s on mid-range Android device
- API response time (P95): < 500ms
- Image optimization: WebP with lazy loading, max 300KB per image
- Support concurrent users: 10,000 simultaneous storefront visitors at launch

### Availability
- Uptime SLA: 99.5% (hosted on Vercel + Supabase Cloud)
- Planned maintenance window: Sundays 02:00–04:00 WAT
- Incident response time: < 30 minutes for P0 issues

### Security
- All data in transit: TLS 1.3
- All data at rest: AES-256 encryption (Supabase default)
- Payment data: Never stored locally — tokenized via Paystack
- Auth: JWT with 7-day refresh tokens, 1-hour access tokens
- RLS: Row-level security on all Supabase tables — zero data leakage between creators
- Rate limiting: 60 requests/minute per IP on public endpoints, 10/minute on AI endpoints
- OWASP Top 10 compliance required before launch

### Accessibility
- WCAG 2.1 Level AA for public storefronts
- All interactive elements keyboard navigable
- Screen reader compatible (ARIA labels)
- Minimum touch target: 48px × 48px on mobile

### Connectivity & Mobile
- Offline-graceful: Cache storefront data for offline viewing
- Low-bandwidth mode: Text-first option (no images) togglable
- Progressive images: Blur-up placeholders
- Android-first: Test on Samsung Galaxy A series (most common in Nigeria)

---

## 4. User Flows

### Onboarding Flow
```
Landing Page
  → Sign Up (email or Google)
  → Step 1: Creator Type
  → Step 2: Business Setup (name, handle, WhatsApp, niche, platform)
  → Step 3: AI Interview (what do you sell? who's your audience?)
  → Step 4: Auto-generate storefront
  → Dashboard (first-time welcome state)
```

### Storefront Purchase Flow (WhatsApp)
```
Customer visits lummy.co/[handle]
  → Browses products
  → Clicks "Order on WhatsApp"
  → wa.me link opens with pre-filled message
  → Click tracked in analytics
  → Creator receives WhatsApp message
  → Creator confirms order manually
  → Payment link sent via WhatsApp
```

### Storefront Purchase Flow (Direct Payment)
```
Customer visits lummy.co/[handle]
  → Clicks "Buy Now" on product
  → Checkout page (name, email, phone)
  → Paystack payment popup
  → Payment confirmed → webhook fires
  → Order created, creator notified
  → Customer receives confirmation
```

### AI Assistant Flow
```
Creator opens AI Assistant panel
  → Selects task (caption / CTA / reply / pricing)
  → Fills prompt inputs (product name, platform, tone)
  → AI generates options (2–3 variants)
  → Creator selects and copies / publishes
  → Generation logged for improvement
```

---

## 5. Out of Scope (MVP)

- Native mobile app (iOS / Android) — web only in MVP
- WhatsApp Business API integration (manual flow only in MVP)
- Multi-creator teams / agency accounts
- Subscription products (SaaS-style recurring billing)
- Product reviews from customers (phase 2)
- Multi-currency display (NGN only in MVP)
- Marketplace discovery (lummy.co/explore) — post-MVP
- SMS notifications (WhatsApp is primary channel)
- Escrow / buyer protection (post-MVP)
- Referral / affiliate system (post-MVP)

---

## 6. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│  Next.js Web App (Vercel)                                   │
│  ┌──────────────┐ ┌─────────────┐ ┌───────────────────┐   │
│  │ Public Store  │ │  Dashboard  │ │   Admin Panel     │   │
│  │ /[handle]    │ │  /dashboard │ │   /admin          │   │
│  └──────────────┘ └─────────────┘ └───────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────┐
│                   API LAYER (Supabase)                      │
│  ┌─────────────────┐  ┌──────────────────────────────────┐ │
│  │  PostgREST API  │  │      Edge Functions (Deno)       │ │
│  │  (auto-gen)     │  │  - payment-webhook               │ │
│  └────────┬────────┘  │  - whatsapp-track               │ │
│           │           │  - ai-generate                   │ │
│           │           │  - send-notification             │ │
│           │           └──────────────────────────────────┘ │
└───────────┬──────────────────────────────────────────────── ┘
            │
┌───────────▼───────────────────────────────────────────────── ┐
│              DATA LAYER (Supabase Postgres)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Core Tables │  │  CRM Tables  │  │ Analytics Tables │   │
│  │  users       │  │  leads       │  │ creator_metrics  │   │
│  │  products    │  │  customers   │  │ campaign_clicks  │   │
│  │  orders      │  │  notes       │  │ whatsapp_events  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                         [RLS Enabled on All Tables]          │
└────────────────────────────────────────────────────────────── ┘
            │                          │
┌───────────▼──────────┐   ┌───────────▼─────────────────────┐
│  EXTERNAL SERVICES   │   │      STORAGE (Supabase)         │
│  Paystack (payments) │   │  product-images/                │
│  Flutterwave (pay)   │   │  creator-banners/               │
│  Anthropic (AI)      │   │  digital-products/              │
│  WhatsApp wa.me      │   └─────────────────────────────────┘
└──────────────────────┘
```

---

## 7. Database Schema (Core Tables)

### Enums
```sql
CREATE TYPE creator_type AS ENUM ('product_seller','service_creator','digital_seller','influencer','coach');
CREATE TYPE product_type AS ENUM ('physical','digital','service');
CREATE TYPE order_status AS ENUM ('pending','confirmed','processing','completed','cancelled','refunded');
CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded','partial');
CREATE TYPE lead_status AS ENUM ('new','hot','warm','cold','converted','lost');
CREATE TYPE customer_status AS ENUM ('active','inactive','vip','blocked');
CREATE TYPE post_type AS ENUM ('product_launch','before_after','tutorial','promo','countdown','testimonial','affiliate');
CREATE TYPE user_role AS ENUM ('creator','customer','admin');
```

### Core Tables (Summary)
Full SQL in `supabase/migrations/001_initial_schema.sql`

| Table | Purpose |
|---|---|
| `users` | Auth-linked user profiles with role |
| `creator_profiles` | Storefront config, WhatsApp, theme, niche |
| `products` | Physical product listings |
| `services` | Service/booking offerings |
| `digital_products` | Downloadable digital offers |
| `orders` | Order lifecycle tracking |
| `transactions` | Payment records (provider-agnostic) |
| `leads` | CRM: potential customers |
| `customers` | CRM: confirmed buyers |
| `campaigns` | Tracking campaign links |
| `posts` | Sellable social posts |
| `post_ctas` | CTA attachments for posts |
| `testimonials` | Creator-managed social proof |
| `ai_generations` | Log of AI-generated content |
| `creator_metrics_daily` | Analytics rollup per creator per day |
| `whatsapp_events` | Click, open, conversion tracking |
| `notifications` | In-app notification queue |

---

## 8. API Endpoints (Summary)

Full documentation in `docs/API.md`

### Auth
- `POST /auth/signup` — Create account
- `POST /auth/signin` — Sign in
- `POST /auth/signout` — Sign out
- `POST /auth/forgot-password` — Send reset email
- `POST /auth/reset-password` — Reset with token

### Creator Profile
- `POST /creators` — Create profile (onboarding)
- `GET /creators/:handle` — Public storefront data
- `PATCH /creators/me` — Update profile
- `GET /creators/me/analytics` — Creator analytics summary

### Products
- `GET /products?creator_id=` — List products
- `POST /products` — Create product
- `PATCH /products/:id` — Update product
- `DELETE /products/:id` — Archive product
- `GET /products/:id/public` — Public product page

### Orders
- `POST /orders` — Create order
- `GET /orders?creator_id=` — List orders
- `PATCH /orders/:id/status` — Update status
- `GET /orders/:id` — Order detail

### Payments
- `POST /payments/initiate` — Start Paystack payment
- `POST /payments/verify` — Verify reference
- `POST /webhooks/paystack` — Paystack webhook handler
- `GET /payments/history` — Creator payment history

### WhatsApp
- `POST /whatsapp/generate-link` — Generate pre-filled wa.me link
- `POST /whatsapp/track-click` — Log click event
- `GET /whatsapp/analytics` — WhatsApp conversion stats

### AI
- `POST /ai/generate-caption` — Generate social caption
- `POST /ai/generate-cta` — Generate CTA text
- `POST /ai/generate-reply` — Generate WhatsApp reply
- `POST /ai/suggest-pricing` — AI pricing recommendation
- `POST /ai/build-campaign` — Campaign idea generator

### CRM
- `GET /leads` — List leads
- `POST /leads` — Create lead
- `PATCH /leads/:id` — Update lead/status
- `GET /customers` — List customers
- `GET /customers/:id/timeline` — Customer timeline

---

## 9. Monetization Model

| Revenue Stream | Mechanism | MVP |
|---|---|---|
| Free tier | 1 storefront, up to 5 products, basic analytics | Yes |
| Starter (₦3,500/mo) | Unlimited products, WhatsApp tracking, basic AI | Yes |
| Pro (₦9,500/mo) | Full AI suite, CRM, advanced analytics, campaigns | Yes |
| Business (₦25,000/mo) | Team accounts, API access, priority support | Phase 2 |
| Transaction fee | 1% of all orders processed through Lummy checkout | Phase 2 |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| WhatsApp TOS issues | Medium | High | Use official wa.me links only; no scraping |
| Paystack API changes | Low | High | Abstract behind payment service layer |
| Low creator activation | Medium | High | Frictionless onboarding + AI assistance |
| Spam / fake storefronts | Medium | Medium | Email verification + manual creator review |
| AI cost overrun | Medium | Medium | Rate limit AI endpoints; cache common outputs |
| Low-bandwidth failure | High | High | Offline mode, image compression, skeleton screens |

---

## 11. Launch Plan

### Week 1–2: Foundation
- Auth system
- Creator onboarding wizard
- Basic storefront (read-only)

### Week 3–4: Commerce Core
- Product management
- WhatsApp CTA engine
- Paystack payment integration
- Basic analytics

### Week 5–6: AI + Growth
- AI Growth Assistant (captions, CTAs, replies)
- Social selling posts
- Campaign tracking

### Week 7–8: Polish + Launch
- CRM module
- Dark/light mode
- Performance optimization
- Beta creator cohort (50 creators)
- Public launch

---

*This PRD is a living document. Update version number and changelog on each revision.*
