import type { Metadata } from "next";
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
      <head>
        {/* Resolves the theme before hydration so dark never flashes white.
            Must be a synchronous inline script placed in <head>, ahead of
            everything else, so it runs while the browser is still parsing
            the document and mutates <html> before first paint (Next's
            documented "Preventing flash before hydration" pattern).
            `next/script`'s `beforeInteractive` looks like the right tool but
            isn't: measured against served HTML it landed ~13KB into <body>,
            after the first page text had already been parsed — its execution
            does not block page hydration, so the light palette could paint
            first. `suppressHydrationWarning` on <html> stays required since
            this script mutates <html> pre-hydration. */}
        <script dangerouslySetInnerHTML={{ __html: preHydrationThemeScript }} />
        <link rel="preconnect" href="https://use.typekit.net" />
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://use.typekit.net/aqv1jgr.css"
          precedence="default"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <FontsReady />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
