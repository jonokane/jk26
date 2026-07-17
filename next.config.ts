import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// Velite compiles the MDX content collection into `.velite/` before Next
// compiles. Running it from the config (rather than a webpack plugin) keeps it
// working under Turbopack, the default bundler in Next 16.
//
// `dev` comes from the phase, never from `process.argv`. `next dev` does its
// work in a worker it forks as `fork(start-server.js, {options})` — with no
// args array — so the child's argv is `[node, start-server.js]` and the "dev"
// token is gone. This config is loaded *in that child*, so sniffing argv for
// "dev" silently yields false, and Velite builds once at boot instead of
// watching. Saving an .mdx then changes nothing on screen.
// The in-flight build itself, not a flag saying one happened. Next calls this
// config more than once per process, and the two must not both start a watcher
// — but a boolean can only say "started", never "started and not finished".
// Set before an await, it let a second call return a RESOLVED promise while the
// first build was still writing, so Next could go on to compile against
// `.velite/*.json` files that did not exist yet ("Can't resolve './site.json'").
// Awaiting the same promise makes every caller wait for the one real build.
let velitePromise: Promise<void> | null = null;
function runVelite(dev: boolean): Promise<void> {
  velitePromise ??= (async () => {
    const { build } = await import("velite");
    await build({ watch: dev, clean: !dev });
  })();
  return velitePromise;
}

export default async function nextConfig(phase: string): Promise<NextConfig> {
  await runVelite(phase === PHASE_DEVELOPMENT_SERVER);
  return {
    images: {
      remotePatterns: [{ protocol: "https", hostname: "**" }],
    },
    async redirects() {
      return [{ source: "/work", destination: "/#work", permanent: false }];
    },
  };
}
