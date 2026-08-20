import { Pass, CreatePassInput, PassStatus } from '../types';

export class ApiPassService {
  static async createPass(input: CreatePassInput): Promise<Pass> {
    const res = await fetch('/api/data/passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return res.json();
  }

  static async createMultiplePasses(inputs: CreatePassInput[]): Promise<Pass[]> {
    const res = await fetch('/api/data/passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bulk: true, items: inputs }),
    });
    return res.json();
  }

  static async getPassesByUser(userId: string): Promise<Pass[]> {
    const res = await fetch(`/api/data/passes?userId=${userId}`);
    return res.json();
  }

  static async getPassById(passId: string): Promise<Pass | null> {
    const res = await fetch(`/api/data/passes?passId=${passId}`);
    return res.json();
  }

  static async updatePassStatus(passId: string, status: PassStatus): Promise<void> {
    await fetch(`/api/data/passes/${passId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }
}
