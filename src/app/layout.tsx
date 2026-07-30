import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { FontsReady } from "@/components/fonts-ready";
import { preHydrationThemeScript } from "@/lib/pre-hydration-theme";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { siteContent } from "@/lib/site-content";

/* Title and description are Jono's locked positioning copy (site-content.ts):
   the kicker as the title suffix, the tagline as the description. The " — "
   separator matches the existing title template; the "no em-dash" house rule is
   about visitor PROSE, and titles have always used it here. */
const title = `${SITE_NAME} — ${siteContent.kicker}`;
const description = siteContent.tagline;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: title,
    template: `%s — ${SITE_NAME}`,
  },
  description,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title,
    description,
    locale: "en_US",
    /* og:image / twitter:image come from app/opengraph-image.tsx (auto-wired
       for every route; case studies override it with their cover). */
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

/* Paints the browser chrome to the stark canvas, per theme, and declares the
   site supports both schemes. Values are `--canvas` in globals.css. */
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
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
        {modal}
      </body>
    </html>
  );
}
