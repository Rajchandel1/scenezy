import { AuthService } from './auth.service';
import { AuthUser, LoginInput, RegisterInput } from '../types';
import usersData from '@/data/users.json';

interface StoredUser extends AuthUser {
  password: string;
}

const STORAGE_KEY = 'pass_auth_user';
const USERS_DB_KEY = 'pass_users_db';

function getUsers(): StoredUser[] {
  if (typeof window === 'undefined') return usersData.users as StoredUser[];
  const stored = localStorage.getItem(USERS_DB_KEY);
  return stored ? JSON.parse(stored) : (usersData.users as StoredUser[]);
}

function saveUsers(users: StoredUser[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  }
}

function sanitize(user: StoredUser): AuthUser {
  const { password, ...safe } = user;
  return safe;
}

export class JsonAuthService implements AuthService {
  async login(input: LoginInput): Promise<AuthUser> {
    const users = getUsers();
    const user = users.find(
      u => u.email.toLowerCase() === input.email.toLowerCase() && u.password === input.password
    );
    if (!user) throw new Error('Invalid email or password');
    const safeUser = sanitize(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    }
    return safeUser;
  }

  async register(input: RegisterInput): Promise<AuthUser> {
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new Error('Email already registered');
    }
    const newUser: StoredUser = {
      id: `usr_${Date.now()}`,
      email: input.email,
      name: input.name,
      password: input.password,
      role: input.role || 'USER',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    const safeUser = sanitize(newUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
    }
    return safeUser;
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }
}
