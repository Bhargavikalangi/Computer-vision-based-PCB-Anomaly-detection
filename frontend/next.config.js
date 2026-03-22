/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'pcb-backend'],
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return [
      {
        // Proxy browser /api/* → FastAPI /api/* (same-origin option; avoids CORS when using relative baseURL)
        source: '/api/:path*',
        destination: `${api}/api/:path*`,
      },
    ];
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

module.exports = nextConfig;
