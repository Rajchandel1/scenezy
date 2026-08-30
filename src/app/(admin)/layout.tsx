import { AdminNav } from '@/shared/components/layout/AdminNav';
import { requirePageRole } from '@/shared/lib/page-auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(['ADMIN']);
  return (
    <div className="app-shell">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-6 pb-14">{children}</main>
    </div>
  );
}
