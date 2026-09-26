import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // No floating Next.js badge in the corner while developing.
  devIndicators: false,
  // three.js ships untranspiled ESM examples used by drei loaders
  transpilePackages: ["three"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
