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
