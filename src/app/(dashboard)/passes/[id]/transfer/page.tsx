'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authService, AuthUser } from '@/features/auth';
import { PassService, Pass } from '@/features/passes';
import { TransferService, Transfer } from '@/features/transfers';

export default function TransferPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pass, setPass] = useState<Pass | null>(null);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [recipient, setRecipient] = useState('');

  useEffect(() => {
    async function load() {
      const u = await authService.getCurrentUser();
      const p = await PassService.getPassById(params.id as string);
      setUser(u);
      setPass(p);
      if (u && p) {
        const existing = await TransferService.getPendingTransferForPass(p.id);
        if (existing) {
          setTransfer(existing);
          setSuccess(true);
        }
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  const handleSend = async () => {
    if (!user || !pass || !recipient.trim()) return;
    setSending(true);
    setError('');

    try {
      const t = await TransferService.createTransfer({
        passId: pass.id,
        senderUserId: user.id,
        senderName: user.name,
        recipientIdentifier: recipient.trim(),
        eventTitle: pass.eventTitle,
        passTypeName: pass.passTypeName,
        eventDate: pass.eventDate,
        eventTime: pass.eventTime,
        eventLocation: pass.eventLocation,
        eventVenue: pass.eventVenue,
      });
      setTransfer(t);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send transfer');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    if (!transfer || !user) return;
    setCancelling(true);
    const result = await TransferService.cancelTransfer(transfer.id, user.id);
    if (result.success) {
      setTransfer(null);
      setSuccess(false);
      setRecipient('');
    } else {
      setError(result.message);
    }
    setCancelling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (!pass) {
    return (
      <div className="px-4 pt-6 text-center">
        <p className="text-neutral-500">Pass not found</p>
        <button onClick={() => router.back()} className="text-[#c4f000] text-sm mt-2">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-6">
      <div className="max-w-[340px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-white text-lg font-bold">Give to a friend</h1>
        </div>

        {/* Pass Info */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-2">
          <p className="text-[#c4f000] text-xs font-medium uppercase tracking-wider">{pass.passTypeName}</p>
          <p className="text-white font-semibold">{pass.eventTitle}</p>
          <p className="text-neutral-500 text-xs">{new Date(pass.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {pass.eventTime}</p>
        </div>

        {!success ? (
          /* STEP 1: Enter recipient email/phone */
          <div className="space-y-4">
            <div className="text-center space-y-2 py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#c4f000]/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#c4f000]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p className="text-white font-medium text-sm">Who should receive this pass?</p>
              <p className="text-neutral-500 text-xs">Enter their email. They'll see it in their Passes tab.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-neutral-400 text-xs font-medium uppercase tracking-wider">Friend's Email</label>
              <input
                type="email"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="friend@example.com"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#c4f000] focus:ring-1 focus:ring-[#c4f000] transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <button
              onClick={handleSend}
              disabled={sending || !recipient.trim()}
              className="w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send Pass'}
            </button>

            <div className="bg-neutral-900/50 border border-neutral-800/50 rounded-xl p-3 space-y-1">
              <p className="text-neutral-500 text-[11px] leading-relaxed">
                • Your pass stays active until they claim it<br/>
                • You can cancel anytime before they claim<br/>
                • Once claimed, you won't be able to use this pass<br/>
                • Transfer expires in 48 hours
              </p>
            </div>
          </div>
        ) : (
          /* STEP 2: Transfer sent confirmation */
          <div className="space-y-4">
            <div className="text-center space-y-3 py-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#c4f000]/10 border border-[#c4f000]/30 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#c4f000]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-white font-bold">Pass sent ✓</p>
                <p className="text-neutral-500 text-xs mt-1">Waiting for {transfer?.recipientIdentifier} to claim</p>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-neutral-900 border border-orange-900/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-orange-300 text-xs font-medium">TRANSFER PENDING</span>
              </div>
              <p className="text-neutral-400 text-xs">Your pass is still active. You can use it until your friend claims it.</p>
            </div>

            {error && (
              <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Transfer'}
            </button>

            <button
              onClick={() => router.push('/passes')}
              className="w-full text-neutral-500 text-sm py-2"
            >
              ← Back to My Passes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
