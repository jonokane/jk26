import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { FontsReady } from "@/components/fonts-ready";
import { preHydrationThemeScript } from "@/lib/pre-hydration-theme";

export const metadata: Metadata = {
  metadataBase: new URL("https://jonokane.com"),
  title: {
    default: "Jono Kane — Designer",
    template: "%s — Jono Kane",
  },
  description:
    "Design and career portfolio of Jono Kane — case studies in product design, design systems, and motion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <link rel="preconnect" href="https://use.typekit.net" />
      <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://use.typekit.net/aqv1jgr.css"
        precedence="default"
      />
      <body className="min-h-full flex flex-col">
        {/* Resolves the theme before hydration so dark never flashes white.
            `beforeInteractive` is the only strategy that lands in the server
            HTML ahead of framework JS; a raw <script> element would warn
            (React never executes scripts rendered on the client) and would
            not run on a client navigation. */}
        <Script
          id="theme-first-paint"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: preHydrationThemeScript }}
        />
        <FontsReady />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
