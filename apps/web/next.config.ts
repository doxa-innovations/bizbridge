import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bizbridge/shared', '@bizbridge/ui'],
  // Keep server-only auth modules out of the client + server bundlers so
  // Next doesn't try to resolve their optional peer adapters (kysely, etc.).
  serverExternalPackages: ['better-auth', '@better-auth/core', '@better-auth/kysely-adapter'],
  experimental: {
    reactCompiler: false,
  },
  webpack(config) {
    // Resolve workspace packages that import their own modules with `.js`
    // extensions (required by NodeNext) back to the `.ts` source files.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
  async headers() {
    return [
      {
        // Global security headers on every route. Intentionally conservative:
        // no CSP yet (needs an audit of inline scripts + third-party embeds
        // first) but everything else that has no downside.
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      {
        // Static assets are fingerprinted by Next — cache hard.
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // API routes must never be cached by intermediaries.
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
