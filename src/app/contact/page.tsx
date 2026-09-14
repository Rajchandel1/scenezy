import Link from 'next/link';
import { Mail, Phone, TicketCheck } from 'lucide-react';
import { PassLogo } from '@/shared/components/branding/PassLogo';
import { PublicFooter } from '@/shared/components/legal/PublicFooter';

export default function ContactPage() {
  return <main className="min-h-screen app-shell px-5 py-8"><article className="mx-auto max-w-2xl">
    <Link href="/" className="inline-flex items-center gap-2"><PassLogo className="h-10 w-10"/><span className="font-semibold">Scenezy</span></Link>
    <header className="mt-10"><p className="eyebrow">Support</p><h1 className="display-serif mt-2 text-4xl">Contact Us</h1><p className="muted mt-3 max-w-xl text-sm leading-7">Scenezy is an online event-ticketing platform. Contact us about payments, ticket delivery, account access, transfers, event listings or organizer support.</p></header>
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <a href="mailto:scenezyin@gmail.com" className="surface-raised rounded-2xl p-5 transition hover:border-blue-500/50"><Mail className="h-5 w-5 text-blue-400"/><p className="eyebrow mt-5">Email</p><p className="mt-1 font-semibold">scenezyin@gmail.com</p></a>
      <a href="tel:+919265461135" className="surface-raised rounded-2xl p-5 transition hover:border-blue-500/50"><Phone className="h-5 w-5 text-blue-400"/><p className="eyebrow mt-5">Phone</p><p className="mt-1 font-semibold">+91 92654 61135</p></a>
    </div>
    <section className="surface mt-5 rounded-2xl p-5"><div className="flex gap-3"><TicketCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-400"/><div><h2 className="font-semibold">For faster booking support</h2><p className="muted mt-2 text-sm leading-6">Include your registered email, event name, order ID and payment transaction reference. Never send your password, OTP, UPI PIN or complete card details.</p></div></div></section>
    <div className="mt-12"><PublicFooter compact/></div>
  </article></main>;
}
