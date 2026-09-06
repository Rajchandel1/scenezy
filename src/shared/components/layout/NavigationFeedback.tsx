'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationFeedback(){
  const pathname=usePathname(),[active,setActive]=useState(false);
  useEffect(()=>{setActive(false)},[pathname]);
  useEffect(()=>{const click=(event:MouseEvent)=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;const anchor=(event.target as Element | null)?.closest('a[href]') as HTMLAnchorElement|null;if(!anchor||anchor.target==='_blank'||anchor.hasAttribute('download'))return;const target=new URL(anchor.href,location.href);if(target.origin===location.origin&&`${target.pathname}${target.search}`!==`${location.pathname}${location.search}`){setActive(true);window.setTimeout(()=>setActive(false),8000)}};document.addEventListener('click',click,true);return()=>document.removeEventListener('click',click,true)},[]);
  if(!active)return null;
  return <div role="status" aria-label="Loading page" className="fixed inset-x-0 top-0 z-[200] h-1 overflow-hidden bg-blue-950/50"><span className="block h-full w-1/3 bg-blue-500 shadow-[0_0_14px_rgba(59,130,246,.9)] animate-[nav-progress_1s_ease-in-out_infinite]"/></div>;
}
