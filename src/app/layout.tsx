import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/shared/components/theme/ThemeProvider';
import { PWARegister } from '@/shared/components/layout/PWARegister';
import { NavigationFeedback } from '@/shared/components/layout/NavigationFeedback';

export const metadata: Metadata = {
  title: 'Scenezy — Discover Events & Manage Passes',
  description: 'Discover events, book passes and manage entry with Scenezy.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Scenezy',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#050816',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const runtimeConfig=JSON.stringify({supabaseUrl:process.env.SUPABASE_URL||'',supabaseAnonKey:process.env.SUPABASE_ANON_KEY||''}).replace(/</g,'\\u003c');
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('scenezy_theme')||'system';var r=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.dataset.theme=r;document.documentElement.style.colorScheme=r}catch(e){}})()` }} />
        <script dangerouslySetInnerHTML={{__html:`window.__SCENEZY_CONFIG__=${runtimeConfig};`}}/>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png?v=3" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="text-white antialiased min-h-screen">
        <ThemeProvider><PWARegister/><NavigationFeedback/>{children}</ThemeProvider>
      </body>
    </html>
  );
}
