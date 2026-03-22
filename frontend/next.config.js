/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow @shelby-protocol/sdk if it ships ESM
  transpilePackages: [],
};

module.exports = nextConfig;
