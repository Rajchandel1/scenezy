import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/shared/db';
import { users } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';

type Role='USER'|'SELLER'|'ADMIN';
const homeForRole=(role:Role)=>role==='ADMIN'?'/admin':role==='SELLER'?'/seller':'/home';

export async function requirePageRole(allowed:Role[]){
  const store=await cookies();
  const supabase=createServerClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{cookies:{getAll:()=>store.getAll(),setAll:()=>undefined}});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect('/sign-in');
  const [profile]=await db.select({id:users.id,role:users.role,suspended:users.suspended}).from(users).where(eq(users.id,user.id)).limit(1);
  if(!profile||profile.suspended)redirect('/sign-in');
  if(!allowed.includes(profile.role))redirect(homeForRole(profile.role));
  return profile;
}

export async function redirectAuthenticated(){
  const store=await cookies();
  const supabase=createServerClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{cookies:{getAll:()=>store.getAll(),setAll:()=>undefined}});
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return;
  const [profile]=await db.select({role:users.role,suspended:users.suspended}).from(users).where(eq(users.id,user.id)).limit(1);
  if(profile&&!profile.suspended)redirect(homeForRole(profile.role));
}
