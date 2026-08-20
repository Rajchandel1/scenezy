import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { users, events, passes, orders, entries, auditLogs } from '@/shared/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

async function addAuditLog(actorId: string, actorName: string, action: string, targetType: string, targetId: string, metadata: any = {}) {
  await db.insert(auditLogs).values({ actorId, actorName, action, targetType, targetId, metadata });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'stats') {
    const allUsers = await db.select().from(users);
    const allEvents = await db.select().from(events);
    const allPasses = await db.select().from(passes);
    const allOrders = await db.select().from(orders);
    const allEntries = await db.select().from(entries);

    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const today = new Date().toDateString();
    const entriesToday = allEntries.filter(e => new Date(e.scannedAt).toDateString() === today);

    return Response.json({
      totalUsers: allUsers.filter(u => u.role === 'USER').length,
      totalSellers: allUsers.filter(u => u.role === 'SELLER').length,
      pendingSellers: allUsers.filter(u => u.role === 'SELLER' && !u.approved && !u.rejected).length,
      totalEvents: allEvents.length,
      activeEvents: allEvents.filter(e => e.status === 'ACTIVE').length,
      pendingEvents: allEvents.filter(e => e.status === 'PENDING_APPROVAL').length,
      totalPasses: allPasses.length,
      activePasses: allPasses.filter(p => p.status === 'ACTIVE').length,
      usedPasses: allPasses.filter(p => p.status === 'USED').length,
      totalOrders: allOrders.length,
      totalRevenue,
      totalEntries: allEntries.length,
      entriesToday: entriesToday.length,
      validEntriesToday: entriesToday.filter(e => e.result === 'VALID').length,
    });
  }

  if (action === 'users') {
    const result = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role, suspended: users.suspended, createdAt: users.createdAt }).from(users).where(eq(users.role, 'USER'));
    return Response.json(result);
  }

  if (action === 'sellers') {
    const result = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role, approved: users.approved, rejected: users.rejected, createdAt: users.createdAt }).from(users).where(eq(users.role, 'SELLER'));
    return Response.json(result);
  }

  if (action === 'events') {
    const result = await db.select().from(events).orderBy(desc(events.createdAt));
    return Response.json(result);
  }

  if (action === 'passes') {
    const result = await db.select().from(passes).orderBy(desc(passes.createdAt));
    return Response.json(result);
  }

  if (action === 'orders') {
    const result = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return Response.json(result);
  }

  if (action === 'entries') {
    const result = await db.select().from(entries).orderBy(desc(entries.scannedAt));
    return Response.json(result);
  }

  if (action === 'audit') {
    const result = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
    return Response.json(result);
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === 'suspend-user') {
    await db.update(users).set({ suspended: true }).where(eq(users.id, body.userId));
    await addAuditLog(body.adminId, body.adminName, 'SUSPEND_USER', 'user', body.userId);
    return Response.json({ success: true });
  }

  if (action === 'reactivate-user') {
    await db.update(users).set({ suspended: false }).where(eq(users.id, body.userId));
    await addAuditLog(body.adminId, body.adminName, 'REACTIVATE_USER', 'user', body.userId);
    return Response.json({ success: true });
  }

  if (action === 'approve-seller') {
    await db.update(users).set({ approved: true, rejected: false }).where(eq(users.id, body.userId));
    await addAuditLog(body.adminId, body.adminName, 'APPROVE_SELLER', 'seller', body.userId);
    return Response.json({ success: true });
  }

  if (action === 'reject-seller') {
    await db.update(users).set({ rejected: true, approved: false }).where(eq(users.id, body.userId));
    await addAuditLog(body.adminId, body.adminName, 'REJECT_SELLER', 'seller', body.userId);
    return Response.json({ success: true });
  }

  if (action === 'approve-event') {
    await db.update(events).set({ status: 'ACTIVE' }).where(eq(events.id, body.eventId));
    await addAuditLog(body.adminId, body.adminName, 'APPROVE_EVENT', 'event', body.eventId);
    return Response.json({ success: true });
  }

  if (action === 'reject-event') {
    await db.update(events).set({ status: 'REJECTED' }).where(eq(events.id, body.eventId));
    await addAuditLog(body.adminId, body.adminName, 'REJECT_EVENT', 'event', body.eventId);
    return Response.json({ success: true });
  }

  if (action === 'revoke-pass') {
    await db.update(passes).set({ status: 'REVOKED' }).where(eq(passes.id, body.passId));
    await addAuditLog(body.adminId, body.adminName, 'REVOKE_PASS', 'pass', body.passId, { reason: body.reason });
    return Response.json({ success: true });
  }

  if (action === 'cancel-event') {
    await db.update(events).set({ status: 'CANCELLED' }).where(eq(events.id, body.eventId));
    await addAuditLog(body.adminId, body.adminName, 'CANCEL_EVENT', 'event', body.eventId);
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
