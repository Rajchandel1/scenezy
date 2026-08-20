export function PassLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M140 40 L60 40 L60 70 L120 70 L120 90 L60 90 L60 120 L140 120 L140 150 L80 150 L80 170 L140 170 L140 200 L60 200"
        stroke="white"
        strokeWidth="28"
        strokeLinecap="square"
        strokeLinejoin="miter"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.1))' }}
      />
      <circle cx="145" cy="55" r="3" fill="#0a0a0a" />
      <circle cx="145" cy="185" r="3" fill="#0a0a0a" />
      <path d="M165 195 L170 185 L175 195 L185 200 L175 205 L170 215 L165 205 L155 200 Z" fill="#c4f000" />
    </svg>
  );
}
