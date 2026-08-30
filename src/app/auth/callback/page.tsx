'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/shared/lib/supabase-client';
import { authService } from '@/features/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createSupabaseBrowserClient();

        // Method 1: Try to get existing session (works for OAuth redirect)
        setStatus('Checking session...');
        let { data: { session } } = await supabase.auth.getSession();

        // Method 2: If no session, try exchanging code from URL
        if (!session) {
          setStatus('Exchanging auth code...');
          
          // Get code from URL hash or search params
          const url = new URL(window.location.href);
          const code = url.searchParams.get('code');
          
          if (code) {
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error('[Auth Callback] Exchange error:', exchangeError);
              // Don't fail yet - maybe session exists anyway
            } else {
              session = data.session;
            }
          }
        }

        // Method 3: Try getUser as last resort
        if (!session) {
          setStatus('Fetching user...');
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            // Create a pseudo-session scenario
            const user = userData.user;
            const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
            const role = (user.user_metadata?.role || 'USER') as 'USER' | 'SELLER' | 'ADMIN';
            
            await authService.completeRegistration(user.id, user.email!, name, role);
            
            if (role === 'ADMIN') router.replace('/admin');
            else if (role === 'SELLER') router.replace('/seller');
            else router.replace('/home');
            return;
          }
        }

        if (!session?.user) {
          setError('Could not authenticate. Please try again.');
          setTimeout(() => router.replace('/sign-in'), 3000);
          return;
        }

        // We have a valid session - create/update DB entry
        setStatus('Setting up your account...');
        const user = session.user;
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        const role = (user.user_metadata?.role || 'USER') as 'USER' | 'SELLER' | 'ADMIN';

        await authService.completeRegistration(user.id, user.email!, name, role);

        // Redirect based on role
        setStatus('Redirecting...');
        if (role === 'ADMIN') router.replace('/admin');
        else if (role === 'SELLER') router.replace('/seller');
        else router.replace('/home');

      } catch (err) {
        console.error('[Auth Callback] Error:', err);
        setError('Something went wrong. Please try signing in again.');
        setTimeout(() => router.replace('/sign-in'), 3000);
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen app-shell flex items-center justify-center px-5">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="w-12 h-12 mx-auto rounded-full bg-red-950/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-neutral-600 text-xs">Redirecting to sign in...</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 mx-auto bg-[#2563eb] rounded-xl flex items-center justify-center animate-pulse">
              <span className="text-black font-black">P</span>
            </div>
            <p className="text-neutral-400 text-sm">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}
