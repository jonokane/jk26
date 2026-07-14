import { describe, expect, it } from "vitest";
import {
  Z_ACTIVE,
  Z_FLIGHT,
  Z_TRAY,
  assembleEnd,
  assembleStart,
  beatPose,
  between,
  clamp01,
  isAssembled,
  revealOpacity,
  segment,
  smoothstep,
  snapProgress,
  snapTargets,
  trayHintOpacity,
  wallPose,
  type Point,
} from "@/components/about/collector-math";
import {
  collectorSnap,
  collectorTiming as timing,
  desktopLayout as layout,
  layoutFor,
  phoneLayout,
} from "@/components/about/collector-config";

const COUNT = 4;
const VP = { width: 1000, height: 1000 }; // 1vw = 1vh = 10px, so px === units × 10
const pose = (i: number, p: number) => beatPose(i, COUNT, p, layout, timing, VP);

describe("collector math: the segment grid (prototype geometry)", () => {
  it("gives each beat one segment, plus one for the assembly", () => {
    expect(segment(COUNT)).toBeCloseTo(0.2);
    expect(assembleStart(COUNT)).toBeCloseTo(0.8);
  });

  it("finishes assembling before the section releases", () => {
    const end = assembleEnd(COUNT, timing);
    expect(end).toBeGreaterThan(assembleStart(COUNT));
    expect(end).toBeLessThan(1);
  });

  it("clamps and smoothsteps", () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(0.5)).toBeCloseTo(0.5);
    expect(smoothstep(1)).toBe(1);
    expect(between(5, 5, 5)).toBe(1); // a zero-length window is a step
    expect(between(4, 5, 5)).toBe(0);
  });
});

describe("collector math: a beat's four poses", () => {
  it("parks an unread beat below the fold, invisible", () => {
    const up = pose(2, 0); // beat 3's turn starts at p=0.4
    expect(up.opacity).toBe(0);
    expect(up.y).toBeCloseTo(1080); // 108vh
    expect(up.scale).toBe(1);
  });

  it("holds the active beat center stage, full size, on top", () => {
    const active = pose(1, 0.31); // mid-hold of beat 2's segment (0.2 – 0.4)
    expect(active.opacity).toBe(1);
    expect(active.x).toBeCloseTo(70); // 7vw
    expect(active.y).toBeCloseTo(300); // 30vh
    expect(active.scale).toBe(1);
    expect(active.z).toBe(Z_ACTIVE);
  });

  it("puts the first beat on stage the moment the stage exists", () => {
    // No scroll exists before p=0 to scrub a rise against; the section's own
    // entrance carries beat one up the screen.
    const first = pose(0, 0);
    expect(first.opacity).toBe(1);
    expect(first.y).toBeCloseTo(300);
  });

  it("pockets a read beat into the tray, in order", () => {
    // At the assembly point every beat has landed in the tray and none has
    // left it yet — the prototype's "tray" state, exactly.
    for (let i = 0; i < COUNT; i++) {
      const tray = pose(i, assembleStart(COUNT));
      expect(tray.y).toBeCloseTo(860); // 86vh
      expect(tray.scale).toBeCloseTo(0.22);
      expect(tray.opacity).toBeCloseTo(0.9);
      expect(tray.x).toBeCloseTo((7 + i * 13.5) * 10);
      expect(tray.z).toBe(Z_TRAY);
    }
  });

  it("unpacks the tray into the 2x2 wall, staggered", () => {
    const end = assembleEnd(COUNT, timing);
    for (let i = 0; i < COUNT; i++) {
      const wall = pose(i, end);
      const want = wallPose(i, layout);
      expect(wall.x).toBeCloseTo(want.xVw * 10);
      expect(wall.y).toBeCloseTo(want.yVh * 10);
      expect(wall.scale).toBeCloseTo(0.55);
      expect(wall.opacity).toBeCloseTo(1);
    }
    // Staggered: at the first flight's midpoint, beat 4 has not left the tray.
    const early = assembleStart(COUNT) + timing.assembleSpan / 2;
    expect(pose(0, early).y).toBeLessThan(860);
    expect(pose(3, early).y).toBeCloseTo(860);
  });

  it("moves continuously — no jumps between the poses (spec §14)", () => {
    for (let i = 0; i < COUNT; i++) {
      let prev = pose(i, 0);
      for (let p = 0.002; p <= 1.0001; p += 0.002) {
        const next = pose(i, p);
        // A stepped state change would move a beat by hundreds of px in one
        // frame of scroll; the fastest window here (the rise) moves ~34.
        expect(Math.abs(next.x - prev.x)).toBeLessThan(40);
        expect(Math.abs(next.y - prev.y)).toBeLessThan(40);
        expect(Math.abs(next.scale - prev.scale)).toBeLessThan(0.05);
        expect(Math.abs(next.opacity - prev.opacity)).toBeLessThan(0.05);
        prev = next;
      }
    }
  });

  it("keeps exactly one beat center stage while reading", () => {
    for (let p = 0; p < assembleStart(COUNT); p += 0.01) {
      const onStage = Array.from({ length: COUNT }, (_, i) => pose(i, p)).filter(
        (b) => b.scale > 0.9 && b.opacity > 0.9,
      );
      expect(onStage.length).toBeLessThanOrEqual(1);
    }
  });

  it("lifts a beat in flight above the tray but below center stage", () => {
    const flying = pose(0, 0.19); // beat 1 pocketing (its segment ends at 0.2)
    expect(flying.z).toBe(Z_FLIGHT);
    expect(flying.scale).toBeGreaterThan(0.22);
    expect(flying.scale).toBeLessThan(1);
  });

  it("is stable outside its range (clamped, not extrapolated)", () => {
    for (let i = 0; i < COUNT; i++) {
      expect(pose(i, -1)).toEqual(pose(i, 0));
      expect(pose(i, 2)).toEqual(pose(i, 1));
    }
  });
});

describe("collector math: the overlays", () => {
  it("captions the tray only once something is in it, and drops it at assembly", () => {
    expect(trayHintOpacity(0.1, COUNT, timing)).toBe(0); // nothing pocketed yet
    expect(trayHintOpacity(0.2, COUNT, timing)).toBeCloseTo(1); // first beat lands
    expect(trayHintOpacity(0.5, COUNT, timing)).toBeCloseTo(1);
    expect(trayHintOpacity(0.8, COUNT, timing)).toBe(0); // the tray is unpacking
    expect(trayHintOpacity(1, COUNT, timing)).toBe(0);
  });

  it("hides the About heading, lede and CTAs until the wall is landing", () => {
    expect(revealOpacity(0, COUNT, timing)).toBe(0);
    expect(revealOpacity(0.79, COUNT, timing)).toBe(0);
    expect(revealOpacity(assembleStart(COUNT), COUNT, timing)).toBe(0);
    expect(revealOpacity(1, COUNT, timing)).toBeCloseTo(1);
    expect(isAssembled(0.79, COUNT)).toBe(false);
    expect(isAssembled(0.8, COUNT)).toBe(true);
  });
});

describe("collector math: snapping (spec §7 — click into place, do not drift past)", () => {
  const targets = snapTargets(COUNT, timing);
  const release = assembleEnd(COUNT, timing);
  const tol = collectorSnap.tolerance * segment(COUNT);

  it("targets the stage entry, a reading position per beat, and the assembled wall", () => {
    expect(targets).toHaveLength(COUNT + 2);
    expect(targets[0]).toBe(0); // the stage pins with beat one already up
    // Every beat target lands the beat it belongs to center stage, full size.
    targets.slice(1, COUNT + 1).forEach((p, i) => {
      const b = pose(i, p);
      expect(b.scale).toBe(1);
      expect(b.opacity).toBe(1);
    });
    expect(targets[COUNT + 1]).toBeCloseTo(release);
  });

  it("settles forwards on the next beat when scrolling down", () => {
    expect(snapProgress(0.15, 1, targets, release)).toBeCloseTo(0.31); // beat 2
    expect(snapProgress(0.75, 1, targets, release)).toBeCloseTo(release);
  });

  it("settles backwards on the previous beat when scrolling up", () => {
    expect(snapProgress(0.35, -1, targets, release)).toBeCloseTo(0.31); // beat 2
    expect(snapProgress(0.9, -1, targets, release)).toBeCloseTo(0.71); // beat 4
  });

  /* A visitor who clicks "About" in the nav lands at p=0 with beat one already
     center stage. Snapping them onward from there would scroll the page for no
     visible reason — everything on the stage is still. */
  it("leaves a visitor who arrives at the top of the stage where they landed", () => {
    expect(snapProgress(0, 1, targets, release, tol)).toBe(0);
  });

  it("lets the reader leave once the wall is assembled (no snap trap)", () => {
    expect(snapProgress(release, 1, targets, release)).toBe(release);
    expect(snapProgress(0.98, 1, targets, release)).toBe(0.98);
    expect(snapProgress(0.98, -1, targets, release)).toBe(0.98);
  });

  it("stays put when there is nothing to snap to", () => {
    expect(snapProgress(0.05, -1, [], release)).toBe(0.05);
  });

  /* Measured in the browser: scrolling to beat one's target lands at p=0.11002,
     a hair past it — which read as "scrolling down" and threw the reader a
     whole beat forward. A pixel is not an intention. */
  it("does not skip a beat when the reader has barely moved off one", () => {
    const beatOne = targets[1];
    expect(snapProgress(beatOne + 0.00002, 1, targets, release, tol)).toBeCloseTo(beatOne);
    expect(snapProgress(beatOne - 0.00002, -1, targets, release, tol)).toBeCloseTo(beatOne);
    // ...but a real scroll still advances.
    expect(snapProgress(beatOne + 2 * tol, 1, targets, release, tol)).toBeCloseTo(targets[2]);
  });
});

/* The phone does not finish in a wall. Four legible statements plus the
   heading, the lede and the CTA footer do not fit a 100vh stage at any scale,
   so the section releases instead: the beats fly home into the document and are
   read by scrolling (Jono's call). */
describe("collector math: the phone finish — released into the document (spec §12)", () => {
  const phone = { width: 390, height: 844 };
  /** Where each beat's slab actually sits in the document, on screen right now. */
  const homes: Point[] = [
    { x: 27, y: 900 },
    { x: 27, y: 1150 },
    { x: 27, y: 1400 },
    { x: 27, y: 1650 },
  ];
  const phonePose = (i: number, p: number) =>
    beatPose(i, COUNT, p, phoneLayout, timing, phone, homes[i]);

  it("picks the geometry off the same media query the stylesheet switches on", () => {
    expect(layoutFor(true)).toBe(phoneLayout);
    expect(layoutFor(false)).toBe(layout);
    expect(phoneLayout.finish.kind).toBe("flow");
    expect(layout.finish.kind).toBe("wall");
  });

  it("plays the same choreography through the stage", () => {
    expect(phonePose(0, 0).y).toBeCloseTo(0.24 * phone.height); // center stage
    expect(phonePose(0, 0).scale).toBe(1);
    expect(phonePose(2, 0.51).y).toBeCloseTo(0.24 * phone.height); // beat 3's turn
    const tray = phonePose(0, assembleStart(COUNT));
    expect(tray.y).toBeCloseTo(0.87 * phone.height);
    expect(tray.scale).toBeCloseTo(0.22);
  });

  it("keeps the tray inside the phone", () => {
    for (let i = 0; i < COUNT; i++) {
      const tray = phonePose(i, assembleStart(COUNT));
      expect(tray.x).toBeGreaterThanOrEqual(0);
      expect(tray.x + 0.86 * phone.width * tray.scale).toBeLessThan(phone.width);
      expect(tray.y).toBeLessThan(phone.height);
    }
  });

  /* The pose the beat comes to rest in is the place it already occupies — so
     the transform the writer derives from it is exactly zero, and the document
     it lands in is the document that was there all along. */
  it("comes to rest exactly where the document already holds its place", () => {
    const end = assembleEnd(COUNT, timing);
    for (let i = 0; i < COUNT; i++) {
      const rest = phonePose(i, end);
      expect(rest.x).toBeCloseTo(homes[i].x);
      expect(rest.y).toBeCloseTo(homes[i].y);
      expect(rest.scale).toBeCloseTo(1);
      expect(rest.opacity).toBeCloseTo(1);
    }
  });

  it("flies home staggered, and continuously", () => {
    const early = assembleStart(COUNT) + timing.assembleSpan / 2;
    expect(phonePose(0, early).scale).toBeGreaterThan(0.22); // already growing
    expect(phonePose(3, early).scale).toBeCloseTo(0.22); // still a token

    for (let i = 0; i < COUNT; i++) {
      let prev = phonePose(i, 0);
      for (let p = 0.002; p <= 1.0001; p += 0.002) {
        const next = phonePose(i, p);
        expect(Math.abs(next.y - prev.y)).toBeLessThan(0.1 * phone.height);
        expect(Math.abs(next.scale - prev.scale)).toBeLessThan(0.05);
        prev = next;
      }
    }
  });

  it("has no wall to ask for", () => {
    expect(() => wallPose(0, phoneLayout)).toThrow();
  });
});
