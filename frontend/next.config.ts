import type { NextConfig } from 'next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Proxy /api/* → FastAPI backend.
   *
   * next.config.js runs server-side at build/start time, so we use
   * API_URL (no NEXT_PUBLIC_ prefix) here. NEXT_PUBLIC_API_URL is only
   * needed if you ever call the backend directly from browser code.
   *
   * Set API_URL in .env.local for local dev.
   * Set it in your deployment env for production.
   */
  async rewrites() {
    const backendUrl = process.env.API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
