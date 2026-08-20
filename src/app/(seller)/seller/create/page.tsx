'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth';
import { SellerService } from '@/features/seller';

const CATEGORIES = ['Party', 'Music', 'Conference', 'Comedy', 'Business', 'Sports', 'Workshop', 'Other'];

interface PassInput { name: string; price: number; benefits: string; available: number; transferAllowed: boolean; }

export default function CreateEventPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '', location: '', venue: '', category: 'Party',
    passes: [{ name: 'General', price: 499, benefits: 'Standard entry', available: 100, transferAllowed: true }] as PassInput[],
  });

  const addPassType = () => {
    setForm({ ...form, passes: [...form.passes, { name: '', price: 0, benefits: '', available: 100, transferAllowed: true }] });
  };

  const updatePass = (idx: number, field: keyof PassInput, value: any) => {
    const passes = [...form.passes];
    passes[idx] = { ...passes[idx], [field]: value };
    setForm({ ...form, passes });
  };

  const removePass = (idx: number) => {
    if (form.passes.length <= 1) return;
    setForm({ ...form, passes: form.passes.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async () => {
    const user = await authService.getCurrentUser();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      await SellerService.createEvent({
        ...form,
        sellerId: user.id,
        sellerName: user.name,
        passes: form.passes.filter(p => p.name && p.price > 0),
      });
      setCreated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return form.title.trim().length > 0;
    if (step === 2) return form.date && form.time;
    if (step === 3) return form.location.trim() && form.venue.trim();
    if (step === 4) return form.passes.some(p => p.name && p.price > 0);
    return true;
  };

  // Success screen
  if (created) {
    return (
      <div className="px-4 pt-6 pb-8">
        <div className="max-w-[340px] mx-auto text-center space-y-6 py-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-900/30 border border-yellow-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-white text-xl font-bold">Event Submitted!</h2>
            <p className="text-neutral-400 text-sm">Your event is pending admin approval. It will appear in Explore once approved.</p>
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push('/seller')} className="w-full bg-[#c4f000] text-black font-bold py-3 rounded-xl active:scale-[0.98] transition-all">Back to Dashboard</button>
            <button onClick={() => { setCreated(false); setStep(1); setForm({ title: '', description: '', date: '', time: '', location: '', venue: '', category: 'Party', passes: [{ name: 'General', price: 499, benefits: 'Standard entry', available: 100, transferAllowed: true }] }); }} className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium py-3 rounded-xl active:scale-[0.98] transition-all">Create Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-8 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-white text-lg font-bold">Create Event</h1>
      </div>

      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-[#c4f000]' : 'bg-neutral-800'}`} />
        ))}
      </div>
      <p className="text-neutral-500 text-xs text-center">Step {step} of 5</p>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-white font-semibold">What are you hosting?</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-xs uppercase tracking-wider">Event Name</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="College Night 2026"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-xs uppercase tracking-wider">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Tell people what to expect..." rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] transition-all resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-xs uppercase tracking-wider">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.category === cat ? 'bg-[#c4f000] text-black' : 'bg-neutral-900 text-neutral-400 border border-neutral-800'}`}>{cat}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-white font-semibold">When is it?</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-xs uppercase tracking-wider">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4f000] transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-xs uppercase tracking-wider">Time</label>
              <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#c4f000] transition-all" />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-white font-semibold">Where is it?</h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-xs uppercase tracking-wider">City</label>
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Ahmedabad"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-400 text-xs uppercase tracking-wider">Venue</label>
              <input value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="Riverfront Arena"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] transition-all" />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-white font-semibold">Pass types & pricing</h2>
          <div className="space-y-3">
            {form.passes.map((pass, idx) => (
              <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-xs font-medium">Pass Type {idx + 1}</span>
                  {form.passes.length > 1 && <button type="button" onClick={() => removePass(idx)} className="text-red-400 text-xs">Remove</button>}
                </div>
                <input value={pass.name} onChange={e => updatePass(idx, 'name', e.target.value)} placeholder="General / VIP / VVIP"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#c4f000]" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={pass.price || ''} onChange={e => updatePass(idx, 'price', Number(e.target.value))} placeholder="Price"
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#c4f000]" />
                  <input type="number" value={pass.available || ''} onChange={e => updatePass(idx, 'available', Number(e.target.value))} placeholder="Quantity"
                    className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#c4f000]" />
                </div>
                <input value={pass.benefits} onChange={e => updatePass(idx, 'benefits', e.target.value)} placeholder="Benefits (e.g., Standard entry)"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-[#c4f000]" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={pass.transferAllowed} onChange={e => updatePass(idx, 'transferAllowed', e.target.checked)} className="w-4 h-4 rounded accent-[#c4f000]" />
                  <span className="text-neutral-400 text-xs">Transfer allowed</span>
                </label>
              </div>
            ))}
            <button type="button" onClick={addPassType} className="w-full border border-dashed border-neutral-700 rounded-xl py-3 text-neutral-400 text-sm hover:border-[#c4f000] hover:text-[#c4f000] transition-all">+ Add another pass type</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h2 className="text-white font-semibold">Review & Submit</h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 text-sm">
            <div><span className="text-neutral-500">Event:</span> <span className="text-white ml-2">{form.title}</span></div>
            <div><span className="text-neutral-500">Date:</span> <span className="text-white ml-2">{form.date} at {form.time}</span></div>
            <div><span className="text-neutral-500">Location:</span> <span className="text-white ml-2">{form.venue}, {form.location}</span></div>
            <div><span className="text-neutral-500">Category:</span> <span className="text-white ml-2">{form.category}</span></div>
            <div className="pt-2 border-t border-neutral-800">
              <span className="text-neutral-500">Passes:</span>
              {form.passes.filter(p => p.name && p.price > 0).map((p, i) => (
                <div key={i} className="flex justify-between mt-1 pl-2">
                  <span className="text-white">{p.name}</span>
                  <span className="text-[#c4f000]">₹{p.price} x {p.available}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-yellow-950/20 border border-yellow-900/40 rounded-xl p-3">
            <p className="text-yellow-400/80 text-xs"> Your event will be submitted for admin approval. It won't appear in Explore until approved.</p>
          </div>
          {error && <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button type="button" onClick={() => setStep(step - 1)} className="flex-1 bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium py-3.5 rounded-xl transition-all active:scale-[0.98]">Back</button>
        )}
        {step < 5 ? (
          <button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed()}
            className="flex-1 bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        )}
      </div>
    </div>
  );
}
