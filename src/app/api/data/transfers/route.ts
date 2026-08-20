import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { transfers, passes } from '@/shared/db/schema';
import { eq, and, sql } from 'drizzle-orm';

function normalize(id: string): string { return id.toLowerCase().trim().replace(/\s+/g, ''); }

function generateCredential(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'PASS_';
  for (let i = 0; i < 24; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const forUser = searchParams.get('forUser');
  const passId = searchParams.get('passId');
  const senderId = searchParams.get('senderId');

  if (forUser) {
    const result = await db.select().from(transfers).where(
      and(
        eq(transfers.status, 'PENDING'),
        eq(transfers.recipientIdentifier, normalize(forUser)),
        sql`${transfers.expiresAt} > NOW()`
      )
    );
    return Response.json(result);
  }

  if (passId) {
    const result = await db.select().from(transfers).where(
      and(eq(transfers.passId, passId), eq(transfers.status, 'PENDING'))
    ).limit(1);
    return Response.json(result[0] || null);
  }

  if (senderId) {
    const result = await db.select().from(transfers).where(eq(transfers.senderUserId, senderId));
    return Response.json(result);
  }

  const result = await db.select().from(transfers);
  return Response.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === 'create') {
    // Check existing pending transfer
    const existing = await db.select().from(transfers).where(
      and(eq(transfers.passId, body.passId), eq(transfers.status, 'PENDING'))
    ).limit(1);
    if (existing.length > 0) return Response.json({ error: 'Pass already has a pending transfer' }, { status: 409 });

    const [transfer] = await db.insert(transfers).values({
      passId: body.passId,
      senderUserId: body.senderUserId,
      senderName: body.senderName,
      recipientIdentifier: normalize(body.recipientIdentifier),
      status: 'PENDING',
      eventTitle: body.eventTitle,
      passTypeName: body.passTypeName,
      eventDate: body.eventDate,
      eventTime: body.eventTime,
      eventLocation: body.eventLocation,
      eventVenue: body.eventVenue,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    }).returning();

    return Response.json(transfer);
  }

  if (action === 'claim') {
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, body.transferId)).limit(1);
    if (!transfer) return Response.json({ error: 'Transfer not found' }, { status: 404 });
    if (transfer.status !== 'PENDING') return Response.json({ error: 'Transfer is not pending' }, { status: 400 });
    if (normalize(transfer.recipientIdentifier) !== normalize(body.recipientIdentifier)) return Response.json({ error: 'Not for your account' }, { status: 403 });
    if (new Date(transfer.expiresAt) < new Date()) return Response.json({ error: 'Transfer expired' }, { status: 410 });
    if (transfer.senderUserId === body.recipientUserId) return Response.json({ error: 'Cannot claim own transfer' }, { status: 400 });

    // Atomic ownership swap
    const [pass] = await db.select().from(passes).where(eq(passes.id, transfer.passId)).limit(1);
    if (!pass) return Response.json({ error: 'Pass not found' }, { status: 404 });
    if (pass.status !== 'ACTIVE') return Response.json({ error: 'Pass not active' }, { status: 400 });

    // Update pass ownership + new credential
    await db.update(passes).set({
      ownerUserId: body.recipientUserId,
      credential: generateCredential(),
    }).where(eq(passes.id, transfer.passId));

    // Mark transfer claimed
    await db.update(transfers).set({
      status: 'CLAIMED',
      recipientUserId: body.recipientUserId,
      claimedAt: new Date(),
    }).where(eq(transfers.id, transfer.id));

    return Response.json({ success: true, passId: transfer.passId });
  }

  if (action === 'cancel') {
    const [transfer] = await db.select().from(transfers).where(eq(transfers.id, body.transferId)).limit(1);
    if (!transfer) return Response.json({ error: 'Not found' }, { status: 404 });
    if (transfer.senderUserId !== body.userId) return Response.json({ error: 'Not authorized' }, { status: 403 });
    if (transfer.status !== 'PENDING') return Response.json({ error: 'Cannot cancel' }, { status: 400 });

    await db.update(transfers).set({ status: 'CANCELLED' }).where(eq(transfers.id, transfer.id));
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
