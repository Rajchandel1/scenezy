import { createSupabaseBrowserClient } from '@/shared/lib/supabase-client';
import { AuthUser, LoginInput, RegisterInput, UserRole } from '../types';

const SESSION_KEY = 'pass_session_user';

export class SupabaseAuthService {
  private getClient() {
    return createSupabaseBrowserClient();
  }

  private profileRequestHeaders(accessToken?: string): HeadersInit {
    return {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };
  }

  async login(input: LoginInput): Promise<AuthUser> {
    const supabase = this.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) throw new Error(error.message.includes('Invalid') ? 'Invalid email or password' : error.message);
    if (!data.user) throw new Error('Login failed');

    let profile: {role:UserRole;name:string}|null=null;
    const accessToken=data.session?.access_token;
    const profileResponse=await fetch('/api/data/profile',{cache:'no-store',headers:this.profileRequestHeaders(accessToken)});
    if(profileResponse.ok)profile=await profileResponse.json();
    if(!profile){
      const response=await fetch('/api/data/profile',{method:'POST',headers:{'Content-Type':'application/json',...this.profileRequestHeaders(accessToken)},body:JSON.stringify({name:data.user.user_metadata?.name||data.user.email!.split('@')[0]})});
      if(!response.ok){const result=await response.json().catch(()=>null);throw new Error(result?.error||'Your account profile could not be restored.');}
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
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      document.cookie = `${SESSION_KEY}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
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
    if(!data.session)return {needsVerification:true};

    const profileResponse = await fetch('/api/data/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...this.profileRequestHeaders(data.session.access_token) }, body: JSON.stringify({ name: input.name }),
    });
    if(!profileResponse.ok){const result=await profileResponse.json().catch(()=>null);throw new Error(result?.error||'Account profile could not be created.');}

    return { needsVerification: false };
  }

  async completeRegistration(userId: string, email: string, name: string, role: UserRole): Promise<AuthUser> {
    const { data: { session } } = await this.getClient().auth.getSession();
    const profileResponse = await fetch('/api/data/profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...this.profileRequestHeaders(session?.access_token) }, body: JSON.stringify({ name }),
    });
    if (!profileResponse.ok) throw new Error('Could not finish setting up your profile.');

    const user: AuthUser = { id: userId, email, name, role, createdAt: new Date().toISOString() };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      document.cookie = `${SESSION_KEY}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
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
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      document.cookie = `${SESSION_KEY}=; path=/; max-age=0`;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) return JSON.parse(stored);

    const supabase = this.getClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const profileResponse=await fetch('/api/data/profile',{cache:'no-store',headers:this.profileRequestHeaders(session.access_token)});
    let profile: {role:UserRole;name:string}|null=profileResponse.ok?await profileResponse.json():null;

    if (!profile) {
      await this.completeRegistration(
        session.user.id,
        session.user.email!,
        session.user.user_metadata?.name || session.user.email!.split('@')[0],
        (session.user.user_metadata?.role || 'USER') as UserRole
      );
      const restored=await fetch('/api/data/profile',{cache:'no-store',headers:this.profileRequestHeaders(session.access_token)});
      profile=restored.ok?await restored.json():null;
    }

    const user: AuthUser = {
      id: session.user.id,
      email: session.user.email!,
      name: profile?.name || session.user.user_metadata?.name || session.user.email!.split('@')[0],
      role: profile?.role || 'USER',
      createdAt: session.user.created_at,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    document.cookie = `${SESSION_KEY}=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400; SameSite=Lax`;
    
    return user;
  }

  async resendVerification(email: string): Promise<void> {
    const {error}=await this.getClient().auth.resend({type:'signup',email,options:{emailRedirectTo:`${window.location.origin}/auth/callback`}});
    if(error)throw error;
  }
}
