'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { authService, type AuthUser } from '@/features/auth';
import { OrderService, type Order } from '@/features/orders';
import { ErrorState, PageLoading } from '@/shared/components/ui/States';
import { useClientQuery } from '@/shared/hooks/useClientQuery';

const money=(value:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(value||0);
type OrderWithPayment=Order&{transactionId?:string};

function OrdersContent({userId}:{userId:string}){
  const fetchOrders=useCallback(()=>OrderService.getOrdersByUser(userId) as Promise<OrderWithPayment[]>,[userId]);
  const {data,loading,error,refresh}=useClientQuery({key:`private:orders:${userId}`,fetcher:fetchOrders,freshForMs:30_000,retainForMs:5*60_000});
  const orders=data||[];
  if(loading)return <PageLoading message="Opening order history..."/>;
  if(error)return <ErrorState message={error} onRetry={()=>void refresh()}/>;
  return <div className="px-5 pt-7 pb-8 space-y-6"><header><p className="eyebrow">Receipts</p><h1 className="display-serif text-4xl mt-1">Your orders</h1></header>{orders.length?orders.map(order=><article key={order.id} className="editorial-card p-5"><div className="flex justify-between gap-3"><div><p className="font-semibold">{order.eventTitle}</p><p className="muted text-xs mt-1">{new Date(order.createdAt).toLocaleString('en-IN')}</p></div><span className="eyebrow text-blue-400">{order.orderStatus.replace('_',' ')}</span></div><div className="border-y border-[var(--line)] my-4 py-3 space-y-2 text-xs"><div className="flex justify-between"><span className="muted">Subtotal</span><span>{money(order.subtotal)}</span></div><div className="flex justify-between"><span className="muted">Platform fee</span><span>{money(order.fees)}</span></div><div className="flex justify-between font-semibold"><span>Total</span><span>{money(order.total)}</span></div></div><p className="font-mono muted text-[9px] break-all">Order {order.id}{order.transactionId?` · Payment ${order.transactionId}`:''}</p><div className="flex gap-2 mt-4"><button onClick={()=>window.print()} className="rounded-xl border border-[var(--line)] px-3 py-2 text-xs flex gap-2"><FileText size={14}/>Print receipt</button></div></article>):<div className="editorial-card p-10 text-center muted">No orders yet.</div>}</div>;
}

export default function OrdersPage(){
  const [user,setUser]=useState<AuthUser|null>(()=>authService.peekCurrentUser());
  useEffect(()=>{authService.getCurrentUser().then(setUser).catch(()=>setUser(null));},[]);
  if(!user)return <PageLoading message="Opening order history..."/>;
  return <OrdersContent userId={user.id}/>;
}
