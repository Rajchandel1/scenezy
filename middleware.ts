import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require auth
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/callback',
  '/api/data/auth',
  '/api/data/forgot-password',
];

// Routes accessible by any authenticated user
const protectedRoutes = [
  '/home',
  '/explore',
  '/events/',
  '/passes',
  '/profile',
  '/notifications',
];

// Role-specific routes
const roleBasedRoutes: Record<string, string[]> = {
  ADMIN: ['/admin'],
  SELLER: ['/seller', '/seller/events', '/seller/analytics'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip API routes and static files
  if (pathname.startsWith('/api/') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check authentication via Supabase session cookie
  const supabaseSession = request.cookies.get('sb-access-token')?.value;
  const storedUser = request.cookies.get('pass_session_user')?.value;
  
  let isAuthenticated = false;
  let userRole: string | null = null;

  if (supabaseSession || storedUser) {
    isAuthenticated = true;
    try {
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userRole = userData.role;
      }
    } catch {}
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check role-based access
  for (const [role, routes] of Object.entries(roleBasedRoutes)) {
    if (routes.some(route => pathname.startsWith(route))) {
      if (userRole !== role) {
        // Redirect to appropriate dashboard based on role
        const redirectPath = userRole === 'ADMIN' ? '/admin' 
                           : userRole === 'SELLER' ? '/seller' 
                           : '/home';
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};
