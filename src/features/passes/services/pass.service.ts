import { Pass, CreatePassInput, PassStatus } from '../types';

const PASSES_KEY = 'pass_user_passes';

function getPasses(): Pass[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(PASSES_KEY);
  return stored ? JSON.parse(stored) : [];
}

function savePasses(passes: Pass[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PASSES_KEY, JSON.stringify(passes));
  }
}

function generateCredential(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'PASS_';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class PassService {
  static async createPass(input: CreatePassInput): Promise<Pass> {
    const passes = getPasses();
    const newPass: Pass = {
      id: `pass_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      passTypeId: input.passTypeId,
      passTypeName: input.passTypeName,
      price: input.price,
      ownerUserId: input.ownerUserId,
      status: 'ACTIVE',
      credential: generateCredential(),
      createdAt: new Date().toISOString(),
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      eventLocation: input.eventLocation,
      eventVenue: input.eventVenue,
    };
    passes.push(newPass);
    savePasses(passes);
    return newPass;
  }

  static async createMultiplePasses(inputs: CreatePassInput[]): Promise<Pass[]> {
    const results: Pass[] = [];
    for (const input of inputs) {
      const pass = await this.createPass(input);
      results.push(pass);
    }
    return results;
  }

  static async getPassesByUser(userId: string): Promise<Pass[]> {
    const passes = getPasses();
    return passes.filter(p => p.ownerUserId === userId);
  }

  static async getPassById(passId: string): Promise<Pass | null> {
    const passes = getPasses();
    return passes.find(p => p.id === passId) || null;
  }

  static async updatePassStatus(passId: string, status: PassStatus): Promise<void> {
    const passes = getPasses();
    const idx = passes.findIndex(p => p.id === passId);
    if (idx !== -1) {
      passes[idx].status = status;
      savePasses(passes);
    }
  }

  static async getUserPassCount(userId: string): Promise<number> {
    const passes = await this.getPassesByUser(userId);
    return passes.filter(p => p.status === 'ACTIVE').length;
  }
}
