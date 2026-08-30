import { BottomNav } from '@/shared/components/layout/BottomNav';
import { requirePageRole } from '@/shared/lib/page-auth';

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(['SELLER']);
  return (
    <div className="app-shell">
      <main className="pb-24 max-w-xl mx-auto min-h-screen">{children}</main>
      <BottomNav />
    </div>
  );
}
