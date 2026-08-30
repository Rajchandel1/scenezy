const PUBLIC_MARKER='/storage/v1/object/public/event-posters/';
const SIGNED_MARKER='/storage/v1/object/sign/event-posters/';

export function eventPosterUrl(value:string|null|undefined){
  if(!value)return null;
  if(value.startsWith('/api/data/uploads/event-poster?path='))return value;
  const marker=value.includes(PUBLIC_MARKER)?PUBLIC_MARKER:value.includes(SIGNED_MARKER)?SIGNED_MARKER:'';
  if(!marker)return value;
  const encodedPath=value.split(marker)[1]?.split('?')[0];
  if(!encodedPath)return value;
  try{return `/api/data/uploads/event-poster?path=${encodeURIComponent(decodeURIComponent(encodedPath))}`;}
  catch{return `/api/data/uploads/event-poster?path=${encodeURIComponent(encodedPath)}`;}
}
