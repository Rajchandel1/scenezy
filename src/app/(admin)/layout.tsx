import { AdminNav } from '@/shared/components/layout/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-6 pb-14">{children}</main>
    </div>
  );
}
