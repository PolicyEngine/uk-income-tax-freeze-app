/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // Enable static HTML export
  distDir: 'out',    // Output directory
  // Rewrites are only used in development
  async rewrites() {
    return process.env.NODE_ENV === 'development' 
      ? [
          {
            source: '/api/:path*',
            destination: 'http://localhost:8000/api/:path*',
          },
        ]
      : [];
  },
};

module.exports = nextConfig;