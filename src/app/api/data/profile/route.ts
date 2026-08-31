import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/shared/db';
import { users } from '@/shared/db/schema';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
  });
  const { data: { user } } = await supabase.auth.getUser();
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
