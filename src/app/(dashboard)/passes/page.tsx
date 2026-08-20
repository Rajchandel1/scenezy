'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService, AuthUser } from '@/features/auth';
import { PassService, Pass } from '@/features/passes';
import { TransferService, Transfer } from '@/features/transfers';
import { PassCardSkeleton } from '@/shared/components/ui/Skeleton';
import { useToast } from '@/shared/components/ui/Toast';

function PassCard({ pass, hasPendingTransfer }: { pass: Pass; hasPendingTransfer: boolean }) {
  const dateObj = new Date(pass.eventDate);
  const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <Link href={`/passes/${pass.id}`} className="block bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden active:scale-[0.98] transition-all duration-200 hover:border-neutral-700">
      <div className="h-1.5 bg-gradient-to-r from-[#c4f000] to-[#c4f000]/60" />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm">{pass.eventTitle}</h3>
            <p className="text-neutral-500 text-xs mt-0.5">{dateStr} · {pass.eventTime} · {pass.eventLocation}</p>
          </div>
          {hasPendingTransfer ? (
            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-medium text-orange-400 bg-orange-950/30 border-orange-900/50">PENDING</span>
          ) : (
            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border font-medium text-[#c4f000] bg-[#c4f000]/10 border-[#c4f000]/30">{pass.status}</span>
          )}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          <span className="text-neutral-400 text-xs">{pass.passTypeName}</span>
          <span className="text-[#c4f000] text-xs font-bold flex items-center gap-1">
            SHOW PASS
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function ClaimCard({ transfer, onClaimed }: { transfer: Transfer; onClaimed: () => void }) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { addToast } = useToast();

  const handleClaim = async () => {
    const user = await authService.getCurrentUser();
    if (!user) return;
    setClaiming(true);
    setError('');
    const result = await TransferService.claimTransfer({
      transferId: transfer.id,
      recipientUserId: user.id,
      recipientName: user.name,
      recipientIdentifier: user.email,
    });
    if (result.success) {
      addToast('Pass claimed successfully! 🎉', 'success');
      onClaimed();
      router.push(`/passes/${result.passId}`);
    } else {
      setError(result.message);
    }
    setClaiming(false);
  };

  return (
    <div className="bg-neutral-900 border border-[#c4f000]/30 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="h-1.5 bg-gradient-to-r from-[#c4f000] to-yellow-400" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🎁</span>
          <span className="text-[#c4f000] text-xs font-bold uppercase tracking-wider">Pass waiting for you</span>
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">{transfer.eventTitle}</h3>
          <p className="text-neutral-500 text-xs mt-0.5">{transfer.passTypeName} · {new Date(transfer.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {transfer.eventTime}</p>
          <p className="text-neutral-600 text-[11px] mt-1">From {transfer.senderName}</p>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button onClick={handleClaim} disabled={claiming}
          className="w-full bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 text-sm">
          {claiming ? 'Claiming...' : 'CLAIM PASS'}
        </button>
      </div>
    </div>
  );
}

export default function PassesPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [pendingClaims, setPendingClaims] = useState<Transfer[]>([]);
  const [pendingTransferMap, setPendingTransferMap] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      const u = await authService.getCurrentUser();
      setUser(u);
      if (u) {
        const [p, claims] = await Promise.all([
          PassService.getPassesByUser(u.id),
          TransferService.getPendingClaimsForUser(u.email),
        ]);
        setPasses(p.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()));
        setPendingClaims(claims);
        const map: Record<string, boolean> = {};
        for (const pass of p) {
          const t = await TransferService.getPendingTransferForPass(pass.id);
          if (t) map[pass.id] = true;
        }
        setPendingTransferMap(map);
      }
      setLoaded(true);
    }
    load();
  }, [refreshKey]);

  const handleClaimed = () => setRefreshKey(k => k + 1);

  const activePasses = passes.filter(p => p.status === 'ACTIVE');
  const otherPasses = passes.filter(p => p.status !== 'ACTIVE');

  return (
    <div className="px-4 pt-6 space-y-6">
      <div>
        <h1 className="text-white text-xl font-bold">My Passes</h1>
        <p className="text-neutral-500 text-xs mt-0.5">{activePasses.length} active · {pendingClaims.length} waiting to claim</p>
      </div>

      {!loaded ? (
        <div className="space-y-3"><PassCardSkeleton /><PassCardSkeleton /></div>
      ) : (
        <>
          {pendingClaims.length > 0 && (
            <div className="space-y-3">
              {pendingClaims.map(t => <ClaimCard key={t.id} transfer={t} onClaimed={handleClaimed} />)}
            </div>
          )}

          {passes.length === 0 && pendingClaims.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-in fade-in duration-500">
              <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <svg className="w-10 h-10 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="text-center space-y-1">
                <p className="text-white font-medium">No passes yet</p>
                <p className="text-neutral-500 text-sm">Find an event and get your first pass</p>
              </div>
              <Link href="/explore" className="bg-[#c4f000] hover:bg-[#b8e600] text-black font-bold px-6 py-3 rounded-xl transition-all active:scale-[0.98]">
                Explore Events
              </Link>
            </div>
          ) : passes.length > 0 ? (
            <div className="space-y-3">
              {activePasses.map(pass => <PassCard key={pass.id} pass={pass} hasPendingTransfer={!!pendingTransferMap[pass.id]} />)}
              {otherPasses.length > 0 && (
                <div className="pt-4 space-y-3">
                  <p className="text-neutral-600 text-xs uppercase tracking-wider">Past / Used</p>
                  {otherPasses.map(pass => <PassCard key={pass.id} pass={pass} hasPendingTransfer={false} />)}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
