import { Pass, CreatePassInput, PassStatus } from '../types';
import { invalidateClientCache } from '@/shared/lib/client-data-cache';

function invalidatePassData(passId?:string){
  invalidateClientCache('private:passes:');
  if(passId)invalidateClientCache(`private:pass:${passId}`);
}

async function readResponse<T>(response:Response,fallback:string):Promise<T>{
  const raw=await response.text();
  if(!raw.trim())throw new Error(`${fallback} (server returned ${response.status})`);
  let data:T&{error?:string};
  try{data=JSON.parse(raw) as T&{error?:string};}catch{throw new Error(`${fallback} (invalid server response)`);}
  if(!response.ok)throw new Error(data.error||fallback);
  return data;
}

export class ApiPassService {
  static async createPass(input: CreatePassInput): Promise<Pass> {
    const res = await fetch('/api/data/passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const pass=await readResponse<Pass>(res,'Could not create pass');
    invalidatePassData();
    return pass;
  }

  static async createMultiplePasses(inputs: CreatePassInput[]): Promise<Pass[]> {
    const res = await fetch('/api/data/passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bulk: true, items: inputs }),
    });
    const passes=await readResponse<Pass[]>(res,'Could not create passes');
    invalidatePassData();
    return passes;
  }

  static async getPassesByUser(userId: string): Promise<Pass[]> {
    const res = await fetch(`/api/data/passes?userId=${userId}`);
    return readResponse<Pass[]>(res,'Could not load passes');
  }

  static async getPassById(passId: string): Promise<Pass | null> {
    const res = await fetch(`/api/data/passes?passId=${passId}`);
    return readResponse<Pass|null>(res,'Could not load pass');
  }

  static async updatePassStatus(passId: string, status: PassStatus): Promise<void> {
    const response=await fetch(`/api/data/passes/${passId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if(!response.ok)await readResponse(response,'Could not update pass');
    invalidatePassData(passId);
  }
}
