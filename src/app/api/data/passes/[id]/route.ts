import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { passes } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/api-auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser(['ADMIN']);
  if (auth.error) return auth.error;
  const { id } = await params;
  const body = await req.json();
  const allowedStatus = ['ACTIVE','USED','REVOKED','EXPIRED'].includes(body.status) ? body.status : null;
  if (!allowedStatus) return Response.json({ error:'Invalid status' }, { status:400 });

  const [updated] = await db.update(passes).set({ status:allowedStatus }).where(eq(passes.id, id)).returning();
  if (!updated) return Response.json({ error: 'Pass not found' }, { status: 404 });
  return Response.json(updated);
}
