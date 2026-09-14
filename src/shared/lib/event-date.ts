const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;

export function parseEventDate(value:string):Date|null{
  if(!ISO_DATE.test(value))return null;
  const parsed=new Date(`${value}T00:00:00`);
  return Number.isFinite(parsed.getTime())?parsed:null;
}

export function formatEventDate(value:string,options:Intl.DateTimeFormatOptions={day:'numeric',month:'short'}){
  const parsed=parseEventDate(value);
  return parsed?parsed.toLocaleDateString('en-IN',options):value.trim();
}

export function eventDateParts(value:string){
  const parsed=parseEventDate(value);
  if(parsed)return {
    day:String(parsed.getDate()),
    month:parsed.toLocaleDateString('en-IN',{month:'short'}).toUpperCase(),
    weekday:parsed.toLocaleDateString('en-IN',{weekday:'short'}).toUpperCase(),
  };
  const range=value.trim().match(/^(\d{1,2})\s*(?:-|–|—|to)\s*(\d{1,2})\s+([a-z]{3,9})(?:\s+(\d{4}))?$/i);
  if(range)return {day:`${range[1]}–${range[2]}`,month:range[3].slice(0,3).toUpperCase(),weekday:''};
  return {day:value.trim(),month:'',weekday:''};
}

export function eventTimestamp(date:string,time=''){
  if(!ISO_DATE.test(date))return null;
  const normalizedTime=/^\d{2}:\d{2}$/.test(time)?time:'23:59';
  const timestamp=new Date(`${date}T${normalizedTime}:00+05:30`).getTime();
  return Number.isFinite(timestamp)?timestamp:null;
}

export function isEventPast(date:string,time=''){
  const timestamp=eventTimestamp(date,time);
  return timestamp===null?false:timestamp<Date.now();
}

export function eventSortTimestamp(date:string){
  return parseEventDate(date)?.getTime()??Number.MAX_SAFE_INTEGER;
}
