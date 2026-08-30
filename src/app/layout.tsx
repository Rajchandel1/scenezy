import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/shared/components/theme/ThemeProvider';
import { PWARegister } from '@/shared/components/layout/PWARegister';

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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('scenezy_theme')||'system';var r=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.dataset.theme=r;document.documentElement.style.colorScheme=r}catch(e){}})()` }} />
        <link rel="apple-touch-icon" href="/scenezy-logo.png?v=2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="text-white antialiased min-h-screen">
        <ThemeProvider><PWARegister/>{children}</ThemeProvider>
      </body>
    </html>
  );
}
