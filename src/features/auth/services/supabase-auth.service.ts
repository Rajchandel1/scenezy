import { createSupabaseBrowserClient } from '@/shared/lib/supabase-client';
import { AuthUser, LoginInput, RegisterInput, UserRole } from '../types';
import { clearClientCache } from '@/shared/lib/client-data-cache';

const SESSION_KEY = 'pass_session_user';

export class SupabaseAuthService {
  private currentUser: AuthUser | null = null;
  private currentUserExpiresAt = 0;
  private currentUserRequest: Promise<AuthUser | null> | null = null;

  private getClient() {
    return createSupabaseBrowserClient();
  }

  private profileRequestHeaders(accessToken?: string): HeadersInit {
    return {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
  }

  private clearCachedUser() {
    this.currentUser = null;
    this.currentUserExpiresAt = 0;
    this.currentUserRequest = null;
    clearClientCache();
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
    document.cookie = `${SESSION_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }

  private cacheUser(user: AuthUser) {
    this.currentUser = user;
    this.currentUserExpiresAt = Date.now() + 30_000;
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    document.cookie = `${SESSION_KEY}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
  }

  peekCurrentUser(): AuthUser | null {
    if (this.currentUser) return this.currentUser;
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) as AuthUser : null;
    } catch {
      this.clearCachedUser();
      return null;
    }
  }

  private async responseError(response: Response, fallback: string) {
    const result = await response.json().catch(() => null);
    return new Error(result?.error || fallback);
  }

  async login(input: LoginInput): Promise<AuthUser> {
    const supabase = this.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        throw new Error('Verify your email before signing in. You can resend the verification email from Create account.');
      }
      if (error.message.toLowerCase().includes('invalid')) {
        throw new Error("Email or password is incorrect, or this account doesn't exist. Create a new account to continue.");
      }
      throw new Error(error.message);
    }
    if (!data.user) throw new Error('Login failed');
    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut({ scope: 'local' });
      this.clearCachedUser();
      throw new Error('Verify your email before signing in.');
    }

    let profile: {role:UserRole;name:string}|null=null;
    const accessToken=data.session?.access_token;
    const profileResponse=await fetch('/api/data/profile',{cache:'no-store',headers:this.profileRequestHeaders(accessToken)});
    if(profileResponse.ok)profile=await profileResponse.json();
    else if(profileResponse.status!==404){
      if(profileResponse.status===401||profileResponse.status===403){
        await supabase.auth.signOut({scope:'local'});
        this.clearCachedUser();
        throw new Error("This account is no longer available. Create a new account to continue.");
      }
      throw await this.responseError(profileResponse,'We could not load your account. Please try again.');
    }
    if(!profile){
      const response=await fetch('/api/data/profile',{method:'POST',headers:{'Content-Type':'application/json',...this.profileRequestHeaders(accessToken)},body:JSON.stringify({name:data.user.user_metadata?.name||data.user.email!.split('@')[0]})});
      if(!response.ok)throw await this.responseError(response,"We couldn't set up this account. If it was deleted, create a new account or contact Scenezy support.");
      profile=await response.json();
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
      name: profile?.name || data.user.user_metadata?.name || data.user.email!.split('@')[0],
      role: profile?.role || 'USER',
      createdAt: data.user.created_at,
    };

    // Store in localStorage AND set cookie for middleware
    this.cacheUser(user);
    
    return user;
  }

  async register(input: RegisterInput): Promise<{ needsVerification: boolean }> {
    const supabase = this.getClient();

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { name: input.name, role: input.role || 'USER' },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed');
    if(!data.session)return {needsVerification:true};

    const profileResponse = await fetch('/api/data/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...this.profileRequestHeaders(data.session.access_token) }, body: JSON.stringify({ name: input.name }),
    });
    if(!profileResponse.ok)throw await this.responseError(profileResponse,'Account profile could not be created.');

    return { needsVerification: false };
  }

  async completeRegistration(userId: string, email: string, name: string, role: UserRole): Promise<AuthUser> {
    const { data: { session } } = await this.getClient().auth.getSession();
    const headers = this.profileRequestHeaders(session?.access_token);
    const profileResponse = await fetch('/api/data/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...this.profileRequestHeaders(session?.access_token) }, body: JSON.stringify({ name }),
    });
    let profile: { role: UserRole; name: string } | null = profileResponse.ok
      ? await profileResponse.json()
      : null;

    // The profile bootstrap is idempotent. If its response was interrupted or a
    // duplicate OAuth callback was rate-limited, verify the row before failing.
    if (!profile) {
      const existingResponse = await fetch('/api/data/profile', { cache: 'no-store', headers });
      if (existingResponse.ok) profile = await existingResponse.json();
    }
    if (!profile) throw new Error('Could not finish setting up your profile.');

    const user: AuthUser = {
      id: userId,
      email,
      name: profile.name || name,
      role: profile.role || role,
      createdAt: new Date().toISOString(),
    };
    
    this.cacheUser(user);
    
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
    
    this.clearCachedUser();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.currentUser && this.currentUserExpiresAt > Date.now()) return this.currentUser;
    if (this.currentUserRequest) return this.currentUserRequest;
    this.currentUserRequest = this.loadCurrentUser().finally(() => {
      this.currentUserRequest = null;
    });
    return this.currentUserRequest;
  }

  private async loadCurrentUser(): Promise<AuthUser | null> {
    if (typeof window === 'undefined') return null;
    
    const supabase = this.getClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      this.clearCachedUser();
      return null;
    }

    const storedValue = localStorage.getItem(SESSION_KEY);
    let stored: AuthUser | null = null;
    try {
      stored = storedValue ? JSON.parse(storedValue) as AuthUser : null;
    } catch {
      this.clearCachedUser();
    }

    const profileResponse=await fetch('/api/data/profile',{cache:'no-store',headers:this.profileRequestHeaders(session.access_token)});
    const profile: {role:UserRole;name:string}|null=profileResponse.ok?await profileResponse.json():null;

    if(profileResponse.status===401||profileResponse.status===403){
      await supabase.auth.signOut({scope:'local'});
      this.clearCachedUser();
      return null;
    }

    if (profileResponse.status===404) {
      return this.completeRegistration(
        session.user.id,
        session.user.email!,
        session.user.user_metadata?.name || session.user.email!.split('@')[0],
        (session.user.user_metadata?.role || 'USER') as UserRole
      );
    }

    // Keep an already validated UI session usable during a temporary API/DB
    // outage, but never use it for an authentication failure or another user.
    if(!profile&&stored?.id===session.user.id)return stored;
    if(!profile)return null;

    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email!,
      name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
      role: profile?.role || 'USER',
      createdAt: session.user.created_at,
    };

    this.cacheUser(user);
    
    return user;
  }

  async resendVerification(email: string): Promise<void> {
    const {error}=await this.getClient().auth.resend({type:'signup',email,options:{emailRedirectTo:`${window.location.origin}/auth/confirm`}});
    if(error)throw error;
  }
}
