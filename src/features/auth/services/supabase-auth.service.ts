import { createSupabaseBrowserClient } from '@/shared/lib/supabase-client';
import { AuthUser, LoginInput, RegisterInput, UserRole } from '../types';

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

    // Check if user exists in our DB and is verified
    const { data: profile } = await supabase
      .from('users')
      .select('role, name, email_verified')
      .eq('id', data.user.id)
      .single();

    // If not verified yet, block login
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

    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
    return user;
  }

  async register(input: RegisterInput): Promise<{ needsVerification: boolean }> {
    const supabase = this.getClient();

    // Step 1: Create user in Supabase Auth (no email sent by Supabase)
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { name: input.name, role: input.role || 'USER' } },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed');

    // Step 2: Create profile in our users table (email_verified = false)
    await supabase.from('users').upsert({
      id: data.user.id,
      email: input.email,
      name: input.name,
      role: input.role || 'USER',
      email_verified: false,
    }, { onConflict: 'id' });

    // Step 3: Send verification email via OUR Nodemailer (not Supabase!)
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

    // Sign out - user must verify first
    await supabase.auth.signOut();

    return { needsVerification: true };
  }

  async completeRegistration(userId: string, email: string, name: string, role: UserRole): Promise<AuthUser> {
    const supabase = this.getClient();

    await supabase.from('users').upsert({
      id: userId,
      email,
      name,
      role,
      email_verified: true, // OAuth users are pre-verified
    }, { onConflict: 'id' });

    const user: AuthUser = { id: userId, email, name, role, createdAt: new Date().toISOString() };
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    }
    return user;
  }

  async loginWithGoogle(): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw new Error(error.message);
  }

  async logout(): Promise<void> {
    const supabase = this.getClient();
    await supabase.auth.signOut();
    if (typeof window !== 'undefined') localStorage.removeItem(SESSION_KEY);
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
      await this.completeRegistration(session.user.id, session.user.email!, session.user.user_metadata?.name || session.user.email!.split('@')[0], session.user.user_metadata?.role || 'USER');
    }

    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email!,
      name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
      role: (profile?.role as UserRole | undefined) || 'USER',
      createdAt: session.user.created_at,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  async resendVerification(email: string): Promise<void> {
    const supabase = this.getClient();
    const { data: userData } = await supabase.from('users').select('id, name').eq('email', email).single();
    if (!userData) throw new Error('Account not found');

    await fetch('/api/data/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send-verification', userId: userData.id, email, name: userData.name }),
    });
  }
}
