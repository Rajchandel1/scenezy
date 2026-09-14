'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth';
import { PageLoading, Spinner } from '@/shared/components/ui/States';

interface EventOption { id: string; title: string; passes: Array<{ id: string; name: string; price: number }> }

export default function ManualOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [form, setForm] = useState({
    userEmail: '',
    eventId: '',
    passTypeId: '',
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    // Verify admin access
    authService.getCurrentUser().then(u => {
      if (!u || u.role !== 'ADMIN') {
        router.push('/home');
        return;
      }
      setLoading(false);
    });

    // Load active events
    fetch('/api/data/events')
      .then(r => r.json())
      .then(data => setEvents(data.filter((e: any) => e.status === 'ACTIVE')))
      .catch(() => setErrorMsg('Could not load events'));
  }, [router]);

  const selectedEvent = events.find(e => e.id === form.eventId);
  const selectedPass = selectedEvent?.passes.find(p => p.id === form.passTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/data/admin/manual-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue pass');
      }

      setSuccessMsg(data.message);
      setForm({ userEmail: '', eventId: '', passTypeId: '', quantity: 1, notes: '' });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoading message="Verifying admin access..." />;

  return (
    <div className="px-4 pt-7 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/admin')} className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <p className="text-[#c4f000] text-[10px] font-bold uppercase tracking-[.2em]">Admin Only</p>
          <h1 className="text-white text-2xl font-bold">Issue Manual Pass</h1>
        </div>
      </div>

      <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4">
        <p className="text-amber-400 text-xs leading-relaxed">
          ⚠️ This creates a PAID order without payment gateway verification. 
          Use only after confirming payment via UPI/Bank Transfer externally.
        </p>
      </div>

      {successMsg && (
        <div className="bg-green-950/30 border border-green-900/50 text-green-400 text-sm rounded-xl px-4 py-3 animate-in fade-in">
          ✅ {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">
          ❌ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User Email */}
        <div className="space-y-1.5">
          <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Recipient Email</label>
          <input 
            type="email" 
            required 
            value={form.userEmail}
            onChange={e => setForm({...form, userEmail: e.target.value})}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] transition-all"
            placeholder="user@example.com"
          />
        </div>

        {/* Event Selection */}
        <div className="space-y-1.5">
          <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Event</label>
          <select 
            required
            value={form.eventId}
            onChange={e => setForm({...form, eventId: e.target.value, passTypeId: ''})}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4f000] transition-all"
          >
            <option value="">Select an event...</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>

        {/* Pass Type Selection */}
        {selectedEvent && (
          <div className="space-y-1.5 animate-in slide-in-from-top-2">
            <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Pass Type</label>
            <select 
              required
              value={form.passTypeId}
              onChange={e => setForm({...form, passTypeId: e.target.value})}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4f000] transition-all"
            >
              <option value="">Select pass type...</option>
              {selectedEvent.passes.map(p => (
                <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
              ))}
            </select>
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-1.5">
          <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Quantity</label>
          <input 
            type="number" 
            min="1" 
            max="20"
            required 
            value={form.quantity}
            onChange={e => setForm({...form, quantity: parseInt(e.target.value) || 1})}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4f000] transition-all"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Admin Notes (Optional)</label>
          <textarea 
            rows={2}
            value={form.notes}
            onChange={e => setForm({...form, notes: e.target.value})}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] transition-all resize-none"
            placeholder="Payment ref: UPI123456..."
          />
        </div>

        {/* Summary */}
        {selectedPass && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Subtotal</span>
              <span className="text-white">₹{selectedPass.price * form.quantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Platform Fee (5%)</span>
              <span className="text-white">₹{Math.round(selectedPass.price * form.quantity * 0.05)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-neutral-800">
              <span className="text-white">Total Value</span>
              <span className="text-[#c4f000]">₹{Math.round(selectedPass.price * form.quantity * 1.05)}</span>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={submitting || !form.userEmail || !form.eventId || !form.passTypeId}
          className="w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><Spinner size="sm" className="text-black" /> Issuing Pass...</>
          ) : (
            'Confirm & Issue Pass'
          )}
        </button>
      </form>
    </div>
  );
}
