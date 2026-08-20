'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth';
import LandingPage from './(marketing)/page';

export default function RootPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function check() {
      const user = await authService.getCurrentUser();
      if (user) {
        setLoggedIn(true);
        if (user.role === 'ADMIN') router.replace('/admin');
        else if (user.role === 'SELLER') router.replace('/seller');
        else router.replace('/home');
      } else {
        setChecking(false);
      }
    }
    check();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 bg-[#c4f000] rounded-lg flex items-center justify-center animate-pulse">
          <span className="text-black font-black text-sm">P</span>
        </div>
      </div>
    );
  }

  if (loggedIn) return null;

  return <LandingPage />;
}
