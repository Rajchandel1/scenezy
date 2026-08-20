import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { events, passTypes, users } from '@/shared/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get('sellerId');
  const status = searchParams.get('status');
  const includePending = searchParams.get('includePending');

  let conditions: any[] = [];

  if (sellerId) {
    conditions.push(eq(events.sellerId, sellerId));
  } else if (!includePending) {
    conditions.push(eq(events.status, 'ACTIVE'));
  }

  if (status) {
    conditions.push(eq(events.status, status as any));
  }

  const allEvents = conditions.length > 0
    ? await db.select().from(events).where(and(...conditions)).orderBy(desc(events.date))
    : await db.select().from(events).orderBy(desc(events.date));

  // Fetch pass types for each event
  const result = await Promise.all(
    allEvents.map(async (event) => {
      const pts = await db.select().from(passTypes).where(eq(passTypes.eventId, event.id));
      return { ...event, passes: pts };
    })
  );

  return Response.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Check if seller is approved
  const seller = await db.select().from(users).where(eq(users.id, body.sellerId)).limit(1);
  if (!seller[0]) return Response.json({ error: 'Seller not found' }, { status: 404 });
  if (!seller[0].approved) return Response.json({ error: 'Your seller account is not yet approved.' }, { status: 403 });

  // Create event
  const [newEvent] = await db.insert(events).values({
    title: body.title,
    description: body.description || '',
    date: body.date,
    time: body.time,
    location: body.location,
    venue: body.venue,
    category: body.category || 'Other',
    sellerId: body.sellerId,
    sellerName: body.sellerName,
    status: 'PENDING_APPROVAL',
  }).returning();

  // Create pass types
  if (body.passes?.length > 0) {
    await db.insert(passTypes).values(
      body.passes.map((p: any) => ({
        eventId: newEvent.id,
        name: p.name,
        price: p.price,
        benefits: p.benefits || '',
        available: p.available || p.quantity || 100,
        sold: 0,
        transferAllowed: p.transferAllowed !== false,
      }))
    );
  }

  const pts = await db.select().from(passTypes).where(eq(passTypes.eventId, newEvent.id));
  return Response.json({ ...newEvent, passes: pts });
}
