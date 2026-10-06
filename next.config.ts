import path from "node:path";
import type { NextConfig } from "next";

// This project's own folder. Without it Next guesses the root from the nearest
// lockfile and, with another package-lock.json higher up (e.g. in the user
// folder), warns about outputFileTracingRoot on every build.
const root = path.resolve(__dirname);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: root,
  turbopack: { root },
  // No floating Next.js badge in the corner while developing.
  devIndicators: false,
  // three.js ships untranspiled ESM examples used by drei loaders
  transpilePackages: ["three"],
  // Earlier English addresses keep working.
  async redirects() {
    return [
      { source: "/collection/mercedes-benz", destination: "/markalar/mercedes-benz", permanent: true },
      { source: "/collection", destination: "/#koleksiyon", permanent: true },
      // The collection and the brands live on the home page now.
      { source: "/markalar", destination: "/#markalar", permanent: false },
      { source: "/koleksiyon", destination: "/#koleksiyon", permanent: false },
      { source: "/koleksiyonlar", destination: "/#koleksiyon", permanent: false },
      { source: "/koleksiyonlar/:slug", destination: "/#koleksiyon", permanent: false },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
