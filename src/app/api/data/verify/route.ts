import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { passes, entries, events } from '@/shared/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/api-auth';
import { scannerSchema, validationError } from '@/shared/lib/validation';
import { checkRateLimit, rateLimitResponse } from '@/shared/lib/rate-limiter';

function extractCredential(input: string): string {
  let cred = input.trim();
  try {
    const url = new URL(cred);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length > 0) cred = parts[parts.length - 1];
  } catch {}
  if (cred.includes(':')) cred = cred.split(':').pop() || cred;
  return cred.trim();
}

async function recordEntry(passId: string | null, eventId: string | null, eventTitle: string, passTypeName: string, credential: string, result: string, reason: string, gate: string) {
  await db.insert(entries).values({
    passId: passId,
    eventId: eventId,
    eventTitle,
    passTypeName,
    credential: credential.slice(0, 16) + '...',
    result,
    reason,
    gate,
  });
}

export async function POST(req: NextRequest) {
  const auth=await requireApiUser(['SELLER','ADMIN']);
  if(auth.error)return auth.error;
  const parsed=scannerSchema.safeParse(await req.json());
  if(!parsed.success)return validationError(parsed.error);
  const limit=await checkRateLimit(`scan:${auth.profile.id}`,120,60);
  if(!limit.allowed)return rateLimitResponse(limit.resetAt);
  const rawInput=parsed.data.credential,gate=parsed.data.gate;

  const credential = extractCredential(rawInput);

  // Find pass by credential
  const [pass] = await db.select().from(passes).where(eq(passes.credential, credential)).limit(1);

  const foundPass:typeof pass|null=pass??null;

  if (!foundPass) {
    await recordEntry(null, null, 'Unknown', 'Unknown', credential, 'INVALID', 'Credential not recognized', gate);
    return Response.json({ valid: false, reason: 'Invalid QR code. Not recognized.' });
  }

  const [event] = await db.select().from(events).where(eq(events.id, foundPass.eventId)).limit(1);
  if (!event) {
    await recordEntry(foundPass.id, foundPass.eventId, foundPass.eventTitle, foundPass.passTypeName, credential, 'INVALID', 'Event not found', gate);
    return Response.json({ valid: false, reason: 'Event not found' });
  }
  if(auth.profile.role==='SELLER'&&event.sellerId!==auth.profile.id)return Response.json({valid:false,reason:'This scanner is not assigned to that event'},{status:403});

  if (foundPass.status === 'REVOKED') {
    await recordEntry(foundPass.id, foundPass.eventId, foundPass.eventTitle, foundPass.passTypeName, credential, 'INVALID', 'Pass has been revoked', gate);
    return Response.json({ valid: false, reason: 'PASS REVOKED', passName: foundPass.passTypeName, eventTitle: foundPass.eventTitle });
  }

  if (foundPass.status === 'EXPIRED') {
    await recordEntry(foundPass.id, foundPass.eventId, foundPass.eventTitle, foundPass.passTypeName, credential, 'INVALID', 'Pass has expired', gate);
    return Response.json({ valid: false, reason: 'PASS EXPIRED', passName: foundPass.passTypeName, eventTitle: foundPass.eventTitle });
  }

  if (foundPass.status === 'USED') {
    await recordEntry(foundPass.id, foundPass.eventId, foundPass.eventTitle, foundPass.passTypeName, credential, 'INVALID', 'Pass already used', gate);
    return Response.json({ valid: false, reason: 'PASS ALREADY USED', passName: foundPass.passTypeName, eventTitle: foundPass.eventTitle });
  }

  // Check event is active
  if (event.status !== 'ACTIVE') {
    await recordEntry(foundPass.id, foundPass.eventId, foundPass.eventTitle, foundPass.passTypeName, credential, 'INVALID', 'Event is no longer active', gate);
    return Response.json({ valid: false, reason: 'Event is no longer active', passName: foundPass.passTypeName, eventTitle: foundPass.eventTitle });
  }

  // All checks passed - mark as USED
  const [consumed]=await db.update(passes).set({status:'USED'}).where(and(eq(passes.id,foundPass.id),eq(passes.status,'ACTIVE'))).returning();
  if(!consumed){
    await recordEntry(foundPass.id,foundPass.eventId,foundPass.eventTitle,foundPass.passTypeName,credential,'INVALID','Pass already used',gate);
    return Response.json({valid:false,reason:'PASS ALREADY USED',passName:foundPass.passTypeName,eventTitle:foundPass.eventTitle},{status:409});
  }
  await recordEntry(foundPass.id, foundPass.eventId, foundPass.eventTitle, foundPass.passTypeName, credential, 'VALID', 'Entry approved', gate);

  return Response.json({
    valid: true,
    reason: 'ENTRY APPROVED',
    passName: foundPass.passTypeName,
    eventTitle: foundPass.eventTitle,
    eventDate: foundPass.eventDate,
    eventTime: foundPass.eventTime,
    gate,
  });
}

export async function GET() {
  const auth=await requireApiUser(['SELLER','ADMIN']);
  if(auth.error)return auth.error;
  if(auth.profile.role==='SELLER'){
    const owned=await db.select({id:events.id}).from(events).where(eq(events.sellerId,auth.profile.id));
    if(!owned.length)return Response.json([]);
    const result=await db.select().from(entries).where(inArray(entries.eventId,owned.map(event=>event.id))).orderBy(sql`${entries.scannedAt} DESC`).limit(200);
    return Response.json(result);
  }
  const result = await db.select().from(entries).orderBy(sql`${entries.scannedAt} DESC`).limit(200);
  return Response.json(result);
}
