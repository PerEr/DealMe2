/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow access from other devices in the network
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  // Image optimization settings
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    remotePatterns: [],
    minimumCacheTTL: 604800, // Cache images for 1 week (in seconds)
    dangerouslyAllowSVG: false,
  },
  // Asset caching headers
  async headers() {
    return [
      {
        source: '/cards/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;