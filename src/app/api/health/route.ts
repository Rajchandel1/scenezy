import { sql } from 'drizzle-orm';
import { db } from '@/shared/db';

export const dynamic='force-dynamic';
export async function GET(){
  const started=Date.now();
  try{await db.execute(sql`select 1`);return Response.json({status:'ok',database:'reachable',latencyMs:Date.now()-started},{headers:{'Cache-Control':'no-store'}})}
  catch(error){console.error('[health] database unavailable',error);return Response.json({status:'degraded',database:'unreachable'},{status:503,headers:{'Cache-Control':'no-store'}})}
}
