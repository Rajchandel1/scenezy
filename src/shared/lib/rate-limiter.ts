import { sql } from 'drizzle-orm';
import { db } from '@/shared/db';
import { rateLimits } from '@/shared/db/schema';

export async function checkRateLimit(key:string, maxRequests=30, windowSeconds=60){
  // FIX: Convert Date to ISO String for postgres.js compatibility
  const resetAt = new Date(Date.now() + windowSeconds * 1000).toISOString();
  
  try {
    const [record] = await db.insert(rateLimits).values({
      key, 
      count: 1, 
      resetAt // Now passing a string
    }).onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.resetAt} <= now() then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${rateLimits.resetAt} <= now() then ${resetAt} else ${rateLimits.resetAt} end`,
      },
    }).returning({count: rateLimits.count, resetAt: rateLimits.resetAt});
    
    return {
      allowed: record.count <= maxRequests,
      remaining: Math.max(0, maxRequests - record.count),
      resetAt: new Date(record.resetAt) // Convert back to Date for the return object if needed elsewhere
    };
  } catch (error) {
    console.error('[Rate Limit] Error:', error);
    // Fail open: allow request if rate limiter fails
    return { allowed: true, remaining: maxRequests, resetAt: new Date() };
  }
}

export function getClientIP(req:Request){
  return (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown').trim();
}

export function rateLimitResponse(resetAt:Date){
  return Response.json(
    {error:'Too many requests. Please try again shortly.'},
    {
      status:429,
      headers:{'Retry-After':String(Math.max(1,Math.ceil((resetAt.getTime()-Date.now())/1000)))}
    }
  );
}