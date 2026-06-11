# Landing Page Validation
**Date:** 2026-05-25  
**Scope:** Landing page CTAs, conversion flows, and lead/signup persistence

---

## Summary Table

| CTA / Form | File | Destination | Status |
|---|---|---|---|
| Hero "Get Started Free" button | `src/components/sections/hero-section.tsx:316` | No href / no onClick | ❌ disconnected |
| Hero "Watch Demo" button | `src/components/sections/hero-section.tsx:320` | No href / no onClick | ❌ disconnected |
| Navbar "Get Started Free" | `src/components/layout/navbar.tsx:71` | `/signup` | ✅ wired |
| Navbar "Log in" | `src/components/layout/navbar.tsx:68` | `/login` | ✅ wired |
| Pricing page CTAs | `src/app/pricing/page.tsx:113,222,331` | `/signup` | ✅ wired |
| AI Assistant section CTA | `src/components/sections/ai-assistant-section.tsx:142` | `/signup` | ✅ wired |
| CTA section | `src/components/sections/cta-section.tsx:74` | `/signup` | ✅ wired |
| Signup form | `src/app/(auth)/signup/page.tsx:112` | Supabase Auth `signUp()` | ✅ persists to DB |
| Login form | `src/app/(auth)/login/page.tsx:34` | Supabase Auth `signInWithPassword()` | ✅ persists session |
| Signup → Onboarding redirect | `src/app/(auth)/signup/page.tsx:129` | `/onboarding` (immediate redirect) | ✅ wired |
| Email confirmation redirect | `src/app/(auth)/signup/page.tsx:120` | `{origin}/onboarding` | ✅ wired |

---

## Critical: Hero CTA Buttons Are Dead

**File:** `src/components/sections/hero-section.tsx:316-325`

```tsx
<Button size="xl" className="group">
  Get Started Free
  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
</Button>
<Button variant="outline-white" size="xl" className="group">
  ...Watch Demo...
</Button>
```

Neither button has an `href`, `asChild`, or `onClick` prop. Clicking "Get Started Free" on the hero — the highest-visibility CTA on the marketing homepage — does nothing. This is the primary acquisition funnel entry point.

The Navbar "Get Started Free" (`navbar.tsx:71`) correctly links to `/signup` and works.

---

## Signup Flow — Correctly Wired

**File:** `src/app/(auth)/signup/page.tsx`

1. Form collects: full name, email, password, store handle
2. Handle availability checked in real-time via Supabase query (`storefronts.handle`, line 102)
3. On submit (line 112): calls `supabase.auth.signUp()` with `full_name` and `handle` in user metadata
4. On success (line 129): `window.location.href = "/onboarding"` — immediate redirect
5. Supabase triggers onboarding flow at `/onboarding` which creates `profiles`, `organizations`, `storefronts` rows

**No waitlist / no lead capture** — users go directly to auth. There is no intermediate waitlist form.

---

## Login Flow — Correctly Wired

**File:** `src/app/(auth)/login/page.tsx`

- `signInWithPassword()` called on submit
- Open redirect prevented: `next` param validated to start with `/` and not `//` (line 42-43)
- Default redirect to `/dashboard`

---

## Pricing Page CTAs

**File:** `src/app/pricing/page.tsx`

All plan CTAs link to `/signup`:
- Line 113: header "Start free" button
- Line 222: Starter plan CTA
- Line 331: Growth plan CTA

Plan upgrade flow (billing) is not yet wired — the pricing page shows plans but there is no Stripe/Paystack subscription creation for paid tiers.

---

## Onboarding Flow

**File:** `src/app/onboarding/page.tsx`

Not fully audited but the dashboard page (`src/app/(dashboard)/dashboard/page.tsx:32`) confirms:
```typescript
if (!profile?.onboarding_completed || !profile.organization_id) {
  redirect('/onboarding')
}
```

Onboarding completion gate is enforced on every dashboard load.

---

## Action Items

1. **P0** — Add `href="/signup"` (or wrap with `<Link>`) to the Hero "Get Started Free" button in `src/components/sections/hero-section.tsx:316`
2. **P0** — Add `href="#demo"` or link to a demo video for the "Watch Demo" button, or remove it to avoid dead UX
3. **P1** — Wire pricing plan CTAs to a subscription initiation flow (Paystack recurring billing) for Growth/Pro plans
4. **P2** — Consider adding an email lead capture for "Watch Demo" to build a waitlist for users not ready to sign up
