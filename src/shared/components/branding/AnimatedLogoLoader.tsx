import { PassLogo } from './PassLogo';

interface AnimatedLogoLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: string;
}

export function AnimatedLogoLoader({className='',size='md',showText=false,text}:AnimatedLogoLoaderProps){
  const sizes={sm:'w-12 h-12',md:'w-20 h-20',lg:'w-28 h-28'};
  return <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-4 ${className}`}>
    <div className={`scenezy-logo-loader relative ${sizes[size]}`}>
      <span className="absolute inset-0 rounded-[28%] border border-blue-500/30"/>
      <span className="scenezy-logo-loader-ring absolute -inset-2 rounded-[30%] border border-blue-500/15"/>
      <PassLogo className="scenezy-logo-loader-mark h-full w-full rounded-[24%]"/>
      <span className="scenezy-logo-loader-sheen pointer-events-none absolute inset-0 overflow-hidden rounded-[24%]"/>
    </div>
    {showText&&text&&<p className="muted text-center text-xs font-medium">{text}</p>}
  </div>;
}
