import { SupabaseAuthService } from './services/supabase-auth.service';

export const authService = new SupabaseAuthService();
export * from './types';
export type { AuthService } from './services/auth.service';
