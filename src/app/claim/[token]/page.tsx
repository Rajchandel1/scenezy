'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Gift, ShieldCheck } from 'lucide-react';
import { authService } from '@/features/auth';
import { TransferService, type Transfer } from '@/features/transfers';
import { LoadingButton } from '@/shared/components/ui/LoadingButton';
import { PageLoading } from '@/shared/components/ui/States';

export default function ClaimPassPage(){
  const {token}=useParams<{token:string}>(),router=useRouter();const [transfer,setTransfer]=useState<Transfer|null>(null),[authenticated,setAuthenticated]=useState(false),[loading,setLoading]=useState(true),[claiming,setClaiming]=useState(false),[error,setError]=useState('');
  useEffect(()=>{(async()=>{try{const user=await authService.getCurrentUser();if(!user)return;setAuthenticated(true);const claims=await TransferService.getPendingClaimsForUser(user.email);setTransfer(claims.find(item=>item.id===token)||null);}catch{setError('This transfer is unavailable or has expired.');}finally{setLoading(false)}})()},[token]);
  const claim=async()=>{if(!transfer)return;setClaiming(true);const result=await TransferService.claimTransfer({transferId:transfer.id,recipientUserId:'',recipientName:'',recipientIdentifier:''});if(result.success&&result.passId)router.replace(`/passes/${result.passId}`);else{setError(result.message);setClaiming(false)}};
  if(loading)return <PageLoading message="Opening your pass gift..."/>;
  return <main className="min-h-screen app-shell grid place-items-center px-5"><section className="surface rounded-[2rem] p-6 max-w-sm w-full text-center space-y-5"><span className="w-16 h-16 mx-auto rounded-2xl brand-button grid place-items-center"><Gift size={28}/></span>{!authenticated?<><div><p className="eyebrow">Scenezy transfer</p><h1 className="display-serif text-3xl mt-1">A pass is waiting</h1><p className="muted text-sm mt-2">Sign in with the recipient email address to securely claim it.</p></div><Link href={`/sign-in?redirect=${encodeURIComponent(`/claim/${token}`)}`} className="brand-button block rounded-xl py-3.5 font-semibold">Sign in to claim</Link></>:transfer?<><div><p className="eyebrow">From {transfer.senderName}</p><h1 className="display-serif text-3xl mt-1">{transfer.eventTitle}</h1><p className="muted text-sm mt-2">{transfer.passTypeName} · {new Date(transfer.eventDate).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p></div><div className="flex items-center gap-2 text-[10px] muted text-left"><ShieldCheck size={17} className="text-blue-400 shrink-0"/>Claiming changes the QR credential, so the sender’s old QR immediately stops working.</div>{error&&<p className="text-red-400 text-xs">{error}</p>}<LoadingButton loading={claiming} loadingLabel="Securing your pass" onClick={claim} className="brand-button w-full rounded-xl py-3.5 font-semibold">Claim this pass</LoadingButton></>:<><h1 className="display-serif text-3xl">Transfer unavailable</h1><p className="muted text-sm">It may have expired, been cancelled, or belongs to another email address.</p><Link href="/passes" className="brand-button block rounded-xl py-3">Go to my passes</Link></>}</section></main>;
}
