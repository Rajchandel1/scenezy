export async function POST(){
  return Response.json({error:'Legacy authentication is disabled. Use Supabase Auth.'},{status:410});
}
