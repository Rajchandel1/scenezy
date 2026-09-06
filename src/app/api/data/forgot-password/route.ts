export async function POST(){
  return Response.json({error:'Legacy OTP reset is disabled. Use Supabase password recovery.'},{status:410});
}
