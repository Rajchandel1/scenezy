import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { db } from '@/shared/db';
import { users } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';

export async function requireApiUser(roles?: Array<'USER' | 'SELLER' | 'ADMIN'>) {
  const requestHeaders=await headers();
  if(requestHeaders.get('x-scenezy-auth')==='1'){
    const role=requestHeaders.get('x-scenezy-user-role') as 'USER'|'SELLER'|'ADMIN'|null;
    const id=requestHeaders.get('x-scenezy-user-id');
    if(id&&role){
      const profile={
        id,
        role,
        email:decodeURIComponent(requestHeaders.get('x-scenezy-user-email')||''),
        name:decodeURIComponent(requestHeaders.get('x-scenezy-user-name')||''),
        approved:requestHeaders.get('x-scenezy-user-approved')==='1',
        suspended:false,
      };
      if(roles&&!roles.includes(role))return {error:Response.json({error:'You do not have permission to do this'},{status:403})};
      return {user:{id},profile};
    }
  }
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } },
  );
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: Response.json({ error: 'Authentication required' }, { status: 401 }) };
  const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!profile || profile.suspended) return { error: Response.json({ error: 'Account is unavailable' }, { status: 403 }) };
  if (roles && !roles.includes(profile.role)) return { error: Response.json({ error: 'You do not have permission to do this' }, { status: 403 }) };
  return { user, profile };
}
