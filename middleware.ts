import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/',
  '/upcoming',
  '/previous',
  '/recordings',
  '/personal-room',
  '/calendar',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    protectedRoutes.some((route) => pathname === route) ||
    pathname.startsWith('/meeting');

  // The session cookie is set by the client after Firebase sign-in.
  // We use a simple cookie check here; full token verification happens server-side.
  const session = req.cookies.get('firebase-auth-token');

  if (isProtected && !session) {
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next (Next.js internals)
     * - api (API routes — handled by route handlers)
     * - sign-in / sign-up (public auth pages)
     * - static files (images, fonts, icons, etc.)
     */
    '/((?!_next|api|sign-in|sign-up|icons|images|[^?]*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf)).*)',
  ],
};
