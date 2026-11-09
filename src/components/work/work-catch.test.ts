import { describe, expect, it } from "vitest";
import { isFlingPastWork, shouldRearm, type ScrollState } from "@/components/work/work-catch";

const VH = 900;
const WORK_TOP = 6000;
const FLING = 0.45; // vh: a fling has the target more than 405px ahead

const state = (over: Partial<ScrollState>): ScrollState => ({
  scroll: WORK_TOP - 600,
  target: WORK_TOP + 900,
  direction: 1,
  workTop: WORK_TOP,
  viewportHeight: VH,
  ...over,
});

describe("isFlingPastWork", () => {
  it("catches a downward fling headed past Work's top", () => {
    expect(isFlingPastWork(state({}), FLING)).toBe(true);
  });

  it("lets a gentle scroll cross into Work", () => {
    /* Target only 150px ahead: an ordinary wheel step, not a fling. */
    expect(isFlingPastWork(state({ scroll: WORK_TOP - 50, target: WORK_TOP + 100 }), FLING)).toBe(false);
  });

  it("ignores a fling that will stop short of Work", () => {
    expect(isFlingPastWork(state({ scroll: WORK_TOP - 2000, target: WORK_TOP - 100 }), FLING)).toBe(false);
  });

  it("never catches on the way up", () => {
    expect(isFlingPastWork(state({ direction: -1 }), FLING)).toBe(false);
  });

  it("never catches at rest", () => {
    expect(isFlingPastWork(state({ direction: 0 }), FLING)).toBe(false);
  });

  it("leaves a reader already inside Work alone", () => {
    expect(isFlingPastWork(state({ scroll: WORK_TOP + 10, target: WORK_TOP + 2000 }), FLING)).toBe(false);
    expect(isFlingPastWork(state({ scroll: WORK_TOP, target: WORK_TOP + 2000 }), FLING)).toBe(false);
  });

  it("measures the fling against the viewport, so it holds on any screen", () => {
    /* 500px ahead is a fling on a 900px screen (> 405px) but not on a
       1200px one (< 540px). */
    const s = { scroll: WORK_TOP - 100, target: WORK_TOP + 400 };
    expect(isFlingPastWork(state(s), FLING)).toBe(true);
    expect(isFlingPastWork(state({ ...s, viewportHeight: 1200 }), FLING)).toBe(false);
  });
});

describe("shouldRearm", () => {
  it("re-arms once the reader is back clear of Work's door", () => {
    expect(shouldRearm(WORK_TOP - 600, WORK_TOP, VH, 0.6)).toBe(true);
  });

  it("stays spent while the reader is still at the door or inside Work", () => {
    expect(shouldRearm(WORK_TOP - 500, WORK_TOP, VH, 0.6)).toBe(false);
    expect(shouldRearm(WORK_TOP + 3000, WORK_TOP, VH, 0.6)).toBe(false);
  });
});
