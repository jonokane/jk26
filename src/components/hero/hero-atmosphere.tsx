"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { gsap } from "@/lib/gsap";
import { ATMOSPHERE, PERF } from "@/components/hero/hero-atmosphere-config";
import {
  auroraPeak, ease, foldAlpha, foldBulge, hexToRgb, planeBlurs,
} from "@/components/hero/atmosphere-engine";
import styles from "@/components/hero/hero-atmosphere.module.css";

type Rgb = [number, number, number];

/* Reading-lane geometry, calibrated to reproduce the approved look at the 1440
   design width while TRACKING the measured wordmark. The wordmark's font-size
   clamps (caps at 8rem), so past ~1424px it stops growing — but a purely
   viewport-relative ellipse keeps widening and drifts off the word. Deriving the
   horizontal geometry from the measured word keeps the clearing sized to and
   centred on the lockup at any width (spec §Reading-lane geometry). Horizontal
   only: the lockup is flex-centred vertically, so the vertical ellipse stays a
   stable 44% radius at 50% of the lane box. */
const LANE_RX_FRAC = 1.15; // horizontal radius as a multiple of the word's width
const LANE_CX_FRAC = 0.4; // centre-x as a fraction across the word from its left edge

/**
 * The hero's ambient wash (spec 2026-07-18). Two blurred depth planes — a
 * drifting aurora haze (far) and flowing folds (near) — drawn from the live
 * accents, with a reading lane. Purely decorative (aria-hidden).
 *
 * Driven off the shared GSAP ticker (never a second RAF loop — CLAUDE.md),
 * throttled to PERF.fps, and only subscribed while the hero is on screen and
 * the tab is visible (the perf contract, spec §The performance contract).
 * Reduced motion / a coarse pointer / a narrow viewport get one static frame
 * and no ticker subscription at all — the cursor push/pull is fine-pointer
 * only regardless.
 */
export function HeroAtmosphere() {
  const rootRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLCanvasElement>(null);
  const nearRef = useRef<HTMLCanvasElement>(null);
  const laneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current, farEl = farRef.current, nearEl = nearRef.current, laneEl = laneRef.current;
    if (!root || !farEl || !nearEl || !laneEl) return;
    const farCtx = farEl.getContext("2d");
    const nearCtx = nearEl.getContext("2d");
    if (!farCtx || !nearCtx) return; // canvas unavailable (jsdom): mount, draw nothing

    let W = 0, H = 0, baseSize = 0;
    // Eased cursor state, read by paint() and leaned onto the planes each tick.
    // Rests at centre (0.5, 0.44) with zero strength until a fine pointer hovers.
    const cursor = { x: 0.5, y: 0.44, k: 0 };

    const accents = (): Rgb[] => {
      const cs = getComputedStyle(document.documentElement);
      return [
        hexToRgb(cs.getPropertyValue("--about")),
        hexToRgb(cs.getPropertyValue("--work")),
        hexToRgb(cs.getPropertyValue("--contact")),
      ];
    };
    const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";
    const ground = (): Rgb => (isDark() ? [0, 0, 0] : [255, 255, 255]);
    const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: Rgb, peak: number, depth: number) {
      if (r <= 0 || peak <= 0) return;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(c, peak));
      g.addColorStop(0.45, rgba(c, peak * (0.4 - 0.22 * depth)));
      g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.2832);
      ctx.fill();
    }

    // The far aurora plane: 6 drifting blobs + 2 denser cores.
    function drawAurora(ctx: CanvasRenderingContext2D, t: number, tri: Rgb[], dark: boolean) {
      const gain = dark ? ATMOSPHERE.darkGain : ATMOSPHERE.lightGain;
      const peak = auroraPeak(ATMOSPHERE.intensity * gain, ATMOSPHERE.balance, ATMOSPHERE.depth, dark);
      for (let i = 0; i < 6; i++) {
        const c = tri[i % 3], ph = i * 1.7;
        const x = W * (0.5 + 0.42 * Math.sin(t * 0.05 + ph) * Math.cos(t * 0.028 + ph * 0.5));
        const y = H * (0.5 + 0.34 * Math.cos(t * 0.043 + ph * 1.2));
        blob(ctx, x, y, baseSize * (0.42 + 0.16 * Math.sin(t * 0.07 + ph)), c, peak, ATMOSPHERE.depth);
      }
      for (let i = 0; i < 2; i++) {
        const c = tri[(i + 1) % 3], ph = i * 3.1 + 1;
        const x = W * (0.5 + 0.3 * Math.sin(t * 0.09 + ph)), y = H * (0.46 + 0.22 * Math.cos(t * 0.07 + ph));
        blob(ctx, x, y, baseSize * 0.24, c, peak * 1.5 * ATMOSPHERE.depth, ATMOSPHERE.depth);
      }
    }

    // The near folds plane: 4 flowing ribbons. `cursorX/cursorNormY/cursorK` drive
    // the push/pull; static frames pass cursorK: 0, so foldBulge is skipped.
    function drawFolds(ctx: CanvasRenderingContext2D, t: number, tri: Rgb[], dark: boolean, cursorX: number, cursorNormY: number, cursorK: number) {
      const gain = dark ? ATMOSPHERE.darkGain : ATMOSPHERE.lightGain;
      const a = foldAlpha(ATMOSPHERE.intensity * gain, ATMOSPHERE.balance, ATMOSPHERE.depth, dark);
      for (let L = 0; L < 4; L++) {
        const c = tri[L % 3];
        const baseY = H * (0.3 + 0.13 * L), amp = H * (0.05 + 0.02 * L), thick = H * (0.12 + 0.03 * L);
        const f1 = (1.0 + 0.4 * L) * 6.2832 / W, f2 = (2.3 + 0.5 * L) * 6.2832 / W, sp = 0.18 + 0.07 * L;
        const shape = (x: number) => baseY + amp * Math.sin(f1 * x + t * sp + L * 1.3) + amp * 0.4 * Math.sin(f2 * x - t * sp * 0.7 + L);
        const yAt = (x: number) => shape(x) - (cursorK > 0 ? foldBulge(x, W, cursorX, cursorNormY, amp, cursorK) : 0);
        ctx.beginPath();
        ctx.moveTo(-70, yAt(-70));
        for (let x = -70; x <= W + 70; x += 12) ctx.lineTo(x, yAt(x));
        for (let x = W + 70; x >= -70; x -= 12) ctx.lineTo(x, yAt(x) + thick);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, baseY - amp, 0, baseY + amp + thick);
        g.addColorStop(0, rgba(c, a));
        g.addColorStop(1, rgba(c, a * 0.1));
        ctx.fillStyle = g;
        ctx.fill();
      }
    }

    // One draw path shared by the static frame and every animated tick, so
    // "what the field looks like" has one definition.
    const paint = (t: number, cursorX: number, cursorNormY: number, cursorK: number) => {
      const tri = accents(), dark = isDark(), comp = dark ? "lighter" : "source-over";
      farCtx.clearRect(0, 0, W, H);
      farCtx.globalCompositeOperation = comp;
      drawAurora(farCtx, t, tri, dark);
      farCtx.globalCompositeOperation = "source-over";
      nearCtx.clearRect(0, 0, W, H);
      nearCtx.globalCompositeOperation = comp;
      drawFolds(nearCtx, t, tri, dark, cursorX, cursorNormY, cursorK);
      nearCtx.globalCompositeOperation = "source-over";
    };

    /* The reading lane, centred on and sized to the real lockup. The wordmark
       anchor is never transformed (only its letters and the kicker/tagline are —
       hero.module.css), so its rect is stable to measure even mid build-in.
       Measured against the lane element's own box, so the .lane inset never has
       to be duplicated here. Falls back to the viewport-relative ellipse only if
       the wordmark isn't measurable yet. */
    const laneBackground = (gr: Rgb) => {
      const wm = root.parentElement?.querySelector<HTMLElement>('[data-wordmark="anchor"]');
      const laneR = laneEl.getBoundingClientRect();
      if (wm && laneR.width > 0) {
        const wmR = wm.getBoundingClientRect();
        const cx = wmR.left - laneR.left + LANE_CX_FRAC * wmR.width;
        const rx = LANE_RX_FRAC * wmR.width;
        return `radial-gradient(ellipse ${rx.toFixed(1)}px 44% at ${cx.toFixed(1)}px 50%, rgba(${gr.join(",")},${ATMOSPHERE.lane}) 0%, rgba(${gr.join(",")},0) 66%)`;
      }
      return `radial-gradient(ellipse 56% 44% at 30% 50%, rgba(${gr.join(",")},${ATMOSPHERE.lane}) 0%, rgba(${gr.join(",")},0) 66%)`;
    };

    const applyStyles = () => {
      const { far, near } = planeBlurs(ATMOSPHERE.blur, ATMOSPHERE.variation);
      farEl.style.filter = `blur(${far.toFixed(1)}px)`;
      nearEl.style.filter = `blur(${near.toFixed(1)}px)`;
      laneEl.style.background = laneBackground(ground());
    };

    const measure = () => {
      const r = root.getBoundingClientRect();
      const os = 1 + PERF.overscan * 2;
      W = r.width * os; H = r.height * os; baseSize = Math.min(W, H);
      const px = Math.min(PERF.dprCap, window.devicePixelRatio || 1) * PERF.renderScale;
      for (const el of [farEl, nearEl]) {
        el.width = Math.round(W * px);
        el.height = Math.round(H * px);
        el.getContext("2d")!.setTransform(px, 0, 0, px, 0, 0);
      }
      applyStyles();
      paint(6.5, cursor.x, cursor.y, cursor.k); // one static frame
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    /* The wordmark's width changes when the web font loads, but the hero keeps its
       size, so the ResizeObserver won't fire — re-track the lane once fonts land. */
    void document.fonts?.ready.then(applyStyles);
    const themeObserver = new MutationObserver(() => { applyStyles(); paint(6.5, cursor.x, cursor.y, cursor.k); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    // reveal after the first paint
    root.setAttribute("data-ready", "true");

    // ---- perf contract: reduced motion / low-power → one static frame, no loop ----
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const staticOnly = reduced || coarse || window.innerWidth < PERF.staticMaxWidth;

    // ---- cursor tracking (fine pointer only) ----
    const target = { x: 0.5, y: 0.44 };
    let hovering = false;
    const onPointerMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      target.x = (e.clientX - r.left) / r.width;
      target.y = (e.clientY - r.top) / r.height;
      hovering = true;
    };
    const onPointerLeave = () => { hovering = false; };
    if (!staticOnly) {
      root.parentElement?.addEventListener("pointermove", onPointerMove);
      root.parentElement?.addEventListener("pointerleave", onPointerLeave);
    }

    let running = false;
    let lastMs = 0;
    const frameMs = 1000 / PERF.fps;
    // gsap.ticker passes time in seconds; throttle to PERF.fps inside the callback.
    const tick = (time: number) => {
      const ms = time * 1000;
      if (ms - lastMs < frameMs) return;
      lastMs = ms;
      const tgX = hovering ? target.x : 0.5, tgY = hovering ? target.y : 0.44;
      cursor.x = ease(cursor.x, tgX, 0.06);
      cursor.y = ease(cursor.y, tgY, 0.06);
      cursor.k = ease(cursor.k, hovering ? ATMOSPHERE.cursor : 0, 0.08);
      paint(time, cursor.x, cursor.y, cursor.k);
      // parallax lean — a few px toward the cursor, near plane leading (composited,
      // cheap). Derived straight from the eased strength (cursor.k tops out at
      // ATMOSPHERE.cursor = 0.5 → ~12px), so no divide-by-recipe.
      const lean = 24 * cursor.k;
      farEl.style.transform = `translate(${(cursor.x - 0.5) * lean * 0.4}px, ${(cursor.y - 0.5) * lean * 0.4}px)`;
      nearEl.style.transform = `translate(${(cursor.x - 0.5) * lean}px, ${(cursor.y - 0.5) * lean}px)`;
    };
    const play = () => { if (!running && !staticOnly) { running = true; gsap.ticker.add(tick); } };
    const stop = () => { if (running) { running = false; gsap.ticker.remove(tick); } };

    // Only animate while the hero is on screen (the effect costs nothing elsewhere).
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) play(); else stop(); }, { threshold: 0.04 });
    io.observe(root);
    const isOnScreen = () => {
      const r = root.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };
    const onVisibility = () => { if (document.hidden) stop(); else if (isOnScreen()) play(); };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      root.parentElement?.removeEventListener("pointermove", onPointerMove);
      root.parentElement?.removeEventListener("pointerleave", onPointerLeave);
      observer.disconnect();
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={styles.atmosphere}
      aria-hidden="true"
      style={
        {
          "--atmo-fade": `${PERF.fadeInMs}ms`,
          /* Single source for the overscan: the canvas CSS box (module) and the
             backing-store math (measure()) both read this, so PERF.overscan is
             the only place it's set — change one number, not two. */
          "--atmo-overscan": `${PERF.overscan * 100}%`,
        } as CSSProperties
      }
    >
      <canvas ref={farRef} className={styles.canvas} />
      <canvas ref={nearRef} className={styles.canvas} />
      <div ref={laneRef} className={styles.lane} />
      <div className={styles.fade} />
    </div>
  );
}
