/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // Enable static HTML export
  distDir: 'out',    // Output directory
  
  // We need to disable rewrites in production with static export
  // The API calls will be handled by the FastAPI backend serving the static files
};

module.exports = nextConfig;