import { AnimatedLogoLoader } from '@/shared/components/branding/AnimatedLogoLoader';

export default function Loading() {
  return (
    <div className="min-h-screen app-shell flex items-center justify-center">
      <AnimatedLogoLoader size="lg" />
    </div>
  );
}
