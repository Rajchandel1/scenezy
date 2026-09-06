import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { users, events, passes, orders, entries, auditLogs, passTypes, notifications } from '@/shared/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/api-auth';

async function addAuditLog(actorId: string, actorName: string, action: string, targetType: string, targetId: string, metadata: any = {}) {
  await db.insert(auditLogs).values({ actorId, actorName, action, targetType, targetId, metadata });
}

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(['ADMIN']);
  if (auth.error) return auth.error;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'stats') {
    const [userStats,allEvents,passStats,orderStats,entryStats]=await Promise.all([
      db.select({
        totalUsers:sql<number>`count(*) filter (where ${users.role} = 'USER')::int`,
        totalSellers:sql<number>`count(*) filter (where ${users.role} = 'SELLER')::int`,
        pendingSellers:sql<number>`count(*) filter (where ${users.role} = 'SELLER' and ${users.approved} = false and ${users.rejected} = false)::int`,
      }).from(users),
      db.select().from(events),
      db.select({totalPasses:sql<number>`count(*)::int`,activePasses:sql<number>`count(*) filter (where ${passes.status} = 'ACTIVE')::int`,usedPasses:sql<number>`count(*) filter (where ${passes.status} = 'USED')::int`}).from(passes),
      db.select({totalOrders:sql<number>`count(*) filter (where ${orders.orderStatus} = 'PAID')::int`,totalRevenue:sql<number>`coalesce(sum(${orders.total}) filter (where ${orders.orderStatus} = 'PAID'),0)::int`}).from(orders),
      db.select({totalEntries:sql<number>`count(*)::int`,entriesToday:sql<number>`count(*) filter (where ${entries.scannedAt} >= current_date)::int`,validEntriesToday:sql<number>`count(*) filter (where ${entries.scannedAt} >= current_date and ${entries.result} = 'VALID')::int`}).from(entries),
    ]);
    const user=userStats[0],pass=passStats[0],order=orderStats[0],entry=entryStats[0];

    return Response.json({
      totalUsers:user.totalUsers,
      totalSellers:user.totalSellers,
      pendingSellers:user.pendingSellers,
      totalEvents: allEvents.length,
      activeEvents: allEvents.filter(e => e.status === 'ACTIVE').length,
      pendingEvents: allEvents.filter(e => e.status === 'PENDING_APPROVAL').length,
      totalPasses:pass.totalPasses,
      activePasses:pass.activePasses,
      usedPasses:pass.usedPasses,
      totalOrders:order.totalOrders,
      totalRevenue:order.totalRevenue,
      totalEntries:entry.totalEntries,
      entriesToday:entry.entriesToday,
      validEntriesToday:entry.validEntriesToday,
      events:allEvents,
    });
  }

  if (action === 'users') {
    const result = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role, approved: users.approved, suspended: users.suspended, createdAt: users.createdAt }).from(users);
    return Response.json(result);
  }

  if (action === 'sellers') {
    const result = await db.select({ id: users.id, email: users.email, name: users.name, role: users.role, approved: users.approved, rejected: users.rejected, createdAt: users.createdAt }).from(users).where(eq(users.role, 'SELLER'));
    return Response.json(result);
  }

  if (action === 'events') {
    const [result,allPassTypes]=await Promise.all([
      db.select().from(events).orderBy(desc(events.createdAt)),
      db.select().from(passTypes),
    ]);
    return Response.json(result.map(event => ({ ...event, passes: allPassTypes.filter(pass => pass.eventId === event.id) })));
  }

  if (action === 'passes') {
    const result = await db.select().from(passes).orderBy(desc(passes.createdAt)).limit(200);
    return Response.json(result);
  }

  if (action === 'orders') {
    const result = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
    return Response.json(result);
  }

  if (action === 'entries') {
    const result = await db.select().from(entries).orderBy(desc(entries.scannedAt)).limit(200);
    return Response.json(result);
  }

  if (action === 'audit') {
    const result = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
    return Response.json(result);
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(['ADMIN']);
  if (auth.error) return auth.error;
  const body = await req.json();
  const { action } = body;
  body.adminId = auth.profile.id;
  body.adminName = auth.profile.name;

  if (action === 'suspend-user') {
    await db.update(users).set({ suspended: true }).where(eq(users.id, body.userId));
    await addAuditLog(body.adminId, body.adminName, 'SUSPEND_USER', 'user', body.userId);
    await db.insert(notifications).values({userId:body.userId,type:'account',title:'Account suspended',body:'Contact support if you believe this is a mistake.',icon:'alert',link:'/profile'});
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
    await db.insert(notifications).values({userId:body.userId,type:'seller-approved',title:'Seller access approved',body:'You can now create and submit events.',icon:'store',link:'/seller'});
    return Response.json({ success: true });
  }

  if (action === 'reject-seller') {
    await db.update(users).set({ rejected: true, approved: false }).where(eq(users.id, body.userId));
    await addAuditLog(body.adminId, body.adminName, 'REJECT_SELLER', 'seller', body.userId);
    await db.insert(notifications).values({userId:body.userId,type:'seller-rejected',title:'Seller application declined',body:String(body.reason||'Contact support for more information.'),icon:'alert',link:'/profile'});
    return Response.json({ success: true });
  }

  if (action === 'approve-event') {
    const [event] = await db.update(events).set({ status: 'ACTIVE', moderationReason: null }).where(eq(events.id, body.eventId)).returning();
    if (!event) return Response.json({ error:'Event not found' }, { status:404 });
    if (event.sellerId) await db.insert(notifications).values({userId:event.sellerId,type:'event-approved',title:'Event approved',body:`${event.title} is now live.`,icon:'calendar',link:`/seller/events/${event.id}`});
    await addAuditLog(body.adminId, body.adminName, 'APPROVE_EVENT', 'event', body.eventId);
    return Response.json({ success: true });
  }

  if (action === 'reject-event') {
    const reason=String(body.reason||'Please review the event information and submit it again.').slice(0,500);
    const [event] = await db.update(events).set({ status: 'REJECTED', moderationReason:reason }).where(eq(events.id, body.eventId)).returning();
    if (!event) return Response.json({ error:'Event not found' }, { status:404 });
    if (event.sellerId) await db.insert(notifications).values({userId:event.sellerId,type:'event-rejected',title:'Event needs changes',body:`${event.title}: ${reason}`,icon:'alert',link:`/seller/events/${event.id}`});
    await addAuditLog(body.adminId, body.adminName, 'REJECT_EVENT', 'event', body.eventId);
    return Response.json({ success: true });
  }

  if (action === 'revoke-pass') {
    await db.update(passes).set({ status: 'REVOKED' }).where(eq(passes.id, body.passId));
    await addAuditLog(body.adminId, body.adminName, 'REVOKE_PASS', 'pass', body.passId, { reason: body.reason });
    return Response.json({ success: true });
  }

  if (action === 'close-event' || action === 'cancel-event') {
    const [event] = await db.update(events).set({ status: 'CANCELLED', moderationReason:String(body.reason||'Closed by an administrator.') }).where(eq(events.id, body.eventId)).returning();
    if (!event) return Response.json({error:'Event not found'},{status:404});
    if(event.sellerId) await db.insert(notifications).values({userId:event.sellerId,type:'event-closed',title:'Event closed',body:`${event.title} was closed by an administrator.`,icon:'calendar',link:`/seller/events/${event.id}`});
    await addAuditLog(body.adminId, body.adminName, 'CLOSE_EVENT', 'event', body.eventId);
    return Response.json({ success: true });
  }

  if (action === 'continue-event') {
    const [existing]=await db.select().from(events).where(eq(events.id,body.eventId)).limit(1);
    if(!existing)return Response.json({error:'Event not found'},{status:404});
    if(existing.status!=='CANCELLED')return Response.json({error:'Only a closed event can be continued'},{status:409});
    const [event]=await db.update(events).set({status:'ACTIVE',moderationReason:null}).where(eq(events.id,body.eventId)).returning();
    if(event.sellerId)await db.insert(notifications).values({userId:event.sellerId,type:'event-continued',title:'Event continued',body:`${event.title} is live and visible to customers again.`,icon:'calendar',link:`/seller/events/${event.id}`});
    await addAuditLog(body.adminId,body.adminName,'CONTINUE_EVENT','event',body.eventId);
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
