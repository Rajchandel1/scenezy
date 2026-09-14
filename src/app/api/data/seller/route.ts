import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { events, passes, orders, entries, users, passTypes } from '@/shared/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/api-auth';
import { eventSortTimestamp, isEventPast } from '@/shared/lib/event-date';

export async function GET(req: NextRequest) {
  const auth = await requireApiUser(['SELLER', 'ADMIN']);
  if (auth.error) return auth.error;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const sellerId = searchParams.get('sellerId');

  if (!sellerId) return Response.json({ error: 'sellerId required' }, { status: 400 });
  if (auth.profile.role !== 'ADMIN' && sellerId !== auth.profile.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const sellerEvents = await db.select().from(events).where(eq(events.sellerId, sellerId));
  const sellerEventIds = sellerEvents.map(e => e.id);

  if (sellerEventIds.length === 0) {
    if (action === 'dashboard') return Response.json({ overview: { totalRevenue: 0, monthRevenue: 0, totalSold: 0, totalCapacity: 0, checkedIn: 0, activeCount: 0, pastCount: 0, pendingCount: 0, rejectedCount: 0, totalEvents: 0 }, bestEvent: null, bestPassType: null });
    if (action === 'events') return Response.json([]);
    if (action === 'activity') return Response.json([]);
    return Response.json({});
  }

  const [sellerPasses,sellerOrders,sellerEntries,sellerPassTypes]=await Promise.all([
    db.select().from(passes).where(inArray(passes.eventId,sellerEventIds)),
    db.select().from(orders).where(inArray(orders.eventId,sellerEventIds)),
    db.select().from(entries).where(inArray(entries.eventId,sellerEventIds)),
    db.select().from(passTypes).where(inArray(passTypes.eventId,sellerEventIds)),
  ]);

  const now = new Date();

  if (action === 'dashboard') {
    const activeEvents = sellerEvents.filter(e => e.status === 'ACTIVE' && !isEventPast(e.date,e.time));
    const pastEvents = sellerEvents.filter(e => isEventPast(e.date,e.time) || e.status === 'CANCELLED');
    const pendingEvents = sellerEvents.filter(e => e.status === 'PENDING_APPROVAL');

    const paidOrders=sellerOrders.filter(order=>order.orderStatus==='PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const monthRevenue = paidOrders.filter(o => { const d = new Date(o.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).reduce((sum, o) => sum + (o.total || 0), 0);

    const eventSales: Record<string, number> = {};
    sellerPasses.forEach(p => { eventSales[p.eventId] = (eventSales[p.eventId] || 0) + 1; });
    const bestEventId = Object.entries(eventSales).sort((a, b) => b[1] - a[1])[0]?.[0];
    const bestEvent = sellerEvents.find(e => e.id === bestEventId);

    const passTypeSales: Record<string, number> = {};
    sellerPasses.forEach(p => { passTypeSales[p.passTypeName] = (passTypeSales[p.passTypeName] || 0) + 1; });
    const bestPassType = Object.entries(passTypeSales).sort((a, b) => b[1] - a[1])[0];

    const enrichedEvents=sellerEvents.map(event=>{
      const pts=sellerPassTypes.filter(type=>type.eventId===event.id);
      const totalCapacity=pts.reduce((sum,type)=>sum+type.available+type.sold,0);
      const totalSold=pts.reduce((sum,type)=>sum+type.sold,0);
      return {...event,passes:pts,totalSold,totalCapacity,revenue:paidOrders.filter(order=>order.eventId===event.id).reduce((sum,order)=>sum+(order.total||0),0),checkedIn:sellerEntries.filter(entry=>entry.eventId===event.id&&entry.result==='VALID').length,sellPercentage:totalCapacity?Math.round(totalSold/totalCapacity*100):0};
    }).sort((a,b)=>eventSortTimestamp(b.date)-eventSortTimestamp(a.date));
    return Response.json({
      overview: {
        totalRevenue, monthRevenue,
        totalSold: sellerPasses.length,
        totalCapacity: sellerEvents.length * 100,
        checkedIn: sellerEntries.filter(e => e.result === 'VALID').length,
        activeCount: activeEvents.length, pastCount: pastEvents.length,
        pendingCount: pendingEvents.length,
        rejectedCount: sellerEvents.filter(e => e.status === 'REJECTED').length,
        totalEvents: sellerEvents.length,
      },
      bestEvent: bestEvent ? { title: bestEvent.title, sold: eventSales[bestEventId] } : null,
      bestPassType: bestPassType ? { name: bestPassType[0], sold: bestPassType[1] } : null,
      events:enrichedEvents,
    });
  }

  if (action === 'events') {
    const tab = searchParams.get('tab') || 'active';
    let filtered = sellerEvents;
    if (tab === 'active') filtered = sellerEvents.filter(e => e.status === 'ACTIVE' && !isEventPast(e.date,e.time));
    else if (tab === 'past') filtered = sellerEvents.filter(e => isEventPast(e.date,e.time) || e.status === 'CANCELLED');
    else if (tab === 'pending') filtered = sellerEvents.filter(e => e.status === 'PENDING_APPROVAL');

    const enriched = filtered.map((event) => {
      const evtOrders = sellerOrders.filter(o => o.eventId === event.id);
      const evtEntries = sellerEntries.filter(e => e.eventId === event.id && e.result === 'VALID');
      const pts=sellerPassTypes.filter(type=>type.eventId===event.id);
      const totalCap = pts.reduce((s, p) => s + p.available + p.sold, 0);
      const sold = pts.reduce((s, p) => s + p.sold, 0);
      return {
        ...event, passes: pts,
        totalSold: sold, totalCapacity: totalCap,
        revenue: evtOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        checkedIn: evtEntries.length,
        sellPercentage: totalCap > 0 ? Math.round((sold / totalCap) * 100) : 0,
      };
    });

    return Response.json(enriched.sort((a, b) => eventSortTimestamp(b.date) - eventSortTimestamp(a.date)));
  }

  if (action === 'event-detail') {
    const eventId = searchParams.get('eventId');
    if (!eventId) return Response.json({ error: 'eventId required' }, { status: 400 });

    const event = sellerEvents.find(e => e.id === eventId);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const evtPasses = sellerPasses.filter(p => p.eventId === eventId);
    const evtOrders = sellerOrders.filter(o => o.eventId === eventId);
    const evtEntries = sellerEntries.filter(e => e.eventId === eventId);
    const pts=sellerPassTypes.filter(type=>type.eventId===eventId);

    const passBreakdown = pts.map(pt => {
      const typePasses = evtPasses.filter(p => p.passTypeId === pt.id);
      return { ...pt, revenue: typePasses.reduce((s, p) => s + p.price, 0), sellPercentage: (pt.available + pt.sold) > 0 ? Math.round((pt.sold / (pt.available + pt.sold)) * 100) : 0 };
    });

    const buyerIds=[...new Set(evtOrders.map(order=>order.userId))];
    const allUsers=buyerIds.length?await db.select().from(users).where(inArray(users.id,buyerIds)):[];
    const buyers = evtOrders.map(order => {
      const user = allUsers.find(u => u.id === order.userId);
      return { orderId: order.id, userName: user?.name || 'Unknown', userEmail: user?.email || '', items: order.items, total: order.total, createdAt: order.createdAt, paymentStatus: order.paymentStatus };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activity: any[] = [];
    evtOrders.forEach(o => { const u = allUsers.find(u => u.id === o.userId); activity.push({ type: 'purchase', userName: u?.name || 'Someone', details: Array.isArray(o.items) ? o.items.map((i: any) => i.passTypeName).join(', ') : '', amount: o.total, time: o.createdAt }); });
    evtEntries.filter(e => e.result === 'VALID').forEach(e => { activity.push({ type: 'entry', userName: '', details: `${e.passTypeName} checked in at ${e.gate}`, amount: 0, time: e.scannedAt }); });
    activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const totalRevenue = evtOrders.filter(order=>order.orderStatus==='PAID').reduce((sum, o) => sum + (o.total || 0), 0);
    const totalSold = pts.reduce((s, p) => s + p.sold, 0);
    const totalCap = pts.reduce((s, p) => s + p.available + p.sold, 0);

    return Response.json({
      event: { ...event, totalRevenue, totalSold, totalCapacity: totalCap, checkedIn: evtEntries.filter(e => e.result === 'VALID').length, sellPercentage: totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0 },
      passBreakdown, buyers: buyers.slice(0, 20), activity: activity.slice(0, 30),
    });
  }

  if (action === 'activity') {
    const buyerIds=[...new Set(sellerOrders.map(order=>order.userId))];
    const allUsersList=buyerIds.length?await db.select().from(users).where(inArray(users.id,buyerIds)):[];
    const activity: any[] = [];
    sellerOrders.forEach(o => { const u = allUsersList.find(u => u.id === o.userId); const ev = sellerEvents.find(e => e.id === o.eventId); activity.push({ type: 'purchase', userName: u?.name || 'Someone', eventTitle: ev?.title, details: Array.isArray(o.items) ? o.items.map((i: any) => i.passTypeName).join(', ') : '', amount: o.total, time: o.createdAt }); });
    activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return Response.json(activity.slice(0, 30));
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
