import type { NextConfig } from "next";

// Velite compiles the MDX content collection into `.velite/` before Next
// compiles. Running it from the config (rather than a webpack plugin) keeps it
// working under Turbopack, the default bundler in Next 16.
let veliteStarted = false;
async function runVelite() {
  if (veliteStarted) return;
  veliteStarted = true;
  const dev = process.argv.includes("dev");
  const { build } = await import("velite");
  await build({ watch: dev, clean: !dev });
}

export default async function nextConfig(): Promise<NextConfig> {
  await runVelite();
  return {
    images: {
      remotePatterns: [{ protocol: "https", hostname: "**" }],
    },
  };
}
