"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { HeroWordmark } from "@/components/hero-wordmark";
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
      <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="flex min-h-[90vh] flex-col justify-center px-6 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="font-mono text-sm uppercase tracking-[0.2em] text-zinc-500"
          >
            Product Design Leader &amp; Strategist
          </motion.p>

          <HeroWordmark className="mt-6 text-5xl leading-[1.05] sm:text-7xl lg:text-8xl" />

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.16 }}
            className="mt-6 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400"
          >
            I design products, systems, and the motion that ties them together.
            This is a fresh build — the case studies are on their way.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.24 }}
            className="mt-10"
          >
            <Link
              href="/work"
              className="inline-flex h-12 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              View selected work →
            </Link>
          </motion.div>
        </div>
      </section>

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
