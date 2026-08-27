import { NextResponse, type NextRequest } from 'next/server'

/**
 * Optimistic route protection in middleware.
 * Checks for session token cookie before allowing access to app routes.
 * Redirects unauthenticated visitors to `/sign-in`.
 */
export function middleware(req: NextRequest) {
  const hasCookie =
    req.cookies.get('better-auth.session_token') ??
    req.cookies.get('__Secure-better-auth.session_token') ??
    req.cookies.get('session_token')

  if (!hasCookie) {
    const signInUrl = new URL('/sign-in', req.url)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/live-chat/:path*', '/text-to-speech/:path*'],
}
