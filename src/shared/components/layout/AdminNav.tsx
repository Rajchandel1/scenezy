'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, LayoutDashboard, PanelsTopLeft, Store, Ticket, Users } from 'lucide-react';
import { PassLogo } from '@/shared/components/branding/PassLogo';

const items = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/content', label: 'Home CMS', icon: PanelsTopLeft },
  { href: '/admin/sellers', label: 'Sellers', icon: Store },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/passes', label: 'Passes', icon: Ticket },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="app-header">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-5">
        <Link href="/admin" className="flex items-center gap-2 shrink-0">
          <PassLogo className="w-10 h-10"/>
          <span className="hidden sm:block display-serif text-lg">Scenezy Admin</span>
        </Link>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide ml-auto">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`));
            return <Link key={href} href={href} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${active ? 'brand-button' : 'muted hover:text-white hover:bg-white/5'}`}><Icon size={16} /><span className="hidden md:inline">{label}</span></Link>;
          })}
        </div>
      </div>
    </nav>
  );
}
