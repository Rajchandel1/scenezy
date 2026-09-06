import { BottomNav } from '@/shared/components/layout/BottomNav';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <main className="pb-24 max-w-xl mx-auto min-h-screen">{children}</main>
      <BottomNav />
    </div>
  );
}
