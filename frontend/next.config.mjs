/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  output: 'export',
  distDir: '../docs',
  basePath: '/HIMO2004',
  assetPrefix: '/HIMO2004',
  trailingSlash: true,
};

export default nextConfig;
