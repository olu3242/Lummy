function parseEnvList(name) {
  const v = process.env[name]
  if (!v) return []
  return v.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * Authoritative Next.js config for the monorepo.
 * - Consolidated from next.config.ts + next.config.mjs
 * - Deployment-safe comments included; do not recreate next.config.ts
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
    ],
  },

  experimental: {
    // Preserve existing optimized imports from previous config.
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Allow configuring transpiled packages via env: TRANSPILE_PACKAGES="pkg-a,pkg-b"
  transpilePackages: parseEnvList('TRANSPILE_PACKAGES'),

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },

  async redirects() {
    // Preserve any runtime redirects here. Use env-driven redirects if needed.
    return []
  },

  async rewrites() {
    // Rewrites may be needed for internal proxying to API workers or external services.
    return []
  },
}

export default nextConfig
