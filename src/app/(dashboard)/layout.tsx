import { BottomNav } from '@/shared/components/layout/BottomNav';
import { ToastProvider } from '@/shared/components/ui/Toast';
import { requirePageRole } from '@/shared/lib/page-auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(['USER','SELLER','ADMIN']);
  return (
    <ToastProvider>
      <div className="app-shell">
        <main className="pb-24 max-w-xl mx-auto min-h-screen">{children}</main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
