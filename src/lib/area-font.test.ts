import { afterEach, describe, expect, it, vi } from "vitest";
import { extractAreaUrl, loadAreaFont, __resetAreaFontForTests } from "@/lib/area-font";

const KIT_FIXTURE = `
@font-face { font-family:"mae-variable"; src:url("https://use.typekit.net/af/mae/l?primer=x&fvd=n4&v=3") format("woff2"); }
@font-face {
font-family:"area-variable";
src:url("https://use.typekit.net/af/ad9eb8/000/31/l?primer=abc&fvd=n4&v=3") format("woff2"),url("https://use.typekit.net/af/ad9eb8/000/31/d?primer=abc&fvd=n4&v=3") format("woff");
font-weight:100 900; font-stretch:normal; font-style:normal;
}`;

describe("extractAreaUrl", () => {
  it("pulls area-variable's first (woff2) src url", () => {
    expect(extractAreaUrl(KIT_FIXTURE)).toBe(
      "https://use.typekit.net/af/ad9eb8/000/31/l?primer=abc&fvd=n4&v=3",
    );
  });
  it("returns null when area-variable is absent", () => {
    expect(extractAreaUrl('@font-face { font-family:"other"; src:url("x") }')).toBeNull();
  });
});

describe("loadAreaFont", () => {
  afterEach(() => {
    __resetAreaFontForTests();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("registers area-full with honest descriptor ranges and resolves true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ text: () => Promise.resolve(KIT_FIXTURE) }));
    const load = vi.fn().mockResolvedValue(undefined);
    const ctorCalls: unknown[][] = [];
    class FontFaceStub {
      load = load;
      constructor(...args: unknown[]) {
        ctorCalls.push(args);
      }
    }
    vi.stubGlobal("FontFace", FontFaceStub);
    const add = vi.fn();
    Object.defineProperty(document, "fonts", { configurable: true, value: { add } });

    await expect(loadAreaFont()).resolves.toBe(true);
    expect(ctorCalls[0]).toEqual([
      "area-full",
      expect.stringContaining("use.typekit.net"),
      { weight: "100 900", stretch: "100% 200%", style: "oblique 0deg 10deg" },
    ]);
    expect(add).toHaveBeenCalled();
  });

  it("resolves false when the kit fetch fails, without throwing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(loadAreaFont()).resolves.toBe(false);
  });

  it("memoizes: second call returns the same promise", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const p1 = loadAreaFont();
    const p2 = loadAreaFont();
    expect(p1).toBe(p2);
    await p1;
  });
});
