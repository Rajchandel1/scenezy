import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS=['/','/sign-in','/sign-up','/forgot-password','/reset-password','/verify-email','/auth/callback','/auth/confirm','/claim','/terms','/privacy','/cancellation-refund-policy','/contact','/api/health','/api/data/auth','/api/data/profile','/api/data/forgot-password'];
const isPublic=(pathname:string)=>PUBLIC_PATHS.some(path=>pathname===path||(path!=='/'&&pathname.startsWith(`${path}/`)));
const homeForRole=(role?:string)=>role==='ADMIN'?'/admin':role==='SELLER'?'/seller':'/home';
type AuthProfile={id:string;email:string;name:string;role:string;approved:boolean|null;suspended:boolean|null};
const profileCache=new Map<string,{expires:number;value:Promise<AuthProfile|null>}>();

function getProfile(userId:string){
  const cached=profileCache.get(userId),now=Date.now();
  if(cached&&cached.expires>now)return cached.value;
  const value=(async()=>{
    const admin=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await admin.from('users').select('id, email, name, role, approved, suspended').eq('id',userId).single();
    return error?null:data as AuthProfile;
  })();
  profileCache.set(userId,{expires:now+15_000,value});
  return value;
}

export async function proxy(request:NextRequest){
  const {pathname}=request.nextUrl;
  const requestId=request.headers.get('x-request-id')||crypto.randomUUID();
  const profileBootstrap=pathname==='/api/data/profile';
  let response=NextResponse.next({request});
  const supabase=createServerClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{cookies:{getAll:()=>request.cookies.getAll(),setAll(cookies){cookies.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
  const {data:claimData}=await supabase.auth.getClaims();
  const subject=claimData?.claims?.sub;
  const user=subject?{id:subject}:null;
  let role:string|undefined,profile:AuthProfile|null=null,accountAvailable=Boolean(user);
  if(user&&!profileBootstrap){
    profile=await getProfile(user.id);role=profile?.role;accountAvailable=Boolean(profile)&&!profile?.suspended;
  }
  const authenticatedResponse=()=>{
    const requestHeaders=new Headers(request.headers);
    ['x-scenezy-auth','x-scenezy-user-id','x-scenezy-user-email','x-scenezy-user-name','x-scenezy-user-role','x-scenezy-user-approved'].forEach(header=>requestHeaders.delete(header));
    requestHeaders.set('x-request-id',requestId);
    if(user&&profile&&accountAvailable){
      requestHeaders.set('x-scenezy-auth','1');
      requestHeaders.set('x-scenezy-user-id',profile.id);
      requestHeaders.set('x-scenezy-user-email',encodeURIComponent(profile.email));
      requestHeaders.set('x-scenezy-user-name',encodeURIComponent(profile.name));
      requestHeaders.set('x-scenezy-user-role',profile.role);
      requestHeaders.set('x-scenezy-user-approved',profile.approved?'1':'0');
    }
    const next=NextResponse.next({request:{headers:requestHeaders}});
    response.cookies.getAll().forEach(cookie=>next.cookies.set(cookie));
    next.headers.set('Cache-Control','private, no-store, no-cache, max-age=0, must-revalidate');
    next.headers.set('Vary','Cookie');
    next.headers.set('x-request-id',requestId);
    return next;
  };
  if(isPublic(pathname)){
    if(user&&accountAvailable&&(pathname==='/sign-in'||pathname==='/sign-up'))return NextResponse.redirect(new URL(homeForRole(role),request.url));
    return authenticatedResponse();
  }
  if(!user||!accountAvailable||!role){
    if(pathname.startsWith('/api/'))return Response.json({error:'Authentication required'},{status:401});
    const url=new URL('/sign-in',request.url);url.searchParams.set('redirect',`${pathname}${request.nextUrl.search}`);return NextResponse.redirect(url);
  }
  if(pathname.startsWith('/admin')&&role!=='ADMIN')return NextResponse.redirect(new URL(homeForRole(role),request.url));
  if(pathname.startsWith('/seller')&&role!=='SELLER')return NextResponse.redirect(new URL(homeForRole(role),request.url));
  if(pathname.startsWith('/api/data/admin')&&role!=='ADMIN')return Response.json({error:'Admin access required'},{status:403});
  if(pathname.startsWith('/api/data/seller')&&role!=='SELLER'&&role!=='ADMIN')return Response.json({error:'Seller access required'},{status:403});
  if(pathname==='/scanner'&&role!=='SELLER'&&role!=='ADMIN')return NextResponse.redirect(new URL('/home',request.url));
  return authenticatedResponse();
}

export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|mp4|webm)$).*)']};
