import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function createFile(filepath, content) {
  const fullPath = join(__dirname, filepath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content.trimStart(), 'utf-8');
  console.log(`  ✅ ${filepath}`);
}

console.log('🚀 Setting up PWA, Rate Limiting & Deployment...\n');

// =============================================
// 1. PWA MANIFEST (App Identity)
// =============================================
createFile('public/manifest.json', `{
  "name": "PASS - Event Passes",
  "short_name": "PASS",
  "description": "Your events. Your passes. Simple.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#c4f000",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}`);

// =============================================
// 2. NEXT-PWA CONFIG
// =============================================
createFile('next.config.ts', `
import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development', // Disable in dev for faster HMR
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google OAuth avatars
  },
};

export default withPWA(nextConfig);
`);

// =============================================
// 3. RATE LIMITING MIDDLEWARE (Simple IP-based)
// =============================================
createFile('src/shared/lib/rate-limiter.ts', `
// Simple in-memory rate limiter (use Redis/Upstash in production)
const ipStore = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10;      // Max requests per window

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipStore.get(ip);

  if (!record || now > record.resetAt) {
    ipStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         '127.0.0.1';
}
`);

// =============================================
// 4. PROTECTED API ROUTE EXAMPLE (Forgot Password)
// =============================================
createFile('src/app/api/data/forgot-password/route.ts.patch.txt', `
ADD THIS AT TOP OF POST FUNCTION IN forgot-password/route.ts:

import { checkRateLimit, getClientIP } from '@/shared/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  
  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Too many requests. Please try again in 1 minute.' }, 
      { status: 429 }
    );
  }

  // ... rest of existing code
}
`);

// Actually update the file directly
import { readFileSync } from 'fs';
try {
  const routePath = join(__dirname, 'src/app/api/data/forgot-password/route.ts');
  let content = readFileSync(routePath, 'utf-8');
  
  if (!content.includes('rate-limiter')) {
    content = content.replace(
      "import { OTPService } from '@/features/auth/services/otp.service';",
      "import { OTPService } from '@/features/auth/services/otp.service';\nimport { checkRateLimit, getClientIP } from '@/shared/lib/rate-limiter';"
    );
    
    content = content.replace(
      'export async function POST(req: NextRequest) {',
      'export async function POST(req: NextRequest) {\n  const ip = getClientIP(req);\n  if (!checkRateLimit(ip)) {\n    return Response.json({ error: \'Too many requests. Try again in 1 min.\' }, { status: 429 });\n  }\n'
    );
    
    writeFileSync(routePath, content);
    console.log('  ✅ Updated forgot-password/route.ts with rate limiting');
  }
} catch (e) {
  console.log('  ⚠️  Could not patch forgot-password route (file may not exist yet)');
}

// =============================================
// 5. INSTALL PROMPT COMPONENT
// =============================================
createFile('src/shared/components/ui/InstallPrompt.tsx', `
'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-2xl flex items-center gap-3 max-w-sm mx-auto">
        <div className="w-10 h-10 bg-[#c4f000] rounded-xl flex items-center justify-center shrink-0">
          <span className="text-black font-black text-lg">P</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Install PASS App</p>
          <p className="text-neutral-500 text-xs truncate">Add to home screen for quick access</p>
        </div>
        <button 
          onClick={handleInstall}
          className="bg-[#c4f000] hover:bg-[#b8e600] text-black text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shrink-0"
        >
          Install
        </button>
        <button 
          onClick={() => setShowPrompt(false)}
          className="text-neutral-500 hover:text-white p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
`);

// =============================================
// 6. VERCEL CONFIG
// =============================================
createFile('vercel.json', `{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/auth/callback", "destination": "/auth/callback" }
  ]
}`);

// =============================================
// 7. ENVIRONMENT TEMPLATE
// =============================================
createFile('.env.example', `
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Transaction Pooler - Port 6543)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Email (Gmail SMTP or Resend)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
`);

// =============================================
// DONE
// =============================================
console.log('\\n✅ PWA + Deploy + Security setup complete!');
console.log('');
console.log('   ═══════════════════════════════════════════');
console.log('   📱 PWA FEATURES:');
console.log('   • manifest.json configured');
console.log('   • next-pwa with offline caching');
console.log('   • Install prompt component (bottom sheet)');
console.log('   • Standalone display (no browser bar)');
console.log('');
console.log('   🛡️  SECURITY:');
console.log('   • Rate limiting on sensitive APIs');
console.log('   • Security headers in vercel.json');
console.log('   • IP-based tracking (10 req/min)');
console.log('');
console.log('   🚀 DEPLOYMENT:');
console.log('   • vercel.json ready');
console.log('   • .env.example template');
console.log('   • Google avatar domain whitelisted');
console.log('');
console.log('   ⚠️  IMPORTANT STEPS:');
console.log('   1. npm install @ducanh2912/next-pwa');
console.log('   2. Create /public/icons/ folder');
console.log('   3. Add icon-192.png and icon-512.png');
console.log('   4. Push to GitHub → Connect Vercel');
console.log('   5. Add env vars in Vercel dashboard');
console.log('   6. Connect scenezy.in domain in Vercel');
console.log('');
console.log('   Run: npm run build && npm start');
console.log('   Test PWA: Chrome DevTools → Application → Manifest');
console.log('');