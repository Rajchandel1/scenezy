import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  // ✅ REMOVED: swcMinify (deprecated in Next.js 16)
  disable: process.env.NODE_ENV === 'development', 
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'lh3.googleusercontent.com' }],
  },
  // ✅ FIX: Explicit empty turbopack config to silence webpack warning
  turbopack: {},
};

export default withPWA(nextConfig);
