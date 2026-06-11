# AUTH FLOW TRACE

Scope: forensic audit only. No code, schema, auth, bucket, or deploy changes were made.

Canonical Supabase project observed from `.env.local`: `llbuddtdsdbljnsvzide`.

## Client Factories

| File | Function | Client creation method | Cookie/session behavior | Execution context |
|---|---|---|---|---|
| `src/lib/supabase/client.ts` | `createClient()` | `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)` | Browser Supabase client; session is held by Supabase SSR/browser storage/cookies. | Client components |
| `src/lib/supabase/server.ts` | `createClient()` | `createServerClient(..., { cookies: { getAll, setAll } })` from `next/headers` cookies | Reads request cookies. Attempts to set cookies, but catches when called from Server Components where cookie mutation is not allowed. | Server Actions, Route Handlers, Server Components |
| `src/lib/supabase/server.ts` | `createAdminClient` export | Re-export of `supabaseAdmin` | Service role path; bypasses user RLS when used. | Server-only admin routes/libs |
| `src/lib/supabase/middleware.ts` | `updateSession(request)` | `createServerClient(..., request.cookies)` | Refreshes Supabase session cookies and returns `{ response, user }`. | Middleware |

## Auth Entry Points

| File | Function | Supabase client used | Auth/session path | Notes |
|---|---|---|---|---|
| `src/app/(auth)/signup/page.tsx` | `handleSubmit` | Browser `createClient()` | Anonymous browser request calls `supabase.auth.signUp`. | Uses `emailRedirectTo: ${origin}/api/auth/callback?next=/onboarding`. If no session is returned, displays "Check your email". |
| `src/app/(auth)/signup/page.tsx` | `handleGoogleSignup` | Browser `createClient()` | Anonymous browser request starts OAuth. | Redirects to `/api/auth/callback`. |
| `src/app/(auth)/signup/page.tsx` | `onHandleChange` | Browser `createClient()` | Anonymous/public read against `storefronts`. | Checks handle availability before signup. |
| `src/app/(auth)/login/page.tsx` | `handleSubmit` | Browser `createClient()` | Browser signs in via `signInWithPassword`, then calls `/api/account/bootstrap`. | If bootstrap fails, login UI shows "We couldn't prepare your creator workspace." |
| `src/app/(auth)/login/page.tsx` | `handleGoogleLogin` | Browser `createClient()` | Anonymous browser request starts OAuth. | Redirects to `/api/auth/callback`. |
| `src/app/api/auth/callback/route.ts` | `GET` | Direct `createServerClient` from `@supabase/ssr` with request-cookie adapter | Exchanges PKCE `code` for session via `exchangeCodeForSession`; captures pending Set-Cookie values and attaches them to final redirect. | Auth context should be preserved after callback. Calls `ensureCreatorRuntimeContext(supabase, user)`. |
| `src/app/api/account/bootstrap/route.ts` | `POST` | Server `createClient()` | Reads authenticated user from request cookies via `auth.getUser()`. | Calls `ensureCreatorRuntimeContext(supabase, auth.user)`. |
| `src/middleware.ts` | `middleware` | `updateSession(request)` | Refreshes session cookies and protects `/dashboard`, `/onboarding`, `/ops`, `/developers`. | `/api/auth/*` is passthrough so callback is not intercepted. |
| `src/app/onboarding/page.tsx` | initial hydration effect | Browser `createClient()` | Browser reads `auth.getUser()`, then `profiles` and `onboarding_states`. | If unauthenticated, redirects to `/login?next=/onboarding`. |
| `src/app/(dashboard)/dashboard/page.tsx` | `DashboardPage` | Server `createClient()` | Server reads `auth.getUser()` from cookies. | Redirects unauthenticated users to `/login`; redirects incomplete profile/no profile to onboarding. |

## Auth Context Preservation Assessment

- Signup itself is anonymous until email confirmation.
- The auth callback explicitly exchanges the code and attaches cookies to the redirect response.
- Login creates a browser session first, then calls `/api/account/bootstrap` with browser cookies.
- The bootstrap and onboarding server actions use cookie-aware server clients.
- The observed synthetic runtime test had a valid user session and `auth.getUser()` returned the expected user immediately before attempting organization creation.

Conclusion: the repo-level auth flow is designed to preserve session context. The observed `organizations` insert failure is not explained by an obvious missing browser/server cookie handoff in the audited code paths.
