import { PassLogo } from '@/shared/components/branding/PassLogo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-[340px] space-y-10">
        <div className="flex flex-col items-center space-y-4">
          <PassLogo className="w-20 h-24" />
          <div className="text-center">
            <h1 className="text-white text-2xl font-bold tracking-tight">Scenezy</h1>
            <p className="text-neutral-500 text-sm mt-1">Find · Pick · Pay · Pass · Show · Go</p>
          </div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
          {children}
        </div>
        <p className="text-center text-neutral-600 text-xs">Paper Plane UX · Jet Engine Backend</p>
      </div>
    </div>
  );
}
