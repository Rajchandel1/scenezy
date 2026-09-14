import { LogoVideoLoader } from '@/shared/components/branding/LogoVideoLoader';

export default function Loading() {
  return (
    <div className="min-h-screen app-shell flex items-center justify-center">
      <LogoVideoLoader size="lg" />
    </div>
  );
}
