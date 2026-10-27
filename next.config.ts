import path from "node:path";
import type { NextConfig } from "next";

// This project's own folder. Without it Next guesses the root from the nearest
// lockfile and, with another package-lock.json higher up (e.g. in the user
// folder), warns about outputFileTracingRoot on every build.
const root = path.resolve(__dirname);

/**
 * Watch photographs uploaded to Supabase Storage (CATALOG_SOURCE=db): only the
 * public path of this project's product-images bucket, from the project URL
 * (no keys). Without NEXT_PUBLIC_SUPABASE_URL no remote image is allowed.
 */
function productImageHosts() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    if (url.protocol !== "https:" && url.protocol !== "http:") return [];
    return [new URL(`${url.origin}/storage/v1/object/public/product-images/**`)];
  } catch {
    return [];
  }
}

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
    remotePatterns: productImageHosts(),
  },
};

export default nextConfig;
