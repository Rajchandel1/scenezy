import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { db } from '@/shared/db';
import { users } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/shared/lib/rate-limiter';

async function authenticatedUser(request?: Request){
  const authorization = request?.headers.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (accessToken) {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    return user;
  }
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function GET(req: Request) {
  const user=await authenticatedUser(req);
  if(!user)return Response.json({error:'Authentication required'},{status:401});
  const [profile]=await db.select({id:users.id,email:users.email,name:users.name,role:users.role,approved:users.approved,suspended:users.suspended,emailVerified:users.emailVerified}).from(users).where(eq(users.id,user.id)).limit(1);
  return profile?Response.json(profile):Response.json({error:'Profile not found'},{status:404});
}

export async function POST(req: Request) {
  const limit=await checkRateLimit(`profile:${getClientIP(req)}`,10,60);
  if(!limit.allowed)return rateLimitResponse(limit.resetAt);
  const user=await authenticatedUser(req);
  if (!user?.email) return Response.json({ error: 'Authentication required' }, { status: 401 });
  const body = await req.json();
  const metadataRole = user.user_metadata?.role;
  const role = metadataRole === 'SELLER' ? 'SELLER' : 'USER';
  const [profile] = await db.insert(users).values({
    id: user.id,
    email: user.email,
    name: String(body.name || user.user_metadata?.name || user.email.split('@')[0]),
    role,
    emailVerified: true,
  }).onConflictDoUpdate({ target: users.id, set: { name: String(body.name || user.user_metadata?.name), emailVerified: true, updatedAt: new Date() } }).returning();
  return Response.json(profile);
}
