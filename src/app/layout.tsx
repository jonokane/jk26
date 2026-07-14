import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { preHydrationSceneScript } from "@/lib/pre-hydration-scene";
import { FontsReady } from "@/components/fonts-ready";
import { SceneProvider } from "@/components/sky/scene-provider";
import { Sky } from "@/components/sky/sky";
import { SunMoon } from "@/components/sky/sun-moon";
import { Rays } from "@/components/sky/rays";
import { Stars } from "@/components/sky/stars";
import { Clouds } from "@/components/sky/clouds";
import { Birds } from "@/components/sky/birds";
import { TimeScrubber } from "@/components/sky/time-scrubber";
import { SceneTunePanel } from "@/components/sky/scene-tune-panel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <link rel="preconnect" href="https://use.typekit.net" />
      <link rel="preconnect" href="https://use.typekit.net" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://use.typekit.net/aqv1jgr.css"
        precedence="default"
      />
      <body className="min-h-full flex flex-col">
        <script
          id="scene-first-paint"
          dangerouslySetInnerHTML={{ __html: preHydrationSceneScript }}
        />
        <FontsReady />
        <SmoothScroll>
          <SceneProvider>
            <Sky>
              <SunMoon />
              <Rays />
              <Stars />
              <Clouds />
              <Birds />
            </Sky>
            {children}
            <TimeScrubber />
            <SceneTunePanel />
          </SceneProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
