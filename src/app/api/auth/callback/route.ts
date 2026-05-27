import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Supabase PKCE auth code exchange — called after email confirmation / OAuth
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = createClient()
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("[auth/callback]", error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Ensure profiles row exists — may not yet if this is first sign-in after email confirmation
  const user = sessionData?.user
  if (user) {
    try {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name ?? null,
      }, { onConflict: "id", ignoreDuplicates: true })
    } catch { /* non-critical, profile may already exist */ }
  }

  // Ensure next is a relative path to prevent open redirect
  let safeNext = next.startsWith("/") ? next : "/dashboard"
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, organization_id")
      .eq("id", user.id)
      .maybeSingle()
    if (!profile?.onboarding_completed || !profile.organization_id) safeNext = "/onboarding"
  }
  return NextResponse.redirect(`${origin}${safeNext}`)
}
