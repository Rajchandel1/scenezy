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
      
      setSuccess(`Successfully issued ${data.passes.length} pass(es) to ${users.find(u=>u.id===form.userId)?.name}`);
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
