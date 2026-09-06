'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { authService } from '@/features/auth';
import { ErrorState, PageLoading } from '@/shared/components/ui/States';

const money=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(value||0);

export default function OrdersPage(){
  const [orders,setOrders]=useState<any[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const user=await authService.getCurrentUser();
      if(!user)throw new Error();
      const response=await fetch(`/api/data/orders?userId=${user.id}`,{cache:'no-store'});
      if(!response.ok)throw new Error();
      setOrders(await response.json());setError('');
    }catch{setError('Orders could not be loaded.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  if(loading)return <PageLoading message="Opening order history..."/>;
  if(error)return <ErrorState message={error} onRetry={load}/>;
  return <div className="px-5 pt-7 pb-8 space-y-6"><header><p className="eyebrow">Receipts</p><h1 className="display-serif text-4xl mt-1">Your orders</h1></header>{orders.length?orders.map(order=><article key={order.id} className="editorial-card p-5"><div className="flex justify-between gap-3"><div><p className="font-semibold">{order.eventTitle}</p><p className="muted text-xs mt-1">{new Date(order.createdAt).toLocaleString('en-IN')}</p></div><span className="eyebrow text-blue-400">{order.orderStatus.replace('_',' ')}</span></div><div className="border-y border-[var(--line)] my-4 py-3 space-y-2 text-xs"><div className="flex justify-between"><span className="muted">Subtotal</span><span>{money(order.subtotal)}</span></div><div className="flex justify-between"><span className="muted">Platform fee</span><span>{money(order.fees)}</span></div><div className="flex justify-between font-semibold"><span>Total</span><span>{money(order.total)}</span></div></div><p className="font-mono muted text-[9px] break-all">Order {order.id}{order.transactionId?` · Payment ${order.transactionId}`:''}</p><div className="flex gap-2 mt-4"><button onClick={()=>window.print()} className="rounded-xl border border-[var(--line)] px-3 py-2 text-xs flex gap-2"><FileText size={14}/>Print receipt</button></div></article>):<div className="editorial-card p-10 text-center muted">No orders yet.</div>}</div>;
}
