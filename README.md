# 🌱 Par-Kids — Intelligent Family Growth Planner

> **Grow Together. Stay Connected.**

Par-Kids is a structured, guided family growth platform that helps parents and children connect intentionally through weekly check-ins — tracking emotional wellness, academic growth, goals, and everything that matters most in a child's development.

---

## 📦 Monorepo Structure

```
parkids/
├── apps/
│   ├── web/          # Next.js 14 web app (parent dashboard + marketing)
│   ├── mobile/       # React Native + Expo (parent & child apps)
│   └── backend/      # Supabase config, migrations, edge functions, seed data
├── packages/
│   ├── shared-types/ # TypeScript types shared across all apps
│   └── ui-tokens/    # Design system tokens (colors, spacing, typography)
├── .env.example      # Environment variable reference
├── turbo.json        # Turborepo configuration
└── package.json      # Root workspace config
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- Supabase CLI
- Expo CLI (for mobile)

### 1. Clone and install
```bash
git clone https://github.com/your-org/parkids.git
cd parkids
pnpm install
```

### 2. Set up environment
```bash
cp .env.example apps/web/.env.local
cp .env.example apps/mobile/.env.local
# Fill in your Supabase URL, anon key, and other values
```

### 3. Set up Supabase
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Seed the database
supabase db reset  # applies migrations + seed
```

### 4. Run development servers

**Web app:**
```bash
pnpm dev:web
# Opens at http://localhost:3000
```

**Mobile app:**
```bash
pnpm dev:mobile
# Scan QR with Expo Go app
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Mobile | React Native + Expo SDK 51 |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Auth | Supabase Auth (email, Google, Apple) |
| AI Features | OpenAI GPT-4o via Supabase Edge Functions |
| Email | Resend.com |
| Payments | Stripe |
| Analytics | PostHog |
| Monitoring | Sentry |
| Deployment | Vercel (web) + Expo EAS (mobile) |

---

## 📱 App Features

### Parent Experience
- 🏠 Family dashboard with child overview
- ✅ Guided weekly/bi-weekly check-in engine
- 📊 Growth analytics (mood, academic, social, goals)
- 🎯 Shared goal creation and tracking
- 📝 Monthly summary reports
- 👥 Co-parent collaboration and access controls
- 🔔 Smart reminders and scheduling
- 🌱 Bonding activity suggestions

### Child Experience  
- 😊 Age-appropriate guided check-in flow
- 🎯 My goals board with progress
- 💚 Mood tracker with emoji scale
- 🏆 Wins and achievements celebration
- 🔒 Private notes option

---

## 🗂️ Database

23 PostgreSQL tables with full Row Level Security. See:
- `apps/backend/supabase/migrations/001_initial_schema.sql`
- `apps/backend/supabase/seed/001_seed_data.sql`

---

## 🛡️ Privacy & Security

- COPPA-compliant child account management
- GDPR + CCPA ready
- Row Level Security on all tables
- No advertising or child data monetization
- End-to-end encryption for check-in data

---

## 📋 Documentation

| Document | Location |
|----------|----------|
| Product Requirements | `docs/ParKids_PRD.md` |
| Database Schema | `docs/ParKids_Database_Schema.md` |
| Technical Architecture | `docs/ParKids_Technical_Architecture.md` |
| Mobile App IA | `docs/ParKids_Mobile_App_IA.md` |
| Implementation Roadmap | `docs/ParKids_Implementation_Roadmap.md` |
| Design System | `docs/ParKids_Design_System.md` |

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes following the naming conventions
3. Run `pnpm type-check` and `pnpm lint` before committing
4. Open a PR to `develop`

---

## 📄 License

Private & Proprietary — Par-Kids Inc. © 2026

---

Built with ❤️ for families everywhere.
