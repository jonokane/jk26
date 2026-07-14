import { describe, expect, it } from "vitest";
import { farewellWordKey } from "@/lib/farewell-word";

describe("farewellWordKey (spec §11)", () => {
  it("returns morning for 5–12", () => {
    expect(farewellWordKey(5)).toBe("morning");
    expect(farewellWordKey(8)).toBe("morning");
    expect(farewellWordKey(11.99)).toBe("morning");
  });

  it("returns afternoon for 12–17", () => {
    expect(farewellWordKey(12)).toBe("afternoon");
    expect(farewellWordKey(14.5)).toBe("afternoon");
    expect(farewellWordKey(16.99)).toBe("afternoon");
  });

  it("returns evening for 17–21", () => {
    expect(farewellWordKey(17)).toBe("evening");
    expect(farewellWordKey(19)).toBe("evening");
    expect(farewellWordKey(20.99)).toBe("evening");
  });

  it("returns night otherwise (21–24 and 0–5)", () => {
    expect(farewellWordKey(21)).toBe("night");
    expect(farewellWordKey(23)).toBe("night");
    expect(farewellWordKey(0)).toBe("night");
    expect(farewellWordKey(4.99)).toBe("night");
  });

  it("holds exactly at every boundary (5, 12, 17, 21) — the lower bound belongs to the new word", () => {
    expect(farewellWordKey(4.999999)).toBe("night");
    expect(farewellWordKey(5)).toBe("morning");
    expect(farewellWordKey(11.999999)).toBe("morning");
    expect(farewellWordKey(12)).toBe("afternoon");
    expect(farewellWordKey(16.999999)).toBe("afternoon");
    expect(farewellWordKey(17)).toBe("evening");
    expect(farewellWordKey(20.999999)).toBe("evening");
    expect(farewellWordKey(21)).toBe("night");
  });

  it("wraps past midnight for hours at or beyond 24", () => {
    expect(farewellWordKey(24)).toBe(farewellWordKey(0));
    expect(farewellWordKey(24)).toBe("night");
    expect(farewellWordKey(29)).toBe("morning"); // 29 % 24 === 5
    expect(farewellWordKey(36.5)).toBe("afternoon"); // 36.5 % 24 === 12.5
  });

  it("wraps for negative hours (a scrub or clock read below zero)", () => {
    expect(farewellWordKey(-1)).toBe("night"); // -1 -> 23
    expect(farewellWordKey(-19)).toBe("morning"); // -19 -> 5
  });
});
