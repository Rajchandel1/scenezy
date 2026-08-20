import { AuthService } from './auth.service';
import { AuthUser, LoginInput, RegisterInput } from '../types';

const SESSION_KEY = 'pass_session_user';

export class ApiAuthService implements AuthService {
  async login(input: LoginInput): Promise<AuthUser> {
    const res = await fetch('/api/data/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', ...input }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const user = await res.json();
    if (typeof window !== 'undefined') localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  async register(input: RegisterInput): Promise<AuthUser> {
    const res = await fetch('/api/data/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', ...input }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    const user = await res.json();
    if (typeof window !== 'undefined') localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') localStorage.removeItem(SESSION_KEY);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
