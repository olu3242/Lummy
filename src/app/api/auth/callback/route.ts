import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { ensureCreatorRuntimeContext } from "@/repositories/runtime-bootstrap-repository"

// Supabase PKCE auth code exchange — called after email confirmation / OAuth.
// IMPORTANT: Uses request-cookie-aware client that attaches session cookies
// directly to the redirect response, ensuring session persists post-redirect.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  // Collect cookies emitted by exchangeCodeForSession so we can attach them
  // to the redirect response. Using cookies() from next/headers + NextResponse.redirect()
  // in the same handler is unreliable — this pattern is guaranteed.
  type CookieTuple = { name: string; value: string; options: Record<string, unknown> }
  const pendingCookies: CookieTuple[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          pendingCookies.push(...cookiesToSet as CookieTuple[])
        },
      },
    },
  )

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message)
    const res = NextResponse.redirect(`${origin}/login?error=auth_failed`)
    pendingCookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]))
    return res
  }

  const user = sessionData?.user

  if (user) {
    // Email and OAuth converge here: profile, organization, membership, and
    // onboarding state are created before route selection.
    try {
      await ensureCreatorRuntimeContext(supabase, user)
    } catch (bootstrapErr) {
      console.error("[auth/callback] runtime bootstrap failed:", bootstrapErr)
    }
  }

  // Determine post-auth destination
  let safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, organization_id")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile?.onboarding_completed || !profile?.organization_id) {
      safeNext = "/onboarding"
    }
  }

  const response = NextResponse.redirect(`${origin}${safeNext}`)

  // Attach all session cookies to the redirect response
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  })

  return response
}
