/**
 * Area variable font access (spec §5). Adobe's generated @font-face clamps
 * the registered wdth/slnt axes (font-stretch: normal, font-style: normal),
 * which freezes the wordmark's 195-wide stance. We fetch the kit CSS,
 * extract Area's own CDN URL, and re-register the SAME file as "area-full"
 * with honest descriptor ranges. The font never touches our origin — this
 * corrects CSS metadata only (deliberate licensing call, documented in the
 * spec).
 */
const KIT_CSS_URL = "https://use.typekit.net/aqv1jgr.css";
const LOAD_TIMEOUT_MS = 4000;

export const AREA_FAMILY = "area-full";

/** Pull area-variable's first (woff2) src URL out of the kit CSS. */
export function extractAreaUrl(kitCss: string): string | null {
  const match = kitCss.match(/area-variable[\s\S]*?src:url\("([^"]+)"\)/);
  return match ? match[1] : null;
}

let areaPromise: Promise<boolean> | null = null;

/** Test hook: clear the memoized load so each test starts fresh. */
export function __resetAreaFontForTests(): void {
  areaPromise = null;
}

/**
 * Load + register area-full. Resolves true when usable, false on any
 * failure or after ~4s — callers render the fallback rather than blocking.
 */
async function doLoadAreaFont(): Promise<boolean> {
  try {
    const attempt = (async () => {
      const css = await (await fetch(KIT_CSS_URL)).text();
      const url = extractAreaUrl(css);
      if (!url) return false;
      const face = new FontFace(AREA_FAMILY, `url("${url}") format("woff2")`, {
        weight: "100 900",
        stretch: "100% 200%",
        style: "oblique 0deg 10deg",
      });
      await face.load();
      document.fonts.add(face);
      return true;
    })();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), LOAD_TIMEOUT_MS);
    });
    /* Promise.race never cancels the loser — clear the timer so a fast
       load doesn't leave a stray 4s timeout behind */
    return await Promise.race([attempt, timeout]).finally(() => clearTimeout(timer));
  } catch {
    return false;
  }
}

export function loadAreaFont(): Promise<boolean> {
  if (areaPromise) return areaPromise;
  areaPromise = doLoadAreaFont();
  return areaPromise;
}
