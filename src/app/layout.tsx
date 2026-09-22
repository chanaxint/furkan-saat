import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import { Navigation } from "@/components/layout/Navigation";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

export const metadata: Metadata = {
  title: "Furkan Saat — Fine Watches, İstanbul",
  description:
    "A private house for exceptional timepieces. Rolex, Patek Philippe, Richard Mille, Jacob & Co., Audemars Piguet and Cartier — presented by appointment in İstanbul.",
  openGraph: {
    title: "Furkan Saat — Fine Watches",
    description: "A private house for exceptional timepieces.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#071a16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/cormorant-garamond-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/cormorant-garamond-latin-wght-italic.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/inter-tight-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>
        <SmoothScroll>
          <Navigation />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
