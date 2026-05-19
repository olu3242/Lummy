import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/ops", "/developers"]
const AUTH_ROUTES = ["/login", "/signup"]

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

  // Propagate or mint correlation ID
  const correlationId = request.headers.get("x-correlation-id") ?? genCorrelationId()

  const { response, user } = await updateSession(request)

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.some(p => pathname.startsWith(p))

  // Unauthenticated user hitting a protected route → redirect to login
  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Authenticated user hitting login/signup → redirect to dashboard
  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/dashboard"
    redirectUrl.searchParams.delete("next")
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
