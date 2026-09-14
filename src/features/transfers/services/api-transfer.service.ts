import { Transfer, CreateTransferInput, ClaimTransferInput } from '../types';
import { invalidateClientCache } from '@/shared/lib/client-data-cache';

function invalidateTransferPasses(passId?:string){invalidateClientCache('private:passes:');if(passId)invalidateClientCache(`private:pass:${passId}`);}

async function json(response:Response) { const data=await response.json(); if(!response.ok) throw new Error(data.error||'Request failed'); return data; }

export class ApiTransferService {
  static async createTransfer(input:CreateTransferInput):Promise<Transfer> {
    const transfer=await json(await fetch('/api/data/transfers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'create',passId:input.passId,recipientIdentifier:input.recipientIdentifier})}));
    invalidateTransferPasses(input.passId);
    return transfer;
  }
  static async getPendingClaimsForUser(email:string):Promise<Transfer[]> { return json(await fetch(`/api/data/transfers?forUser=${encodeURIComponent(email)}`)); }
  static async claimTransfer(input:ClaimTransferInput):Promise<{success:boolean;message:string;passId?:string}> {
    try { const data=await json(await fetch('/api/data/transfers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim',transferId:input.transferId})})); invalidateTransferPasses(data.passId);return {success:true,message:'Pass is now yours!',passId:data.passId}; }
    catch(error) { return {success:false,message:error instanceof Error?error.message:'Claim failed'}; }
  }
  static async cancelTransfer(transferId:string,userId:string):Promise<{success:boolean;message:string}> {
    void userId; // Kept for compatibility; the server derives identity from the session.
    try { await json(await fetch('/api/data/transfers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'cancel',transferId})})); invalidateTransferPasses();return {success:true,message:'Transfer cancelled.'}; }
    catch(error) { return {success:false,message:error instanceof Error?error.message:'Cancel failed'}; }
  }
  static async getPendingTransferForPass(passId:string):Promise<Transfer|null> { return json(await fetch(`/api/data/transfers?passId=${passId}`)); }
  static async getSentTransfers(userId:string):Promise<Transfer[]> { return json(await fetch(`/api/data/transfers?senderId=${userId}`)); }
}
