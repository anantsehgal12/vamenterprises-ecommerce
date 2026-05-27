import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   eslint: { ignoreDuringBuilds: true },
   experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001', 'https://glorious-umbrella-975jrgrq9g7cx4vr-3001.app.github.dev/', 'localhost:3000', 'https://glorious-umbrella-975jrgrq9g7cx4vr-3000.app.github.dev/'],
    },
  },
  crossOrigin: 'anonymous',
  images: {
    remotePatterns: [new URL('https://i.ibb.co/**'), new URL('https://marrrfyugywqrchdtqlq.supabase.co/**')]},
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NETLIFY_URL ? process.env.NETLIFY_URL : 'http://localhost:3000',
  },
};


export default nextConfig;
