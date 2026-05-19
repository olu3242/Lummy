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
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("[auth/callback]", error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Ensure next is a relative path to prevent open redirect
  const safeNext = next.startsWith("/") ? next : "/dashboard"
  return NextResponse.redirect(`${origin}${safeNext}`)
}
