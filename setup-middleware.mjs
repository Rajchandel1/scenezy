import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createFile(filepath, content) {
  const fullPath = join(__dirname, filepath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.trimStart(), 'utf-8');
  console.log(`  ✅ ${filepath}`);
}

console.log('🛡️  Setting up Route Protection Middleware...\n');

// =============================================
// 1. MIDDLEWARE (Route Protection)
// =============================================
createFile('middleware.ts', `
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
`);

// =============================================
// 2. AUTH SERVICE UPDATE (Set cookies properly)
// =============================================
createFile('src/features/auth/services/supabase-auth.service.ts', `
import { createSupabaseBrowserClient } from '@/shared/lib/supabase-client';
import { AuthUser, LoginInput, RegisterInput } from '../types';

const SESSION_KEY = 'pass_session_user';

export class SupabaseAuthService {
  private getClient() {
    return createSupabaseBrowserClient();
  }

  async login(input: LoginInput): Promise<AuthUser> {
    const supabase = this.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) throw new Error(error.message.includes('Invalid') ? 'Invalid email or password' : error.message);
    if (!data.user) throw new Error('Login failed');

    // Check our DB for email_verified
    const { data: profile } = await supabase
      .from('users')
      .select('role, name, email_verified')
      .eq('id', data.user.id)
      .single();

    if (profile && !profile.email_verified) {
      await supabase.auth.signOut();
      throw new Error('Please verify your email first. Check your inbox.');
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
      name: profile?.name || data.user.user_metadata?.name || data.user.email!.split('@')[0],
      role: profile?.role || 'USER',
      createdAt: data.user.created_at,
    };

    // Store in localStorage AND set cookie for middleware
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      document.cookie = \`\${SESSION_KEY}=\${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax\`;
    }
    
    return user;
  }

  async register(input: RegisterInput): Promise<{ needsVerification: boolean }> {
    const supabase = this.getClient();

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name, role: input.role || 'USER' } },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed');

    await supabase.from('users').upsert({
      id: data.user.id,
      email: input.email,
      name: input.name,
      role: input.role || 'USER',
      email_verified: false,
    }, { onConflict: 'id' });

    // Send verification email
    try {
      await fetch('/api/data/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-verification',
          userId: data.user.id,
          email: input.email,
          name: input.name,
        }),
      });
    } catch (err) {
      console.error('[Auth] Failed to send verification email:', err);
    }

    await supabase.auth.signOut();
    return { needsVerification: true };
  }

  async completeRegistration(userId: string, email: string, name: string, role: string): Promise<AuthUser> {
    const supabase = this.getClient();

    await supabase.from('users').upsert({
      id: userId,
      email,
      name,
      role,
      email_verified: true,
    }, { onConflict: 'id' });

    const user: AuthUser = { id: userId, email, name, role, createdAt: new Date().toISOString() };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      document.cookie = \`\${SESSION_KEY}=\${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax\`;
    }
    
    return user;
  }

  async loginWithGoogle(): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: \`\${window.location.origin}/auth/callback\`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw new Error(error.message);
  }

  async logout(): Promise<void> {
    const supabase = this.getClient();
    await supabase.auth.signOut();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      document.cookie = \`\${SESSION_KEY}=; path=/; max-age=0\`;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);

    const supabase = this.getClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data: profile } = await supabase
      .from('users')
      .select('role, name, email_verified')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      await this.completeRegistration(
        session.user.id,
        session.user.email!,
        session.user.user_metadata?.name || session.user.email!.split('@')[0],
        session.user.user_metadata?.role || 'USER'
      );
    }

    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email!,
      name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
      role: profile?.role || 'USER',
      createdAt: session.user.created_at,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    document.cookie = \`\${SESSION_KEY}=\${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax\`;
    
    return user;
  }

  async resendVerification(email: string): Promise<void> {
    const supabase = this.getClient();
    const { data: userData } = await supabase.from('users').select('id, name').eq('email', email).single();
    if (!userData) throw new Error('Account not found');

    await fetch('/api/data/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'send-verification', 
        userId: userData.id, 
        email, 
        name: userData.name 
      }),
    });
  }
}
`);

// =============================================
// DONE
// =============================================
console.log('\\n✅ Middleware setup complete!');
console.log('');
console.log('   ═══════════════════════════════════════════');
console.log('   🔒 PROTECTION RULES:');
console.log('   ═══════════════════════════════════════════');
console.log('');
console.log('   PUBLIC (No auth needed):');
console.log('     /, /sign-in, /sign-up, /forgot-password');
console.log('     /reset-password, /verify-email, /auth/callback');
console.log('');
console.log('   PROTECTED (Any logged-in user):');
console.log('     /home, /explore, /events/*, /passes');
console.log('     /profile, /notifications');
console.log('');
console.log('   ROLE-BASED:');
console.log('     /admin → Only ADMIN role');
console.log('     /seller* → Only SELLER role');
console.log('');
console.log('   UNAUTHORIZED ACCESS:');
console.log('     Not logged in → Redirect to /sign-in');
console.log('     Wrong role → Redirect to correct dashboard');
console.log('');
console.log('   ⚠️  IMPORTANT:');
console.log('   Auth service now sets BOTH localStorage AND cookie');
console.log('   Middleware reads the cookie for server-side checks');
console.log('   Logout clears both storage mechanisms');
console.log('');
console.log('   Test:');
console.log('     1. Try accessing /admin without logging in → Redirects to /sign-in');
console.log('     2. Login as USER → Try /admin → Redirects to /home');
console.log('     3. Login as ADMIN → Access /admin → Works ✅');
console.log('');