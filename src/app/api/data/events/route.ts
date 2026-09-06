import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { categories, events, passTypes } from '@/shared/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/api-auth';
import { eventPosterUrl } from '@/shared/lib/event-poster';
import { eventCreateSchema, eventUpdateSchema, validationError } from '@/shared/lib/validation';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sellerId = searchParams.get('sellerId');
  const eventId=searchParams.get('id');
  const status = searchParams.get('status');
  const includePending = searchParams.get('includePending');

  if(sellerId||includePending||(status&&status!=='ACTIVE')){
    const auth=await requireApiUser(['SELLER','ADMIN']);if(auth.error)return auth.error;
    if(auth.profile.role!=='ADMIN'&&sellerId!==auth.profile.id)return Response.json({error:'Forbidden'},{status:403});
  }

  const conditions: any[] = [];

  if(eventId)conditions.push(eq(events.id,eventId));

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

  const allPassTypes=allEvents.length?await db.select().from(passTypes).where(inArray(passTypes.eventId,allEvents.map(event=>event.id))):[];
  const result=allEvents.map(event=>({...event,posterUrl:eventPosterUrl(event.posterUrl),passes:allPassTypes.filter(type=>type.eventId===event.id)}));

  return Response.json(eventId?(result[0]||null):result);
}

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(['SELLER']);
  if (auth.error) return auth.error;
  const parsed=eventCreateSchema.safeParse(await req.json());
  if(!parsed.success)return validationError(parsed.error);
  const body=parsed.data;

  if(new Date(`${body.date}T${body.time}:00+05:30`).getTime()<=Date.now())return Response.json({error:'Event date and time must be in the future'},{status:400});

  if(!auth.profile.approved)return Response.json({error:'Your seller account is not yet approved.'},{status:403});

  const requestedCategory=String(body.category||'').trim();
  const [category]=await db.select().from(categories).where(and(eq(categories.name,requestedCategory),eq(categories.active,true))).limit(1);
  if(!category)return Response.json({error:'Choose an available event category'},{status:400});

  // Create event
  const [newEvent] = await db.insert(events).values({
    title: body.title,
    description: body.description || '',
    date: body.date,
    time: body.time,
    location: body.location,
    venue: body.venue,
    category: category.name,
    posterUrl: body.posterUrl ? String(body.posterUrl).trim().slice(0, 2000) : null,
    sellerId: auth.profile.id,
    sellerName: auth.profile.name,
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

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser(['SELLER']);
  if (auth.error) return auth.error;
  const parsed=eventUpdateSchema.safeParse(await req.json());if(!parsed.success)return validationError(parsed.error);
  const body = parsed.data;
  const [existing] = await db.select().from(events).where(and(eq(events.id, body.eventId), eq(events.sellerId, auth.profile.id))).limit(1);
  if (!existing) return Response.json({ error:'Event not found' }, { status:404 });
  if (existing.status !== 'REJECTED') return Response.json({ error:'Only rejected events can be resubmitted' }, { status:409 });
  if(body.date&&body.time&&new Date(`${body.date}T${body.time}:00+05:30`).getTime()<=Date.now())return Response.json({error:'Event date and time must be in the future'},{status:400});
  if(body.category){const [category]=await db.select().from(categories).where(and(eq(categories.name,body.category),eq(categories.active,true))).limit(1);if(!category)return Response.json({error:'Choose an available event category'},{status:400});}
  const {eventId,...changes}=body;
  const [updated] = await db.update(events).set({ ...changes,status:'PENDING_APPROVAL', moderationReason:null }).where(eq(events.id,eventId)).returning();
  return Response.json(updated);
}
