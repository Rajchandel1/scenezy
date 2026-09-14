import Link from 'next/link';

const links = [
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cancellation-refund-policy', label: 'Cancellation & Refund Policy' },
  { href: '/contact', label: 'Contact Us' },
];

export function PublicFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={`border-t border-[var(--line)] ${compact ? 'pt-5' : 'px-5 py-8'}`}>
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Legal and support" className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-center text-xs">
          {links.map(link => <Link key={link.href} href={link.href} className="text-[var(--muted)] transition hover:text-[var(--ink)]">{link.label}</Link>)}
        </nav>
        {!compact && (
          <div className="mt-6 text-center text-xs leading-6 text-[var(--muted)]">
            <p><a href="mailto:scenezyin@gmail.com" className="hover:text-[var(--ink)]">scenezyin@gmail.com</a> · <a href="tel:+919265461135" className="hover:text-[var(--ink)]">+91 92654 61135</a></p>
            <p className="mt-1">Scenezy is an online event-ticketing platform serving customers digitally.</p>
          </div>
        )}
      </div>
    </footer>
  );
}
