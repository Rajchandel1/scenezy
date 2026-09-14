import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { events, passes, passTypes, users, orders } from '@/shared/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/api-auth';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(['ADMIN']);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { userId, eventId, passTypeId, quantity = 1, notes } = body;

  if (!userId || !eventId || !passTypeId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify User
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  // Verify Event & Pass Type
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

  const [passType] = await db.select().from(passTypes).where(eq(passTypes.id, passTypeId)).limit(1);
  if (!passType) return Response.json({ error: 'Pass type not found' }, { status: 404 });

  // Create Order (Marked as PAID manually)
  const orderId = randomUUID();
  const total = passType.price * quantity;
  
  await db.insert(orders).values({
    id: orderId,
    userId: user.id,
    eventId: event.id,
    eventTitle: event.title,
    items: [{ passTypeId, passTypeName: passType.name, quantity, unitPrice: passType.price, total }],
    subtotal: total,
    fees: 0, // No platform fee for manual issues if you want
    total: total,
    paymentStatus: 'SUCCESS',
    orderStatus: 'PAID',
    transactionId: `MANUAL-${Date.now()}`,
    createdAt: new Date(),
  });

  // Issue Passes
  const issuedPasses = [];
  for (let i = 0; i < quantity; i++) {
    const credential = `PASS_${randomUUID().replaceAll('-', '')}`;
    const [pass] = await db.insert(passes).values({
      id: randomUUID(),
      eventId: event.id,
      eventTitle: event.title,
      passTypeId: passType.id,
      passTypeName: passType.name,
      price: passType.price,
      ownerUserId: user.id,
      status: 'ACTIVE',
      credential,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      eventVenue: event.venue,
      createdAt: new Date(),
    }).returning();
    issuedPasses.push(pass);
  }

  return Response.json({ success: true, passes: issuedPasses, orderId });
}
