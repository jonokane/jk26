import { describe, expect, it } from "vitest";
import { isViewUrl, urlLabel } from "@/components/work/url-label";

describe("isViewUrl", () => {
  it("is true for http(s) urls", () => {
    expect(isViewUrl("https://amazon.com/key")).toBe(true);
    expect(isViewUrl("http://example.com")).toBe(true);
  });

  it("is false for plain-text view values", () => {
    expect(isViewUrl("Under NDA")).toBe(false);
    expect(isViewUrl("Archived")).toBe(false);
  });
});

describe("urlLabel", () => {
  it("strips the protocol", () => {
    expect(urlLabel("https://amazon.com/key")).toBe("amazon.com/key");
  });

  it("strips a trailing slash", () => {
    expect(urlLabel("https://fluence.io/")).toBe("fluence.io");
  });
});
