export function PassLogo({className=''}:{className?:string}){
  return (
    <span className={`relative inline-block shrink-0 overflow-hidden rounded-xl bg-black ring-1 ring-white/15 shadow-lg ${className}`}>
      {/* Served directly from /public so brand artwork never depends on the image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/scenezy-logo.png?v=2"
        alt="Scenezy"
        className="absolute inset-0 h-full w-full object-contain p-[8%]"
      />
    </span>
  );
}
