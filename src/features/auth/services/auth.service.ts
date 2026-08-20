import { AuthUser, LoginInput, RegisterInput } from '../types';

/**
 * Auth Service Contract
 * Switch implementations by changing ONE line in ../index.ts
 */
export interface AuthService {
  login(input: LoginInput): Promise<AuthUser>;
  register(input: RegisterInput): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}
