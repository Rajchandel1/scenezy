import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { orders } from '@/shared/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (userId) {
    const result = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    return Response.json(result);
  }

  const result = await db.select().from(orders).orderBy(desc(orders.createdAt));
  return Response.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const [order] = await db.insert(orders).values({
    userId: body.userId,
    eventId: body.eventId,
    eventTitle: body.eventTitle,
    items: body.items,
    subtotal: body.subtotal,
    fees: body.fees,
    total: body.total,
    paymentStatus: body.paymentStatus || 'SUCCESS',
    orderStatus: body.orderStatus || 'PAID',
  }).returning();

  return Response.json(order);
}
