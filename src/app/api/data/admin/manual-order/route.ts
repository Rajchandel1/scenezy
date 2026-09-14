import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { users, events, passes, orders } from '@/shared/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/auth-helpers';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/shared/lib/rate-limiter';
import { randomUUID } from 'crypto';

// Generate secure credential for pass
function generateCredential() {
  return randomUUID().replace(/-/g, '').toUpperCase().slice(0, 16);
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

    // Verify event and pass type exist
    const [event] = await db.select().from(events)
      .where(and(eq(events.id, eventId), eq(events.status, 'ACTIVE')))
      .limit(1);

    if (!event) {
      return Response.json({ error: 'Event not found or inactive' }, { status: 404 });
    }

    const passType = event.passes?.find((p: any) => p.id === passTypeId);
    if (!passType) {
      return Response.json({ error: 'Pass type not found in this event' }, { status: 404 });
    }

    const totalAmount = passType.price * quantity;

    // Create everything in a transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create PAID order record (isolated from Razorpay flow)
      const [order] = await tx.insert(orders).values({
        userId: targetUser.id,
        eventId: eventId,
        providerOrderId: `MANUAL-${Date.now()}`,
        idempotencyKey: `manual-${randomUUID()}`,
        orderStatus: 'PAID',
        paymentStatus: 'CAPTURED',
        currency: 'INR',
        subtotal: passType.price * quantity,
        fees: Math.round(totalAmount * 0.05),
        total: totalAmount + Math.round(totalAmount * 0.05),
        metadata: { 
          source: 'MANUAL_ADMIN', 
          adminId: auth.profile.id,
          notes: notes || '',
          createdAt: new Date().toISOString()
        },
      }).returning();

      // 2. Issue passes directly
      const issuedPasses = [];
      for (let i = 0; i < quantity; i++) {
        const [pass] = await tx.insert(passes).values({
          orderId: order.id,
          userId: targetUser.id,
          eventId: eventId,
          passTypeId: passTypeId,
          credential: generateCredential(),
          status: 'ACTIVE',
          issuedAt: new Date(),
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
