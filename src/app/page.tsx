'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth';
import LandingPage from './(marketing)/page';
import { LogoVideoLoader } from '@/shared/components/branding/LogoVideoLoader';

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
      <div className="min-h-screen app-shell flex items-center justify-center">
        <LogoVideoLoader size="lg" />
      </div>
    );
  }

  if (loggedIn) return null;

  return <LandingPage />;
}
