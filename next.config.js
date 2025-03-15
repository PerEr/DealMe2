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
  },
};

module.exports = nextConfig;