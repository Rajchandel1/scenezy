import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { passes, entries, events, transfers } from '@/shared/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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
  const body = await req.json();
  const rawInput = body.credential || '';
  const gate = body.gate || 'Main Gate';

  if (!rawInput) return Response.json({ valid: false, reason: 'No credential provided' });

  const credential = extractCredential(rawInput);

  // Find pass by credential
  const [pass] = await db.select().from(passes).where(eq(passes.credential, credential)).limit(1);

  // Fallback: fuzzy match
  let foundPass: typeof pass | null = pass ?? null;
  if (!foundPass) {
    const allPasses = await db.select().from(passes);
    foundPass = allPasses.find(p => credential.includes(p.credential) || p.credential.includes(credential)) || null;
  }

  if (!foundPass) {
    await recordEntry(null, null, 'Unknown', 'Unknown', credential, 'INVALID', 'Credential not recognized', gate);
    return Response.json({ valid: false, reason: 'Invalid QR code. Not recognized.', debug: { searched: credential } });
  }

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
  const [event] = await db.select().from(events).where(eq(events.id, foundPass.eventId)).limit(1);
  if (!event) {
    await recordEntry(foundPass.id, foundPass.eventId, foundPass.eventTitle, foundPass.passTypeName, credential, 'INVALID', 'Event not found', gate);
    return Response.json({ valid: false, reason: 'Event not found' });
  }
  if (event.status !== 'ACTIVE') {
    await recordEntry(foundPass.id, foundPass.eventId, foundPass.eventTitle, foundPass.passTypeName, credential, 'INVALID', 'Event is no longer active', gate);
    return Response.json({ valid: false, reason: 'Event is no longer active', passName: foundPass.passTypeName, eventTitle: foundPass.eventTitle });
  }

  // All checks passed - mark as USED
  await db.update(passes).set({ status: 'USED' }).where(eq(passes.id, foundPass.id));
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
  const result = await db.select().from(entries).orderBy(sql`${entries.scannedAt} DESC`);
  return Response.json(result);
}
