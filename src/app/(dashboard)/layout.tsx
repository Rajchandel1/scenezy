import { BottomNav } from '@/shared/components/layout/BottomNav';
import { ToastProvider } from '@/shared/components/ui/Toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="app-shell">
        <main className="pb-24 max-w-xl mx-auto min-h-screen">{children}</main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
