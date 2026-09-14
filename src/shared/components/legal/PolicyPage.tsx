import Link from 'next/link';
import { PassLogo } from '@/shared/components/branding/PassLogo';
import { PublicFooter } from './PublicFooter';

export function PolicyPage({eyebrow,title,updated,sections}:{eyebrow:string;title:string;updated:string;sections:Array<{title:string;body:string}>}){
  return <main className="min-h-screen app-shell px-5 py-8"><article className="max-w-2xl mx-auto"><Link href="/" className="inline-flex items-center gap-2"><PassLogo className="w-10 h-10"/><span className="font-semibold">Scenezy</span></Link><header className="mt-10"><p className="eyebrow">{eyebrow}</p><h1 className="display-serif text-4xl mt-2">{title}</h1><p className="muted text-xs mt-2">Last updated: {updated}</p></header><div className="space-y-7 mt-10">{sections.map(section=><section key={section.title}><h2 className="font-semibold text-lg">{section.title}</h2><p className="muted leading-7 text-sm mt-2 whitespace-pre-line">{section.body}</p></section>)}</div><div className="mt-12"><PublicFooter compact/></div></article></main>;
}
