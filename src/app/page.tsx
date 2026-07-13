"use client";

import { motion } from "motion/react";
import { Hero } from "@/components/hero/hero";
import { SiteHeader } from "@/components/site-header";
import { SceneProvider } from "@/components/sky/scene-provider";
import { Sky } from "@/components/sky/sky";
import { SunMoon } from "@/components/sky/sun-moon";
import { Rays } from "@/components/sky/rays";
import { Stars } from "@/components/sky/stars";
import { Clouds } from "@/components/sky/clouds";
import { Birds } from "@/components/sky/birds";
import { TimeScrubber } from "@/components/sky/time-scrubber";
import { SceneTunePanel } from "@/components/sky/scene-tune-panel";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Home() {
  return (
    <SceneProvider>
      <Sky>
        <SunMoon />
        <Rays />
        <Stars />
        <Clouds />
        <Birds />
      </Sky>
      <SiteHeader />
      <main className="flex flex-1 flex-col">
      <Hero />

      {/* Scroll-reveal section — proves Lenis + Motion whileInView are wired */}
      <section className="px-6 py-40 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8, ease }}
            className="text-3xl font-medium tracking-tight sm:text-4xl"
          >
            Scroll is smooth. Motion is ready.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-400"
          >
            Lenis smooth-scroll and GSAP ScrollTrigger share one RAF loop, and
            Motion handles component-level animation. The stage is set for the
            hero we&apos;ll build next.
          </motion.p>
        </div>
      </section>
      </main>
      <TimeScrubber />
      <SceneTunePanel />
    </SceneProvider>
  );
}
