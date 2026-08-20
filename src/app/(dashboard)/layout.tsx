import { BottomNav } from '@/shared/components/layout/BottomNav';
import { ToastProvider } from '@/shared/components/ui/Toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0a0a0a]">
        <main className="pb-20 max-w-lg mx-auto">{children}</main>
        <BottomNav />
      </div>
    </ToastProvider>
  );
}
