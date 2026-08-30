'use client';
import { useRef, useState } from 'react';
import { X } from 'lucide-react';

type Choice={label:string;value:string};
type Options={title:string;description?:string;confirmLabel?:string;cancelLabel?:string;tone?:'default'|'danger';field?:{label:string;defaultValue?:string;placeholder?:string;choices?:Choice[];required?:boolean}};
type State=Options&{open:boolean};

export function useActionDialog(){
  const [state,setState]=useState<State>({open:false,title:''}),[value,setValue]=useState('');
  const resolver=useRef<((value:string|null)=>void)|null>(null);
  const ask=(options:Options)=>new Promise<string|null>(resolve=>{resolver.current=resolve;setValue(options.field?.defaultValue||options.field?.choices?.[0]?.value||'');setState({...options,open:true});});
  const close=(result:string|null)=>{setState(current=>({...current,open:false}));resolver.current?.(result);resolver.current=null;};
  const dialog=state.open?<div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm p-4 grid place-items-center" onMouseDown={event=>event.target===event.currentTarget&&close(null)}><div role="dialog" aria-modal="true" aria-labelledby="action-dialog-title" className="surface w-full max-w-md rounded-[1.75rem] border border-[var(--line)] p-5 shadow-2xl animate-in"><div className="flex items-start gap-4"><div className="min-w-0 flex-1"><p className="eyebrow">Scenezy control</p><h2 id="action-dialog-title" className="display-serif text-2xl text-[var(--ink)] mt-1">{state.title}</h2>{state.description&&<p className="muted text-sm leading-6 mt-2">{state.description}</p>}</div><button onClick={()=>close(null)} aria-label="Close dialog" className="w-9 h-9 rounded-full bg-[var(--soft)] grid place-items-center shrink-0"><X size={16}/></button></div>{state.field&&<label className="block mt-5 text-xs font-semibold"><span className="muted">{state.field.label}</span>{state.field.choices?<select autoFocus value={value} onChange={event=>setValue(event.target.value)} className="app-input w-full rounded-xl px-4 py-3 mt-2">{state.field.choices.map(choice=><option key={choice.value} value={choice.value}>{choice.label}</option>)}</select>:<input autoFocus value={value} onChange={event=>setValue(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&(!state.field?.required||value.trim()))close(value.trim())}} placeholder={state.field.placeholder} className="app-input w-full rounded-xl px-4 py-3 mt-2"/>}</label>}<div className="grid grid-cols-2 gap-3 mt-6"><button onClick={()=>close(null)} className="rounded-xl border border-[var(--line)] py-3 text-sm font-semibold">{state.cancelLabel||'Cancel'}</button><button onClick={()=>close(state.field?value.trim():'confirmed')} disabled={Boolean(state.field?.required&&!value.trim())} className={`rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40 ${state.tone==='danger'?'bg-red-600':'brand-button'}`}>{state.confirmLabel||'Confirm'}</button></div></div></div>:null;
  return {ask,dialog};
}
