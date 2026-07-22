/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  output: 'export',
  basePath: '/hayati-os',
  assetPrefix: '/hayati-os',
  trailingSlash: true,
};

export default nextConfig;
