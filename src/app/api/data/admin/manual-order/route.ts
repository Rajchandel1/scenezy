import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
// ✅ Add 'orders' to this import line
import { users, events, passes, passTypes, orders } from '@/shared/db/schema'; 
import { eq, and } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/api-auth';
import { randomUUID } from 'crypto';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/shared/lib/rate-limiter';

function generateCredential(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'PASS_';
  for (let i = 0; i < 24; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export async function POST(req: NextRequest) {
  // Rate limit protection
  const ip = getClientIP(req);
  const rl = await checkRateLimit(`manual_order::${ip}`, 10, 60);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  // Auth check - ADMIN only
  const auth = await requireApiUser(['ADMIN']);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { userEmail, eventId, passTypeId, quantity = 1, notes } = body;

    if (!userEmail || !eventId || !passTypeId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find user by email
    const [targetUser] = await db.select().from(users)
      .where(eq(users.email, userEmail.toLowerCase().trim()))
      .limit(1);

    if (!targetUser) {
      return Response.json({ error: 'User not found with this email' }, { status: 404 });
    }

    // Verify event exists and is active
    const [event] = await db.select().from(events)
      .where(and(eq(events.id, eventId), eq(events.status, 'ACTIVE')))
      .limit(1);

    if (!event) {
      return Response.json({ error: 'Event not found or inactive' }, { status: 404 });
    }

    // Verify pass type belongs to this event
    const [passType] = await db.select().from(passTypes)
      .where(and(eq(passTypes.id, passTypeId), eq(passTypes.eventId, eventId)))
      .limit(1);

    if (!passType) {
      return Response.json({ error: 'Pass type not found in this event' }, { status: 404 });
    }

    const totalAmount = passType.price * quantity;

    // Create everything in a transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create PAID order record (matching your schema exactly)
      const [order] = await tx.insert(orders).values({
        userId: targetUser.id,
        eventId: eventId,
        eventTitle: event.title,
        items: [{
          passTypeId: passType.id,
          passTypeName: passType.name,
          quantity,
          unitPrice: passType.price,
          total: totalAmount
        }],
        subtotal: totalAmount,
        fees: Math.round(totalAmount * 0.05),
        total: totalAmount + Math.round(totalAmount * 0.05),
        paymentStatus: 'SUCCESS',
        orderStatus: 'PAID',
        transactionId: `MANUAL-${Date.now()}`,
        idempotencyKey: `manual-${crypto.randomUUID()}`
      }).returning();

      // 2. Issue passes directly (matching your schema exactly)
      const issuedPasses = [];
      for (let i = 0; i < quantity; i++) {
        const [pass] = await tx.insert(passes).values({
          eventId: eventId,
          eventTitle: event.title,
          passTypeId: passType.id,
          passTypeName: passType.name,
          price: passType.price,
          ownerUserId: targetUser.id,
          credential: generateCredential(),
          status: 'ACTIVE',
          eventDate: event.date,
          eventTime: event.time,
          eventLocation: event.location,
          eventVenue: event.venue
        }).returning();
        issuedPasses.push(pass);
      }

      return { order, passes: issuedPasses };
    });

    console.log(`[Manual Order] Admin ${auth.profile.email} issued ${quantity} pass(es) to ${userEmail}`);

    return Response.json({
      success: true,
      orderId: result.order.id,
      passesIssued: result.passes.length,
      message: `Successfully issued ${result.passes.length} pass(es) to ${userEmail}`
    });

  } catch (error: any) {
    console.error('[Manual Order] Error:', error);
    return Response.json({ error: error.message || 'Failed to create manual order' }, { status: 500 });
  }
}