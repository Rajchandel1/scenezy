import { createClient } from '@supabase/supabase-js';
import { requireApiUser } from '@/shared/lib/api-auth';

const MAX_BYTES=6*1024*1024;
const types:Record<string,{extension:string;signature:(bytes:Uint8Array)=>boolean}>={
  'image/jpeg':{extension:'jpg',signature:bytes=>bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff},
  'image/png':{extension:'png',signature:bytes=>bytes.slice(0,8).join(',')==='137,80,78,71,13,10,26,10'},
  'image/webp':{extension:'webp',signature:bytes=>new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'},
};

export async function GET(request:Request){
  const auth=await requireApiUser();
  if(auth.error)return auth.error;
  const path=new URL(request.url).searchParams.get('path')||'';
  if(!/^[0-9a-f-]{36}\/\d{4}-\d{2}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(path))return Response.json({error:'Invalid poster path'},{status:400});
  const supabase=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await supabase.storage.from('event-posters').createSignedUrl(path,3600);
  if(error||!data?.signedUrl)return Response.json({error:'Poster is unavailable'},{status:404});
  return new Response(null,{status:307,headers:{Location:data.signedUrl,'Cache-Control':'private, max-age=3300'}});
}

export async function POST(request:Request){
  const auth=await requireApiUser(['SELLER']);
  if(auth.error)return auth.error;
  if(!auth.profile.approved)return Response.json({error:'Seller approval is required before uploading posters'},{status:403});
  try{
    const form=await request.formData(),file=form.get('file');
    if(!(file instanceof File))return Response.json({error:'Choose an image to upload'},{status:400});
    if(file.size<1||file.size>MAX_BYTES)return Response.json({error:'Poster must be smaller than 6 MB'},{status:400});
    const type=types[file.type];
    if(!type)return Response.json({error:'Use a JPG, PNG or WebP image'},{status:400});
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(!type.signature(bytes))return Response.json({error:'The selected file is not a valid image'},{status:400});
    const supabase=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
    const month=new Date().toISOString().slice(0,7),path=`${auth.profile.id}/${month}/${crypto.randomUUID()}.${type.extension}`;
    const {error}=await supabase.storage.from('event-posters').upload(path,bytes,{contentType:file.type,cacheControl:'31536000',upsert:false});
    if(error){console.error('[Poster upload]',error);return Response.json({error:error.message.includes('Bucket not found')?'Storage bucket event-posters is not configured':'Poster upload failed'},{status:500});}
    return Response.json({url:`/api/data/uploads/event-poster?path=${encodeURIComponent(path)}`,path});
  }catch(error){console.error('[Poster upload]',error);return Response.json({error:'Poster upload failed'},{status:500});}
}

export async function DELETE(request:Request){
  const auth=await requireApiUser(['SELLER']);
  if(auth.error)return auth.error;
  try{
    const path=String((await request.json()).path||'');
    if(!path.startsWith(`${auth.profile.id}/`))return Response.json({error:'Invalid poster path'},{status:403});
    const supabase=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error}=await supabase.storage.from('event-posters').remove([path]);
    if(error)throw error;
    return Response.json({success:true});
  }catch(error){console.error('[Poster cleanup]',error);return Response.json({error:'Poster cleanup failed'},{status:500});}
}
