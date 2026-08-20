import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * Next.js 16 proxy (middleware equivalent).
 *
 * Route protection:
 * - /dashboard* and /checkout* → redirect to /auth/login if logged out
 * - /auth/login and /auth/signup → redirect to / if logged in
 *
 * Uses cookie-only check for speed (no DB call per request).
 * Full session validation happens in page-level server components.
 */
export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  const isLoggedIn = !!sessionCookie

  const { pathname } = request.nextUrl

  // Protect dashboard and checkout routes
  if (
    !isLoggedIn &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/checkout"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  if (
    isLoggedIn &&
    (pathname.startsWith("/auth/login") || pathname.startsWith("/auth/signup"))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
