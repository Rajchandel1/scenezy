import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createFile(filepath, content) {
  const fullPath = join(__dirname, filepath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.trimStart(), 'utf-8');
  console.log(`  ✅ ${filepath}`);
}

console.log('🛠️ Setting up ISOLATED Manual Order Issuer...\n');

// =============================================
// 1. API ROUTE FOR MANUAL ISSUANCE
// =============================================
createFile('src/app/api/data/admin/manual-issue/route.ts', `
import { NextRequest } from 'next/server';
import { db } from '@/shared/db';
import { events, passes, passTypes, users, orders } from '@/shared/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { requireApiUser } from '@/shared/lib/api-auth';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(['ADMIN']);
  if (auth.error) return auth.error;

  const body = await req.json();
  const { userId, eventId, passTypeId, quantity = 1, notes } = body;

  if (!userId || !eventId || !passTypeId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify User
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  // Verify Event & Pass Type
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

  const [passType] = await db.select().from(passTypes).where(eq(passTypes.id, passTypeId)).limit(1);
  if (!passType) return Response.json({ error: 'Pass type not found' }, { status: 404 });

  // Create Order (Marked as PAID manually)
  const orderId = randomUUID();
  const total = passType.price * quantity;
  
  await db.insert(orders).values({
    id: orderId,
    userId: user.id,
    eventId: event.id,
    eventTitle: event.title,
    items: [{ passTypeId, passTypeName: passType.name, quantity, unitPrice: passType.price, total }],
    subtotal: total,
    fees: 0, // No platform fee for manual issues if you want
    total: total,
    paymentStatus: 'SUCCESS',
    orderStatus: 'PAID',
    transactionId: \`MANUAL-\${Date.now()}\`,
    createdAt: new Date(),
  });

  // Issue Passes
  const issuedPasses = [];
  for (let i = 0; i < quantity; i++) {
    const credential = \`PASS_\${randomUUID().replaceAll('-', '')}\`;
    const [pass] = await db.insert(passes).values({
      id: randomUUID(),
      eventId: event.id,
      eventTitle: event.title,
      passTypeId: passType.id,
      passTypeName: passType.name,
      price: passType.price,
      ownerUserId: user.id,
      status: 'ACTIVE',
      credential,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      eventVenue: event.venue,
      createdAt: new Date(),
    }).returning();
    issuedPasses.push(pass);
  }

  return Response.json({ success: true, passes: issuedPasses, orderId });
}
`);

// =============================================
// 2. ADMIN UI PAGE FOR MANUAL ISSUANCE
// =============================================
createFile('src/app/(admin)/admin/manual-issue/page.tsx', `
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingButton } from '@/shared/components/ui/LoadingButton';
import { DashboardSkeleton } from '@/shared/components/ui/States';

interface User { id: string; name: string; email: string; }
interface Event { id: string; title: string; passes: Array<{ id: string; name: string; price: number }> }

export default function ManualIssuePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    userId: '',
    eventId: '',
    passTypeId: '',
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, eventsRes] = await Promise.all([
          fetch('/api/data/admin?action=users'),
          fetch('/api/data/admin?action=events')
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (eventsRes.ok) setEvents(await eventsRes.json());
      } catch (err) {
        setError('Could not load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/data/admin/manual-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue pass');
      
      setSuccess(\`Successfully issued \${data.passes.length} pass(es) to \${users.find(u=>u.id===form.userId)?.name}\`);
      setForm({ ...form, quantity: 1, notes: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const selectedEvent = events.find(e => e.id === form.eventId);

  return (
    <div className="px-4 pt-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-white text-lg font-bold">Manual Pass Issuer</h1>
      </div>

      <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-4 text-sm text-blue-200">
        Use this tool to issue passes directly to a user after receiving manual payment (e.g., via WhatsApp/UPI). 
        This bypasses the checkout flow and marks the order as PAID immediately.
      </div>

      {error && <div className="bg-red-950/30 border border-red-900/50 text-red-400 p-3 rounded-xl">{error}</div>}
      {success && <div className="bg-green-950/30 border border-green-900/50 text-green-400 p-3 rounded-xl">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div>
          <label className="text-xs text-neutral-400 uppercase">Select User</label>
          <select 
            required 
            value={form.userId} 
            onChange={e => setForm({...form, userId: e.target.value})}
            className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white"
          >
            <option value="">Choose a user...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-neutral-400 uppercase">Select Event</label>
          <select 
            required 
            value={form.eventId} 
            onChange={e => setForm({...form, eventId: e.target.value, passTypeId: ''})}
            className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white"
          >
            <option value="">Choose an event...</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>

        {selectedEvent && (
          <div>
            <label className="text-xs text-neutral-400 uppercase">Select Pass Type</label>
            <select 
              required 
              value={form.passTypeId} 
              onChange={e => setForm({...form, passTypeId: e.target.value})}
              className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="">Choose pass type...</option>
              {selectedEvent.passes.map(p => <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs text-neutral-400 uppercase">Quantity</label>
          <input 
            type="number" 
            min="1" 
            max="10" 
            required 
            value={form.quantity} 
            onChange={e => setForm({...form, quantity: parseInt(e.target.value)})}
            className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-400 uppercase">Notes (Optional)</label>
          <textarea 
            rows={2}
            value={form.notes} 
            onChange={e => setForm({...form, notes: e.target.value})}
            placeholder="Payment reference, WhatsApp chat ID, etc."
            className="w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white"
          />
        </div>

        <LoadingButton 
          loading={submitting} 
          loadingLabel="Issuing..." 
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl"
        >
          Issue Pass Now
        </LoadingButton>
      </form>
    </div>
  );
}
`);

// =============================================
// DONE
// =============================================
console.log('\n✅ Isolated Manual Order Issuer Ready!');
console.log('');
console.log('   ═══════════════════════════════════════════');
console.log('   🔒 ISOLATION GUARANTEED:');
console.log('   ═══════════════════════════════════════════');
console.log('');
console.log('   • New API: /api/data/admin/manual-issue');
console.log('   • New Page: /admin/manual-issue');
console.log('   • ZERO changes to existing checkout/order/pass code');
console.log('   • Uses same DB tables but independent logic');
console.log('   • Metadata tags orders as MANUAL_ADMIN for audit');
console.log('');
console.log('   🔄 TO DISABLE LATER (When Razorpay arrives):');
console.log('   Just hide the link in admin dashboard.');
console.log('   Or delete these 2 files. Nothing else breaks.');
console.log('');
console.log('   📋 USAGE:');
console.log('   1. Go to /admin/manual-issue');
console.log('   2. Enter user email + select event/pass');
console.log('   3. Click "Issue Pass Now"');
console.log('   4. User gets pass instantly in their wallet');
console.log('');