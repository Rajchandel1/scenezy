'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingButton } from '@/shared/components/ui/LoadingButton';
import { PageLoading } from '@/shared/components/ui/States';
import { createSupabaseBrowserClient } from '@/shared/lib/supabase-client';

function ResetPasswordContent(){
  const router=useRouter(),params=useSearchParams();
  const [ready,setReady]=useState(false),[password,setPassword]=useState(''),[confirmPassword,setConfirmPassword]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(false);

  useEffect(()=>{let active=true;(async()=>{try{const supabase=createSupabaseBrowserClient(),code=params.get('code');if(code){const {error}=await supabase.auth.exchangeCodeForSession(code);if(error)throw error;}const {data}=await supabase.auth.getSession();if(!data.session)throw new Error('This reset link is invalid or has expired.');if(active)setReady(true);}catch(err){if(active)setError(err instanceof Error?err.message:'This reset link is invalid or has expired.');}})();return()=>{active=false};},[params]);

  const submit=async(event:React.FormEvent)=>{event.preventDefault();setError('');if(password.length<8){setError('Use at least 8 characters.');return}if(password!==confirmPassword){setError('Passwords do not match.');return}setLoading(true);try{const supabase=createSupabaseBrowserClient();const {error:updateError}=await supabase.auth.updateUser({password});if(updateError)throw updateError;await supabase.auth.signOut();setSuccess(true);setTimeout(()=>router.replace('/sign-in'),1400);}catch(err){setError(err instanceof Error?err.message:'Password could not be updated.');}finally{setLoading(false)}};

  if(!ready&&!error)return <PageLoading message="Validating your secure reset link…"/>;
  if(success)return <div className="space-y-4 text-center py-5"><div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/25 grid place-items-center text-emerald-400 text-2xl">✓</div><h1 className="text-white text-xl font-bold">Password updated</h1><p className="text-neutral-400 text-sm">Taking you to sign in…</p></div>;
  if(!ready)return <div className="space-y-4 text-center py-5"><h1 className="text-white text-xl font-bold">Reset link unavailable</h1><p className="text-red-400 text-sm">{error}</p><Link href="/forgot-password" className="block brand-button rounded-xl py-3 font-semibold">Request another link</Link></div>;

  return <form onSubmit={submit} className="space-y-5"><div className="text-center"><h1 className="text-white text-xl font-bold">Choose a new password</h1><p className="text-neutral-500 text-sm mt-2">Use at least 8 characters and avoid reused passwords.</p></div><label className="block space-y-1.5"><span className="text-neutral-400 text-xs font-medium uppercase tracking-wider">New password</span><input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={event=>setPassword(event.target.value)} className="app-input w-full rounded-xl px-4 py-3"/></label><label className="block space-y-1.5"><span className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Confirm password</span><input type="password" autoComplete="new-password" required minLength={8} value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} className="app-input w-full rounded-xl px-4 py-3"/></label>{error&&<div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-red-400 text-sm">{error}</div>}<LoadingButton type="submit" loading={loading} loadingLabel="Updating…" className="brand-button w-full rounded-xl py-3.5 font-bold">Update password</LoadingButton></form>;
}

export default function ResetPasswordPage(){
  return <Suspense fallback={<PageLoading message="Validating your secure reset link..."/>}><ResetPasswordContent/></Suspense>;
}
