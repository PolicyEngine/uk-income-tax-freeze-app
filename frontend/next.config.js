/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',  // Enable static HTML export
  distDir: 'out',    // Output directory
  // Pin the workspace root so Turbopack does not pick up a stray lockfile from
  // a parent directory.
  turbopack: {
    root: process.cwd(),
  },
};

module.exports = nextConfig;
