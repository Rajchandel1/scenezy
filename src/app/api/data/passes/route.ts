import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { passes, passTypes } from '@/shared/db/schema';
import { eq, sql } from 'drizzle-orm';

function generateCredential(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'PASS_';
  for (let i = 0; i < 24; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const passId = searchParams.get('passId');

  if (passId) {
    const result = await db.select().from(passes).where(eq(passes.id, passId)).limit(1);
    return Response.json(result[0] || null);
  }

  if (userId) {
    const result = await db.select().from(passes).where(eq(passes.ownerUserId, userId));
    return Response.json(result);
  }

  const result = await db.select().from(passes);
  return Response.json(result);
}

export async function POST(req: NextRequest) {
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
