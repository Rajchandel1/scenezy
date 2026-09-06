'use client';
import { useEffect } from 'react';

export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{console.error('[ui-boundary]',{message:error.message,digest:error.digest})},[error]);
  return <main className="min-h-[70vh] grid place-items-center px-6"><div className="surface rounded-3xl p-7 text-center max-w-sm"><p className="eyebrow">Scene interrupted</p><h1 className="display-serif text-3xl mt-2">Something went wrong</h1><p className="muted text-sm mt-3">Your data is safe. Try loading this screen again.</p><button onClick={reset} className="brand-button rounded-full px-6 py-3 mt-6 text-sm font-semibold">Try again</button>{error.digest&&<p className="muted text-[10px] mt-4 font-mono">Reference {error.digest}</p>}</div></main>
}
