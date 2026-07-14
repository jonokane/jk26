/**
 * Optical kerning for the split-span wordmark (spec §5).
 *
 * The hero wraps every letter of JONOKANE in its own <span> so each can be
 * animated and carved independently. That split silently destroys the font's
 * native kern pairs — a browser only kerns *within* one text run — and Area's
 * K·A pair leans on its kern hard: unkerned, the wordmark reads "JONOK ANE".
 *
 * So we restore a base kern the way the wordmark lab did: rasterize each glyph
 * on a canvas, read its true visual side bearings off the alpha channel over
 * the cap-height band, and emit the per-pair adjustment that equalizes every
 * pair's visual gap. That base is what `wordmarkConfig.pairKernsMem` — Jono's
 * hand nudges, in thousandths of an em — was tuned to sit ON TOP OF. The two
 * are always applied together: margin-left = optical base + hand nudge.
 *
 * Two properties worth knowing:
 * - The kerns sum to zero (they redistribute gaps around their own mean), so
 *   restoring them does not change the wordmark's total width — the lockup and
 *   the header morph measure exactly what they measured before.
 * - The scan is only meaningful once the real Area face is loaded. Against the
 *   fallback face every measurement is a lie, so callers pass `fontReady` and
 *   we return the hand nudges alone until it's true.
 */
import { WORDMARK_TEXT, wordmarkConfig } from "@/lib/wordmark-config";

/** One glyph's visual ink edges and advance, all in em (origin at the pen). */
export interface GlyphInk {
  /** Visual left edge — the left sidebearing, negative if the ink overhangs. */
  left: number;
  /** Visual right edge, measured from the origin. */
  right: number;
  /** Advance width. */
  advance: number;
}

/** The visual gap a pair leaves: A's right sidebearing plus B's left. */
export function pairGap(a: GlyphInk, b: GlyphInk): number {
  return a.advance - a.right + b.left;
}

/**
 * The base kern for each adjacent pair (em) — what it takes to bring every
 * pair's visual gap to the mean gap. That equalization *is* optical kerning.
 * Null if any glyph of `text` is missing from `ink`, so a partial scan can
 * never produce half-right spacing.
 */
export function opticalKerns(text: string, ink: Record<string, GlyphInk>): number[] | null {
  const chars = [...text];
  if (chars.length < 2) return [];

  const gaps: number[] = [];
  for (let i = 0; i < chars.length - 1; i++) {
    const a = ink[chars[i]];
    const b = ink[chars[i + 1]];
    if (!a || !b) return null;
    gaps.push(pairGap(a, b));
  }
  const mean = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  return gaps.map((g) => mean - g);
}

/**
 * The margin-left each letter carries, in em (letter 0 never has one).
 * `optical` is the measured base — null when the scan couldn't run (no font,
 * no canvas, server), in which case the nudges stand alone. That fallback is
 * the pre-optical behavior: imperfect, but the wordmark still renders.
 */
export function letterMargins(
  text: string,
  optical: number[] | null,
  nudgesMem: readonly number[],
): number[] {
  return [...text].map((_, i) => {
    if (i === 0) return 0;
    return (optical?.[i - 1] ?? 0) + (nudgesMem[i - 1] ?? 0) / 1000;
  });
}

/**
 * The CSS font-stretch keyword nearest a `wdth` axis value. Canvas has no
 * font-variation-settings — `ctx.fontStretch` takes a keyword and nothing else
 * — so this is the only way to scan the wordmark at its 195-wide stance rather
 * than the face's default width. Thresholds are the lab's; they decide which
 * width the pairKernsMem nudges are based on, so don't retune them casually.
 */
export function stretchKeyword(wdth: number): CanvasFontStretch {
  if (wdth >= 162) return "ultra-expanded";
  if (wdth >= 137) return "extra-expanded";
  if (wdth >= 112) return "expanded";
  if (wdth >= 106) return "semi-expanded";
  return "normal";
}

/** The face a scan is taken against — also its memo key. */
export interface ScanFace {
  /** CSS font-family list, e.g. `"area-full", "area-variable", sans-serif`. */
  family: string;
  weight: number;
  wdth: number;
}

const faceKey = (text: string, f: ScanFace) => `${text}|${f.family}|${f.weight}|${f.wdth}`;

/**
 * Rasterize each unique glyph and read its visual edges off the alpha channel.
 * Client-only (canvas); returns null if anything is missing rather than
 * guessing. Not memoized — `scanOpticalKerns` below is the entry point.
 */
export function measureGlyphInk(text: string, face: ScanFace): Record<string, GlyphInk> | null {
  if (typeof document === "undefined") return null;

  const { samplePx, padPx, canvasWidthRatio, canvasHeightRatio, baselineRatio, bandTopRatio, bandBottomRatio, inkAlpha } =
    wordmarkConfig.opticalKern;
  const font = `${face.weight} ${samplePx}px ${face.family}`;

  /* The whole scan is only worth anything against the real face. `check` is
     also our jsdom/SSR guard: no document.fonts, no scan. */
  if (!document.fonts?.check?.(font)) return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(samplePx * canvasWidthRatio);
    canvas.height = Math.ceil(samplePx * canvasHeightRatio);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const { width, height } = canvas;
    const baseline = Math.round(samplePx * baselineRatio);
    const y0 = Math.round(baseline - samplePx * bandTopRatio);
    const y1 = Math.round(baseline - samplePx * bandBottomRatio);
    const ink: Record<string, GlyphInk> = {};

    for (const ch of new Set([...text])) {
      ctx.clearRect(0, 0, width, height);
      ctx.font = font;
      /* Older engines have no ctx.fontStretch. The scan then measures the
         face's default width instead of 195 — worse, but still far better
         than no base kern at all, so we press on rather than bail. */
      try {
        ctx.fontStretch = stretchKeyword(face.wdth);
      } catch {
        /* not supported — measured at the default width */
      }
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#fff";
      ctx.fillText(ch, padPx, baseline);

      const advance = ctx.measureText(ch).width;
      const pixels = ctx.getImageData(0, 0, width, height).data;

      /* Per row of the cap band, the leftmost and rightmost inked pixel;
         averaged over the inked rows, that's the glyph's visual edge. The
         average (not the extreme) is the point: it's why a diagonal like A
         reads as tuckable under a K, and a straight-sided E does not. */
      let sumLeft = 0;
      let sumRight = 0;
      let rows = 0;
      for (let y = y0; y <= y1; y++) {
        let left = -1;
        let right = -1;
        for (let x = 0; x < width; x++) {
          if (pixels[(y * width + x) * 4 + 3] > inkAlpha) {
            if (left < 0) left = x;
            right = x;
          }
        }
        if (left >= 0) {
          sumLeft += left;
          sumRight += right;
          rows++;
        }
      }
      if (!rows) return null; // a glyph with no ink means the face never applied

      ink[ch] = {
        left: (sumLeft / rows - padPx) / samplePx,
        right: (sumRight / rows - padPx) / samplePx,
        advance: advance / samplePx,
      };
    }
    return ink;
  } catch {
    return null;
  }
}

/**
 * Memoized optical kerns for `text` in `face`. The scan rasterizes every unique
 * glyph, so it runs once per (text, family, weight, wdth) — never per render,
 * and never per frame.
 */
const kernCache = new Map<string, number[] | null>();

export function scanOpticalKerns(text: string, face: ScanFace): number[] | null {
  const key = faceKey(text, face);
  const cached = kernCache.get(key);
  if (cached !== undefined) return cached;

  const ink = measureGlyphInk(text, face);
  const kerns = ink ? opticalKerns(text, ink) : null;
  kernCache.set(key, kerns);
  return kerns;
}

/** Test hook: drop the memoized scans so each test starts fresh. */
export function __resetKernCacheForTests(): void {
  kernCache.clear();
}

/**
 * The hero wordmark's per-letter margin-left, in em.
 *
 * `fontReady` must be true only once `loadAreaFont()` has resolved — scanning
 * the fallback face yields garbage kerns. Until then (and on the server) this
 * returns the hand nudges alone, which is exactly what the markup rendered
 * before optical kerning existed: correct enough to read, and identical on both
 * sides of hydration.
 */
export function wordmarkLetterMargins(fontReady: boolean): number[] {
  const optical = fontReady
    ? scanOpticalKerns(WORDMARK_TEXT, {
        family: wordmarkConfig.family,
        weight: wordmarkConfig.axes.wght,
        wdth: wordmarkConfig.axes.wdth,
      })
    : null;
  return letterMargins(WORDMARK_TEXT, optical, wordmarkConfig.pairKernsMem);
}
