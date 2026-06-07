import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/ops", "/developers"]
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password"]
// Auth infrastructure routes — never redirect these, even if unauthenticated
const AUTH_PASSTHROUGH = ["/api/auth/", "/auth/"]

function genCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export async function middleware(request: NextRequest) {
  const start = Date.now()
  const { pathname } = request.nextUrl

  // Webhook routes bypass all middleware: no session management, no redirects,
  // no cookie mutation. Meta's verification requires a fast plain-text 200;
  // Supabase updateSession overhead risks timeout or response interference.
  if (pathname.startsWith("/api/webhooks/")) {
    return NextResponse.next()
  }

  // Auth infrastructure routes — never apply redirect logic here.
  // The PKCE callback exchanges codes and sets session cookies; intercepting
  // it would corrupt the OAuth flow and prevent session establishment.
  if (AUTH_PASSTHROUGH.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Propagate or mint correlation ID
  const correlationId = request.headers.get("x-correlation-id") ?? genCorrelationId()

  if (PUBLIC_ROUTES.includes(pathname)) {
    const response = NextResponse.next()
    response.headers.set("x-correlation-id", correlationId)
    response.headers.set("x-response-time", `${Date.now() - start}ms`)
    return response
  }

  const { response, user } = await updateSession(request)

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))

  // Unauthenticated user hitting a protected route → redirect to login
  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Attach observability headers to response
  response.headers.set("x-correlation-id", correlationId)
  response.headers.set("x-response-time", `${Date.now() - start}ms`)

  // Structured request log (server-side only)
  if (pathname.startsWith("/api/")) {
    console.log(JSON.stringify({
      level: "info",
      message: "api_request",
      method: request.method,
      pathname,
      correlationId,
      latencyMs: Date.now() - start,
      userId: user?.id ?? null,
    }))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
