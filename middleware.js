import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/api/v1/webhooks/meta', '/api/v1/auth', '/api/v1/setup', '/invite'];

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check if route is publicly accessible
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for sessionToken cookie
  const sessionToken = request.cookies.get('sessionToken')?.value;

  if (!sessionToken) {
    // Redirect to login
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Validate session exists in KV and is not expired
  try {
    const key = `session:${sessionToken}`;
    const session = await kv.get(key);

    if (!session) {
      // Session not found or expired
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Check if session is expired (session object has expiresAt timestamp)
    const now = Date.now();
    const expiresAt = typeof session === 'object' ? session.expiresAt : null;

    if (expiresAt && now > expiresAt) {
      // Session expired
      await kv.del(key);
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (error) {
    // If there's any error validating, redirect to login for safety
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
import { NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/api/v1/webhooks/meta', '/api/v1/auth', '/invite'];

export function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check if route is publicly accessible
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for sessionToken cookie
  const sessionToken = request.cookies.get('sessionToken')?.value;

  if (!sessionToken) {
    // Redirect to login
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
