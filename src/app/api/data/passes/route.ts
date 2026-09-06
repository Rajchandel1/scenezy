import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { passes, passTypes } from '@/shared/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/api-auth';

function generateCredential(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'PASS_';
  for (let i = 0; i < 24; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export async function GET(req: NextRequest) {
  const auth = await requireApiUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const passId = searchParams.get('passId');
  if (passId) {
    const result = await db.select().from(passes).where(eq(passes.id, passId)).limit(1);
    const pass = result[0];
    if (pass && auth.profile.role !== 'ADMIN' && pass.ownerUserId !== auth.profile.id) return Response.json({ error:'Forbidden' }, { status:403 });
    return Response.json(pass || null);
  }

  if (userId || auth.profile.role !== 'ADMIN') {
    const ownerUserId = userId || auth.profile.id;
    if (auth.profile.role !== 'ADMIN' && ownerUserId !== auth.profile.id) return Response.json({ error:'Forbidden' }, { status:403 });
    const result = await db.select().from(passes).where(eq(passes.ownerUserId, ownerUserId));
    return Response.json(result);
  }

  if (auth.profile.role !== 'ADMIN') return Response.json({ error:'Forbidden' }, { status:403 });
  const result = await db.select().from(passes);
  return Response.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(['ADMIN']);
  if (auth.error) return auth.error;
  const body = await req.json();
  const inputs = body.bulk ? body.items : [body];

  const created = [];
  for (const input of inputs) {
    const [newPass] = await db.insert(passes).values({
      eventId: input.eventId,
      eventTitle: input.eventTitle,
      passTypeId: input.passTypeId,
      passTypeName: input.passTypeName,
      price: input.price,
      ownerUserId: input.ownerUserId,
      status: 'ACTIVE',
      credential: generateCredential(),
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      eventLocation: input.eventLocation,
      eventVenue: input.eventVenue,
    }).returning();
    created.push(newPass);

    // Update sold count
    await db.update(passTypes).set({
      sold: sql`sold + 1`,
      available: sql`GREATEST(available - 1, 0)`,
    }).where(eq(passTypes.id, input.passTypeId));
  }

  return Response.json(body.bulk ? created : created[0]);
}
