import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { passes } from '@/shared/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const [updated] = await db.update(passes).set(body).where(eq(passes.id, id)).returning();
  if (!updated) return Response.json({ error: 'Pass not found' }, { status: 404 });
  return Response.json(updated);
}
