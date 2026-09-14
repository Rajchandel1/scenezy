import { PassLogo } from '@/shared/components/branding/PassLogo';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell min-h-screen flex items-center justify-center px-5 py-10 relative overflow-x-hidden">
      <div className="absolute w-80 h-80 rounded-full bg-blue-600/20 blur-[90px] -top-28 -right-24"/><div className="absolute w-72 h-72 rounded-full bg-indigo-600/15 blur-[100px] -bottom-24 -left-20"/>
      <div className="w-full max-w-[370px] space-y-8 relative z-10">
        <div className="flex flex-col items-center space-y-4">
          <PassLogo className="w-24 h-24" />
          <div className="text-center">
            <h1 className="text-white text-2xl font-bold tracking-tight">Scenezy</h1>
            <p className="text-neutral-500 text-sm mt-1">Your events and passes, in one place.</p>
          </div>
        </div>
        <div className="app-surface rounded-[2rem] p-6 shadow-2xl">
          {children}
        </div>
        <p className="text-center text-neutral-600 text-[11px] leading-5">By continuing, you agree to our <Link href="/terms" className="text-blue-400 hover:underline">Terms & Conditions</Link> and acknowledge our <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link> and <Link href="/cancellation-refund-policy" className="text-blue-400 hover:underline">Cancellation & Refund Policy</Link>.</p>
      </div>
    </div>
  );
}
